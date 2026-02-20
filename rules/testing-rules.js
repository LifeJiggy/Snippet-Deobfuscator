/**
 * Testing Rules
 * Production-grade JavaScript testing best practices
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class TestingRules {
  constructor() {
    this.name = "testing-rules";
    this.version = "1.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      testQuality: 0,
      assertions: 0,
      mocking: 0,
      asyncTesting: 0
    };
  }

  initializeRules() {
    return {
      describeIt: {
        id: "test-describe-it",
        description: "Use proper describe/it structure",
        severity: "error",
        pattern: /test\s*\(\s*['"]/g,
        message: "Use describe() blocks to group related tests",
        recommendation: "Wrap tests in describe('module', () => { it('should', ...) })"
      },
      assertions: {
        id: "test-assertions",
        description: "Include assertions in tests",
        severity: "error",
        pattern: /it\s*\([^)]*\)\s*\{[^}]*\}(?!\s*;)/g,
        message: "Test must include at least one assertion",
        recommendation: "Use expect(), assert., or should.* assertions"
      },
      meaningfulNames: {
        id: "test-meaningful-names",
        description: "Use descriptive test names",
        severity: "warning",
        pattern: /it\s*\(\s*['"](?:test|foo|bar)/gi,
        message: "Use descriptive test names that explain the expected behavior",
        recommendation: "it('should return user by id') is better than it('test1')"
      },
      oneAssertion: {
        id: "test-one-assertion",
        description: "Prefer one assertion per test",
        severity: "info",
        pattern: /expect\s*\([^)]+\)\.\w+\([^)]+\)[^;]{0,50}expect/g,
        message: "Consider splitting multiple assertions into separate tests",
        recommendation: "Each test should verify one behavior"
      },
      beforeAfter: {
        id: "test-before-after",
        description: "Use beforeEach/afterEach for setup/teardown",
        severity: "info",
        pattern: /let\s+\w+\s*=\s*[^;]+;\s*(?:it|test)\s*\(/g,
        message: "Consider using beforeEach for repetitive setup",
        recommendation: "Use beforeEach(() => { setup }) to reduce duplication"
      },
      asyncHandling: {
        id: "test-async",
        description: "Properly handle async tests",
        severity: "error",
        pattern: /it\s*\(\s*['"][^"]*['"]\s*,\s*(?:async\s*)?\([^)]*\)\s*=>/g,
        message: "Async tests must return a promise or use done callback",
        recommendation: "Return the promise or use async/await in tests"
      },
      testOnly: {
        id: "test-only",
        description: "Use .only to focus on specific tests during development",
        severity: "info",
        pattern: /it\.only\(|describe\.only\(/g,
        message: "Remove .only before committing",
        recommendation: "Remove .only to run all tests"
      },
      skipInstead: {
        id: "test-skip",
        description: "Use it.skip for temporarily disabled tests",
        severity: "info",
        pattern: /it\.skip\(/g,
        message: "Use it.skip for temporarily disabled tests",
        recommendation: "Use it.skip instead of commenting out tests"
      },
      mockCalls: {
        id: "test-mock-calls",
        description: "Verify mock function calls",
        severity: "warning",
        pattern: /jest\.fn\(\)|vi\.fn\(\)|sinon\.spy\(/g,
        message: "Mock functions should be verified with toHaveBeenCalled",
        recommendation: "Add expect(mock).toHaveBeenCalled() assertions"
      },
      spyCleanup: {
        id: "test-spy-cleanup",
        description: "Clean up spies after tests",
        severity: "warning",
        pattern: /jest\.spyOn\(/g,
        message: "Remember to restore or clear spies after tests",
        recommendation: "Use jest.restoreAllMocks() in afterEach"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      testQuality: 0,
      assertions: 0,
      mocking: 0,
      asyncTesting: 0
    };

    const result = {
      violations: [],
      statistics: {},
      testQualityScore: 0
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        return result;
      }

      this.checkPatterns(code);
      this.checkAST(ast);

      result.violations = this.violations;
      result.statistics = this.getStatistics();
      result.testQualityScore = this.calculateTestScore();
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"]
      });
    } catch (e) {
      return null;
    }
  }

  checkPatterns(code) {
    for (const [ruleId, rule] of Object.entries(this.rules)) {
      if (!rule.pattern) continue;

      const matches = code.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          this.addViolation(rule, match, null);
        }
      }
    }
  }

  checkAST(ast) {
    const self = this;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        
        if (callee.type === 'Identifier' && callee.name === 'it') {
          if (path.node.arguments.length >= 2) {
            const secondArg = path.node.arguments[1];
            if (secondArg.type !== 'ArrowFunctionExpression' && 
                secondArg.type !== 'FunctionExpression') {
              self.addViolation(self.rules.describeIt, 'it()', path.node.loc);
            }
          }
        }
        
        if (callee.type === 'MemberExpression' && 
            (callee.property.name === 'mock' || callee.property.name === 'spyOn')) {
          self.addViolation(self.rules.mockCalls, 'mock/spyOn', path.node.loc);
        }
      }
    });
  }

  addViolation(rule, match, location) {
    this.violations.push({
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
      match: match,
      recommendation: rule.recommendation,
      location: location
        ? { line: location.start.line, column: location.start.column }
        : null,
      timestamp: Date.now()
    });

    this.stats.totalChecks++;
    if (rule.severity === 'error') this.stats.testQuality++;
  }

  calculateTestScore() {
    const total = this.stats.totalChecks;
    const errors = this.stats.testQuality;
    return Math.max(0, 100 - (errors * 15));
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
      totalChecks: 0,
      testQuality: 0,
      assertions: 0,
      mocking: 0,
      asyncTesting: 0
    };
  }
}

module.exports = TestingRules;
