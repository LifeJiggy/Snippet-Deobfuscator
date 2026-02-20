/**
 * Complexity Rules
 * Production-grade code complexity measurement rules for JavaScript
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class ComplexityRules {
  constructor() {
    this.name = "complexity-rules";
    this.version = "3.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      cyclomatic: 1,
      cognitive: 0,
      nesting: 0,
      functions: 0,
      lines: 0,
    };
  }

  initializeRules() {
    return {
      cyclomaticComplexity: {
        id: "complexity-cyclomatic",
        description: "Cyclomatic complexity should not exceed threshold",
        severity: "warning",
        threshold: 15,
        message:
          "Cyclomatic complexity {{value}} exceeds threshold {{threshold}}",
      },
      cognitiveComplexity: {
        id: "complexity-cognitive",
        description: "Cognitive complexity should not exceed threshold",
        severity: "warning",
        threshold: 25,
        message:
          "Cognitive complexity {{value}} exceeds threshold {{threshold}}",
      },
      nestingDepth: {
        id: "complexity-nesting-depth",
        description: "Nesting depth should not exceed threshold",
        severity: "warning",
        threshold: 5,
        message: "Nesting depth {{value}} exceeds threshold {{threshold}}",
      },
      functionLength: {
        id: "complexity-function-length",
        description: "Function length should not exceed threshold",
        severity: "info",
        threshold: 100,
        message:
          "Function '{{name}}' has {{value}} lines, exceeds threshold {{threshold}}",
      },
      parameterCount: {
        id: "complexity-parameter-count",
        description: "Parameter count should not exceed threshold",
        severity: "warning",
        threshold: 5,
        message:
          "Function '{{name}}' has {{value}} parameters, exceeds threshold {{threshold}}",
      },
      callbackNesting: {
        id: "complexity-callback-nesting",
        description: "Callback nesting should not exceed threshold",
        severity: "warning",
        threshold: 3,
        message: "Callback nesting {{value}} exceeds threshold {{threshold}}",
      },
      switchCases: {
        id: "complexity-switch-cases",
        description: "Switch cases should not exceed threshold",
        severity: "info",
        threshold: 20,
        message:
          "Switch statement has {{value}} cases, exceeds threshold {{threshold}}",
      },
      linesOfFile: {
        id: "complexity-file-lines",
        description: "File should not exceed maximum lines",
        severity: "info",
        threshold: 500,
        message: "File has {{value}} lines, exceeds threshold {{threshold}}",
      },
      functionCount: {
        id: "complexity-function-count",
        description: "File should not have too many functions",
        severity: "info",
        threshold: 50,
        message:
          "File has {{value}} functions, exceeds threshold {{threshold}}",
      },
      nestedTernary: {
        id: "complexity-nested-ternary",
        description: "Nested ternary expressions should be avoided",
        severity: "warning",
        threshold: 2,
        message:
          "Nested ternary depth {{value}} exceeds threshold {{threshold}}",
      },
      loopComplexity: {
        id: "complexity-loop",
        description: "Loop body should not be too complex",
        severity: "info",
        threshold: 20,
        message:
          "Loop body has {{value}} statements, exceeds threshold {{threshold}}",
      },
      conditionalComplexity: {
        id: "complexity-conditional",
        description: "Condition should not be too complex",
        severity: "warning",
        threshold: 5,
        message:
          "Condition has complexity {{value}}, exceeds threshold {{threshold}}",
      },
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      cyclomatic: 1,
      cognitive: 0,
      nesting: 0,
      functions: 0,
      lines: code.split("\n").length,
    };

    const result = {
      violations: [],
      complexity: {},
      statistics: {},
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        return result;
      }

      this.calculateCyclomatic(ast);
      this.calculateCognitive(ast);
      this.calculateNesting(ast);
      this.checkFunctions(ast);
      this.checkSwitchStatements(ast);
      this.checkTernaryExpressions(ast);
      this.checkConditions(ast);

      this.checkThresholds();

      result.violations = this.violations;
      result.complexity = {
        cyclomatic: this.stats.cyclomatic,
        cognitive: this.stats.cognitive,
        nesting: this.stats.nesting,
        functions: this.stats.functions,
      };
      result.statistics = this.getStatistics();
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

  calculateCyclomatic(ast) {
    const self = this;

    traverse(ast, {
      IfStatement() {
        self.stats.cyclomatic++;
      },
      ConditionalExpression() {
        self.stats.cyclomatic++;
      },
      ForStatement() {
        self.stats.cyclomatic++;
      },
      ForInStatement() {
        self.stats.cyclomatic++;
      },
      ForOfStatement() {
        self.stats.cyclomatic++;
      },
      WhileStatement() {
        self.stats.cyclomatic++;
      },
      DoWhileStatement() {
        self.stats.cyclomatic++;
      },
      SwitchCase() {
        self.stats.cyclomatic++;
      },
      LogicalExpression(path) {
        if (path.node.operator === "&&" || path.node.operator === "||") {
          self.stats.cyclomatic++;
        }
      },
      CatchClause() {
        self.stats.cyclomatic++;
      },
    });
  }

  calculateCognitive(ast) {
    let cognitive = 0;
    let nestingLevel = 0;

    traverse(ast, {
      enter(path) {
        if (
          path.isIfStatement() ||
          path.isForStatement() ||
          path.isWhileStatement() ||
          path.isDoWhileStatement() ||
          path.isSwitchStatement()
        ) {
          cognitive += 1 + nestingLevel;
          nestingLevel++;
        }
        if (path.isConditionalExpression()) {
          cognitive += 1 + nestingLevel;
        }
        if (
          path.isLogicalExpression() &&
          (path.node.operator === "&&" || path.node.operator === "||")
        ) {
          cognitive++;
        }
      },
      exit(path) {
        if (
          path.isIfStatement() ||
          path.isForStatement() ||
          path.isWhileStatement() ||
          path.isDoWhileStatement() ||
          path.isSwitchStatement()
        ) {
          nestingLevel--;
        }
      },
    });

    this.stats.cognitive = cognitive;
  }

  calculateNesting(ast) {
    let maxNesting = 0;

    traverse(ast, {
      enter(path) {
        let level = 0;
        let current = path.parent;
        while (current) {
          if (
            [
              "IfStatement",
              "ForStatement",
              "ForInStatement",
              "ForOfStatement",
              "WhileStatement",
              "DoWhileStatement",
              "SwitchStatement",
              "TryStatement",
            ].includes(current.type)
          ) {
            level++;
          }
          current = current.parent;
        }
        if (level > maxNesting) {
          maxNesting = level;
        }
      },
    });

    this.stats.nesting = maxNesting;
  }

  checkFunctions(ast) {
    const self = this;
    this.stats.functions = 0;

    traverse(ast, {
      FunctionDeclaration(path) {
        self.stats.functions++;
        self.checkFunctionComplexity(path);
      },
      FunctionExpression() {
        self.stats.functions++;
      },
      ArrowFunctionExpression() {
        self.stats.functions++;
      },
    });
  }

  checkFunctionComplexity(path) {
    const node = path.node;
    const name = node.id?.name || "anonymous";
    const params = node.params?.length || 0;

    if (params > this.rules.parameterCount.threshold) {
      this.addViolation(
        "parameterCount",
        name,
        params,
        this.rules.parameterCount.threshold
      );
    }

    const body = node.body;
    if (body.type === "BlockStatement") {
      const lines = this.countLines(body);
      if (lines > this.rules.functionLength.threshold) {
        this.addViolation(
          "functionLength",
          name,
          lines,
          this.rules.functionLength.threshold
        );
      }
    }
  }

  countLines(node) {
    if (!node.loc) return 0;
    return node.loc.end.line - node.loc.start.line + 1;
  }

  checkSwitchStatements(ast) {
    const self = this;

    traverse(ast, {
      SwitchStatement(path) {
        const cases = path.node.cases.length;
        if (cases > self.rules.switchCases.threshold) {
          self.addViolation(
            "switchCases",
            "switch",
            cases,
            self.rules.switchCases.threshold,
            path.node.loc
          );
        }
      },
    });
  }

  checkTernaryExpressions(ast) {
    const self = this;

    traverse(ast, {
      ConditionalExpression(path) {
        const depth = self.getTernaryDepth(path.node);
        if (depth > self.rules.nestedTernary.threshold) {
          self.addViolation(
            "nestedTernary",
            "ternary",
            depth,
            self.rules.nestedTernary.threshold,
            path.node.loc
          );
        }
      },
    });
  }

  getTernaryDepth(node, depth = 1) {
    if (!node) return depth;
    if (node.consequent?.type === "ConditionalExpression") {
      return this.getTernaryDepth(node.consequent, depth + 1);
    }
    if (node.alternate?.type === "ConditionalExpression") {
      return this.getTernaryDepth(node.alternate, depth + 1);
    }
    return depth;
  }

  checkConditions(ast) {
    const self = this;

    traverse(ast, {
      IfStatement(path) {
        const complexity = self.getConditionComplexity(path.node.test);
        if (complexity > self.rules.conditionalComplexity.threshold) {
          self.addViolation(
            "conditionalComplexity",
            "if",
            complexity,
            self.rules.conditionalComplexity.threshold,
            path.node.loc
          );
        }
      },
    });
  }

  getConditionComplexity(node) {
    if (!node) return 0;
    if (node.type === "LogicalExpression") {
      return (
        1 +
        this.getConditionComplexity(node.left) +
        this.getConditionComplexity(node.right)
      );
    }
    if (node.type === "BinaryExpression") {
      return 1;
    }
    return 0;
  }

  checkThresholds() {
    if (this.stats.cyclomatic > this.rules.cyclomaticComplexity.threshold) {
      this.addViolation(
        "cyclomaticComplexity",
        "code",
        this.stats.cyclomatic,
        this.rules.cyclomaticComplexity.threshold
      );
    }
    if (this.stats.cognitive > this.rules.cognitiveComplexity.threshold) {
      this.addViolation(
        "cognitiveComplexity",
        "code",
        this.stats.cognitive,
        this.rules.cognitiveComplexity.threshold
      );
    }
    if (this.stats.nesting > this.rules.nestingDepth.threshold) {
      this.addViolation(
        "nestingDepth",
        "code",
        this.stats.nesting,
        this.rules.nestingDepth.threshold
      );
    }
    if (this.stats.functions > this.rules.functionCount.threshold) {
      this.addViolation(
        "functionCount",
        "file",
        this.stats.functions,
        this.rules.functionCount.threshold
      );
    }
  }

  addViolation(ruleId, name, value, threshold, location = null) {
    const rule = this.rules[ruleId];
    this.violations.push({
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message
        .replace("{{name}}", name)
        .replace("{{value}}", value)
        .replace("{{threshold}}", threshold),
      name,
      value,
      threshold,
      location: location
        ? { line: location.start.line, column: location.start.column }
        : null,
    });
  }

  getViolations() {
    return this.violations;
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.violations = [];
    this.stats = {
      cyclomatic: 1,
      cognitive: 0,
      nesting: 0,
      functions: 0,
      lines: 0,
    };
  }
}

module.exports = ComplexityRules;
