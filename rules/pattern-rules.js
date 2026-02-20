const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class PatternRules {
  constructor() {
    this.name = "PatternRules";
    this.version = "1.0.0";
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      patternsFound: 0,
      stringObfuscation: 0,
      controlFlowFlattening: 0,
      deadCode: 0,
      variableMangling: 0,
      proxyFunctions: 0,
      encodingPatterns: 0,
    };
    this.rules = {};
  }

  initializeRules() {
    this.rules = {
      stringObfuscation: {
        charCode: {
          name: "char-code-string",
          description: "Detects strings constructed from char codes",
          severity: "high",
          enabled: true,
        },
        base64: {
          name: "base64-encoded-string",
          description: "Detects base64 encoded strings",
          severity: "medium",
          enabled: true,
        },
        hex: {
          name: "hex-encoded-string",
          description: "Detects hexadecimal encoded strings",
          severity: "medium",
          enabled: true,
        },
        unicode: {
          name: "unicode-escape-string",
          description: "Detects unicode escape sequences in strings",
          severity: "medium",
          enabled: true,
        },
        stringConcat: {
          name: "string-concatenation",
          description: "Detects excessive string concatenation",
          severity: "low",
          enabled: true,
        },
      },
      controlFlow: {
        switchBased: {
          name: "switch-control-flow",
          description: "Detects switch-based control flow flattening",
          severity: "critical",
          enabled: true,
        },
        whileBased: {
          name: "while-control-flow",
          description: "Detects while-based control flow flattening",
          severity: "critical",
          enabled: true,
        },
        stateVariable: {
          name: "state-variable-pattern",
          description: "Detects state variable dispatcher patterns",
          severity: "high",
          enabled: true,
        },
      },
      deadCode: {
        unreachable: {
          name: "unreachable-code",
          description: "Detects unreachable code blocks",
          severity: "medium",
          enabled: true,
        },
        falseConditions: {
          name: "false-conditions",
          description: "Detects always-false conditional blocks",
          severity: "medium",
          enabled: true,
        },
        trueConditions: {
          name: "true-conditions",
          description: "Detects always-true conditional blocks",
          severity: "medium",
          enabled: true,
        },
      },
      variableMangling: {
        singleLetter: {
          name: "single-letter-variables",
          description: "Detects single letter variable names",
          severity: "low",
          enabled: true,
        },
        hexPrefixed: {
          name: "hex-prefixed-variables",
          description: "Detects hex-prefixed variable names like _0x1234",
          severity: "high",
          enabled: true,
        },
        sequential: {
          name: "sequential-naming",
          description: "Detects sequentially named variables",
          severity: "medium",
          enabled: true,
        },
      },
      proxyFunctions: {
        wrapper: {
          name: "wrapper-functions",
          description: "Detects simple wrapper/proxy functions",
          severity: "medium",
          enabled: true,
        },
        indirection: {
          name: "indirection-chains",
          description: "Detects function call indirection chains",
          severity: "high",
          enabled: true,
        },
      },
      encoding: {
        evalBased: {
          name: "eval-encoding",
          description: "Detects eval-based encoding/decoding",
          severity: "critical",
          enabled: true,
        },
        functionConstructor: {
          name: "function-constructor-encoding",
          description: "Detects Function constructor based encoding",
          severity: "critical",
          enabled: true,
        },
      },
    };
    return this.rules;
  }

  apply(code, options = {}) {
    this.reset();
    this.initializeRules();

    const config = {
      checkStringObfuscation: options.checkStringObfuscation !== false,
      checkControlFlow: options.checkControlFlow !== false,
      checkDeadCode: options.checkDeadCode !== false,
      checkVariableMangling: options.checkVariableMangling !== false,
      checkProxyFunctions: options.checkProxyFunctions !== false,
      checkEncoding: options.checkEncoding !== false,
      ...options,
    };

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        allowReturnOutsideFunction: true,
        errorRecovery: true,
      });
    } catch (error) {
      this.violations.push({
        rule: "parse-error",
        message: `Failed to parse code: ${error.message}`,
        severity: "critical",
        line: 0,
        column: 0,
      });
      return this.violations;
    }

    this.checkPatterns(ast, config);
    this.checkAST(ast, config);
    this.statistics.totalChecks = this.violations.length;

    return this.violations;
  }

  checkPatterns(ast, config) {
    const self = this;

    traverse(ast, {
      StringLiteral(path) {
        if (config.checkStringObfuscation) {
          self.checkStringObfuscation(path);
        }
      },
      CallExpression(path) {
        if (config.checkStringObfuscation) {
          self.checkCharCodePattern(path);
          self.checkBase64Pattern(path);
        }
        if (config.checkProxyFunctions) {
          self.checkProxyFunctionPattern(path);
        }
        if (config.checkEncoding) {
          self.checkEncodingPattern(path);
        }
      },
      SwitchStatement(path) {
        if (config.checkControlFlow) {
          self.checkSwitchControlFlow(path);
        }
      },
      WhileStatement(path) {
        if (config.checkControlFlow) {
          self.checkWhileControlFlow(path);
        }
      },
      IfStatement(path) {
        if (config.checkDeadCode) {
          self.checkDeadCodePattern(path);
        }
      },
      VariableDeclarator(path) {
        if (config.checkVariableMangling) {
          self.checkVariableMangling(path);
        }
      },
      FunctionDeclaration(path) {
        if (config.checkProxyFunctions) {
          self.checkWrapperFunction(path);
        }
      },
      BinaryExpression(path) {
        if (config.checkDeadCode) {
          self.checkConstantCondition(path);
        }
      },
    });
  }

  checkStringObfuscation(path) {
    const value = path.node.value;

    if (this.isHexString(value)) {
      this.addViolation({
        rule: this.rules.stringObfuscation.hex.name,
        message: `Hex encoded string detected: ${value.substring(0, 30)}...`,
        severity: this.rules.stringObfuscation.hex.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Decode the hex string to reveal the actual content",
      });
      this.statistics.stringObfuscation++;
      this.statistics.patternsFound++;
    }

    if (this.isBase64String(value)) {
      this.addViolation({
        rule: this.rules.stringObfuscation.base64.name,
        message: `Base64 encoded string detected: ${value.substring(0, 30)}...`,
        severity: this.rules.stringObfuscation.base64.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Decode the base64 string to reveal the actual content",
      });
      this.statistics.stringObfuscation++;
      this.statistics.patternsFound++;
    }

    const unicodePattern = /\\u[0-9a-fA-F]{4}/g;
    const unicodeMatches = value.match(unicodePattern);
    if (unicodeMatches && unicodeMatches.length > 3) {
      this.addViolation({
        rule: this.rules.stringObfuscation.unicode.name,
        message: `Heavy unicode escape usage detected (${unicodeMatches.length} escapes)`,
        severity: this.rules.stringObfuscation.unicode.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Convert unicode escapes to regular characters",
      });
      this.statistics.stringObfuscation++;
      this.statistics.patternsFound++;
    }
  }

  checkCharCodePattern(path) {
    const callee = path.node.callee;

    if (t.isMemberExpression(callee)) {
      const property = callee.property;
      if (t.isIdentifier(property, { name: "fromCharCode" })) {
        if (
          t.isMemberExpression(callee.object) &&
          t.isIdentifier(callee.object.property, { name: "String" })
        ) {
          this.addViolation({
            rule: this.rules.stringObfuscation.charCode.name,
            message:
              "String.fromCharCode detected - potential string obfuscation",
            severity: this.rules.stringObfuscation.charCode.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: "Replace with literal string value",
          });
          this.statistics.stringObfuscation++;
          this.statistics.patternsFound++;
        }
      }
    }

    if (t.isIdentifier(callee, { name: "fromCharCode" })) {
      this.addViolation({
        rule: this.rules.stringObfuscation.charCode.name,
        message: "fromCharCode call detected - potential string obfuscation",
        severity: this.rules.stringObfuscation.charCode.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Replace with literal string value",
      });
      this.statistics.stringObfuscation++;
      this.statistics.patternsFound++;
    }
  }

  checkBase64Pattern(path) {
    const callee = path.node.callee;

    if (t.isMemberExpression(callee)) {
      const obj = callee.object;
      const prop = callee.property;

      if (
        t.isIdentifier(prop, { name: "atob" }) ||
        t.isIdentifier(prop, { name: "btoa" })
      ) {
        this.addViolation({
          rule: this.rules.stringObfuscation.base64.name,
          message: "Base64 encoding/decoding function detected",
          severity: this.rules.stringObfuscation.base64.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Replace with decoded string literal",
        });
        this.statistics.stringObfuscation++;
        this.statistics.patternsFound++;
      }
    }

    if (
      t.isIdentifier(callee, { name: "atob" }) ||
      t.isIdentifier(callee, { name: "btoa" })
    ) {
      this.addViolation({
        rule: this.rules.stringObfuscation.base64.name,
        message: "Base64 encoding/decoding function detected",
        severity: this.rules.stringObfuscation.base64.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Replace with decoded string literal",
      });
      this.statistics.stringObfuscation++;
      this.statistics.patternsFound++;
    }
  }

  checkSwitchControlFlow(path) {
    const discriminant = path.node.discriminant;
    const cases = path.node.cases;

    if (cases.length > 5) {
      let hasOrdering = false;
      let stateVarFound = false;

      if (t.isIdentifier(discriminant)) {
        stateVarFound = true;
      }

      const caseValues = cases
        .map((c) => {
          if (c.test && t.isNumericLiteral(c.test)) {
            return c.test.value;
          }
          return null;
        })
        .filter((v) => v !== null);

      if (caseValues.length > 3) {
        const sorted = [...caseValues].sort((a, b) => a - b);
        let sequential = true;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] !== 1) {
            sequential = false;
            break;
          }
        }
        if (sequential || this.isShuffledSequence(caseValues)) {
          hasOrdering = true;
        }
      }

      if (stateVarFound && hasOrdering) {
        this.addViolation({
          rule: this.rules.controlFlow.switchBased.name,
          message: "Switch-based control flow flattening detected",
          severity: this.rules.controlFlow.switchBased.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Reconstruct natural control flow from state machine",
        });
        this.statistics.controlFlowFlattening++;
        this.statistics.patternsFound++;
      }
    }
  }

  checkWhileControlFlow(path) {
    const body = path.node.body;
    const test = path.node.test;

    if (
      t.isBooleanLiteral(test, { value: true }) ||
      (t.isLiteral(test) && test.value === 1)
    ) {
      let hasSwitch = false;
      path.traverse({
        SwitchStatement() {
          hasSwitch = true;
        },
      });

      if (hasSwitch) {
        this.addViolation({
          rule: this.rules.controlFlow.whileBased.name,
          message: "While-based control flow flattening detected",
          severity: this.rules.controlFlow.whileBased.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Reconstruct control flow from infinite loop with switch",
        });
        this.statistics.controlFlowFlattening++;
        this.statistics.patternsFound++;
      }
    }

    if (t.isBinaryExpression(test) || t.isIdentifier(test)) {
      let switchCount = 0;
      let assignmentCount = 0;

      path.traverse({
        SwitchStatement() {
          switchCount++;
        },
        AssignmentExpression(assignPath) {
          if (
            t.isIdentifier(test) &&
            t.isIdentifier(assignPath.node.left, { name: test.name })
          ) {
            assignmentCount++;
          }
        },
      });

      if (switchCount > 0 && assignmentCount > 2) {
        this.addViolation({
          rule: this.rules.controlFlow.stateVariable.name,
          message: "State variable dispatcher pattern detected",
          severity: this.rules.controlFlow.stateVariable.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Replace state machine with linear code flow",
        });
        this.statistics.controlFlowFlattening++;
        this.statistics.patternsFound++;
      }
    }
  }

  checkDeadCodePattern(path) {
    const test = path.node.test;

    if (t.isBooleanLiteral(test)) {
      if (test.value === false) {
        this.addViolation({
          rule: this.rules.deadCode.falseConditions.name,
          message: "Always-false condition detected - dead code",
          severity: this.rules.deadCode.falseConditions.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Remove the entire if block as it will never execute",
        });
        this.statistics.deadCode++;
        this.statistics.patternsFound++;
      } else if (test.value === true) {
        this.addViolation({
          rule: this.rules.deadCode.trueConditions.name,
          message: "Always-true condition detected - redundant conditional",
          severity: this.rules.deadCode.trueConditions.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Replace with just the consequent block content",
        });
        this.statistics.deadCode++;
        this.statistics.patternsFound++;
      }
    }

    if (
      t.isBinaryExpression(test, { operator: "===" }) ||
      t.isBinaryExpression(test, { operator: "==" })
    ) {
      const left = test.left;
      const right = test.right;

      if (
        t.isLiteral(left) &&
        t.isLiteral(right) &&
        left.value === right.value
      ) {
        this.addViolation({
          rule: this.rules.deadCode.trueConditions.name,
          message: "Self-comparison always evaluates to true",
          severity: this.rules.deadCode.trueConditions.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Simplify the condition to true or remove the check",
        });
        this.statistics.deadCode++;
        this.statistics.patternsFound++;
      }
    }
  }

  checkConstantCondition(path) {
    const { operator, left, right } = path.node;

    if (t.isLiteral(left) && t.isLiteral(right)) {
      let result;
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
        case "===":
        case "==":
          result = left.value === right.value;
          break;
        case "!==":
        case "!=":
          result = left.value !== right.value;
          break;
        default:
          return;
      }

      this.addViolation({
        rule: this.rules.deadCode.unreachable.name,
        message: `Constant expression can be simplified to: ${result}`,
        severity: this.rules.deadCode.unreachable.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Replace with the computed value",
      });
      this.statistics.deadCode++;
      this.statistics.patternsFound++;
    }
  }

  checkVariableMangling(path) {
    const name = path.node.id ? path.node.id.name : null;

    if (!name) return;

    if (name.length === 1 && !["i", "j", "k", "x", "y", "n"].includes(name)) {
      this.addViolation({
        rule: this.rules.variableMangling.singleLetter.name,
        message: `Single letter variable '${name}' detected`,
        severity: this.rules.variableMangling.singleLetter.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Use a more descriptive variable name",
      });
      this.statistics.variableMangling++;
      this.statistics.patternsFound++;
    }

    const hexPattern = /^_0x[0-9a-fA-F]+$/;
    if (hexPattern.test(name)) {
      this.addViolation({
        rule: this.rules.variableMangling.hexPrefixed.name,
        message: `Hex-prefixed variable '${name}' indicates obfuscation`,
        severity: this.rules.variableMangling.hexPrefixed.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Rename to a semantic variable name",
      });
      this.statistics.variableMangling++;
      this.statistics.patternsFound++;
    }

    const hexVarPattern = /^_0x/;
    if (hexVarPattern.test(name)) {
      this.addViolation({
        rule: this.rules.variableMangling.hexPrefixed.name,
        message: `Obfuscated variable name pattern '${name}' detected`,
        severity: this.rules.variableMangling.hexPrefixed.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Rename to a meaningful variable name",
      });
      this.statistics.variableMangling++;
      this.statistics.patternsFound++;
    }
  }

  checkProxyFunctionPattern(path) {
    const callee = path.node.callee;

    if (t.isIdentifier(callee)) {
      const binding = path.scope.getBinding(callee.name);

      if (binding && t.isVariableDeclarator(binding.path.node)) {
        const init = binding.path.node.init;

        if (t.isFunctionExpression(init) || t.isArrowFunctionExpression(init)) {
          const body = init.body;

          if (t.isBlockStatement(body) && body.body.length === 1) {
            const stmt = body.body[0];

            if (
              t.isReturnStatement(stmt) &&
              t.isCallExpression(stmt.argument)
            ) {
              this.addViolation({
                rule: this.rules.proxyFunctions.wrapper.name,
                message: `Proxy function '${callee.name}' detected`,
                severity: this.rules.proxyFunctions.wrapper.severity,
                line: path.node.loc ? path.node.loc.start.line : 0,
                column: path.node.loc ? path.node.loc.start.column : 0,
                suggestion: "Inline the proxy function call",
              });
              this.statistics.proxyFunctions++;
              this.statistics.patternsFound++;
            }
          }
        }
      }
    }
  }

  checkWrapperFunction(path) {
    const body = path.node.body;

    if (t.isBlockStatement(body) && body.body.length === 1) {
      const stmt = body.body[0];

      if (t.isReturnStatement(stmt) && t.isCallExpression(stmt.argument)) {
        const name = path.node.id ? path.node.id.name : "anonymous";

        this.addViolation({
          rule: this.rules.proxyFunctions.wrapper.name,
          message: `Wrapper function '${name}' simply delegates to another function`,
          severity: this.rules.proxyFunctions.wrapper.severity,
          line: path.node.loc ? path.node.loc.start.line : 0,
          column: path.node.loc ? path.node.loc.start.column : 0,
          suggestion: "Replace calls with direct calls to the target function",
        });
        this.statistics.proxyFunctions++;
        this.statistics.patternsFound++;
      }
    }
  }

  checkEncodingPattern(path) {
    const callee = path.node.callee;

    if (t.isIdentifier(callee, { name: "eval" })) {
      this.addViolation({
        rule: this.rules.encoding.evalBased.name,
        message: "eval() detected - potential code encoding/decoding",
        severity: this.rules.encoding.evalBased.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion:
          "Replace eval with direct code or analyze the evaluated content",
      });
      this.statistics.encodingPatterns++;
      this.statistics.patternsFound++;
    }

    if (t.isIdentifier(callee, { name: "Function" })) {
      this.addViolation({
        rule: this.rules.encoding.functionConstructor.name,
        message: "Function constructor detected - potential code generation",
        severity: this.rules.encoding.functionConstructor.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Replace with direct function definition",
      });
      this.statistics.encodingPatterns++;
      this.statistics.patternsFound++;
    }
  }

  checkAST(ast, config) {
    const self = this;

    traverse(ast, {
      Program(path) {
        const body = path.node.body;
        let lastReturnIndex = -1;

        body.forEach((node, index) => {
          if (t.isReturnStatement(node) || t.isThrowStatement(node)) {
            lastReturnIndex = index;
          }
        });

        if (lastReturnIndex >= 0 && lastReturnIndex < body.length - 1) {
          for (let i = lastReturnIndex + 1; i < body.length; i++) {
            self.addViolation({
              rule: self.rules.deadCode.unreachable.name,
              message: "Unreachable code detected after return/throw",
              severity: self.rules.deadCode.unreachable.severity,
              line: body[i].loc ? body[i].loc.start.line : 0,
              column: body[i].loc ? body[i].loc.start.column : 0,
              suggestion: "Remove unreachable code",
            });
            self.statistics.deadCode++;
            self.statistics.patternsFound++;
          }
        }
      },
    });
  }

  isHexString(str) {
    if (typeof str !== "string") return false;
    const hexPattern = /^[0-9a-fA-F]{20,}$/;
    return hexPattern.test(str);
  }

  isBase64String(str) {
    if (typeof str !== "string") return false;
    const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
    return base64Pattern.test(str);
  }

  isShuffledSequence(arr) {
    if (arr.length < 3) return false;
    const sorted = [...arr].sort((a, b) => a - b);
    let consecutive = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        consecutive++;
      }
    }
    return consecutive >= sorted.length * 0.6;
  }

  addViolation(violation) {
    this.violations.push({
      ...violation,
      timestamp: Date.now(),
    });
  }

  getViolations() {
    return [...this.violations];
  }

  getStatistics() {
    return { ...this.statistics };
  }

  reset() {
    this.violations = [];
    this.statistics = {
      totalChecks: 0,
      patternsFound: 0,
      stringObfuscation: 0,
      controlFlowFlattening: 0,
      deadCode: 0,
      variableMangling: 0,
      proxyFunctions: 0,
      encodingPatterns: 0,
    };
    this.rules = {};
  }
}

module.exports = PatternRules;
