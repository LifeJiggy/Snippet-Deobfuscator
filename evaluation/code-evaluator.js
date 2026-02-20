const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class CodeEvaluator {
  constructor(options = {}) {
    this.name = "CodeEvaluator";
    this.version = "3.0.0";
    this.options = {
      sourceType: options.sourceType || "module",
      plugins: options.plugins || ["jsx", "typescript"],
      strictMode: options.strictMode !== false,
      maxCodeSize: options.maxCodeSize || 1024 * 1024,
    };
    this._rules = [];
    this._patterns = new Map();
    this.statistics = {
      totalEvaluations: 0,
      totalIssues: 0,
      syntaxErrors: 0,
      averageScore: 0,
    };
    this._initializeDefaultRules();
  }

  _initializeDefaultRules() {
    this._rules = [
      { id: "no-debugger", severity: "warning", check: this._checkDebugger },
      { id: "no-console", severity: "info", check: this._checkConsole },
      { id: "no-empty", severity: "warning", check: this._checkEmptyBlock },
      {
        id: "no-unused-vars",
        severity: "warning",
        check: this._checkUnusedVars,
      },
      { id: "no-var", severity: "warning", check: this._checkVar },
      { id: "prefer-const", severity: "info", check: this._checkPreferConst },
      { id: "no-eval", severity: "error", check: this._checkEval },
      { id: "no-with", severity: "error", check: this._checkWith },
      { id: "no-alert", severity: "warning", check: this._checkAlert },
      { id: "eq-eq-eq", severity: "warning", check: this._checkEquality },
    ];
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const result = {
      score: 100,
      grade: "A",
      issues: [],
      metrics: {},
      suggestions: [],
      timestamp: Date.now(),
    };
    if (!code || typeof code !== "string") {
      return { error: "Invalid code input", score: 0, grade: "F" };
    }
    if (code.length > this.options.maxCodeSize) {
      return { error: "Code exceeds maximum size", score: 0, grade: "F" };
    }
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });
    } catch (error) {
      this.statistics.syntaxErrors++;
      result.issues.push({
        type: "syntax-error",
        severity: "error",
        message: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
      });
      result.score = 0;
      result.grade = "F";
      return result;
    }
    result.metrics = this._collectMetrics(ast);
    result.issues = this._runRules(ast, code);
    this.statistics.totalIssues += result.issues.length;
    result.score = this._calculateScore(result);
    result.grade = this._scoreToGrade(result.score);
    result.suggestions = this._generateSuggestions(result);
    this._updateAverageScore(result.score);
    return result;
  }

  _collectMetrics(ast) {
    const metrics = {
      lines: 0,
      statements: 0,
      functions: 0,
      classes: 0,
      imports: 0,
      exports: 0,
      variables: 0,
      loops: 0,
      conditionals: 0,
      tryCatch: 0,
      asyncAwait: 0,
      maxNesting: 0,
    };
    traverse(ast, {
      Statement(path) {
        metrics.statements++;
      },
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
      VariableDeclarator() {
        metrics.variables++;
      },
      ForStatement() {
        metrics.loops++;
      },
      ForInStatement() {
        metrics.loops++;
      },
      ForOfStatement() {
        metrics.loops++;
      },
      WhileStatement() {
        metrics.loops++;
      },
      DoWhileStatement() {
        metrics.loops++;
      },
      IfStatement() {
        metrics.conditionals++;
      },
      SwitchStatement() {
        metrics.conditionals++;
      },
      ConditionalExpression() {
        metrics.conditionals++;
      },
      TryStatement() {
        metrics.tryCatch++;
      },
      AwaitExpression() {
        metrics.asyncAwait++;
      },
      AsyncFunction() {
        metrics.asyncAwait++;
      },
    });
    metrics.maxNesting = this._calculateMaxNesting(ast);
    return metrics;
  }

  _calculateMaxNesting(ast) {
    let maxDepth = 0;
    const self = this;
    traverse(ast, {
      enter(path) {
        const depth = self._getDepth(path);
        if (depth > maxDepth) {
          maxDepth = depth;
        }
      },
    });
    return maxDepth;
  }

  _getDepth(path) {
    let depth = 0;
    let current = path.parentPath;
    while (current) {
      if (t.isStatement(current.node) || t.isFunction(current.node)) {
        depth++;
      }
      current = current.parentPath;
    }
    return depth;
  }

  _runRules(ast, code) {
    const issues = [];
    for (const rule of this._rules) {
      try {
        const ruleIssues = rule.check.call(this, ast, code);
        if (ruleIssues && ruleIssues.length > 0) {
          issues.push(
            ...ruleIssues.map((i) => ({
              ...i,
              rule: rule.id,
              severity: i.severity || rule.severity,
            }))
          );
        }
      } catch (error) {
        console.error(`Rule ${rule.id} error:`, error.message);
      }
    }
    return issues;
  }

  _checkDebugger(ast) {
    const issues = [];
    traverse(ast, {
      DebuggerStatement(path) {
        issues.push({
          type: "debugger",
          message: "Unexpected 'debugger' statement",
          line: path.node.loc?.start?.line,
          column: path.node.loc?.start?.column,
        });
      },
    });
    return issues;
  }

  _checkConsole(ast) {
    const issues = [];
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object, { name: "console" })
        ) {
          issues.push({
            type: "console",
            message: `Unexpected console.${callee.property.name} call`,
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _checkEmptyBlock(ast) {
    const issues = [];
    traverse(ast, {
      BlockStatement(path) {
        if (path.node.body.length === 0 && !t.isCatchClause(path.parent)) {
          issues.push({
            type: "empty-block",
            message: "Empty block statement",
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _checkUnusedVars(ast) {
    const issues = [];
    const bindings = new Map();
    const usages = new Map();
    traverse(ast, {
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          bindings.set(path.node.id.name, path.node.loc?.start?.line);
        }
      },
      Identifier(path) {
        if (
          path.isReferencedIdentifier() &&
          !path.scope.getBinding(path.node.name)?.path.isVariableDeclarator()
        ) {
          usages.set(path.node.name, true);
        }
      },
    });
    for (const [name, line] of bindings) {
      if (!usages.has(name)) {
        issues.push({
          type: "unused-var",
          message: `Variable '${name}' is declared but never used`,
          line,
        });
      }
    }
    return issues;
  }

  _checkVar(ast) {
    const issues = [];
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === "var") {
          issues.push({
            type: "no-var",
            message: "Use 'let' or 'const' instead of 'var'",
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _checkPreferConst(ast) {
    const issues = [];
    const assignments = new Set();
    traverse(ast, {
      AssignmentExpression(path) {
        if (t.isIdentifier(path.node.left)) {
          assignments.add(path.node.left.name);
        }
      },
      VariableDeclarator(path) {
        if (
          path.parent.kind === "let" &&
          t.isIdentifier(path.node.id) &&
          !assignments.has(path.node.id.name) &&
          path.node.init
        ) {
          issues.push({
            type: "prefer-const",
            message: `Variable '${path.node.id.name}' is never reassigned. Use 'const' instead`,
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _checkEval(ast) {
    const issues = [];
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee, { name: "eval" })) {
          issues.push({
            type: "no-eval",
            message: "eval() is a security risk and performance concern",
            line: path.node.loc?.start?.line,
            severity: "error",
          });
        }
      },
    });
    return issues;
  }

  _checkWith(ast) {
    const issues = [];
    traverse(ast, {
      WithStatement(path) {
        issues.push({
          type: "no-with",
          message:
            "'with' statement is deprecated and not allowed in strict mode",
          line: path.node.loc?.start?.line,
          severity: "error",
        });
      },
    });
    return issues;
  }

  _checkAlert(ast) {
    const issues = [];
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee, { name: "alert" })) {
          issues.push({
            type: "no-alert",
            message: "Unexpected 'alert' call",
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _checkEquality(ast) {
    const issues = [];
    traverse(ast, {
      BinaryExpression(path) {
        if (path.node.operator === "==" || path.node.operator === "!=") {
          issues.push({
            type: "eq-eq-eq",
            message: `Use '${path.node.operator}=' instead of '${path.node.operator}'`,
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return issues;
  }

  _calculateScore(result) {
    let score = 100;
    for (const issue of result.issues) {
      switch (issue.severity) {
        case "error":
          score -= 10;
          break;
        case "warning":
          score -= 5;
          break;
        case "info":
          score -= 1;
          break;
      }
    }
    if (result.metrics.maxNesting > 5) {
      score -= (result.metrics.maxNesting - 5) * 2;
    }
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
    if (result.issues.some((i) => i.type === "no-var")) {
      suggestions.push({
        type: "modernize",
        message: "Replace 'var' with 'let' or 'const'",
      });
    }
    if (result.issues.some((i) => i.type === "eq-eq-eq")) {
      suggestions.push({
        type: "strict",
        message: "Use strict equality operators (===, !==)",
      });
    }
    if (result.metrics.maxNesting > 4) {
      suggestions.push({
        type: "refactor",
        message: "Reduce nesting depth for better readability",
      });
    }
    return suggestions;
  }

  _updateAverageScore(score) {
    const prevAvg = this.statistics.averageScore;
    const count = this.statistics.totalEvaluations;
    this.statistics.averageScore = (prevAvg * (count - 1) + score) / count;
  }

  addRule(rule) {
    this._rules.push(rule);
    return this;
  }

  removeRule(ruleId) {
    const index = this._rules.findIndex((r) => r.id === ruleId);
    if (index > -1) {
      this._rules.splice(index, 1);
    }
    return this;
  }

  getRules() {
    return [...this._rules];
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.statistics = {
      totalEvaluations: 0,
      totalIssues: 0,
      syntaxErrors: 0,
      averageScore: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._rules = [];
    this._patterns.clear();
    this.options = {};
    return this;
  }
}

module.exports = CodeEvaluator;
