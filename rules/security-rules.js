/**
 * Security Rules
 * Production-grade security vulnerability detection rules for JavaScript
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class SecurityRules {
  constructor() {
    this.name = "security-rules";
    this.version = "3.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };
  }

  initializeRules() {
    return {
      evalUsage: {
        id: "security-eval-usage",
        description: "eval() allows arbitrary code execution",
        severity: "critical",
        cwe: "CWE-94",
        patterns: [/\beval\s*\(/],
        message:
          "eval() usage detected - potential code injection vulnerability",
        recommendation:
          "Replace eval() with safer alternatives like JSON.parse() or specific functions",
      },
      functionConstructor: {
        id: "security-function-constructor",
        description: "Function constructor allows dynamic code execution",
        severity: "critical",
        cwe: "CWE-94",
        patterns: [/\bFunction\s*\(/, /new\s+Function\s*\(/],
        message:
          "Function constructor detected - potential code injection vulnerability",
        recommendation:
          "Avoid dynamic code generation with Function constructor",
      },
      innerHTML: {
        id: "security-innerhtml",
        description: "innerHTML can lead to XSS vulnerabilities",
        severity: "critical",
        cwe: "CWE-79",
        patterns: [/\.innerHTML\s*=/],
        message: "innerHTML assignment detected - potential XSS vulnerability",
        recommendation: "Use textContent or sanitize input before assignment",
      },
      outerHTML: {
        id: "security-outerhtml",
        description: "outerHTML can lead to XSS vulnerabilities",
        severity: "critical",
        cwe: "CWE-79",
        patterns: [/\.outerHTML\s*=/],
        message: "outerHTML assignment detected - potential XSS vulnerability",
        recommendation: "Use DOM manipulation methods instead",
      },
      documentWrite: {
        id: "security-document-write",
        description: "document.write can lead to XSS vulnerabilities",
        severity: "high",
        cwe: "CWE-79",
        patterns: [/document\.write\s*\(/],
        message: "document.write detected - potential XSS vulnerability",
        recommendation: "Use DOM manipulation methods instead",
      },
      setTimeoutString: {
        id: "security-settimeout-string",
        description:
          "setTimeout with string argument can execute arbitrary code",
        severity: "high",
        cwe: "CWE-95",
        patterns: [/setTimeout\s*\(\s*["'`]/, /setTimeout\s*\(\s*[^,]*\+/],
        message: "setTimeout with string argument - potential code injection",
        recommendation: "Pass function reference instead of string",
      },
      setIntervalString: {
        id: "security-setinterval-string",
        description:
          "setInterval with string argument can execute arbitrary code",
        severity: "high",
        cwe: "CWE-95",
        patterns: [/setInterval\s*\(\s*["'`]/, /setInterval\s*\(\s*[^,]*\+/],
        message: "setInterval with string argument - potential code injection",
        recommendation: "Pass function reference instead of string",
      },
      protoPollution: {
        id: "security-proto-pollution",
        description: "__proto__ manipulation can lead to prototype pollution",
        severity: "critical",
        cwe: "CWE-1321",
        patterns: [
          /__proto__/,
          /\.prototype\s*\[/,
          /constructor\s*\.\s*prototype/,
        ],
        message: "Prototype pollution vulnerability detected",
        recommendation: "Use Object.create(null) or validate object keys",
      },
      credentialHardcoded: {
        id: "security-credential-hardcoded",
        description: "Hardcoded credentials detected",
        severity: "critical",
        cwe: "CWE-798",
        patterns: [
          /(password|passwd|pwd)\s*[=:]\s*["'][^"']+["']/i,
          /(api[_-]?key|apikey)\s*[=:]\s*["'][^"']+["']/i,
          /(secret|token)\s*[=:]\s*["'][^"']+["']/i,
        ],
        message: "Hardcoded credential detected - security risk",
        recommendation:
          "Use environment variables or secure credential storage",
      },
      localStorageSensitive: {
        id: "security-localstorage-sensitive",
        description: "Storing sensitive data in localStorage",
        severity: "high",
        cwe: "CWE-922",
        patterns: [
          /localStorage\.setItem\s*\(\s*["'].*(token|password|secret|key)/i,
        ],
        message: "Sensitive data stored in localStorage - security risk",
        recommendation: "Use secure storage mechanisms for sensitive data",
      },
      locationManipulation: {
        id: "security-location-manipulation",
        description: "Location manipulation can lead to open redirect",
        severity: "medium",
        cwe: "CWE-601",
        patterns: [
          /location\.(href|replace|assign)\s*=\s*[^;]+/,
          /window\.location\s*=/,
        ],
        message: "Location manipulation detected - potential open redirect",
        recommendation: "Validate and sanitize URLs before redirect",
      },
      sqlInjection: {
        id: "security-sql-injection",
        description: "Potential SQL injection vulnerability",
        severity: "critical",
        cwe: "CWE-89",
        patterns: [
          /query\s*\(\s*["'`]\s*SELECT.*\+/,
          /query\s*\(\s*[^)]*\+/i,
          /execute\s*\(\s*[^)]*\+/i,
        ],
        message: "Potential SQL injection vulnerability",
        recommendation: "Use parameterized queries or prepared statements",
      },
      commandInjection: {
        id: "security-command-injection",
        description: "Command injection vulnerability detected",
        severity: "critical",
        cwe: "CWE-78",
        patterns: [/exec\s*\(/, /execSync\s*\(/, /spawn\s*\(/, /child_process/],
        message: "Command injection vulnerability detected",
        recommendation: "Validate and sanitize all inputs, use allowlists",
      },
      insecureRandom: {
        id: "security-insecure-random",
        description: "Math.random() is not cryptographically secure",
        severity: "medium",
        cwe: "CWE-338",
        patterns: [/Math\.random\s*\(\s*\)/],
        message: "Math.random() is not cryptographically secure",
        recommendation:
          "Use crypto.getRandomValues() for security-sensitive operations",
      },
      postMessage: {
        id: "security-postmessage",
        description: "postMessage without origin check",
        severity: "medium",
        cwe: "CWE-346",
        patterns: [/\.postMessage\s*\(/, /postMessage\s*\(/],
        message: "postMessage detected - ensure origin validation",
        recommendation: "Always validate message origin in event handler",
      },
      domClobbering: {
        id: "security-dom-clobbering",
        description: "Potential DOM clobbering vulnerability",
        severity: "medium",
        cwe: "CWE-79",
        patterns: [
          /document\.getElementById\s*\(\s*["'][^"']+["']\s*\)/,
          /document\.all\[/,
        ],
        message: "DOM clobbering potential - validate DOM references",
        recommendation: "Use safer DOM access methods or validate existence",
      },
      regexDoS: {
        id: "security-regex-dos",
        description: "Potential ReDoS vulnerability",
        severity: "high",
        cwe: "CWE-1333",
        patterns: [/\([^)]*\+[^)]*\+/, /\([^)]*\*[^)]*\*/, /\(\.\+\)\+\(/],
        message: "Potential regex DoS vulnerability",
        recommendation: "Avoid nested quantifiers and backtracking in regex",
      },
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    const result = {
      violations: [],
      statistics: {},
      riskLevel: "low",
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
      result.riskLevel = this.calculateRiskLevel();
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

  checkPatterns(code) {
    for (const [ruleId, rule] of Object.entries(this.rules)) {
      if (!rule.patterns) continue;

      for (const pattern of rule.patterns) {
        const matches = code.match(pattern);
        if (matches) {
          this.addViolation(rule, matches[0], null);
        }
      }
    }
  }

  checkAST(ast) {
    const self = this;

    traverse(ast, {
      CallExpression(path) {
        self.checkCallExpression(path);
      },
      AssignmentExpression(path) {
        self.checkAssignmentExpression(path);
      },
      MemberExpression(path) {
        self.checkMemberExpression(path);
      },
    });
  }

  checkCallExpression(path) {
    const callee = path.node.callee;

    if (callee.type === "Identifier") {
      if (callee.name === "eval") {
        this.addASTViolation("evalUsage", path.node.loc);
      }
      if (callee.name === "Function") {
        this.addASTViolation("functionConstructor", path.node.loc);
      }
    }

    if (callee.type === "MemberExpression") {
      const obj = callee.object;
      const prop = callee.property;

      if (obj.name === "document" && prop.name === "write") {
        this.addASTViolation("documentWrite", path.node.loc);
      }
    }
  }

  checkAssignmentExpression(path) {
    const left = path.node.left;

    if (left.type === "MemberExpression") {
      const prop = left.property;

      if (prop.name === "innerHTML") {
        this.addASTViolation("innerHTML", path.node.loc);
      }
      if (prop.name === "outerHTML") {
        this.addASTViolation("outerHTML", path.node.loc);
      }
      if (
        left.object.name === "location" &&
        ["href", "replace", "assign"].includes(prop.name)
      ) {
        this.addASTViolation("locationManipulation", path.node.loc);
      }
    }
  }

  checkMemberExpression(path) {
    const node = path.node;

    if (node.property && node.property.name === "__proto__") {
      this.addASTViolation("protoPollution", path.node.loc);
    }
  }

  addViolation(rule, match, location) {
    this.violations.push({
      ruleId: rule.id,
      severity: rule.severity,
      cwe: rule.cwe,
      message: rule.message,
      match: match,
      recommendation: rule.recommendation,
      location: location
        ? { line: location.start.line, column: location.start.column }
        : null,
    });

    this.stats[rule.severity] = (this.stats[rule.severity] || 0) + 1;
    this.stats.total++;
  }

  addASTViolation(ruleId, location) {
    const rule = this.rules[ruleId];
    this.addViolation(rule, null, location);
  }

  calculateRiskLevel() {
    if (this.stats.critical > 0) return "critical";
    if (this.stats.high > 0) return "high";
    if (this.stats.medium > 0) return "medium";
    return "low";
  }

  getViolations() {
    return this.violations;
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.violations = [];
    this.stats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }
}

module.exports = SecurityRules;
