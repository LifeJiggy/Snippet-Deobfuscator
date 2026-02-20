const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

class DeobfuscationRules {
  constructor() {
    this.name = "DeobfuscationRules";
    this.version = "3.0.0";
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      deobfuscationOpportunities: 0,
      stringDecryption: 0,
      controlFlowReconstruction: 0,
      variableRenaming: 0,
      deadCodeElimination: 0,
      constantFolding: 0,
      arrayUnwrapping: 0,
    };
    this.rules = {};
    this.stringArrays = new Map();
    this.decryptionFunctions = new Map();
    this.constants = new Map();
  }

  initializeRules() {
    this.rules = {
      stringDecryption: {
        encodedStrings: {
          name: "encoded-strings",
          description: "Detects encoded strings that can be decrypted",
          severity: "high",
          enabled: true,
        },
        decryptionFunctions: {
          name: "decryption-functions",
          description: "Identifies string decryption functions",
          severity: "critical",
          enabled: true,
        },
        stringRotators: {
          name: "string-rotators",
          description: "Detects string rotation or shuffle patterns",
          severity: "high",
          enabled: true,
        },
      },
      controlFlow: {
        stateMachines: {
          name: "state-machines",
          description: "Detects state machine patterns for reconstruction",
          severity: "critical",
          enabled: true,
        },
        dispatchers: {
          name: "dispatchers",
          description: "Identifies dispatcher functions",
          severity: "critical",
          enabled: true,
        },
        switchTables: {
          name: "switch-tables",
          description: "Detects switch-based dispatch tables",
          severity: "high",
          enabled: true,
        },
      },
      variableRenaming: {
        semanticNames: {
          name: "semantic-names",
          description: "Suggests semantic names for obfuscated variables",
          severity: "medium",
          enabled: true,
        },
        collisionDetection: {
          name: "collision-detection",
          description: "Detects potential name collisions when renaming",
          severity: "medium",
          enabled: true,
        },
        scopeAnalysis: {
          name: "scope-analysis",
          description: "Analyzes variable scopes for safe renaming",
          severity: "low",
          enabled: true,
        },
      },
      deadCode: {
        unreachable: {
          name: "unreachable-dead-code",
          description: "Detects unreachable code for elimination",
          severity: "medium",
          enabled: true,
        },
        unused: {
          name: "unused-declarations",
          description: "Identifies unused variable and function declarations",
          severity: "medium",
          enabled: true,
        },
        redundantBranches: {
          name: "redundant-branches",
          description: "Detects conditional branches with constant results",
          severity: "medium",
          enabled: true,
        },
      },
      constantFolding: {
        arithmetic: {
          name: "arithmetic-folding",
          description: "Detects constant arithmetic expressions",
          severity: "medium",
          enabled: true,
        },
        string: {
          name: "string-folding",
          description: "Detects constant string expressions",
          severity: "medium",
          enabled: true,
        },
        boolean: {
          name: "boolean-folding",
          description: "Detects constant boolean expressions",
          severity: "medium",
          enabled: true,
        },
      },
      arrayUnwrapping: {
        stringArrays: {
          name: "string-arrays",
          description: "Detects string array patterns used for obfuscation",
          severity: "high",
          enabled: true,
        },
        lookupTables: {
          name: "lookup-tables",
          description: "Identifies lookup table patterns",
          severity: "medium",
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
      checkStringDecryption: options.checkStringDecryption !== false,
      checkControlFlow: options.checkControlFlow !== false,
      checkVariableRenaming: options.checkVariableRenaming !== false,
      checkDeadCode: options.checkDeadCode !== false,
      checkConstantFolding: options.checkConstantFolding !== false,
      checkArrayUnwrapping: options.checkArrayUnwrapping !== false,
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
        rule: "parse-error",
        message: "Failed to parse code: " + error.message,
        severity: "critical",
        line: 0,
        column: 0,
      });
      return this.violations;
    }

    this.checkDeobfuscation(ast, config);
    this.statistics.totalChecks = this.violations.length;

    return this.violations;
  }

  checkDeobfuscation(ast, config) {
    var self = this;

    this.identifyStringArrays(ast);
    this.identifyDecryptionFunctions(ast);
    this.collectConstants(ast);

    traverse(ast, {
      CallExpression: function (path) {
        if (config.checkStringDecryption) {
          self.checkStringDecryptionPattern(path);
        }
        if (config.checkArrayUnwrapping) {
          self.checkArrayAccessPattern(path);
        }
      },
      SwitchStatement: function (path) {
        if (config.checkControlFlow) {
          self.checkControlFlowPattern(path);
        }
      },
      WhileStatement: function (path) {
        if (config.checkControlFlow) {
          self.checkWhileDispatcherPattern(path);
        }
      },
      VariableDeclarator: function (path) {
        if (config.checkVariableRenaming) {
          self.checkVariableRenamingOpportunity(path);
        }
      },
      BinaryExpression: function (path) {
        if (config.checkConstantFolding) {
          self.checkConstantFolding(path);
        }
      },
      IfStatement: function (path) {
        if (config.checkDeadCode) {
          self.checkDeadCodeElimination(path);
        }
      },
      FunctionDeclaration: function (path) {
        if (config.checkDeadCode) {
          self.checkUnusedDeclaration(path);
        }
      },
      Identifier: function (path) {
        if (config.checkVariableRenaming) {
          self.checkNameCollision(path);
        }
      },
      MemberExpression: function (path) {
        if (config.checkArrayUnwrapping) {
          self.checkLookupTablePattern(path);
        }
      },
    });
  }

  identifyStringArrays(ast) {
    var self = this;

    traverse(ast, {
      VariableDeclarator: function (path) {
        var id = path.node.id;
        var init = path.node.init;

        if (t.isIdentifier(id) && t.isArrayExpression(init)) {
          var elements = init.elements;
          var stringElements = elements.filter(function (el) {
            return t.isStringLiteral(el);
          });

          if (
            stringElements.length > 5 &&
            stringElements.length === elements.length
          ) {
            self.stringArrays.set(id.name, {
              elements: stringElements.map(function (el) {
                return el.value;
              }),
              line: path.node.loc ? path.node.loc.start.line : 0,
            });

            self.addViolation({
              rule: self.rules.arrayUnwrapping.stringArrays.name,
              message:
                "String array pattern detected with " +
                stringElements.length +
                " elements",
              severity: self.rules.arrayUnwrapping.stringArrays.severity,
              line: path.node.loc ? path.node.loc.start.line : 0,
              column: path.node.loc ? path.node.loc.start.column : 0,
              suggestion: "Inline string array values at usage sites",
            });
            self.statistics.arrayUnwrapping++;
            self.statistics.deobfuscationOpportunities++;
          }
        }
      },
    });
  }

  identifyDecryptionFunctions(ast) {
    var self = this;

    traverse(ast, {
      FunctionDeclaration: function (path) {
        var body = path.node.body;
        var name = path.node.id ? path.node.id.name : null;

        if (!name || !t.isBlockStatement(body)) return;

        var hasCharCodeAt = false;
        var hasXor = false;
        var hasFromCharCode = false;
        var hasBase64 = false;

        path.traverse({
          CallExpression: function (callPath) {
            var callee = callPath.node.callee;

            if (t.isMemberExpression(callee)) {
              if (t.isIdentifier(callee.property, { name: "charCodeAt" })) {
                hasCharCodeAt = true;
              }
              if (t.isIdentifier(callee.property, { name: "fromCharCode" })) {
                hasFromCharCode = true;
              }
            }
            if (t.isIdentifier(callee, { name: "atob" })) {
              hasBase64 = true;
            }
          },
          BinaryExpression: function (binPath) {
            if (binPath.node.operator === "^") {
              hasXor = true;
            }
          },
        });

        if ((hasCharCodeAt && hasXor) || hasFromCharCode || hasBase64) {
          self.decryptionFunctions.set(name, {
            type: hasBase64 ? "base64" : hasXor ? "xor" : "charcode",
            line: path.node.loc ? path.node.loc.start.line : 0,
          });

          self.addViolation({
            rule: self.rules.stringDecryption.decryptionFunctions.name,
            message: "Decryption function detected: " + name,
            severity: self.rules.stringDecryption.decryptionFunctions.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion:
              "Evaluate function with known inputs to decrypt strings",
          });
          self.statistics.stringDecryption++;
          self.statistics.deobfuscationOpportunities++;
        }
      },
    });
  }

  collectConstants(ast) {
    var self = this;

    traverse(ast, {
      VariableDeclarator: function (path) {
        var id = path.node.id;
        var init = path.node.init;

        if (t.isIdentifier(id) && init) {
          if (
            t.isNumericLiteral(init) ||
            t.isStringLiteral(init) ||
            t.isBooleanLiteral(init)
          ) {
            self.constants.set(id.name, init.value);
          }
        }
      },
    });
  }

  checkStringDecryptionPattern(path) {
    var callee = path.node.callee;

    if (t.isIdentifier(callee) && this.decryptionFunctions.has(callee.name)) {
      var args = path.node.arguments;

      if (args.length > 0 && t.isStringLiteral(args[0])) {
        this.addViolation({
          rule: this.rules.stringDecryption.encodedStrings.name,
          message: "Decryptable string call with literal argument",
          severity: this.rules.stringDecryption.encodedStrings.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion:
            "Evaluate the decryption function to get the actual string",
        });
        this.statistics.stringDecryption++;
        this.statistics.deobfuscationOpportunities++;
      }
    }

    if (t.isMemberExpression(callee)) {
      if (t.isIdentifier(callee.property, { name: "split" })) {
        var args = path.node.arguments;
        if (
          args.length > 0 &&
          t.isStringLiteral(args[0]) &&
          args[0].value.length === 1
        ) {
          this.addViolation({
            rule: this.rules.stringDecryption.stringRotators.name,
            message: "String split pattern detected - potential string array",
            severity: this.rules.stringDecryption.stringRotators.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: "The split string may be an encoded string array",
          });
          this.statistics.stringDecryption++;
          this.statistics.deobfuscationOpportunities++;
        }
      }
    }
  }

  checkControlFlowPattern(path) {
    var discriminant = path.node.discriminant;
    var cases = path.node.cases;

    if (cases.length < 5) return;

    var isStateMachine = false;
    var stateVar = t.isIdentifier(discriminant) ? discriminant.name : null;

    if (stateVar) {
      var stateUpdates = 0;

      path.traverse({
        AssignmentExpression: function (assignPath) {
          if (t.isIdentifier(assignPath.node.left, { name: stateVar })) {
            stateUpdates++;
          }
        },
      });

      if (stateUpdates >= cases.length / 2) {
        isStateMachine = true;
      }
    }

    var caseValues = cases
      .map(function (c) {
        if (c.test && t.isNumericLiteral(c.test)) {
          return c.test.value;
        }
        return null;
      })
      .filter(function (v) {
        return v !== null;
      });

    if (isStateMachine || this.isOrderedSequence(caseValues)) {
      this.addViolation({
        rule: this.rules.controlFlow.stateMachines.name,
        message:
          "State machine control flow detected with " +
          cases.length +
          " states",
        severity: this.rules.controlFlow.stateMachines.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion:
          "Reconstruct natural control flow by analyzing state transitions",
      });
      this.statistics.controlFlowReconstruction++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkWhileDispatcherPattern(path) {
    var test = path.node.test;

    if (
      !t.isBooleanLiteral(test, { value: true }) &&
      !(t.isLiteral(test) && test.value === 1)
    ) {
      return;
    }

    var hasSwitch = false;
    var switchCount = 0;

    path.traverse({
      SwitchStatement: function () {
        hasSwitch = true;
        switchCount++;
      },
    });

    if (hasSwitch && switchCount === 1) {
      this.addViolation({
        rule: this.rules.controlFlow.dispatchers.name,
        message: "While-true dispatcher pattern detected",
        severity: this.rules.controlFlow.dispatchers.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Extract cases and reconstruct linear control flow",
      });
      this.statistics.controlFlowReconstruction++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkVariableRenamingOpportunity(path) {
    var id = path.node.id;

    if (!t.isIdentifier(id)) return;

    var name = id.name;
    var hexPattern = /^_0x[0-9a-fA-F]+$/;

    if (hexPattern.test(name)) {
      var init = path.node.init;
      var inferredType = "unknown";
      var suggestedName = "value";

      if (init) {
        if (t.isStringLiteral(init)) {
          inferredType = "string";
          suggestedName = "str";
        } else if (t.isNumericLiteral(init)) {
          inferredType = "number";
          suggestedName = "num";
        } else if (t.isBooleanLiteral(init)) {
          inferredType = "boolean";
          suggestedName = "flag";
        } else if (t.isArrayExpression(init)) {
          inferredType = "array";
          suggestedName = "arr";
        } else if (
          t.isFunctionExpression(init) ||
          t.isArrowFunctionExpression(init)
        ) {
          inferredType = "function";
          suggestedName = "fn";
        }
      }

      this.addViolation({
        rule: this.rules.variableRenaming.semanticNames.name,
        message:
          "Obfuscated variable: " +
          name +
          " (inferred type: " +
          inferredType +
          ")",
        severity: this.rules.variableRenaming.semanticNames.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Rename to a semantic name like: " + suggestedName,
      });
      this.statistics.variableRenaming++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkConstantFolding(path) {
    var left = path.node.left;
    var right = path.node.right;
    var operator = path.node.operator;

    if (t.isNumericLiteral(left) && t.isNumericLiteral(right)) {
      var result;
      switch (operator) {
        case "+":
          result = left.value + right.value;
          break;
        case "-":
          result = left.value - right.value;
          break;
        case "*":
          result = left.value * right.value;
          break;
        case "/":
          result = left.value / right.value;
          break;
        case "%":
          result = left.value % right.value;
          break;
        default:
          return;
      }

      this.addViolation({
        rule: this.rules.constantFolding.arithmetic.name,
        message:
          "Constant expression can be folded: " +
          left.value +
          " " +
          operator +
          " " +
          right.value +
          " = " +
          result,
        severity: this.rules.constantFolding.arithmetic.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Replace with the computed value: " + result,
      });
      this.statistics.constantFolding++;
      this.statistics.deobfuscationOpportunities++;
    }

    if (
      t.isStringLiteral(left) &&
      t.isStringLiteral(right) &&
      operator === "+"
    ) {
      this.addViolation({
        rule: this.rules.constantFolding.string.name,
        message: "String concatenation can be folded",
        severity: this.rules.constantFolding.string.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: 'Replace with: "' + left.value + right.value + '"',
      });
      this.statistics.constantFolding++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkDeadCodeElimination(path) {
    var test = path.node.test;

    if (t.isBooleanLiteral(test)) {
      if (test.value === false) {
        this.addViolation({
          rule: this.rules.deadCode.unreachable.name,
          message: "Dead code: if condition is always false",
          severity: this.rules.deadCode.unreachable.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Remove the entire if block",
        });
        this.statistics.deadCodeElimination++;
        this.statistics.deobfuscationOpportunities++;
      } else if (test.value === true) {
        this.addViolation({
          rule: this.rules.deadCode.redundantBranches.name,
          message: "Redundant branch: if condition is always true",
          severity: this.rules.deadCode.redundantBranches.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Remove the if statement and keep only the consequent",
        });
        this.statistics.deadCodeElimination++;
        this.statistics.deobfuscationOpportunities++;
      }
    }

    if (t.isBinaryExpression(test)) {
      if (t.isLiteral(test.left) && t.isLiteral(test.right)) {
        var leftVal = test.left.value;
        var rightVal = test.right.value;
        var isAlwaysTrue = false;
        var isAlwaysFalse = false;

        if (test.operator === "===" || test.operator === "==") {
          isAlwaysTrue = leftVal === rightVal;
          isAlwaysFalse = leftVal !== rightVal;
        }

        if (isAlwaysTrue || isAlwaysFalse) {
          this.addViolation({
            rule: this.rules.deadCode.redundantBranches.name,
            message: "Constant condition detected in if statement",
            severity: this.rules.deadCode.redundantBranches.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: isAlwaysTrue
              ? "Condition is always true"
              : "Condition is always false",
          });
          this.statistics.deadCodeElimination++;
          this.statistics.deobfuscationOpportunities++;
        }
      }
    }
  }

  checkUnusedDeclaration(path) {
    var name = path.node.id ? path.node.id.name : null;

    if (!name) return;

    var binding = path.scope.getBinding(name);

    if (binding && binding.referenced === false) {
      this.addViolation({
        rule: this.rules.deadCode.unused.name,
        message: "Unused function declaration: " + name,
        severity: this.rules.deadCode.unused.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Remove the unused function",
      });
      this.statistics.deadCodeElimination++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkNameCollision(path) {
    var name = path.node.name;
    var binding = path.scope.getBinding(name);

    if (!binding) return;

    var hexPattern = /^_0x[0-9a-fA-F]+$/;
    if (!hexPattern.test(name)) return;

    var allBindings = path.scope.getAllBindings();
    var similarNames = Object.keys(allBindings).filter(function (n) {
      return (
        n !== name &&
        !hexPattern.test(n) &&
        n.toLowerCase().indexOf(name.toLowerCase()) === -1
      );
    });

    if (similarNames.length > 0) {
      this.addViolation({
        rule: this.rules.variableRenaming.collisionDetection.name,
        message: "Potential naming conflict when renaming: " + name,
        severity: this.rules.variableRenaming.collisionDetection.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Choose a unique semantic name that does not conflict",
      });
      this.statistics.variableRenaming++;
      this.statistics.deobfuscationOpportunities++;
    }
  }

  checkArrayAccessPattern(path) {
    var callee = path.node.callee;

    if (t.isIdentifier(callee) && this.stringArrays.has(callee.name)) {
      var args = path.node.arguments;

      if (args.length > 0 && t.isNumericLiteral(args[0])) {
        var index = args[0].value;
        var arrData = this.stringArrays.get(callee.name);

        if (index >= 0 && index < arrData.elements.length) {
          this.addViolation({
            rule: this.rules.arrayUnwrapping.stringArrays.name,
            message: "String array access can be unwrapped",
            severity: this.rules.arrayUnwrapping.stringArrays.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: 'Replace with: "' + arrData.elements[index] + '"',
          });
          this.statistics.arrayUnwrapping++;
          this.statistics.deobfuscationOpportunities++;
        }
      }
    }
  }

  checkLookupTablePattern(path) {
    var object = path.node.object;
    var property = path.node.property;

    if (
      t.isIdentifier(object) &&
      t.isNumericLiteral(property) &&
      !path.node.computed
    ) {
      if (this.stringArrays.has(object.name)) {
        this.addViolation({
          rule: this.rules.arrayUnwrapping.lookupTables.name,
          message: "Lookup table access pattern detected",
          severity: this.rules.arrayUnwrapping.lookupTables.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Consider unwrapping the lookup table",
        });
        this.statistics.arrayUnwrapping++;
        this.statistics.deobfuscationOpportunities++;
      }
    }
  }

  isOrderedSequence(arr) {
    if (arr.length < 3) return false;
    var sorted = arr.slice().sort(function (a, b) {
      return a - b;
    });
    var consecutive = 0;

    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        consecutive++;
      }
    }

    return consecutive >= sorted.length * 0.6;
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
      deobfuscationOpportunities: this.statistics.deobfuscationOpportunities,
      stringDecryption: this.statistics.stringDecryption,
      controlFlowReconstruction: this.statistics.controlFlowReconstruction,
      variableRenaming: this.statistics.variableRenaming,
      deadCodeElimination: this.statistics.deadCodeElimination,
      constantFolding: this.statistics.constantFolding,
      arrayUnwrapping: this.statistics.arrayUnwrapping,
    };
  }

  reset() {
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      deobfuscationOpportunities: 0,
      stringDecryption: 0,
      controlFlowReconstruction: 0,
      variableRenaming: 0,
      deadCodeElimination: 0,
      constantFolding: 0,
      arrayUnwrapping: 0,
    };
    this.rules = {};
    this.stringArrays = new Map();
    this.decryptionFunctions = new Map();
    this.constants = new Map();
  }
}

module.exports = DeobfuscationRules;
