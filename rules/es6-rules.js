/**
 * ES6+ Rules
 * Production-grade modern JavaScript (ES6+) coding standards
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class ES6Rules {
  constructor() {
    this.name = "es6-rules";
    this.version = "3.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      modernFeatures: 0,
      legacyPatterns: 0,
      asyncPatterns: 0,
      destructuring: 0,
      spreadUsage: 0
    };
  }

  initializeRules() {
    return {
      constLet: {
        id: "es6-const-let",
        description: "Prefer const/let over var",
        severity: "warning",
        pattern: /\bvar\s+\w+/g,
        message: "Use const or let instead of var",
        recommendation: "var has function scope; use const/let for block scope"
      },
      arrowFunctions: {
        id: "es6-arrow-functions",
        description: "Prefer arrow functions for callbacks",
        severity: "info",
        pattern: /function\s+\([^)]*\)\s*\{[^}]*return/g,
        message: "Consider using arrow function syntax",
        recommendation: "Arrow functions have shorter syntax and lexical this"
      },
      templateLiterals: {
        id: "es6-template-literals",
        description: "Use template literals instead of concatenation",
        severity: "info",
        pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/g,
        message: "Use template literals for string interpolation",
        recommendation: "`string ${variable}` is cleaner than 'string ' + variable"
      },
      destructuring: {
        id: "es6-destructuring",
        description: "Use destructuring for object/array access",
        severity: "info",
        pattern: /\w+\.\w+/g,
        message: "Consider using destructuring assignment",
        recommendation: "const { a, b } = obj is more readable than obj.a and obj.b"
      },
      spreadOperator: {
        id: "es6-spread-operator",
        description: "Use spread operator for array/object copying",
        severity: "info",
        pattern: /\.slice\(\)|\.concat\(/g,
        message: "Consider using spread operator instead of slice/concat",
        recommendation: "[...arr] or {...obj} is more concise"
      },
      defaultParameters: {
        id: "es6-default-parameters",
        description: "Use default parameters instead of || checks",
        severity: "info",
        pattern: /\|\|\s*['"\d]/g,
        message: "Consider using default parameters instead of ||",
        recommendation: "function(x = default) is safer than x || default"
      },
      modules: {
        id: "es6-modules",
        description: "Use ES6 module syntax",
        severity: "info",
        pattern: /require\s*\(/g,
        message: "Consider using ES6 import/export syntax",
        recommendation: "import x from 'x' is preferred over require('x')"
      },
      promises: {
        id: "es6-promises",
        description: "Prefer async/await over Promise chains",
        severity: "info",
        pattern: /\.then\s*\(\s*\w+\s*=>/g,
        message: "Consider using async/await for better readability",
        recommendation: "async/await is more readable than .then chains"
      },
      forOf: {
        id: "es6-for-of",
        description: "Use for...of instead of for...in for arrays",
        severity: "info",
        pattern: /for\s*\(\s*const\s+\w+\s+in\s+/g,
        message: "Use for...of instead of for...in for arrays",
        recommendation: "for...of iterates over values, for...in over keys"
      },
      mapSet: {
        id: "es6-map-set",
        description: "Use Map/Set for collections",
        severity: "info",
        pattern: /Object\.create\(null\)/g,
        message: "Consider using Map or Set for keyed/found collections",
        recommendation: "Map has better performance for frequent additions"
      },
      classes: {
        id: "es6-classes",
        description: "Use class syntax for constructors",
        severity: "info",
        pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*this\./g,
        message: "Consider using class syntax for constructors",
        recommendation: "class syntax is more consistent and has better features"
      },
      computedProperties: {
        id: "es6-computed-properties",
        description: "Use computed property names",
        severity: "info",
        pattern: /\w+\s*\[\s*['"]\w+['"]\s*\]/g,
        message: "Consider using computed property names in objects",
        recommendation: "{ [key]: value } allows dynamic property keys"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      modernFeatures: 0,
      legacyPatterns: 0,
      asyncPatterns: 0,
      destructuring: 0,
      spreadUsage: 0
    };

    const result = {
      violations: [],
      statistics: {},
      modernLevel: "legacy"
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
      result.modernLevel = this.calculateModernLevel();
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript", "dynamicImport"]
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
      VariableDeclaration(path) {
        if (path.node.kind === 'var') {
          self.addViolation(self.rules.constLet, 'var', path.node.loc);
        }
      },
      FunctionDeclaration(path) {
        self.checkArrowCandidate(path);
      },
      ForInStatement(path) {
        self.addViolation(self.rules.forOf, 'for...in', path.node.loc);
      },
      CallExpression(path) {
        self.checkModernAlternatives(path);
      }
    });
  }

  checkArrowCandidate(path) {
    const body = path.node.body;
    if (body && body.type === 'BlockStatement' && body.body.length === 1) {
      const stmt = body.body[0];
      if (stmt.type === 'ReturnStatement') {
        this.addViolation(this.rules.arrowFunctions, 'function with return', path.node.loc);
      }
    }
  }

  checkModernAlternatives(path) {
    const callee = path.node.callee;
    if (!callee) return;

    if (callee.type === 'MemberExpression' && callee.property) {
      if (callee.property.name === 'slice') {
        this.addViolation(this.rules.spreadOperator, '.slice()', path.node.loc);
      }
      if (callee.property.name === 'concat') {
        this.addViolation(this.rules.spreadOperator, '.concat()', path.node.loc);
      }
    }
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
  }

  calculateModernLevel() {
    const legacyCount = this.stats.legacyPatterns || 0;
    const modernCount = this.stats.modernFeatures || 0;
    const ratio = modernCount / (legacyCount + 1);

    if (ratio > 2) return "modern";
    if (ratio > 0.5) return "transitional";
    return "legacy";
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
      modernFeatures: 0,
      legacyPatterns: 0,
      asyncPatterns: 0,
      destructuring: 0,
      spreadUsage: 0
    };
  }
}

module.exports = ES6Rules;
