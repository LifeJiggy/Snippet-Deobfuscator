const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

class ValidationTask {
  constructor(options = {}) {
    this.name = "ValidationTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      strictMode: options.strictMode || false,
      validateSyntax: options.validateSyntax !== false,
      validateSemantics: options.validateSemantics !== false,
      validateStyle: options.validateStyle || false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      maxErrors: options.maxErrors || 100,
    };
    this.rules = new Map();
    this.results = new Map();
    this.violations = [];
    this.statistics = {
      totalValidated: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalViolations: 0,
      errorsByType: {},
      errorsByRule: {},
      averageValidationTime: 0,
    };
    this._validationTimes = [];
    this._initializeDefaultRules();
  }

  _initializeDefaultRules() {
    this.addRule("no-unused-vars", {
      description: "Disallow unused variables",
      severity: "warning",
      category: "best-practices",
      check: this._checkUnusedVars.bind(this),
    });
    this.addRule("no-undef", {
      description: "Disallow undeclared variables",
      severity: "error",
      category: "possible-errors",
      check: this._checkUndef.bind(this),
    });
    this.addRule("no-dupe-args", {
      description: "Disallow duplicate arguments",
      severity: "error",
      category: "possible-errors",
      check: this._checkDupeArgs.bind(this),
    });
    this.addRule("no-redeclare", {
      description: "Disallow variable redeclaration",
      severity: "error",
      category: "best-practices",
      check: this._checkRedeclare.bind(this),
    });
    this.addRule("no-empty", {
      description: "Disallow empty block statements",
      severity: "warning",
      category: "stylistic",
      check: this._checkEmptyBlock.bind(this),
    });
    this.addRule("no-console", {
      description: "Disallow console statements",
      severity: "warning",
      category: "best-practices",
      check: this._checkConsole.bind(this),
    });
    this.addRule("no-debugger", {
      description: "Disallow debugger statements",
      severity: "warning",
      category: "best-practices",
      check: this._checkDebugger.bind(this),
    });
    this.addRule("no-constant-condition", {
      description: "Disallow constant conditions",
      severity: "warning",
      category: "possible-errors",
      check: this._checkConstantCondition.bind(this),
    });
    this.addRule("no-unreachable", {
      description: "Disallow unreachable code",
      severity: "error",
      category: "possible-errors",
      check: this._checkUnreachable.bind(this),
    });
    this.addRule("valid-typeof", {
      description: "Ensure typeof expressions are valid",
      severity: "error",
      category: "possible-errors",
      check: this._checkValidTypeof.bind(this),
    });
  }

  async validate(code, options = {}) {
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    if (code.length > this.options.maxFileSize) {
      throw new Error(
        `Code exceeds maximum file size of ${this.options.maxFileSize} bytes`
      );
    }
    const startTime = Date.now();
    const validationId = `validation-${startTime}`;
    const violations = [];
    try {
      const ast = this._parseCode(code, options);
      if (options.validateSyntax !== false && this.options.validateSyntax) {
        const syntaxViolations = this.validateSyntax(ast, options);
        violations.push(...syntaxViolations);
      }
      if (
        options.validateSemantics !== false &&
        this.options.validateSemantics
      ) {
        const semanticViolations = await this.validateSemantics(ast, options);
        violations.push(...semanticViolations);
      }
      if (options.validateStyle && this.options.validateStyle) {
        const styleViolations = this._validateStyle(ast, options);
        violations.push(...styleViolations);
      }
      const ruleViolations = await this._applyRules(ast, options);
      violations.push(...ruleViolations);
      const passed =
        violations.filter((v) => v.severity === "error").length === 0;
      const duration = Date.now() - startTime;
      this._recordValidation(validationId, {
        passed,
        violations,
        duration,
      });
      return {
        id: validationId,
        passed,
        violations: violations.slice(0, this.options.maxErrors),
        summary: this._createSummary(violations),
        duration,
      };
    } catch (error) {
      violations.push({
        rule: "parse-error",
        severity: "error",
        message: error.message,
        line: 0,
        column: 0,
      });
      const duration = Date.now() - startTime;
      this._recordValidation(validationId, {
        passed: false,
        violations,
        duration,
      });
      return {
        id: validationId,
        passed: false,
        violations,
        summary: this._createSummary(violations),
        duration,
      };
    }
  }

  validateSyntax(ast, options = {}) {
    const violations = [];
    if (!ast || typeof ast !== "object") {
      violations.push({
        rule: "syntax-error",
        severity: "error",
        message: "Invalid AST structure",
        line: 0,
        column: 0,
      });
      return violations;
    }
    const self = this;
    traverse(ast, {
      FunctionDeclaration(path) {
        if (!path.node.id) {
          violations.push({
            rule: "syntax-error",
            severity: "error",
            message: "Function declaration must have a name",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      ReturnStatement(path) {
        const func = path.getFunctionParent();
        if (!func) {
          violations.push({
            rule: "syntax-error",
            severity: "error",
            message: "Return statement outside of function",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      BreakStatement(path) {
        const loop = path.getParentLoop();
        if (!loop && !path.findParent((p) => p.isSwitchStatement())) {
          violations.push({
            rule: "syntax-error",
            severity: "error",
            message: "Break statement outside of loop or switch",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      ContinueStatement(path) {
        const loop = path.getParentLoop();
        if (!loop) {
          violations.push({
            rule: "syntax-error",
            severity: "error",
            message: "Continue statement outside of loop",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  async validateSemantics(ast, options = {}) {
    const violations = [];
    const scopes = new Map();
    let currentScope = null;
    const self = this;
    traverse(ast, {
      Program(path) {
        currentScope = path.scope;
      },
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name) {
          const binding = path.scope.getBinding(name);
          if (!binding) {
            violations.push({
              rule: "semantic-error",
              severity: "warning",
              message: `Function "${name}" is not properly bound`,
              line: path.node.loc?.start?.line || 0,
              column: path.node.loc?.start?.column || 0,
            });
          }
        }
      },
      VariableDeclarator(path) {
        const name = path.node.id.name;
        const binding = path.scope.getBinding(name);
        if (binding && binding.constantViolations.length > 0) {
          violations.push({
            rule: "semantic-warning",
            severity: "info",
            message: `Variable "${name}" is reassigned`,
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      Identifier(path) {
        if (
          path.isReferencedIdentifier() &&
          !path.scope.hasBinding(path.node.name)
        ) {
          violations.push({
            rule: "semantic-error",
            severity: "error",
            message: `Undefined variable "${path.node.name}"`,
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  _validateStyle(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      Identifier(path) {
        const name = path.node.name;
        if (name.length > 30) {
          violations.push({
            rule: "style-warning",
            severity: "warning",
            message: `Identifier "${name}" is too long`,
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      VariableDeclarator(path) {
        if (!path.node.init) {
          violations.push({
            rule: "style-warning",
            severity: "info",
            message: "Variable declared but not initialized",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  async _applyRules(ast, options = {}) {
    const violations = [];
    const enabledRules = Array.from(this.rules.values()).filter(
      (r) => r.enabled !== false
    );
    for (const rule of enabledRules) {
      try {
        const ruleViolations = await rule.check(ast, options);
        for (const v of ruleViolations) {
          violations.push({
            ...v,
            rule: rule.name,
            severity: v.severity || rule.severity,
          });
          this.statistics.errorsByRule[rule.name] =
            (this.statistics.errorsByRule[rule.name] || 0) + 1;
        }
      } catch (error) {
        violations.push({
          rule: rule.name,
          severity: "error",
          message: `Rule check failed: ${error.message}`,
          line: 0,
          column: 0,
        });
      }
    }
    return violations;
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...options.parseOptions,
    };
    return parser.parse(code, parseOptions);
  }

  _checkUnusedVars(ast, options = {}) {
    const violations = [];
    const self = this;
    traverse(ast, {
      Program(path) {
        const bindings = path.scope.getAllBindings();
        for (const [name, binding] of Object.entries(bindings)) {
          if (!binding.referenced && !name.startsWith("_")) {
            violations.push({
              message: `Variable "${name}" is defined but never used`,
              line: binding.path.node.loc?.start?.line || 0,
              column: binding.path.node.loc?.start?.column || 0,
            });
          }
        }
      },
    });
    return violations;
  }

  _checkUndef(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      Identifier(path) {
        if (
          path.isReferencedIdentifier() &&
          !path.scope.hasBinding(path.node.name)
        ) {
          violations.push({
            message: `"${path.node.name}" is not defined`,
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  _checkDupeArgs(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      Function(path) {
        const params = path.node.params;
        const names = new Set();
        for (const param of params) {
          if (param.type === "Identifier") {
            if (names.has(param.name)) {
              violations.push({
                message: `Duplicate argument "${param.name}"`,
                line: param.loc?.start?.line || 0,
                column: param.loc?.start?.column || 0,
              });
            }
            names.add(param.name);
          }
        }
      },
    });
    return violations;
  }

  _checkRedeclare(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      VariableDeclarator(path) {
        const name = path.node.id.name;
        const binding = path.scope.getBinding(name);
        if (binding && binding.kind !== "param") {
          const declarations = path.scope.getBindings()[name];
          if (declarations && declarations.length > 1) {
            violations.push({
              message: `"${name}" is already declared`,
              line: path.node.loc?.start?.line || 0,
              column: path.node.loc?.start?.column || 0,
            });
          }
        }
      },
    });
    return violations;
  }

  _checkEmptyBlock(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      BlockStatement(path) {
        if (
          path.node.body.length === 0 &&
          path.parent.type !== "FunctionDeclaration"
        ) {
          violations.push({
            message: "Empty block statement",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  _checkConsole(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "console"
        ) {
          violations.push({
            message: "Unexpected console statement",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  _checkDebugger(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      DebuggerStatement(path) {
        violations.push({
          message: "Unexpected debugger statement",
          line: path.node.loc?.start?.line || 0,
          column: path.node.loc?.start?.column || 0,
        });
      },
    });
    return violations;
  }

  _checkConstantCondition(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      IfStatement(path) {
        if (path.node.test.type === "BooleanLiteral") {
          violations.push({
            message: "Constant condition in if statement",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
      WhileStatement(path) {
        if (
          path.node.test.type === "BooleanLiteral" &&
          path.node.test.value === true
        ) {
          violations.push({
            message: "Infinite loop detected",
            line: path.node.loc?.start?.line || 0,
            column: path.node.loc?.start?.column || 0,
          });
        }
      },
    });
    return violations;
  }

  _checkUnreachable(ast, options = {}) {
    const violations = [];
    traverse(ast, {
      ReturnStatement(path) {
        const siblings = path.parent.body || [];
        const index = siblings.indexOf(path.node);
        if (index < siblings.length - 1) {
          for (let i = index + 1; i < siblings.length; i++) {
            violations.push({
              message: "Unreachable code detected",
              line: siblings[i].loc?.start?.line || 0,
              column: siblings[i].loc?.start?.column || 0,
            });
            break;
          }
        }
      },
      ThrowStatement(path) {
        const siblings = path.parent.body || [];
        const index = siblings.indexOf(path.node);
        if (index < siblings.length - 1) {
          for (let i = index + 1; i < siblings.length; i++) {
            violations.push({
              message: "Unreachable code detected",
              line: siblings[i].loc?.start?.line || 0,
              column: siblings[i].loc?.start?.column || 0,
            });
            break;
          }
        }
      },
    });
    return violations;
  }

  _checkValidTypeof(ast, options = {}) {
    const violations = [];
    const validTypes = [
      "undefined",
      "object",
      "boolean",
      "number",
      "string",
      "function",
      "symbol",
      "bigint",
    ];
    traverse(ast, {
      BinaryExpression(path) {
        if (path.node.operator === "===" || path.node.operator === "==") {
          let typeofNode, compareNode;
          if (
            path.node.left.type === "UnaryExpression" &&
            path.node.left.operator === "typeof"
          ) {
            typeofNode = path.node.left;
            compareNode = path.node.right;
          } else if (
            path.node.right.type === "UnaryExpression" &&
            path.node.right.operator === "typeof"
          ) {
            typeofNode = path.node.right;
            compareNode = path.node.left;
          }
          if (compareNode && compareNode.type === "StringLiteral") {
            if (!validTypes.includes(compareNode.value)) {
              violations.push({
                message: `Invalid typeof comparison value "${compareNode.value}"`,
                line: path.node.loc?.start?.line || 0,
                column: path.node.loc?.start?.column || 0,
              });
            }
          }
        }
      },
    });
    return violations;
  }

  addRule(name, config) {
    if (this.rules.has(name)) {
      throw new Error(`Rule "${name}" already exists`);
    }
    this.rules.set(name, {
      name,
      description: config.description || "",
      severity: config.severity || "warning",
      category: config.category || "unknown",
      check: config.check || (() => []),
      enabled: config.enabled !== false,
    });
    return this;
  }

  removeRule(name) {
    this.rules.delete(name);
    return this;
  }

  getRule(name) {
    return this.rules.get(name);
  }

  hasRule(name) {
    return this.rules.has(name);
  }

  listRules() {
    return Array.from(this.rules.keys());
  }

  enableRule(name) {
    const rule = this.rules.get(name);
    if (rule) rule.enabled = true;
    return this;
  }

  disableRule(name) {
    const rule = this.rules.get(name);
    if (rule) rule.enabled = false;
    return this;
  }

  setRuleSeverity(name, severity) {
    const rule = this.rules.get(name);
    if (rule) rule.severity = severity;
    return this;
  }

  _createSummary(violations) {
    const summary = {
      total: violations.length,
      errors: 0,
      warnings: 0,
      info: 0,
    };
    for (const v of violations) {
      switch (v.severity) {
        case "error":
          summary.errors++;
          break;
        case "warning":
          summary.warnings++;
          break;
        default:
          summary.info++;
      }
    }
    return summary;
  }

  _recordValidation(id, data) {
    this.results.set(id, {
      ...data,
      timestamp: Date.now(),
    });
    this.statistics.totalValidated++;
    if (data.passed) {
      this.statistics.totalPassed++;
    } else {
      this.statistics.totalFailed++;
    }
    this.statistics.totalViolations += data.violations.length;
    for (const v of data.violations) {
      this.statistics.errorsByType[v.severity] =
        (this.statistics.errorsByType[v.severity] || 0) + 1;
    }
    this._validationTimes.push(data.duration);
    this._updateAverageTime();
  }

  _updateAverageTime() {
    if (this._validationTimes.length > 100) {
      this._validationTimes = this._validationTimes.slice(-100);
    }
    const sum = this._validationTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageValidationTime = sum / this._validationTimes.length;
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

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  reset() {
    this.rules.clear();
    this.results.clear();
    this._initializeDefaultRules();
    this._validationTimes = [];
    this.statistics = {
      totalValidated: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalViolations: 0,
      errorsByType: {},
      errorsByRule: {},
      averageValidationTime: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = ValidationTask;
