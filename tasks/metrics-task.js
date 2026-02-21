/**
 * Metrics Task
 * Collects and reports various code metrics for deobfuscation analysis
 * Version: 3.0.0
 */
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class MetricsTask {
  constructor(options = {}) {
    this.name = "MetricsTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript", "dynamicImport"],
      },
      includeComplexity: options.includeComplexity !== false,
      includeMaintainability: options.includeMaintainability !== false,
      includeLines: options.includeLines !== false,
      includeFunctions: options.includeFunctions !== false,
      includeClasses: options.includeClasses !== false,
      includeImports: options.includeImports !== false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
    };
    this.metrics = {
      linesOfCode: 0,
      linesOfComments: 0,
      linesOfBlank: 0,
      functions: 0,
      classes: 0,
      complexity: 0,
      cyclomatic: 0,
      halstead: {},
      maintainability: 0,
    };
    this.results = new Map();
    this.patterns = new Map();
    this.statistics = {
      totalAnalyses: 0,
      totalFunctions: 0,
      totalClasses: 0,
      averageComplexity: 0,
      averageLines: 0,
      errors: 0,
    };
    this._initializePatterns();
  }

  _initializePatterns() {
    this.patterns.set("url", /https?:\/\/[^\s"'<>]+/g);
    this.patterns.set("email", /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    this.patterns.set("ip", /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
    this.patterns.set("uuid", /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
  }

  async execute(code, context = {}) {
    const analysisId = `analysis-${Date.now()}`;
    const startTime = Date.now();

    try {
      if (!code || typeof code !== "string") {
        throw new Error("Code must be a non-empty string");
      }
      if (code.length > this.options.maxFileSize) {
        throw new Error(
          `Code exceeds maximum file size of ${this.options.maxFileSize} bytes`
        );
      }

      const ast = this._parseCode(code, context);
      const metrics = this.collectMetrics(ast, code, context);

      const duration = Date.now() - startTime;
      this._recordAnalysis(analysisId, duration, metrics);

      return {
        id: analysisId,
        success: true,
        metrics,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Metrics task failed: ${error.message}`);
    }
  }

  _parseCode(code, context = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...(context.parseOptions || {}),
    };
    try {
      return parser.parse(code, parseOptions);
    } catch (e) {
      return null;
    }
  }

  collectMetrics(ast, code, context = {}) {
    const metrics = {
      lines: this._countLines(code),
      functions: 0,
      classes: 0,
      complexity: 0,
      cyclomatic: 1,
      depth: 0,
      imports: 0,
      exports: 0,
      statements: 0,
      branches: 0,
      loops: 0,
      conditions: 0,
      tryCatch: 0,
      callbacks: 0,
      asyncFunctions: 0,
      generators: 0,
      arrowFunctions: 0,
      methods: 0,
      properties: 0,
      dependencies: [],
      maintainability: 0,
      loc: 0,
      sloc: 0,
      comments: 0,
    };

    if (!ast) {
      return metrics;
    }

    const self = this;
    let currentDepth = 0;
    let maxDepth = 0;

    traverse(ast, {
      Program(path) {
        metrics.imports = path.node.body.filter(
          (node) => t.isImportDeclaration(node)
        ).length;
        metrics.exports = path.node.body.filter(
          (node) => t.isExportDeclaration(node)
        ).length;

        path.node.body.forEach((node) => {
          if (t.isImportDeclaration(node)) {
            const source = node.source.value;
            if (!metrics.dependencies.includes(source)) {
              metrics.dependencies.push(source);
            }
          }
        });
      },
      FunctionDeclaration(path) {
        metrics.functions++;
        metrics.statements += path.node.body?.body?.length || 0;
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
        if (path.node.async) {
          metrics.asyncFunctions++;
        }
        if (path.node.generator) {
          metrics.generators++;
        }
      },
      "FunctionDeclaration:exit"(path) {
        currentDepth = Math.max(0, currentDepth - 1);
      },
      FunctionExpression(path) {
        metrics.functions++;
        metrics.statements += path.node.body?.body?.length || 0;
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
        if (path.node.async) {
          metrics.asyncFunctions++;
        }
        if (path.node.generator) {
          metrics.generators++;
        }
      },
      "FunctionExpression:exit"(path) {
        currentDepth = Math.max(0, currentDepth - 1);
      },
      ArrowFunctionExpression(path) {
        metrics.functions++;
        metrics.arrowFunctions++;
        metrics.statements += path.node.body?.body?.length || 0;
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
        if (path.node.async) {
          metrics.asyncFunctions++;
        }
      },
      "ArrowFunctionExpression:exit"(path) {
        currentDepth = Math.max(0, currentDepth - 1);
      },
      ClassDeclaration(path) {
        metrics.classes++;
        path.node.body.body.forEach((member) => {
          if (t.isClassMethod(member)) {
            metrics.methods++;
            if (member.kind === "constructor") {
              metrics.statements += member.body?.body?.length || 0;
            }
          }
          if (t.isClassProperty(member)) {
            metrics.properties++;
          }
        });
      },
      ClassExpression(path) {
        metrics.classes++;
      },
      IfStatement(path) {
        metrics.branches++;
        metrics.cyclomatic++;
        metrics.conditions++;
      },
      ForStatement(path) {
        metrics.loops++;
        metrics.cyclomatic++;
        metrics.branches++;
      },
      ForInStatement(path) {
        metrics.loops++;
        metrics.cyclomatic++;
      },
      ForOfStatement(path) {
        metrics.loops++;
        metrics.cyclomatic++;
      },
      WhileStatement(path) {
        metrics.loops++;
        metrics.cyclomatic++;
        metrics.branches++;
      },
      DoWhileStatement(path) {
        metrics.loops++;
        metrics.cyclomatic++;
        metrics.branches++;
      },
      SwitchCase(path) {
        metrics.branches++;
        metrics.cyclomatic++;
      },
      ConditionalExpression(path) {
        metrics.conditions++;
        metrics.cyclomatic++;
      },
      LogicalExpression(path) {
        if (path.node.operator === "&&" || path.node.operator === "||") {
          metrics.cyclomatic++;
        }
      },
      BinaryExpression(path) {
        if (
          path.node.operator === "===" ||
          path.node.operator === "!==" ||
          path.node.operator === "==" ||
          path.node.operator === "!="
        ) {
          metrics.branches++;
          metrics.cyclomatic++;
        }
      },
      TryStatement(path) {
        metrics.tryCatch++;
        metrics.cyclomatic++;
      },
      CatchClause(path) {
        metrics.tryCatch++;
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (t.isIdentifier(callee)) {
          if (
            callee.name === "then" ||
            callee.name === "catch" ||
            callee.name === "finally"
          ) {
            metrics.callbacks++;
          }
        }
      },
      ReturnStatement(path) {
        metrics.statements++;
      },
      ExpressionStatement(path) {
        metrics.statements++;
      },
      VariableDeclaration(path) {
        metrics.statements++;
      },
    });

    metrics.maxDepth = maxDepth;
    metrics.complexity = this._calculateComplexity(metrics);
    metrics.maintainability = this._calculateMaintainability(metrics);
    metrics.loc = metrics.lines.total;
    metrics.sloc = metrics.lines.code;

    return metrics;
  }

  _countLines(code) {
    if (!code) {
      return { total: 0, code: 0, comments: 0, blank: 0 };
    }

    const lines = code.split("\n");
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;

    let inBlockComment = false;

    for (let line of lines) {
      const trimmed = line.trim();

      if (trimmed === "") {
        blankLines++;
        continue;
      }

      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes("*/")) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith("/*")) {
        commentLines++;
        if (!trimmed.includes("*/")) {
          inBlockComment = true;
        }
        continue;
      }

      if (trimmed.startsWith("//")) {
        commentLines++;
        continue;
      }

      codeLines++;
    }

    return {
      total: lines.length,
      code: codeLines,
      comments: commentLines,
      blank: blankLines,
    };
  }

  _calculateComplexity(metrics) {
    const base = metrics.cyclomatic;
    const functions = metrics.functions;
    const loops = metrics.loops;
    const branches = metrics.branches;

    const complexity =
      base + functions * 0.5 + loops * 0.3 + branches * 0.2 + metrics.depth * 0.1;

    return Math.max(1, Math.round(complexity));
  }

  _calculateMaintainability(metrics) {
    const lines = metrics.lines.code;
    const complexity = metrics.complexity;
    const comments = metrics.lines.comments;

    if (lines === 0) return 0;

    const commentRatio = comments / lines;
    const volume = lines * Math.log2(lines || 1);
    const difficulty = complexity;

    let maintainability =
      171 -
      5.2 * Math.log(volume || 1) -
      0.23 * difficulty -
      16.2 * Math.log(lines || 1);

    if (commentRatio > 0.2) {
      maintainability += 10;
    }

    return Math.max(0, Math.min(100, Math.round(maintainability)));
  }

  _calculateHalstead(metrics) {
    return {
      volume: metrics.loc * Math.log2(metrics.loc || 1),
      difficulty: metrics.complexity,
      effort: 0,
      time: 0,
      bugs: 0,
    };
  }

  _recordAnalysis(id, duration, metrics) {
    this.results.set(id, {
      metrics,
      duration,
      timestamp: Date.now(),
    });

    this.statistics.totalAnalyses++;
    this.statistics.totalFunctions += metrics.functions;
    this.statistics.totalClasses += metrics.classes;

    if (this.results.size > 100) {
      const firstKey = this.results.keys().next().value;
      this.results.delete(firstKey);
    }
  }

  getResults(id) {
    return this.results.get(id);
  }

  getAllResults() {
    return Array.from(this.results.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  getStatistics() {
    return {
      ...this.statistics,
      resultsSize: this.results.size,
      averageComplexity:
        this.statistics.totalAnalyses > 0
          ? this.statistics.totalFunctions / this.statistics.totalAnalyses
          : 0,
      averageLines:
        this.statistics.totalAnalyses > 0
          ? this.statistics.totalFunctions / this.statistics.totalAnalyses
          : 0,
    };
  }

  analyzeFile(filePath) {
    const fs = require("fs");
    try {
      const code = fs.readFileSync(filePath, "utf8");
      return this.execute(code, { filename: filePath });
    } catch (error) {
      throw new Error(`Failed to analyze file: ${error.message}`);
    }
  }

  analyzeMultiple(files) {
    return Promise.all(
      files.map((file) => this.analyzeFile(file).catch((e) => ({ error: e.message })))
    );
  }

  compareMetrics(metrics1, metrics2) {
    return {
      linesDiff: metrics2.lines.code - metrics1.lines.code,
      functionsDiff: metrics2.functions - metrics1.functions,
      complexityDiff: metrics2.complexity - metrics1.complexity,
      cyclomaticDiff: metrics2.cyclomatic - metrics1.cyclomatic,
      maintainabilityDiff: metrics2.maintainability - metrics1.maintainability,
    };
  }

  getComplexityLevel(complexity) {
    if (complexity <= 10) return "low";
    if (complexity <= 20) return "moderate";
    if (complexity <= 50) return "high";
    return "very-high";
  }

  getMaintainabilityLevel(maintainability) {
    if (maintainability >= 80) return "excellent";
    if (maintainability >= 60) return "good";
    if (maintainability >= 40) return "moderate";
    if (maintainability >= 20) return "poor";
    return "very-poor";
  }

  generateReport(metrics) {
    return {
      summary: {
        lines: metrics.lines.total,
        codeLines: metrics.lines.code,
        commentLines: metrics.lines.comments,
        blankLines: metrics.lines.blank,
      },
      functions: {
        total: metrics.functions,
        async: metrics.asyncFunctions,
        generators: metrics.generators,
        arrow: metrics.arrowFunctions,
      },
      complexity: {
        value: metrics.complexity,
        level: this.getComplexityLevel(metrics.complexity),
        cyclomatic: metrics.cyclomatic,
        maxDepth: metrics.maxDepth,
      },
      maintainability: {
        value: metrics.maintainability,
        level: this.getMaintainabilityLevel(metrics.maintainability),
      },
      classes: {
        total: metrics.classes,
        methods: metrics.methods,
        properties: metrics.properties,
      },
      dependencies: {
        count: metrics.dependencies.length,
        list: metrics.dependencies,
      },
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  registerPattern(name, pattern) {
    if (typeof name !== "string" || !pattern) {
      throw new Error("Pattern name and regex are required");
    }
    this.patterns.set(name, pattern);
    return this;
  }

  unregisterPattern(name) {
    this.patterns.delete(name);
    return this;
  }

  getPattern(name) {
    return this.patterns.get(name);
  }

  listPatterns() {
    return Array.from(this.patterns.keys());
  }

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  reset() {
    this.results.clear();
    this.statistics = {
      totalAnalyses: 0,
      totalFunctions: 0,
      totalClasses: 0,
      averageComplexity: 0,
      averageLines: 0,
      errors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.patterns.clear();
    this.options = {};
    return this;
  }
}

module.exports = MetricsTask;
