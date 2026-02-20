const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class ValidationRules {
  constructor() {
    this.name = "ValidationRules";
    this.version = "3.0.0";
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      validationErrors: 0,
      syntaxErrors: 0,
      typeErrors: 0,
      scopeErrors: 0,
      referenceErrors: 0,
      semanticErrors: 0,
      importExportErrors: 0,
    };
    this.rules = {};
    this.declaredVariables = new Map();
    this.usedVariables = new Set();
    this.imports = new Map();
    this.exports = new Set();
  }

  initializeRules() {
    this.rules = {
      syntax: {
        parsingErrors: {
          name: "parsing-errors",
          description: "Detects JavaScript syntax parsing errors",
          severity: "critical",
          enabled: true,
        },
        recovery: {
          name: "error-recovery",
          description: "Attempts to recover from syntax errors",
          severity: "high",
          enabled: true,
        },
      },
      typeChecking: {
        implicitCoercion: {
          name: "implicit-coercion",
          description: "Detects implicit type coercion",
          severity: "medium",
          enabled: true,
        },
        typeMismatches: {
          name: "type-mismatches",
          description: "Detects potential type mismatches",
          severity: "medium",
          enabled: true,
        },
        strictEquality: {
          name: "strict-equality",
          description: "Suggests strict equality operators",
          severity: "low",
          enabled: true,
        },
      },
      scope: {
        undeclaredVariables: {
          name: "undeclared-variables",
          description: "Detects references to undeclared variables",
          severity: "high",
          enabled: true,
        },
        shadowing: {
          name: "variable-shadowing",
          description: "Detects variable shadowing in nested scopes",
          severity: "medium",
          enabled: true,
        },
        letConst: {
          name: "prefer-let-const",
          description: "Suggests let/const over var",
          severity: "low",
          enabled: true,
        },
      },
      reference: {
        undefinedReferences: {
          name: "undefined-references",
          description: "Detects references that may be undefined",
          severity: "high",
          enabled: true,
        },
        unusedDeclarations: {
          name: "unused-declarations",
          description: "Detects unused variable and function declarations",
          severity: "low",
          enabled: true,
        },
      },
      semantic: {
        unreachableCode: {
          name: "unreachable-code",
          description: "Detects unreachable code",
          severity: "medium",
          enabled: true,
        },
        infiniteLoops: {
          name: "infinite-loops",
          description: "Detects potential infinite loops",
          severity: "high",
          enabled: true,
        },
        emptyStatements: {
          name: "empty-statements",
          description: "Detects empty statements",
          severity: "low",
          enabled: true,
        },
      },
      importExport: {
        missingExports: {
          name: "missing-exports",
          description: "Detects imports from non-existent exports",
          severity: "high",
          enabled: true,
        },
        circularDependencies: {
          name: "circular-dependencies",
          description: "Detects potential circular dependencies",
          severity: "medium",
          enabled: true,
        },
        unusedImports: {
          name: "unused-imports",
          description: "Detects imported but unused identifiers",
          severity: "low",
          enabled: true,
        },
      },
    };
    return this.rules;
  }

  apply(code, options) {
    options = options || {};
    this.reset();
    this.initializeRules();

    var config = {
      checkSyntax: options.checkSyntax !== false,
      checkTypes: options.checkTypes !== false,
      checkScope: options.checkScope !== false,
      checkReferences: options.checkReferences !== false,
      checkSemantics: options.checkSemantics !== false,
      checkImports: options.checkImports !== false,
    };

    var ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        allowReturnOutsideFunction: true,
        errorRecovery: true,
      });
    } catch (error) {
      this.violations.push({
        rule: this.rules.syntax.parsingErrors.name,
        message: "Syntax error: " + error.message,
        severity: this.rules.syntax.parsingErrors.severity,
        line: error.loc ? error.loc.line : 0,
        column: error.loc ? error.loc.column : 0,
        suggestion: "Fix the syntax error before continuing analysis",
      });
      this.statistics.syntaxErrors++;
      this.statistics.validationErrors++;
      return this.violations;
    }

    this.validate(ast, config);
    this.statistics.totalChecks = this.violations.length;

    return this.violations;
  }

  validate(ast, config) {
    var self = this;

    this.collectDeclarations(ast);
    this.collectImportsExports(ast);

    traverse(ast, {
      Identifier: function (path) {
        if (config.checkScope) {
          self.checkUndeclaredVariable(path);
        }
        if (config.checkReferences) {
          self.trackVariableUsage(path);
        }
      },
      BinaryExpression: function (path) {
        if (config.checkTypes) {
          self.checkTypeCoercion(path);
          self.checkStrictEquality(path);
        }
      },
      VariableDeclaration: function (path) {
        if (config.checkScope) {
          self.checkVarDeclaration(path);
        }
      },
      VariableDeclarator: function (path) {
        if (config.checkScope) {
          self.checkVariableShadowing(path);
        }
      },
      IfStatement: function (path) {
        if (config.checkSemantics) {
          self.checkUnreachableCode(path);
        }
      },
      WhileStatement: function (path) {
        if (config.checkSemantics) {
          self.checkInfiniteLoop(path);
        }
      },
      ForStatement: function (path) {
        if (config.checkSemantics) {
          self.checkInfiniteForLoop(path);
        }
      },
      EmptyStatement: function (path) {
        if (config.checkSemantics) {
          self.checkEmptyStatement(path);
        }
      },
      ReturnStatement: function (path) {
        if (config.checkSemantics) {
          self.checkCodeAfterReturn(path);
        }
      },
      ImportDeclaration: function (path) {
        if (config.checkImports) {
          self.checkImportDeclaration(path);
        }
      },
      ExportNamedDeclaration: function (path) {
        if (config.checkImports) {
          self.checkExportDeclaration(path);
        }
      },
      MemberExpression: function (path) {
        if (config.checkTypes) {
          self.checkMemberAccessType(path);
        }
      },
      CallExpression: function (path) {
        if (config.checkTypes) {
          self.checkCallExpressionTypes(path);
        }
      },
    });

    if (config.checkReferences) {
      this.checkUnusedVariables();
    }
    if (config.checkImports) {
      this.checkUnusedImports();
    }
  }

  collectDeclarations(ast) {
    var self = this;

    traverse(ast, {
      VariableDeclarator: function (path) {
        var name = path.node.id.name;
        var scope = path.scope;

        if (!self.declaredVariables.has(name)) {
          self.declaredVariables.set(name, []);
        }
        self.declaredVariables.get(name).push({
          line: path.node.loc ? path.node.loc.start.line : 0,
          scope: scope,
          used: false,
        });
      },
      FunctionDeclaration: function (path) {
        var name = path.node.id ? path.node.id.name : null;
        if (name) {
          if (!self.declaredVariables.has(name)) {
            self.declaredVariables.set(name, []);
          }
          self.declaredVariables.get(name).push({
            line: path.node.loc ? path.node.loc.start.line : 0,
            scope: path.scope,
            used: false,
            isFunction: true,
          });
        }
      },
    });
  }

  collectImportsExports(ast) {
    var self = this;

    traverse(ast, {
      ImportDeclaration: function (path) {
        var specifiers = path.node.specifiers;
        var source = path.node.source.value;

        specifiers.forEach(function (spec) {
          var localName = spec.local.name;
          self.imports.set(localName, {
            source: source,
            line: path.node.loc ? path.node.loc.start.line : 0,
            used: false,
          });
        });
      },
      ExportNamedDeclaration: function (path) {
        var declaration = path.node.declaration;

        if (declaration) {
          if (t.isFunctionDeclaration(declaration) && declaration.id) {
            self.exports.add(declaration.id.name);
          } else if (t.isVariableDeclaration(declaration)) {
            declaration.declarations.forEach(function (decl) {
              if (t.isIdentifier(decl.id)) {
                self.exports.add(decl.id.name);
              }
            });
          }
        }
      },
    });
  }

  checkUndeclaredVariable(path) {
    var name = path.node.name;
    var parent = path.parent;

    if (
      t.isMemberExpression(parent) &&
      parent.property === path.node &&
      !parent.computed
    ) {
      return;
    }

    if (
      t.isObjectProperty(parent) &&
      parent.key === path.node &&
      !parent.computed
    ) {
      return;
    }

    if (t.isVariableDeclarator(parent) && parent.id === path.node) {
      return;
    }

    if (t.isFunctionDeclaration(parent) || t.isFunctionExpression(parent)) {
      if (parent.id === path.node) {
        return;
      }
    }

    if (t.isFunction(parent)) {
      var params = parent.params;
      if (params.indexOf(path.node) !== -1) {
        return;
      }
    }

    var binding = path.scope.getBinding(name);

    if (!binding && !this.imports.has(name)) {
      var globals = [
        "undefined",
        "null",
        "NaN",
        "Infinity",
        "console",
        "window",
        "document",
        "global",
        "process",
        "module",
        "exports",
        "require",
        "setTimeout",
        "setInterval",
        "clearTimeout",
        "clearInterval",
        "Promise",
        "Symbol",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "Function",
        "Error",
        "Date",
        "RegExp",
        "Map",
        "Set",
        "JSON",
        "Math",
        "parseInt",
        "parseFloat",
        "isNaN",
        "isFinite",
        "encodeURI",
        "decodeURI",
        "encodeURIComponent",
        "decodeURIComponent",
        "eval",
        "arguments",
        "this",
        "super",
        "new",
        "typeof",
        "instanceof",
      ];

      if (globals.indexOf(name) === -1) {
        this.addViolation({
          rule: this.rules.scope.undeclaredVariables.name,
          message: "Undeclared variable: " + name,
          severity: this.rules.scope.undeclaredVariables.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Declare the variable or import it from a module",
        });
        this.statistics.scopeErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  trackVariableUsage(path) {
    var name = path.node.name;
    var parent = path.parent;

    if (t.isVariableDeclarator(parent) && parent.id === path.node) {
      return;
    }

    if (t.isFunctionDeclaration(parent) || t.isFunctionExpression(parent)) {
      if (parent.id === path.node) {
        return;
      }
    }

    this.usedVariables.add(name);

    if (this.imports.has(name)) {
      var importInfo = this.imports.get(name);
      importInfo.used = true;
    }

    if (this.declaredVariables.has(name)) {
      var declarations = this.declaredVariables.get(name);
      declarations.forEach(function (decl) {
        decl.used = true;
      });
    }
  }

  checkTypeCoercion(path) {
    var operator = path.node.operator;
    var left = path.node.left;
    var right = path.node.right;

    if (operator === "==" || operator === "!=") {
      this.addViolation({
        rule: this.rules.typeChecking.strictEquality.name,
        message: "Loose equality operator used - may cause type coercion",
        severity: this.rules.typeChecking.strictEquality.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Use strict equality (=== or !==) instead",
      });
      this.statistics.typeErrors++;
      this.statistics.validationErrors++;
    }

    if (operator === "+") {
      if (
        (t.isStringLiteral(left) && !t.isStringLiteral(right)) ||
        (t.isStringLiteral(right) && !t.isStringLiteral(left))
      ) {
        this.addViolation({
          rule: this.rules.typeChecking.implicitCoercion.name,
          message: "Implicit type coercion in addition with string",
          severity: this.rules.typeChecking.implicitCoercion.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Explicitly convert types or use template literals",
        });
        this.statistics.typeErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  checkStrictEquality(path) {
    var left = path.node.left;
    var right = path.node.right;
    var operator = path.node.operator;

    if (operator === "===" || operator === "!==") {
      if (t.isLiteral(left) && t.isLiteral(right)) {
        if (typeof left.value !== typeof right.value) {
          this.addViolation({
            rule: this.rules.typeChecking.typeMismatches.name,
            message:
              "Comparing values of different types always returns " +
              (operator === "===" ? "false" : "true"),
            severity: this.rules.typeChecking.typeMismatches.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: "This comparison may be a bug",
          });
          this.statistics.typeErrors++;
          this.statistics.validationErrors++;
        }
      }
    }
  }

  checkVarDeclaration(path) {
    var kind = path.node.kind;

    if (kind === "var") {
      this.addViolation({
        rule: this.rules.scope.letConst.name,
        message: "var declaration used - consider let or const",
        severity: this.rules.scope.letConst.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Use let for mutable variables or const for constants",
      });
      this.statistics.scopeErrors++;
      this.statistics.validationErrors++;
    }
  }

  checkVariableShadowing(path) {
    var name = path.node.id.name;
    var binding = path.scope.getBinding(name);

    if (binding && binding.kind !== "param") {
      var shadowed = path.scope.parent && path.scope.parent.getBinding(name);

      if (shadowed) {
        this.addViolation({
          rule: this.rules.scope.shadowing.name,
          message:
            "Variable shadowing: " + name + " shadows outer scope variable",
          severity: this.rules.scope.shadowing.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Rename the variable to avoid confusion",
        });
        this.statistics.scopeErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  checkUnreachableCode(path) {
    var test = path.node.test;

    if (t.isBooleanLiteral(test)) {
      if (test.value === false) {
        this.addViolation({
          rule: this.rules.semantic.unreachableCode.name,
          message: "Unreachable code: if condition is always false",
          severity: this.rules.semantic.unreachableCode.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Remove the unreachable code block",
        });
        this.statistics.semanticErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  checkInfiniteLoop(path) {
    var test = path.node.test;

    if (t.isBooleanLiteral(test, { value: true })) {
      var hasBreak = false;

      path.traverse({
        BreakStatement: function () {
          hasBreak = true;
        },
        ReturnStatement: function () {
          hasBreak = true;
        },
        ThrowStatement: function () {
          hasBreak = true;
        },
      });

      if (!hasBreak) {
        this.addViolation({
          rule: this.rules.semantic.infiniteLoops.name,
          message: "Potential infinite while loop detected",
          severity: this.rules.semantic.infiniteLoops.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Add a break condition or verify this is intentional",
        });
        this.statistics.semanticErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  checkInfiniteForLoop(path) {
    var test = path.node.test;
    var update = path.node.update;

    if (!test && !update) {
      this.addViolation({
        rule: this.rules.semantic.infiniteLoops.name,
        message: "Potential infinite for loop (no test or update)",
        severity: this.rules.semantic.infiniteLoops.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Add a loop condition or break statement",
      });
      this.statistics.semanticErrors++;
      this.statistics.validationErrors++;
    }
  }

  checkEmptyStatement(path) {
    this.addViolation({
      rule: this.rules.semantic.emptyStatements.name,
      message: "Empty statement detected",
      severity: this.rules.semantic.emptyStatements.severity,
      line: path.node.loc ? path.node.loc.start.line : 0,
      column: path.node.loc ? path.node.loc.start.column : 0,
      suggestion: "Remove the empty statement or add code",
    });
    this.statistics.semanticErrors++;
    this.statistics.validationErrors++;
  }

  checkCodeAfterReturn(path) {
    var parent = path.parent;

    if (t.isBlockStatement(parent)) {
      var body = parent.body;
      var returnIndex = body.indexOf(path.node);

      if (returnIndex !== -1 && returnIndex < body.length - 1) {
        for (var i = returnIndex + 1; i < body.length; i++) {
          var stmt = body[i];

          if (!t.isFunctionDeclaration(stmt)) {
            this.addViolation({
              rule: this.rules.semantic.unreachableCode.name,
              message: "Unreachable code after return statement",
              severity: this.rules.semantic.unreachableCode.severity,
              line: stmt.loc ? stmt.loc.start.line : 0,
              column: stmt.loc ? stmt.loc.start.column : 0,
              suggestion: "Remove unreachable code after return",
            });
            this.statistics.semanticErrors++;
            this.statistics.validationErrors++;
            break;
          }
        }
      }
    }
  }

  checkImportDeclaration(path) {
    var source = path.node.source.value;
    var specifiers = path.node.specifiers;

    if (specifiers.length === 0) {
      this.addViolation({
        rule: this.rules.importExport.unusedImports.name,
        message: "Side-effect only import from: " + source,
        severity: this.rules.importExport.unusedImports.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Verify this import is necessary",
      });
      this.statistics.importExportErrors++;
      this.statistics.validationErrors++;
    }
  }

  checkExportDeclaration(path) {
    var declaration = path.node.declaration;

    if (declaration && t.isIdentifier(declaration)) {
      if (!this.declaredVariables.has(declaration.name)) {
        this.addViolation({
          rule: this.rules.importExport.missingExports.name,
          message: "Export of undeclared identifier: " + declaration.name,
          severity: this.rules.importExport.missingExports.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Declare the identifier before exporting",
        });
        this.statistics.importExportErrors++;
        this.statistics.validationErrors++;
      }
    }
  }

  checkMemberAccessType(path) {
    var object = path.node.object;
    var property = path.node.property;

    if (t.isStringLiteral(object) && t.isIdentifier(property)) {
      var stringMethods = [
        "charAt",
        "charCodeAt",
        "concat",
        "includes",
        "endsWith",
        "indexOf",
        "lastIndexOf",
        "length",
        "match",
        "padEnd",
        "padStart",
        "repeat",
        "replace",
        "search",
        "slice",
        "split",
        "startsWith",
        "substr",
        "substring",
        "toLowerCase",
        "toUpperCase",
        "trim",
        "trimStart",
        "trimEnd",
      ];

      if (stringMethods.indexOf(property.name) !== -1) {
        return;
      }

      this.addViolation({
        rule: this.rules.typeChecking.typeMismatches.name,
        message:
          "Potential invalid property access on string: " + property.name,
        severity: this.rules.typeChecking.typeMismatches.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Verify the property exists on String type",
      });
      this.statistics.typeErrors++;
      this.statistics.validationErrors++;
    }
  }

  checkCallExpressionTypes(path) {
    var callee = path.node.callee;
    var args = path.node.arguments;

    if (t.isIdentifier(callee)) {
      if (callee.name === "parseInt" || callee.name === "parseFloat") {
        if (args.length === 0) {
          this.addViolation({
            rule: this.rules.typeChecking.typeMismatches.name,
            message: callee.name + " called without arguments",
            severity: this.rules.typeChecking.typeMismatches.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: "Provide a value to parse",
          });
          this.statistics.typeErrors++;
          this.statistics.validationErrors++;
        }
      }
    }
  }

  checkUnusedVariables() {
    var self = this;

    this.declaredVariables.forEach(function (declarations, name) {
      var unusedCount = 0;

      declarations.forEach(function (decl) {
        if (!decl.used) {
          unusedCount++;
        }
      });

      if (unusedCount === declarations.length) {
        self.addViolation({
          rule: self.rules.reference.unusedDeclarations.name,
          message: "Unused variable: " + name,
          severity: self.rules.reference.unusedDeclarations.severity,
          line: declarations[0].line,
          column: 0,
          suggestion: "Remove the unused variable or use it",
        });
        self.statistics.referenceErrors++;
        self.statistics.validationErrors++;
      }
    });
  }

  checkUnusedImports() {
    var self = this;

    this.imports.forEach(function (importInfo, name) {
      if (!importInfo.used) {
        self.addViolation({
          rule: self.rules.importExport.unusedImports.name,
          message: "Unused import: " + name,
          severity: self.rules.importExport.unusedImports.severity,
          line: importInfo.line,
          column: 0,
          suggestion: "Remove the unused import",
        });
        self.statistics.importExportErrors++;
        self.statistics.validationErrors++;
      }
    });
  }

  addViolation(violation) {
    this.violations.push({
      rule: violation.rule,
      message: violation.message,
      severity: violation.severity,
      line: violation.line,
      column: violation.column,
      suggestion: violation.suggestion,
      timestamp: Date.now(),
    });
  }

  getViolations() {
    return this.violations.slice();
  }

  getStatistics() {
    return {
      totalChecks: this.statistics.totalChecks,
      validationErrors: this.statistics.validationErrors,
      syntaxErrors: this.statistics.syntaxErrors,
      typeErrors: this.statistics.typeErrors,
      scopeErrors: this.statistics.scopeErrors,
      referenceErrors: this.statistics.referenceErrors,
      semanticErrors: this.statistics.semanticErrors,
      importExportErrors: this.statistics.importExportErrors,
    };
  }

  reset() {
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      validationErrors: 0,
      syntaxErrors: 0,
      typeErrors: 0,
      scopeErrors: 0,
      referenceErrors: 0,
      semanticErrors: 0,
      importExportErrors: 0,
    };
    this.rules = {};
    this.declaredVariables = new Map();
    this.usedVariables = new Set();
    this.imports = new Map();
    this.exports = new Set();
  }
}

module.exports = ValidationRules;
