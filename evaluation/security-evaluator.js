class SecurityEvaluator {
  constructor(options = {}) {
    this.name = "SecurityEvaluator";
    this.version = "3.0.0";
    this.options = {
      strictMode: options.strictMode !== false,
      checkDependencies: options.checkDependencies || false,
      maxFindings: options.maxFindings || 100,
    };
    this._vulnerabilities = [];
    this._rules = [];
    this._severityScores = {
      critical: 50,
      high: 30,
      medium: 15,
      low: 5,
      info: 1,
    };
    this.statistics = {
      totalEvaluations: 0,
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
    this._initializeRules();
  }

  _initializeRules() {
    this._rules = [
      {
        id: "no-eval",
        severity: "critical",
        patterns: [/\beval\s*\(/, /new\s+Function\s*\(/],
      },
      { id: "no-innerHTML", severity: "high", patterns: [/\.innerHTML\s*=/] },
      {
        id: "no-document-write",
        severity: "medium",
        patterns: [/document\.write\s*\(/],
      },
      {
        id: "no-dynamic-script",
        severity: "high",
        patterns: [/document\.createElement\s*\(\s*['"]script['"]\s*\)/],
      },
      {
        id: "no-postMessage-wildcard",
        severity: "high",
        patterns: [/postMessage\s*\([^,]+,\s*['"]\*['"]\s*\)/],
      },
      {
        id: "no-window-name",
        severity: "medium",
        patterns: [/window\.name\s*=/],
      },
      {
        id: "no-localStorage-sensitive",
        severity: "medium",
        patterns: [
          /localStorage\.setItem\s*\(\s*['"](password|token|secret|key|auth)/i,
        ],
      },
      {
        id: "no-innerHTML-concat",
        severity: "high",
        patterns: [/\.innerHTML\s*[+]=/, /\.innerHTML\s*=\s*[^'"]*[\+]/],
      },
      {
        id: "no-xss-vector",
        severity: "critical",
        patterns: [/<script/i, /javascript:/i, /on\w+\s*=/i],
      },
      {
        id: "no-prototype-pollution",
        severity: "high",
        patterns: [/__proto__/, /constructor\.prototype/, /Object\.prototype/],
      },
      {
        id: "no-sql-injection",
        severity: "critical",
        patterns: [
          /executeSql\s*\([^)]*\+/,
          /query\s*\([^)]*\+/,
          /\.query\s*\([^)]*\+/,
        ],
      },
      {
        id: "no-command-injection",
        severity: "critical",
        patterns: [
          /exec\s*\([^)]*\+/,
          /spawn\s*\([^)]*\+/,
          /execSync\s*\([^)]*\+/,
        ],
      },
      {
        id: "no-hardcoded-secrets",
        severity: "high",
        patterns: [
          /password\s*[:=]\s*['"][^'"]+['"]/,
          /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/,
          /secret\s*[:=]\s*['"][^'"]+['"]/i,
        ],
      },
      {
        id: "no-unsafe-regex",
        severity: "medium",
        patterns: [/new\s+RegExp\s*\([^)]*\+/],
      },
      {
        id: "no-math-random-security",
        severity: "medium",
        patterns: [
          /Math\.random\(\)[^;]*token/,
          /Math\.random\(\)[^;]*key/,
          /Math\.random\(\)[^;]*password/,
        ],
      },
    ];
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const result = {
      score: 100,
      grade: "A",
      findings: [],
      vulnerabilities: [],
      recommendations: [],
      timestamp: Date.now(),
    };
    if (!code || typeof code !== "string") {
      return { error: "Invalid code input", score: 0, grade: "F" };
    }
    const astAnalysis = this._analyzeAST(code);
    const patternAnalysis = this._analyzePatterns(code);
    result.findings = [...astAnalysis, ...patternAnalysis];
    result.findings = result.findings.slice(0, this.options.maxFindings);
    this.statistics.totalFindings += result.findings.length;
    this._updateSeverityCounts(result.findings);
    result.vulnerabilities = this._categorizeVulnerabilities(result.findings);
    result.score = this._calculateScore(result.findings);
    result.grade = this._scoreToGrade(result.score);
    result.recommendations = this._generateRecommendations(result);
    return result;
  }

  _analyzeAST(code) {
    const parser = require("@babel/parser");
    const traverse = require("@babel/traverse").default;
    const findings = [];
    let ast;
    try {
      ast = parser.parse(code, { sourceType: "module" });
    } catch {
      return findings;
    }
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.name === "eval") {
          findings.push({
            ruleId: "no-eval",
            severity: "critical",
            message: "Use of eval() is a security risk",
            line: path.node.loc?.start?.line,
            column: path.node.loc?.start?.column,
          });
        }
        if (callee.name === "Function") {
          findings.push({
            ruleId: "no-eval",
            severity: "critical",
            message: "Dynamic code execution via Function constructor",
            line: path.node.loc?.start?.line,
          });
        }
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "document" &&
          callee.property.name === "write"
        ) {
          findings.push({
            ruleId: "no-document-write",
            severity: "medium",
            message: "document.write can lead to XSS vulnerabilities",
            line: path.node.loc?.start?.line,
          });
        }
      },
      AssignmentExpression(path) {
        if (
          path.node.left.type === "MemberExpression" &&
          path.node.left.property.name === "innerHTML"
        ) {
          const right = path.node.right;
          if (right.type !== "StringLiteral") {
            findings.push({
              ruleId: "no-innerHTML",
              severity: "high",
              message:
                "innerHTML assignment with dynamic content is vulnerable to XSS",
              line: path.node.loc?.start?.line,
            });
          }
        }
      },
      MemberExpression(path) {
        if (
          path.node.object.name === "__proto__" ||
          (path.node.property && path.node.property.name === "__proto__")
        ) {
          findings.push({
            ruleId: "no-prototype-pollution",
            severity: "high",
            message: "Access to __proto__ can lead to prototype pollution",
            line: path.node.loc?.start?.line,
          });
        }
      },
    });
    return findings;
  }

  _analyzePatterns(code) {
    const findings = [];
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      for (const rule of this._rules) {
        for (const pattern of rule.patterns) {
          if (pattern.test(line)) {
            findings.push({
              ruleId: rule.id,
              severity: rule.severity,
              message: this._getRuleMessage(rule.id),
              line: lineNum,
              snippet: line.trim().substring(0, 100),
            });
            break;
          }
        }
      }
    }
    return findings;
  }

  _getRuleMessage(ruleId) {
    const messages = {
      "no-eval": "Dynamic code execution detected",
      "no-innerHTML": "Potential XSS vulnerability via innerHTML",
      "no-document-write": "document.write can lead to XSS",
      "no-dynamic-script": "Dynamic script creation can lead to XSS",
      "no-postMessage-wildcard": "postMessage with wildcard origin is insecure",
      "no-window-name": "window.name can be used for attacks",
      "no-localStorage-sensitive":
        "Sensitive data in localStorage is not secure",
      "no-innerHTML-concat": "innerHTML concatenation is vulnerable to XSS",
      "no-xss-vector": "Potential XSS vector detected",
      "no-prototype-pollution": "Prototype pollution vulnerability",
      "no-sql-injection": "Potential SQL injection vulnerability",
      "no-command-injection": "Potential command injection vulnerability",
      "no-hardcoded-secrets": "Hardcoded secrets detected",
      "no-unsafe-regex": "Dynamic regex can lead to ReDoS",
      "no-math-random-security":
        "Math.random() is not cryptographically secure",
    };
    return messages[ruleId] || "Security issue detected";
  }

  _categorizeVulnerabilities(findings) {
    const categories = {
      injection: [],
      xss: [],
      dataExposure: [],
      crypto: [],
      other: [],
    };
    for (const finding of findings) {
      switch (finding.ruleId) {
        case "no-sql-injection":
        case "no-command-injection":
          categories.injection.push(finding);
          break;
        case "no-eval":
        case "no-innerHTML":
        case "no-innerHTML-concat":
        case "no-xss-vector":
        case "no-document-write":
        case "no-dynamic-script":
          categories.xss.push(finding);
          break;
        case "no-hardcoded-secrets":
        case "no-localStorage-sensitive":
          categories.dataExposure.push(finding);
          break;
        case "no-math-random-security":
        case "no-unsafe-regex":
          categories.crypto.push(finding);
          break;
        default:
          categories.other.push(finding);
      }
    }
    return categories;
  }

  _calculateScore(findings) {
    let score = 100;
    for (const finding of findings) {
      const severityScore = this._severityScores[finding.severity] || 5;
      score -= severityScore;
    }
    return Math.max(0, Math.min(100, score));
  }

  _scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  _updateSeverityCounts(findings) {
    for (const finding of findings) {
      switch (finding.severity) {
        case "critical":
          this.statistics.criticalCount++;
          break;
        case "high":
          this.statistics.highCount++;
          break;
        case "medium":
          this.statistics.mediumCount++;
          break;
        case "low":
          this.statistics.lowCount++;
          break;
      }
    }
  }

  _generateRecommendations(result) {
    const recommendations = [];
    const hasXSS = result.vulnerabilities.xss.length > 0;
    const hasInjection = result.vulnerabilities.injection.length > 0;
    const hasDataExposure = result.vulnerabilities.dataExposure.length > 0;
    if (hasXSS) {
      recommendations.push({
        type: "xss-prevention",
        priority: "high",
        message:
          "Sanitize all user inputs and use textContent instead of innerHTML",
      });
    }
    if (hasInjection) {
      recommendations.push({
        type: "injection-prevention",
        priority: "critical",
        message:
          "Use parameterized queries and avoid string concatenation for commands",
      });
    }
    if (hasDataExposure) {
      recommendations.push({
        type: "data-protection",
        priority: "high",
        message:
          "Remove hardcoded secrets and use environment variables or secure vaults",
      });
    }
    if (result.findings.some((f) => f.ruleId === "no-eval")) {
      recommendations.push({
        type: "code-execution",
        priority: "critical",
        message:
          "Remove eval() and Function constructor usage. Use JSON.parse for JSON data.",
      });
    }
    return recommendations;
  }

  addRule(rule) {
    this._rules.push(rule);
    return this;
  }

  removeRule(ruleId) {
    this._rules = this._rules.filter((r) => r.id !== ruleId);
    return this;
  }

  getRules() {
    return [...this._rules];
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._vulnerabilities = [];
    this.statistics = {
      totalEvaluations: 0,
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._rules = [];
    this.options = {};
    return this;
  }
}

module.exports = SecurityEvaluator;
