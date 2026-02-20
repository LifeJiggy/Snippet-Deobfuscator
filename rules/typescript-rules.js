/**
 * TypeScript Rules
 * Production-grade TypeScript coding standards
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class TypeScriptRules {
  constructor() {
    this.name = "typescript-rules";
    this.version = "1.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      typeIssues: 0,
      anyUsage: 0,
      strictMode: 0,
      generics: 0
    };
  }

  initializeRules() {
    return {
      noImplicitAny: {
        id: "ts-no-implicit-any",
        description: "Avoid implicit any type",
        severity: "error",
        pattern: /:\s*any\b/g,
        message: "Avoid using 'any' type - use explicit types instead",
        recommendation: "Define proper types or use 'unknown' with type guards"
      },
      explicitReturnType: {
        id: "ts-explicit-return",
        description: "Require explicit return types on functions",
        severity: "warning",
        pattern: /function\s+\w+\s*\([^)]*\)\s*\{/g,
        message: "Consider adding explicit return type annotations",
        recommendation: "Add return type: function foo(): string { ... }"
      },
      strictNullChecks: {
        id: "ts-strict-null",
        description: "Check for potential null/undefined errors",
        severity: "warning",
        pattern: /\w+\.\w+(?!\?\.)\s*(?:===?|!==)/g,
        message: "Potential null/undefined access - use optional chaining",
        recommendation: "Use obj?.prop or add null checks"
      },
      interfaceOverType: {
        id: "ts-interface-type",
        description: "Prefer interfaces over type aliases for objects",
        severity: "info",
        pattern: /type\s+\w+\s*=\s*\{/g,
        message: "Consider using interface for object types",
        recommendation: "interface Foo { } is more extensible than type Foo = { }"
      },
      enumUsage: {
        id: "ts-enum",
        description: "Consider const objects instead of enums",
        severity: "info",
        pattern: /enum\s+\w+/g,
        message: "Consider using const object or as const instead of enum",
        recommendation: "const Enum = { A: 'a', B: 'b' } as const"
      },
      readonly: {
        id: "ts-readonly",
        description: "Use readonly for immutable arrays/objects",
        severity: "info",
        pattern: /const\s+\w+\s*=\s*\[/g,
        message: "Add readonly modifier for immutable collections",
        recommendation: "const arr: readonly number[] = [...]"
      },
      preferType: {
        id: "ts-prefer-type",
        description: "Use type inference when possible",
        severity: "info",
        pattern: /:\s*(string|number|boolean|object)\s*[=;]/g,
        message: "Type can be inferred, consider removing explicit type",
        recommendation: "let x = 'string' is sufficient"
      },
      genericConstraints: {
        id: "ts-generic-constraints",
        description: "Add constraints to generic types",
        severity: "warning",
        pattern: /<(\w+)>/g,
        message: "Consider adding constraints to generic types",
        recommendation: "Use <T extends SomeType> to constrain generics"
      },
      noUnusedLocals: {
        id: "ts-no-unused",
        description: "Check for unused variables and parameters",
        severity: "warning",
        pattern: /^(?:const|let|var)\s+_\w+/gm,
        message: "Unused variables should be prefixed with _ or removed",
        recommendation: "Use _unused for intentionally unused variables"
      },
      importType: {
        id: "ts-import-type",
        description: "Use 'import type' for type-only imports",
        severity: "info",
        pattern: /import\s+\{[^}]*\}\s+from/g,
        message: "Use 'import type' for type-only imports to improve performance",
        recommendation: "import type { SomeType } from 'module'"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      typeIssues: 0,
      anyUsage: 0,
      strictMode: 0,
      generics: 0
    };

    const result = {
      violations: [],
      statistics: {},
      typeScore: 0
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
      result.typeScore = this.calculateTypeScore();
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx"]
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
      TSAnyKeyword(path) {
        self.addViolation(self.rules.noImplicitAny, 'any type', path.node.loc);
      },
      VariableDeclarator(path) {
        if (path.node.id.typeAnnotation) {
          if (path.node.id.typeAnnotation.typeName.name === 'any') {
            self.addViolation(self.rules.noImplicitAny, 'any', path.node.loc);
          }
        }
      },
      FunctionDeclaration(path) {
        if (!path.node.returnType) {
          self.addViolation(self.rules.explicitReturnType, 'function', path.node.loc);
        }
      },
      TSEnumDeclaration(path) {
        self.addViolation(self.rules.enumUsage, 'enum', path.node.loc);
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
    if (rule.severity === 'error') this.stats.typeIssues++;
  }

  calculateTypeScore() {
    const total = this.stats.totalChecks;
    const issues = this.stats.typeIssues;
    return Math.max(0, 100 - (issues * 10));
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
      typeIssues: 0,
      anyUsage: 0,
      strictMode: 0,
      generics: 0
    };
  }
}

module.exports = TypeScriptRules;
