/**
 * Control Flow Skill
 * Production-grade control flow deobfuscation and reconstruction
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class ControlFlowSkill {
  constructor() {
    this.name = "control-flow";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      flattened: 0,
      predicates: 0,
      deadCode: 0,
      branches: 0,
      loops: 0,
    };
    this.patterns = this.initializePatterns();
  }

  execute(code, options = {}) {
    return this.analyze(code, options);
  }

  initializePatterns() {
    return {
      switchFlattening: {
        minCases: 5,
        patterns: [/switch\s*\([^)]+\)\s*\{/],
        severity: "high",
      },
      opaquePredicate: {
        patterns: [/if\s*\(\s*(true|false|1|0)\s*\)/],
        severity: "medium",
      },
      deadCode: {
        patterns: [/return[^;]*;[^}]*}/],
        severity: "low",
      },
      infiniteLoop: {
        patterns: [/while\s*\(\s*(true|1)\s*\)/, /for\s*\(\s*;\s*;\s*\)/],
        severity: "critical",
      },
    };
  }

  analyze(code, options = {}) {
    this.stats = {
      flattened: 0,
      predicates: 0,
      deadCode: 0,
      branches: 0,
      loops: 0,
    };
    const result = {
      issues: [],
      reconstructed: code,
      cfg: null,
      complexity: {},
      statistics: {},
      warnings: [],
      errors: [],
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        result.warnings.push("Failed to parse code into AST");
        return result;
      }

      this.detectFlattening(ast, result);
      this.detectOpaquePredicates(ast, result);
      this.detectDeadCode(ast, result);
      this.analyzeBranches(ast, result);
      this.analyzeLoops(ast, result);
      this.calculateComplexity(ast, result);

      if (options.autoReconstruct !== false) {
        result.reconstructed = this.reconstruct(code, ast, result.issues);
      }

      result.statistics = this.getStatistics();
    } catch (error) {
      result.errors.push(error.message);
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

  detectFlattening(ast, result) {
    traverse(ast, {
      SwitchStatement: (path) => {
        if (path.node.cases.length >= this.patterns.switchFlattening.minCases) {
          const stateVar = this.findStateVariable(path);
          const hasDispatcher = this.hasDispatcherPattern(path);

          if (stateVar && hasDispatcher) {
            result.issues.push({
              type: "control-flow-flattening",
              severity: "high",
              location: this.getLocation(path.node),
              cases: path.node.cases.length,
              stateVariable: stateVar,
              recoverable: true,
            });
            this.stats.flattened++;
          }
        }
      },
    });
  }

  findStateVariable(path) {
    const test = path.node.test;
    if (test.type === "Identifier") {
      return test.name;
    }
    if (test.type === "MemberExpression") {
      return generate(test).code;
    }
    return null;
  }

  hasDispatcherPattern(path) {
    let hasAssignment = false;
    let hasContinue = false;

    path.traverse({
      AssignmentExpression: (assignPath) => {
        if (assignPath.node.left.type === "Identifier") {
          hasAssignment = true;
        }
      },
      ContinueStatement: () => {
        hasContinue = true;
      },
    });

    return hasAssignment && hasContinue;
  }

  detectOpaquePredicates(ast, result) {
    traverse(ast, {
      IfStatement: (path) => {
        const test = path.node.test;

        if (test.type === "BooleanLiteral") {
          result.issues.push({
            type: "opaque-predicate",
            severity: "medium",
            location: this.getLocation(path.node),
            value: test.value,
            alwaysExecutes: test.value,
            recoverable: true,
          });
          this.stats.predicates++;
        }

        if (this.isArithmeticOpaque(test)) {
          result.issues.push({
            type: "arithmetic-opaque-predicate",
            severity: "medium",
            location: this.getLocation(path.node),
            expression: generate(test).code,
            recoverable: true,
          });
          this.stats.predicates++;
        }
      },
    });
  }

  isArithmeticOpaque(node) {
    if (node.type !== "BinaryExpression") return false;
    if (
      node.left.type === "NumericLiteral" &&
      node.right.type === "NumericLiteral"
    ) {
      return true;
    }
    return false;
  }

  detectDeadCode(ast, result) {
    traverse(ast, {
      IfStatement: (path) => {
        if (
          path.node.test.type === "BooleanLiteral" &&
          path.node.test.value === false
        ) {
          result.issues.push({
            type: "dead-code-branch",
            severity: "low",
            location: this.getLocation(path.node.consequent),
            reason: "Condition always false",
            recoverable: true,
          });
          this.stats.deadCode++;
        }
      },

      ReturnStatement: (path) => {
        const func = path.getFunctionParent();
        if (func) {
          const body = func.node.body.body || func.node.body;
          const returnIndex = body.indexOf(path.node);

          if (returnIndex >= 0 && returnIndex < body.length - 1) {
            for (let i = returnIndex + 1; i < body.length; i++) {
              if (
                body[i].type !== "EmptyStatements" &&
                body[i].type !== "VariableDeclaration"
              ) {
                result.issues.push({
                  type: "unreachable-code",
                  severity: "low",
                  location: this.getLocation(body[i]),
                  reason: "Code after return statement",
                  recoverable: true,
                });
                this.stats.deadCode++;
                break;
              }
            }
          }
        }
      },
    });
  }

  analyzeBranches(ast, result) {
    traverse(ast, {
      IfStatement: () => {
        this.stats.branches++;
      },
      ConditionalExpression: () => {
        this.stats.branches++;
      },
      SwitchStatement: (path) => {
        result.issues.push({
          type: "switch-statement",
          severity: "info",
          location: this.getLocation(path.node),
          cases: path.node.cases.length,
        });
        this.stats.branches++;
      },
    });
  }

  analyzeLoops(ast, result) {
    traverse(ast, {
      ForStatement: (path) => {
        this.stats.loops++;
        if (!path.node.test) {
          result.issues.push({
            type: "potentially-infinite-loop",
            severity: "medium",
            location: this.getLocation(path.node),
            loopType: "for",
          });
        }
      },
      WhileStatement: (path) => {
        this.stats.loops++;
        const testCode = generate(path.node.test).code;
        if (testCode === "true" || testCode === "1") {
          result.issues.push({
            type: "infinite-loop",
            severity: "critical",
            location: this.getLocation(path.node),
            loopType: "while",
          });
        }
      },
      DoWhileStatement: () => {
        this.stats.loops++;
      },
      ForInStatement: () => {
        this.stats.loops++;
      },
      ForOfStatement: () => {
        this.stats.loops++;
      },
    });
  }

  calculateComplexity(ast, result) {
    let cyclomatic = 1;
    let cognitive = 0;
    let nesting = 0;
    let maxNesting = 0;

    traverse(ast, {
      IfStatement: (path) => {
        cyclomatic++;
        cognitive += 1 + nesting;
        nesting++;
        maxNesting = Math.max(maxNesting, nesting);
      },
      exit(path) {
        if (path.isIfStatement()) nesting--;
      },
      ForStatement: () => {
        cyclomatic++;
        cognitive += 1 + nesting;
      },
      WhileStatement: () => {
        cyclomatic++;
        cognitive += 1 + nesting;
      },
      SwitchCase: () => {
        cyclomatic++;
      },
      ConditionalExpression: () => {
        cyclomatic++;
      },
      LogicalExpression: () => {
        cyclomatic++;
      },
    });

    result.complexity = {
      cyclomatic,
      cognitive,
      maxNesting,
      risk: this.getComplexityRisk(cyclomatic),
    };
  }

  getComplexityRisk(value) {
    if (value <= 10) return "low";
    if (value <= 20) return "moderate";
    if (value <= 50) return "high";
    return "very-high";
  }

  reconstruct(code, ast, issues) {
    let result = code;

    for (const issue of issues) {
      switch (issue.type) {
        case "opaque-predicate":
          result = this.resolveOpaquePredicate(result, issue);
          break;
        case "dead-code-branch":
          result = this.removeDeadCode(result, issue);
          break;
        case "unreachable-code":
          break;
      }
    }

    return result;
  }

  resolveOpaquePredicate(code, issue) {
    if (issue.alwaysExecutes) {
      return code.replace(/if\s*\(\s*true\s*\)\s*\{/g, "{");
    }
    return code.replace(/if\s*\(\s*false\s*\)\s*\{[^}]*\}/g, "");
  }

  removeDeadCode(code, issue) {
    return code.replace(/if\s*\(\s*false\s*\)\s*\{[^}]*\}/g, "");
  }

  unflattenSwitch(ast, switchPath) {
    const cases = switchPath.node.cases;
    const stateVar = this.findStateVariable(switchPath);

    if (!stateVar) return null;

    const orderedCases = this.orderCasesByFlow(cases, stateVar);
    if (!orderedCases) return null;

    const statements = [];
    for (const caseBlock of orderedCases) {
      for (const stmt of caseBlock.consequent) {
        if (
          stmt.type !== "BreakStatement" &&
          stmt.type !== "ContinueStatement"
        ) {
          statements.push(stmt);
        }
      }
    }

    return statements;
  }

  orderCasesByFlow(cases, stateVar) {
    const caseMap = new Map();

    for (const c of cases) {
      if (c.test) {
        const key = c.test.value;
        caseMap.set(key, c);
      }
    }

    const ordered = [];
    let current = 0;

    for (let i = 0; i < cases.length; i++) {
      const caseBlock = caseMap.get(current);
      if (!caseBlock) break;

      ordered.push(caseBlock);

      current = this.findNextState(caseBlock, stateVar);
      if (current === null) break;
    }

    return ordered.length === cases.length - 1 ? ordered : null;
  }

  findNextState(caseBlock, stateVar) {
    for (const stmt of caseBlock.consequent) {
      if (
        stmt.type === "AssignmentExpression" ||
        stmt.type === "ExpressionStatement"
      ) {
        const expr =
          stmt.type === "ExpressionStatement" ? stmt.expression : stmt;
        if (expr.left && expr.left.name === stateVar) {
          return expr.right.value;
        }
      }
    }
    return null;
  }

  getLocation(node) {
    if (!node || !node.loc) return null;
    return {
      start: { line: node.loc.start.line, column: node.loc.start.column },
      end: { line: node.loc.end.line, column: node.loc.end.column },
    };
  }

  getStatistics() {
    return {
      ...this.stats,
      totalIssues:
        this.stats.flattened + this.stats.predicates + this.stats.deadCode,
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.patterns = {};
  }
}

module.exports = ControlFlowSkill;
