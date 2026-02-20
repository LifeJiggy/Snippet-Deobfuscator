class QualityEvaluator {
  constructor(options = {}) {
    this.name = "QualityEvaluator";
    this.version = "3.0.0";
    this.options = {
      maxLineLength: options.maxLineLength || 100,
      maxFunctionLength: options.maxFunctionLength || 50,
      maxFileLength: options.maxFileLength || 500,
      maxParams: options.maxParams || 5,
      minCommentRatio: options.minCommentRatio || 0.1,
    };
    this._metrics = {};
    this._checks = [];
    this.statistics = {
      totalEvaluations: 0,
      averageScore: 0,
      totalIssues: 0,
    };
    this._initializeChecks();
  }

  _initializeChecks() {
    this._checks = [
      { id: "line-length", check: this._checkLineLength },
      { id: "function-length", check: this._checkFunctionLength },
      { id: "file-length", check: this._checkFileLength },
      { id: "naming-convention", check: this._checkNamingConvention },
      { id: "code-duplication", check: this._checkDuplication },
      { id: "comment-coverage", check: this._checkComments },
      { id: "parameter-count", check: this._checkParameterCount },
      { id: "magic-numbers", check: this._checkMagicNumbers },
      { id: "deep-nesting", check: this._checkDeepNesting },
      { id: "todo-fixme", check: this._checkTodoFixme },
    ];
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const result = {
      score: 100,
      grade: "A",
      metrics: {},
      issues: [],
      suggestions: [],
      timestamp: Date.now(),
    };
    if (!code || typeof code !== "string") {
      return { error: "Invalid code input", score: 0, grade: "F" };
    }
    result.metrics = this._collectMetrics(code);
    for (const check of this._checks) {
      try {
        const checkResult = check.check.call(this, code, result.metrics);
        if (checkResult && checkResult.length > 0) {
          result.issues.push(
            ...checkResult.map((i) => ({
              ...i,
              checkId: check.id,
            }))
          );
        }
      } catch (error) {
        console.error(`Check ${check.id} error:`, error.message);
      }
    }
    this.statistics.totalIssues += result.issues.length;
    result.score = this._calculateScore(result);
    result.grade = this._scoreToGrade(result.score);
    result.suggestions = this._generateSuggestions(result);
    this._updateAverageScore(result.score);
    return result;
  }

  _collectMetrics(code) {
    const lines = code.split("\n");
    const metrics = {
      totalLines: lines.length,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      functions: 0,
      classes: 0,
      imports: 0,
      exports: 0,
      averageLineLength: 0,
      maxLineLength: 0,
      commentRatio: 0,
    };
    let totalLineLength = 0;
    let inBlockComment = false;
    for (const line of lines) {
      const trimmed = line.trim();
      totalLineLength += line.length;
      if (line.length > metrics.maxLineLength) {
        metrics.maxLineLength = line.length;
      }
      if (trimmed === "") {
        metrics.blankLines++;
      } else if (trimmed.startsWith("//") || inBlockComment) {
        metrics.commentLines++;
        if (trimmed.includes("/*")) inBlockComment = true;
        if (trimmed.includes("*/")) inBlockComment = false;
      } else if (trimmed.startsWith("/*")) {
        metrics.commentLines++;
        inBlockComment = true;
        if (trimmed.includes("*/")) inBlockComment = false;
      } else if (trimmed.startsWith("*")) {
        metrics.commentLines++;
      } else {
        metrics.codeLines++;
      }
    }
    metrics.averageLineLength =
      lines.length > 0 ? Math.round(totalLineLength / lines.length) : 0;
    metrics.commentRatio =
      metrics.totalLines > 0 ? metrics.commentLines / metrics.totalLines : 0;
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        FunctionDeclaration() {
          metrics.functions++;
        },
        FunctionExpression() {
          metrics.functions++;
        },
        ArrowFunctionExpression() {
          metrics.functions++;
        },
        ClassDeclaration() {
          metrics.classes++;
        },
        ClassExpression() {
          metrics.classes++;
        },
        ImportDeclaration() {
          metrics.imports++;
        },
        ExportNamedDeclaration() {
          metrics.exports++;
        },
        ExportDefaultDeclaration() {
          metrics.exports++;
        },
      });
    } catch (e) {
      // Parse error, use defaults
    }
    return metrics;
  }

  _checkLineLength(code) {
    const issues = [];
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > this.options.maxLineLength) {
        issues.push({
          type: "line-length",
          severity: "info",
          message: `Line exceeds ${this.options.maxLineLength} characters (${lines[i].length} chars)`,
          line: i + 1,
        });
      }
    }
    return issues;
  }

  _checkFunctionLength(code) {
    const issues = [];
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        FunctionDeclaration(path) {
          const start = path.node.loc?.start?.line;
          const end = path.node.loc?.end?.line;
          const length = end - start + 1;
          if (length > this.options.maxFunctionLength) {
            issues.push({
              type: "function-length",
              severity: "warning",
              message: `Function '${
                path.node.id?.name || "anonymous"
              }' is too long (${length} lines)`,
              line: start,
            });
          }
        },
      });
    } catch (e) {
      // Parse error
    }
    return issues;
  }

  _checkFileLength(code) {
    const issues = [];
    const lines = code.split("\n");
    if (lines.length > this.options.maxFileLength) {
      issues.push({
        type: "file-length",
        severity: "warning",
        message: `File has too many lines (${lines.length} > ${this.options.maxFileLength})`,
        line: 1,
      });
    }
    return issues;
  }

  _checkNamingConvention(code) {
    const issues = [];
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        VariableDeclarator(path) {
          if (path.node.id.type === "Identifier") {
            const name = path.node.id.name;
            if (
              name.length === 1 &&
              !["i", "j", "k", "x", "y", "z", "n"].includes(name)
            ) {
              issues.push({
                type: "naming",
                severity: "info",
                message: `Variable '${name}' has a non-descriptive name`,
                line: path.node.loc?.start?.line,
              });
            }
            if (name.includes("_") && !name.startsWith("_")) {
              issues.push({
                type: "naming",
                severity: "info",
                message: `Variable '${name}' uses snake_case. Consider camelCase.`,
                line: path.node.loc?.start?.line,
              });
            }
          }
        },
      });
    } catch (e) {
      // Parse error
    }
    return issues;
  }

  _checkDuplication(code) {
    const issues = [];
    const lines = code
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 20);
    const seen = new Map();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (seen.has(line)) {
        issues.push({
          type: "duplication",
          severity: "info",
          message: "Potential code duplication detected",
          line: i + 1,
          duplicateOf: seen.get(line),
        });
      } else {
        seen.set(line, i + 1);
      }
    }
    return issues;
  }

  _checkComments(code, metrics) {
    const issues = [];
    if (metrics.commentRatio < this.options.minCommentRatio) {
      issues.push({
        type: "comments",
        severity: "info",
        message: `Low comment ratio (${(metrics.commentRatio * 100).toFixed(
          1
        )}% < ${this.options.minCommentRatio * 100}%)`,
        line: 1,
      });
    }
    return issues;
  }

  _checkParameterCount(code) {
    const issues = [];
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        Function(path) {
          const params = path.node.params.length;
          if (params > this.options.maxParams) {
            issues.push({
              type: "parameters",
              severity: "warning",
              message: `Function has too many parameters (${params} > ${this.options.maxParams})`,
              line: path.node.loc?.start?.line,
            });
          }
        },
      });
    } catch (e) {
      // Parse error
    }
    return issues;
  }

  _checkMagicNumbers(code) {
    const issues = [];
    const magicNumbers = [60, 24, 7, 365, 1000, 1024, 100, 3600];
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        NumericLiteral(path) {
          if (magicNumbers.includes(path.node.value) || path.node.value > 100) {
            const parent = path.parent;
            if (
              parent.type !== "VariableDeclarator" &&
              parent.type !== "AssignmentExpression"
            ) {
              issues.push({
                type: "magic-number",
                severity: "info",
                message: `Magic number ${path.node.value} should be extracted to a named constant`,
                line: path.node.loc?.start?.line,
              });
            }
          }
        },
      });
    } catch (e) {
      // Parse error
    }
    return issues;
  }

  _checkDeepNesting(code) {
    const issues = [];
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        enter(path) {
          let depth = 0;
          let current = path.parentPath;
          while (current) {
            if (
              [
                "IfStatement",
                "ForStatement",
                "WhileStatement",
                "SwitchStatement",
              ].includes(current.node.type)
            ) {
              depth++;
            }
            current = current.parentPath;
          }
          if (depth > 3) {
            issues.push({
              type: "nesting",
              severity: "warning",
              message: `Deep nesting detected (depth: ${depth})`,
              line: path.node.loc?.start?.line,
            });
          }
        },
      });
    } catch (e) {
      // Parse error
    }
    return issues;
  }

  _checkTodoFixme(code) {
    const issues = [];
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("todo:") || line.includes("todo ")) {
        issues.push({
          type: "todo",
          severity: "info",
          message: "TODO comment found",
          line: i + 1,
        });
      }
      if (line.includes("fixme:") || line.includes("fixme ")) {
        issues.push({
          type: "fixme",
          severity: "warning",
          message: "FIXME comment found",
          line: i + 1,
        });
      }
    }
    return issues;
  }

  _calculateScore(result) {
    let score = 100;
    for (const issue of result.issues) {
      switch (issue.severity) {
        case "error":
          score -= 15;
          break;
        case "warning":
          score -= 8;
          break;
        case "info":
          score -= 2;
          break;
      }
    }
    if (result.metrics.commentRatio < 0.05) score -= 10;
    if (result.metrics.maxLineLength > 150) score -= 5;
    return Math.max(0, Math.min(100, score));
  }

  _scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  _generateSuggestions(result) {
    const suggestions = [];
    if (result.issues.some((i) => i.type === "function-length")) {
      suggestions.push({
        type: "refactor",
        message: "Consider breaking down large functions into smaller ones",
      });
    }
    if (result.issues.some((i) => i.type === "nesting")) {
      suggestions.push({
        type: "refactor",
        message: "Extract nested logic into separate functions",
      });
    }
    if (result.metrics.commentRatio < 0.1) {
      suggestions.push({
        type: "documentation",
        message: "Add more comments to explain complex logic",
      });
    }
    return suggestions;
  }

  _updateAverageScore(score) {
    const prevAvg = this.statistics.averageScore;
    const count = this.statistics.totalEvaluations;
    this.statistics.averageScore = (prevAvg * (count - 1) + score) / count;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._metrics = {};
    this.statistics = {
      totalEvaluations: 0,
      averageScore: 0,
      totalIssues: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._checks = [];
    this.options = {};
    return this;
  }
}

module.exports = QualityEvaluator;
