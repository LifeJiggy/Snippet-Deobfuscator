/**
 * Naming Rules
 * Production-grade naming convention rules for JavaScript deobfuscation
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class NamingRules {
  constructor() {
    this.name = "naming-rules";
    this.version = "3.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      checked: 0,
      passed: 0,
      violations: 0,
    };
  }

  initializeRules() {
    return {
      variableCamelCase: {
        id: "naming-variable-camelcase",
        description: "Variables should use camelCase convention",
        severity: "warning",
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        applies: ["VariableDeclarator"],
        message: "Variable '{{name}}' should use camelCase",
      },
      functionCamelCase: {
        id: "naming-function-camelcase",
        description: "Functions should use camelCase convention",
        severity: "warning",
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        applies: ["FunctionDeclaration"],
        message: "Function '{{name}}' should use camelCase",
      },
      classPascalCase: {
        id: "naming-class-pascalcase",
        description: "Classes should use PascalCase convention",
        severity: "error",
        pattern: /^[A-Z][a-zA-Z0-9]*$/,
        applies: ["ClassDeclaration"],
        message: "Class '{{name}}' should use PascalCase",
      },
      constantUpperCase: {
        id: "naming-constant-uppercase",
        description: "Constants should use UPPER_SNAKE_CASE",
        severity: "info",
        pattern: /^[A-Z][A-Z0-9_]*$/,
        applies: ["VariableDeclarator"],
        isConstant: true,
        message: "Constant '{{name}}' should use UPPER_SNAKE_CASE",
      },
      singleLetterProhibited: {
        id: "naming-single-letter-prohibited",
        description:
          "Single-letter variable names should be avoided except in loops",
        severity: "warning",
        pattern: /^[a-z]$/,
        applies: ["VariableDeclarator"],
        allowInLoops: true,
        message: "Avoid single-letter variable name '{{name}}'",
      },
      obfuscatedHexPattern: {
        id: "naming-obfuscated-hex",
        description: "Hex-prefixed names indicate obfuscation",
        severity: "error",
        pattern: /^_0x[0-9a-fA-F]+$/,
        applies: ["Identifier"],
        message: "Obfuscated name detected: '{{name}}'",
      },
      underscorePrefix: {
        id: "naming-underscore-prefix",
        description:
          "Underscore prefix should only be used for private members",
        severity: "info",
        pattern: /^_[a-zA-Z0-9]+$/,
        applies: ["Identifier"],
        message:
          "Underscore prefix used for '{{name}}' - ensure it indicates private member",
      },
      dollarPrefix: {
        id: "naming-dollar-prefix",
        description: "Dollar prefix usage should be documented",
        severity: "info",
        pattern: /^\$[a-zA-Z0-9]+$/,
        applies: ["Identifier"],
        message: "Dollar prefix used for '{{name}}'",
      },
      tooShort: {
        id: "naming-too-short",
        description:
          "Names should be descriptive (minimum 2 characters except loop vars)",
        severity: "warning",
        minLength: 2,
        applies: ["VariableDeclarator", "FunctionDeclaration"],
        allowInLoops: true,
        message: "Name '{{name}}' is too short to be descriptive",
      },
      tooLong: {
        id: "naming-too-long",
        description: "Names should not exceed reasonable length",
        severity: "info",
        maxLength: 30,
        applies: ["Identifier"],
        message: "Name '{{name}}' exceeds maximum length",
      },
      reservedWords: {
        id: "naming-reserved-words",
        description: "Do not use reserved JavaScript words",
        severity: "error",
        reserved: [
          "break",
          "case",
          "catch",
          "continue",
          "debugger",
          "default",
          "delete",
          "do",
          "else",
          "finally",
          "for",
          "function",
          "if",
          "in",
          "instanceof",
          "new",
          "return",
          "switch",
          "this",
          "throw",
          "try",
          "typeof",
          "var",
          "void",
          "while",
          "with",
          "class",
          "const",
          "enum",
          "export",
          "extends",
          "import",
          "super",
          "implements",
          "interface",
          "let",
          "package",
          "private",
          "protected",
          "public",
          "static",
          "yield",
        ],
        message: "'{{name}}' is a reserved word",
      },
      misleadingNames: {
        id: "naming-misleading",
        description: "Avoid misleading variable names",
        severity: "warning",
        misleading: [
          "data",
          "temp",
          "tmp",
          "value",
          "item",
          "thing",
          "stuff",
          "foo",
          "bar",
          "baz",
        ],
        message: "Variable '{{name}}' is too generic or misleading",
      },
      booleanPrefix: {
        id: "naming-boolean-prefix",
        description:
          "Boolean variables should start with is, has, can, should, etc.",
        severity: "info",
        prefixes: [
          "is",
          "has",
          "can",
          "should",
          "will",
          "was",
          "are",
          "were",
          "does",
          "did",
        ],
        applies: ["VariableDeclarator"],
        message:
          "Boolean variable '{{name}}' should start with a prefix like 'is', 'has', etc.",
      },
      asyncSuffix: {
        id: "naming-async-suffix",
        description: "Async functions should not have 'Async' suffix",
        severity: "info",
        pattern: /Async$/,
        applies: ["FunctionDeclaration"],
        message: "Async function '{{name}}' should not have 'Async' suffix",
      },
      eventHandlerPrefix: {
        id: "naming-event-handler",
        description: "Event handlers should start with 'handle' or 'on'",
        severity: "info",
        prefixes: ["handle", "on"],
        applies: ["FunctionDeclaration"],
        message: "Event handler '{{name}}' should start with 'handle' or 'on'",
      },
      gettterPrefix: {
        id: "naming-getter-prefix",
        description: "Getter functions should start with 'get'",
        severity: "info",
        prefix: "get",
        applies: ["FunctionDeclaration"],
        message: "Getter function '{{name}}' should start with 'get'",
      },
      setterPrefix: {
        id: "naming-setter-prefix",
        description: "Setter functions should start with 'set'",
        severity: "info",
        prefix: "set",
        applies: ["FunctionDeclaration"],
        message: "Setter function '{{name}}' should start with 'set'",
      },
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = { checked: 0, passed: 0, violations: 0 };

    const result = {
      violations: [],
      statistics: {},
      passed: true,
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        return result;
      }

      this.checkRules(ast, result);
      result.violations = this.violations;
      result.statistics = this.getStatistics();
      result.passed = this.violations.length === 0;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
    } catch (e) {
      return null;
    }
  }

  checkRules(ast, result) {
    const self = this;

    traverse(ast, {
      VariableDeclarator(path) {
        self.checkVariableDeclarator(path);
      },
      FunctionDeclaration(path) {
        self.checkFunctionDeclaration(path);
      },
      ClassDeclaration(path) {
        self.checkClassDeclaration(path);
      },
      Identifier(path) {
        self.checkIdentifier(path);
      },
    });
  }

  checkVariableDeclarator(path) {
    const name = path.node.id?.name;
    if (!name) return;

    this.stats.checked++;

    const isConstant = path.parent.kind === "const";
    const isInLoop = this.isInLoop(path);

    for (const [ruleId, rule] of Object.entries(this.rules)) {
      if (!rule.applies?.includes("VariableDeclarator")) continue;

      if (ruleId === "variableCamelCase" && !isConstant) {
        if (!rule.pattern.test(name)) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "constantUpperCase" && isConstant) {
        if (!rule.pattern.test(name)) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "singleLetterProhibited") {
        if (rule.pattern.test(name) && !isInLoop) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "tooShort" && !isInLoop) {
        if (name.length < rule.minLength) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "misleadingNames") {
        if (rule.misleading.includes(name.toLowerCase())) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "reservedWords") {
        if (rule.reserved.includes(name)) {
          this.addViolation(rule, name, path.node.loc);
        }
      }
    }

    this.stats.passed++;
  }

  checkFunctionDeclaration(path) {
    const name = path.node.id?.name;
    if (!name) return;

    this.stats.checked++;

    for (const [ruleId, rule] of Object.entries(this.rules)) {
      if (!rule.applies?.includes("FunctionDeclaration")) continue;

      if (ruleId === "functionCamelCase") {
        if (!rule.pattern.test(name)) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "tooShort") {
        if (name.length < rule.minLength) {
          this.addViolation(rule, name, path.node.loc);
        }
      }

      if (ruleId === "reservedWords") {
        if (rule.reserved.includes(name)) {
          this.addViolation(rule, name, path.node.loc);
        }
      }
    }

    this.stats.passed++;
  }

  checkClassDeclaration(path) {
    const name = path.node.id?.name;
    if (!name) return;

    this.stats.checked++;

    const rule = this.rules.classPascalCase;
    if (!rule.pattern.test(name)) {
      this.addViolation(rule, name, path.node.loc);
    }

    this.stats.passed++;
  }

  checkIdentifier(path) {
    const name = path.node.name;
    if (!name) return;

    if (!path.isReferencedIdentifier() && !path.isBindingIdentifier()) return;

    this.stats.checked++;

    const hexRule = this.rules.obfuscatedHexPattern;
    if (hexRule.pattern.test(name)) {
      this.addViolation(hexRule, name, path.node.loc);
    }

    const longRule = this.rules.tooLong;
    if (name.length > longRule.maxLength) {
      this.addViolation(longRule, name, path.node.loc);
    }

    this.stats.passed++;
  }

  isInLoop(path) {
    let current = path.parent;
    while (current) {
      if (
        [
          "ForStatement",
          "ForInStatement",
          "ForOfStatement",
          "WhileStatement",
          "DoWhileStatement",
        ].includes(current.type)
      ) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  addViolation(rule, name, location) {
    this.violations.push({
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message.replace("{{name}}", name),
      name,
      location: location
        ? { line: location.start.line, column: location.start.column }
        : null,
    });
    this.stats.violations++;
  }

  getViolations() {
    return this.violations;
  }

  getStatistics() {
    return {
      ...this.stats,
      violationRate:
        this.stats.checked > 0
          ? ((this.stats.violations / this.stats.checked) * 100).toFixed(2) +
            "%"
          : "0%",
    };
  }

  reset() {
    this.violations = [];
    this.stats = { checked: 0, passed: 0, violations: 0 };
  }
}

module.exports = NamingRules;
