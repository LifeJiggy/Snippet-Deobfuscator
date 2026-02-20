const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

class AnalysisTask {
  constructor(options = {}) {
    this.name = "AnalysisTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      analysisTypes: options.analysisTypes || [
        "complexity",
        "dependencies",
        "patterns",
      ],
      maxFileSize: options.maxFileSize || 1024 * 1024,
      timeout: options.timeout || 30000,
    };
    this.results = new Map();
    this.statistics = {
      totalAnalyzed: 0,
      totalFiles: 0,
      totalErrors: 0,
      averageAnalysisTime: 0,
      complexityScores: [],
      dependencyCounts: [],
      patternMatches: 0,
    };
    this._analysisTimes = [];
    this._patterns = this._initializePatterns();
  }

  _initializePatterns() {
    return {
      functionDeclarations: [],
      variableDeclarations: [],
      classDeclarations: [],
      importStatements: [],
      exportStatements: [],
      callExpressions: [],
      asyncPatterns: [],
      errorHandling: [],
      loops: [],
      conditionals: [],
    };
  }

  async analyzeCode(code, options = {}) {
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    if (code.length > this.options.maxFileSize) {
      throw new Error(
        `Code exceeds maximum file size of ${this.options.maxFileSize} bytes`
      );
    }
    const startTime = Date.now();
    const analysisId = `analysis-${startTime}`;
    try {
      const ast = this._parseCode(code, options);
      const results = await this.analyzeAST(ast, options);
      const duration = Date.now() - startTime;
      this._recordAnalysis(analysisId, duration, results);
      return {
        id: analysisId,
        results,
        duration,
        timestamp: startTime,
      };
    } catch (error) {
      this.statistics.totalErrors++;
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...options.parseOptions,
    };
    try {
      return parser.parse(code, parseOptions);
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  async analyzeAST(ast, options = {}) {
    if (!ast || typeof ast !== "object") {
      throw new Error("AST must be a valid object");
    }
    const results = {
      complexity: {},
      dependencies: {},
      patterns: {},
      structure: {},
      metrics: {},
    };
    const analysisTypes = options.analysisTypes || this.options.analysisTypes;
    for (const type of analysisTypes) {
      switch (type) {
        case "complexity":
          results.complexity = this._analyzeComplexity(ast);
          break;
        case "dependencies":
          results.dependencies = this._analyzeDependencies(ast);
          break;
        case "patterns":
          results.patterns = this._analyzePatterns(ast);
          break;
        case "structure":
          results.structure = this._analyzeStructure(ast);
          break;
        case "metrics":
          results.metrics = this._analyzeMetrics(ast);
          break;
        case "security":
          results.security = this._analyzeSecurity(ast);
          break;
        case "performance":
          results.performance = this._analyzePerformance(ast);
          break;
      }
    }
    return results;
  }

  _analyzeComplexity(ast) {
    const complexity = {
      cyclomatic: 1,
      cognitive: 0,
      linesOfCode: 0,
      functions: 0,
      classes: 0,
      nestingLevel: 0,
      maxNesting: 0,
    };
    let currentNesting = 0;
    traverse(ast, {
      IfStatement: {
        enter() {
          complexity.cyclomatic++;
          complexity.cognitive++;
          currentNesting++;
          if (currentNesting > complexity.maxNesting) {
            complexity.maxNesting = currentNesting;
          }
        },
        exit() {
          currentNesting--;
        },
      },
      ForStatement: {
        enter() {
          complexity.cyclomatic++;
          complexity.cognitive += 2;
          currentNesting++;
          if (currentNesting > complexity.maxNesting) {
            complexity.maxNesting = currentNesting;
          }
        },
        exit() {
          currentNesting--;
        },
      },
      WhileStatement: {
        enter() {
          complexity.cyclomatic++;
          complexity.cognitive += 2;
          currentNesting++;
          if (currentNesting > complexity.maxNesting) {
            complexity.maxNesting = currentNesting;
          }
        },
        exit() {
          currentNesting--;
        },
      },
      SwitchCase: {
        enter() {
          complexity.cyclomatic++;
        },
      },
      ConditionalExpression: {
        enter() {
          complexity.cyclomatic++;
          complexity.cognitive++;
        },
      },
      LogicalExpression: {
        enter(path) {
          if (path.node.operator === "&&" || path.node.operator === "||") {
            complexity.cyclomatic++;
          }
        },
      },
      CatchClause: {
        enter() {
          complexity.cyclomatic++;
        },
      },
      FunctionDeclaration: {
        enter() {
          complexity.functions++;
          complexity.cognitive += 1;
        },
      },
      FunctionExpression: {
        enter() {
          complexity.functions++;
        },
      },
      ArrowFunctionExpression: {
        enter() {
          complexity.functions++;
        },
      },
      ClassDeclaration: {
        enter() {
          complexity.classes++;
          complexity.cognitive += 2;
        },
      },
      ClassExpression: {
        enter() {
          complexity.classes++;
        },
      },
    });
    complexity.nestingLevel = complexity.maxNesting;
    this.statistics.complexityScores.push(complexity.cyclomatic);
    return complexity;
  }

  _analyzeDependencies(ast) {
    const dependencies = {
      imports: [],
      exports: [],
      requires: [],
      dynamicImports: [],
      external: new Set(),
      internal: new Set(),
    };
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        dependencies.imports.push({
          source,
          specifiers: path.node.specifiers.map((s) => ({
            type: s.type,
            local: s.local.name,
            imported: s.imported?.name,
          })),
        });
        if (source.startsWith(".") || source.startsWith("/")) {
          dependencies.internal.add(source);
        } else {
          dependencies.external.add(source);
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          const source = path.node.source.value;
          dependencies.exports.push({
            type: "named",
            source,
            reexport: true,
          });
        }
      },
      ExportAllDeclaration(path) {
        const source = path.node.source.value;
        dependencies.exports.push({
          type: "all",
          source,
          reexport: true,
        });
      },
      CallExpression(path) {
        if (
          path.node.callee.name === "require" &&
          path.node.arguments.length > 0
        ) {
          const arg = path.node.arguments[0];
          if (arg.type === "StringLiteral") {
            dependencies.requires.push(arg.value);
          }
        }
        if (path.node.callee.type === "Import") {
          const arg = path.node.arguments[0];
          if (arg.type === "StringLiteral") {
            dependencies.dynamicImports.push(arg.value);
          }
        }
      },
    });
    dependencies.external = Array.from(dependencies.external);
    dependencies.internal = Array.from(dependencies.internal);
    this.statistics.dependencyCounts.push(dependencies.imports.length);
    return dependencies;
  }

  analyzePatterns(ast) {
    return this._analyzePatterns(ast);
  }

  _analyzePatterns(ast) {
    const patterns = {
      functions: [],
      variables: [],
      classes: [],
      asyncPatterns: [],
      errorHandling: [],
      loops: [],
      conditionals: [],
      patterns: [],
    };
    traverse(ast, {
      FunctionDeclaration(path) {
        patterns.functions.push({
          name: path.node.id?.name || "anonymous",
          async: path.node.async,
          generator: path.node.generator,
          params: path.node.params.length,
          loc: path.node.loc,
        });
      },
      VariableDeclaration(path) {
        patterns.variables.push({
          kind: path.node.kind,
          declarations: path.node.declarations.length,
          loc: path.node.loc,
        });
      },
      ClassDeclaration(path) {
        patterns.classes.push({
          name: path.node.id?.name || "anonymous",
          superClass: path.node.superClass?.name,
          loc: path.node.loc,
        });
      },
      TryStatement(path) {
        patterns.errorHandling.push({
          hasCatch: !!path.node.handler,
          hasFinally: !!path.node.finalizer,
          loc: path.node.loc,
        });
      },
      ForStatement(path) {
        patterns.loops.push({
          type: "for",
          loc: path.node.loc,
        });
      },
      ForInStatement(path) {
        patterns.loops.push({
          type: "for-in",
          loc: path.node.loc,
        });
      },
      ForOfStatement(path) {
        patterns.loops.push({
          type: "for-of",
          await: path.node.await,
          loc: path.node.loc,
        });
      },
      WhileStatement(path) {
        patterns.loops.push({
          type: "while",
          loc: path.node.loc,
        });
      },
      DoWhileStatement(path) {
        patterns.loops.push({
          type: "do-while",
          loc: path.node.loc,
        });
      },
      IfStatement(path) {
        patterns.conditionals.push({
          hasAlternate: !!path.node.alternate,
          loc: path.node.loc,
        });
      },
      SwitchStatement(path) {
        patterns.conditionals.push({
          type: "switch",
          cases: path.node.cases.length,
          loc: path.node.loc,
        });
      },
      AwaitExpression(path) {
        patterns.asyncPatterns.push({
          type: "await",
          loc: path.node.loc,
        });
      },
    });
    this.statistics.patternMatches +=
      patterns.functions.length + patterns.classes.length;
    return patterns;
  }

  _analyzeStructure(ast) {
    const structure = {
      topLevelStatements: 0,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      comments: [],
    };
    if (ast.program && ast.program.body) {
      structure.topLevelStatements = ast.program.body.length;
      for (const node of ast.program.body) {
        switch (node.type) {
          case "FunctionDeclaration":
            structure.functions.push({
              name: node.id?.name,
              loc: node.loc,
            });
            break;
          case "ClassDeclaration":
            structure.classes.push({
              name: node.id?.name,
              loc: node.loc,
            });
            break;
          case "ImportDeclaration":
            structure.imports.push({
              source: node.source.value,
              loc: node.loc,
            });
            break;
          case "ExportNamedDeclaration":
          case "ExportDefaultDeclaration":
          case "ExportAllDeclaration":
            structure.exports.push({
              type: node.type,
              loc: node.loc,
            });
            break;
        }
      }
    }
    return structure;
  }

  _analyzeMetrics(ast) {
    const metrics = {
      totalNodes: 0,
      nodeTypes: {},
      depth: 0,
      maxDepth: 0,
      branches: 0,
    };
    const self = this;
    function traverseDepth(node, depth) {
      metrics.totalNodes++;
      metrics.nodeTypes[node.type] = (metrics.nodeTypes[node.type] || 0) + 1;
      if (depth > metrics.maxDepth) {
        metrics.maxDepth = depth;
      }
      for (const key in node) {
        if (
          key === "loc" ||
          key === "start" ||
          key === "end" ||
          key === "range"
        )
          continue;
        const child = node[key];
        if (child && typeof child === "object") {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === "object" && item.type) {
                traverseDepth(item, depth + 1);
              }
            }
          } else if (child.type) {
            traverseDepth(child, depth + 1);
          }
        }
      }
    }
    traverseDepth(ast, 0);
    metrics.depth = metrics.maxDepth;
    return metrics;
  }

  _analyzeSecurity(ast) {
    const security = {
      issues: [],
      evalUsage: 0,
      unsafePatterns: 0,
      hardcodedSecrets: 0,
      unsafeRegex: 0,
    };
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.name === "eval") {
          security.evalUsage++;
          security.issues.push({
            type: "eval",
            message: "Use of eval() is potentially unsafe",
            loc: path.node.loc,
          });
        }
        if (path.node.callee.name === "Function") {
          security.unsafePatterns++;
          security.issues.push({
            type: "Function constructor",
            message: "Function constructor is similar to eval()",
            loc: path.node.loc,
          });
        }
      },
      NewExpression(path) {
        if (
          path.node.callee.name === "RegExp" &&
          path.node.arguments.length > 0
        ) {
          const arg = path.node.arguments[0];
          if (arg.type === "StringLiteral") {
            const pattern = arg.value;
            if (self._isUnsafeRegex(pattern)) {
              security.unsafeRegex++;
              security.issues.push({
                type: "unsafe-regex",
                message: "Potentially unsafe regex pattern",
                loc: path.node.loc,
              });
            }
          }
        }
      },
      AssignmentExpression(path) {
        if (path.node.left.type === "MemberExpression") {
          const prop = path.node.left.property;
          if (prop.name === "innerHTML") {
            security.unsafePatterns++;
            security.issues.push({
              type: "innerHTML",
              message: "Setting innerHTML can lead to XSS",
              loc: path.node.loc,
            });
          }
        }
      },
    });
    return security;
  }

  _isUnsafeRegex(pattern) {
    const unsafePatterns = [
      /\(\.\*\)\1/,
      /\(\.\+\)\1/,
      /\(\.\*\)\{\d+,\}/,
      /\(\.\+\)\{\d+,\}/,
    ];
    return unsafePatterns.some((p) => p.test(pattern));
  }

  _analyzePerformance(ast) {
    const performance = {
      issues: [],
      syncOperations: 0,
      largeLoops: 0,
      deepNesting: 0,
      memoryIntensive: 0,
    };
    traverse(ast, {
      ForStatement(path) {
        const body = path.node.body;
        if (body && body.body && body.body.length > 10) {
          performance.largeLoops++;
          performance.issues.push({
            type: "large-loop",
            message: "Large loop body may impact performance",
            loc: path.node.loc,
          });
        }
      },
      WhileStatement(path) {
        performance.syncOperations++;
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.type === "MemberExpression") {
          const method = callee.property.name;
          if (["push", "concat", "splice", "slice"].includes(method)) {
            if (path.node.arguments.length > 100) {
              performance.memoryIntensive++;
            }
          }
        }
      },
    });
    return performance;
  }

  _recordAnalysis(id, duration, results) {
    this.results.set(id, {
      results,
      duration,
      timestamp: Date.now(),
    });
    this._analysisTimes.push(duration);
    this.statistics.totalAnalyzed++;
    this.statistics.totalFiles++;
    this._updateAverageTime();
  }

  _updateAverageTime() {
    if (this._analysisTimes.length > 100) {
      this._analysisTimes = this._analysisTimes.slice(-100);
    }
    const sum = this._analysisTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageAnalysisTime = sum / this._analysisTimes.length;
  }

  getResults(id) {
    return this.results.get(id);
  }

  getAllResults() {
    return Array.from(this.results.entries());
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  addAnalysisType(type) {
    if (!this.options.analysisTypes.includes(type)) {
      this.options.analysisTypes.push(type);
    }
    return this;
  }

  removeAnalysisType(type) {
    const index = this.options.analysisTypes.indexOf(type);
    if (index > -1) {
      this.options.analysisTypes.splice(index, 1);
    }
    return this;
  }

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  exportResults(format = "json") {
    const results = Array.from(this.results.entries());
    switch (format) {
      case "json":
        return JSON.stringify(results, null, 2);
      case "csv":
        return this._formatAsCSV(results);
      default:
        return results;
    }
  }

  _formatAsCSV(results) {
    const headers = ["id", "duration", "timestamp"];
    const rows = [headers.join(",")];
    for (const [id, data] of results) {
      rows.push([id, data.duration, data.timestamp].join(","));
    }
    return rows.join("\n");
  }

  reset() {
    this.results.clear();
    this._analysisTimes = [];
    this._patterns = this._initializePatterns();
    this.statistics = {
      totalAnalyzed: 0,
      totalFiles: 0,
      totalErrors: 0,
      averageAnalysisTime: 0,
      complexityScores: [],
      dependencyCounts: [],
      patternMatches: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = AnalysisTask;
