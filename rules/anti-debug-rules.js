/**
 * Anti-Debug Rules
 * Production-grade anti-debugging detection rules for JavaScript
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class AntiDebugRules {
  constructor() {
    this.name = "anti-debug-rules";
    this.version = "3.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      detectionCount: 0,
      debuggerDetection: 0,
      timingBypass: 0,
      stackTraceManipulation: 0,
      consoleManipulation: 0,
      eventDetection: 0
    };
  }

  initializeRules() {
    return {
      debuggerDetection: {
        id: "antidebug-debugger-detection",
        description: "Detects code that checks for debugger presence",
        severity: "medium",
        patterns: [
          /debugger/i,
          /Function\("debugger"\)/,
          /while\s*\(\s*true\s*\).*debugger/s
        ],
        message: "Debugger detection technique detected",
        recommendation: "This may be used to prevent debugging"
      },
      timingBypass: {
        id: "antidebug-timing-bypass",
        description: "Detects timing-based anti-debugging",
        severity: "medium",
        patterns: [
          /Date\.now\(\)\s*-\s*\w+/,
          /performance\.now\(\)/,
          /setTimeout.*0/,
          /\+\+.*\$\{?\w+\}?\s*<\s*\d+/
        ],
        message: "Timing-based anti-debugging detected",
        recommendation: "Used to detect step-through debugging"
      },
      stackTraceManipulation: {
        id: "antidebug-stack-trace",
        description: "Detects stack trace manipulation",
        severity: "medium",
        patterns: [
          /\.stack\s*=/,
          /Error\.captureStackTrace/,
          /console\.trace\s*=\s*/,
          /stack\s*:\s*["']/
        ],
        message: "Stack trace manipulation detected",
        recommendation: "May be used to hide malicious code"
      },
      consoleManipulation: {
        id: "antidebug-console-manipulation",
        description: "Detects console output manipulation",
        severity: "low",
        patterns: [
          /console\s*=\s*\{/,
          /console\.\w+\s*=\s*function/,
          /Object\.defineProperty.*console/,
          /Object\.assign.*console/
        ],
        message: "Console manipulation detected",
        recommendation: "May be used to hide console output"
      },
      eventDetection: {
        id: "antidebug-event-detection",
        description: "Detects event-based debugger detection",
        severity: "medium",
        patterns: [
          /addEventListener.*devtools/,
          /postMessage.*devtools/,
          /\$__REACT_DEVTOOLS_/
        ],
        message: "DevTools event detection detected",
        recommendation: "Used to detect browser DevTools"
      },
      breakpointDetection: {
        id: "antidebug-breakpoint",
        description: "Detects breakpoint-based detection",
        severity: "medium",
        patterns: [
          /\bsource\b.*\bsource\b/,
          /Object\.getOwnPropertyNames.*function/,
          /Function\.prototype\.toString/
        ],
        message: "Breakpoint detection technique detected",
        recommendation: "May be used to detect code breakpoints"
      },
      codeIntegrity: {
        id: "antidebug-code-integrity",
        description: "Detects code integrity checks",
        severity: "high",
        patterns: [
          /document\.body\.innerHTML\s*=/,
          /document\.write\s*\(/,
          /eval\s*\(\s*Function/
        ],
        message: "Code integrity check detected",
        recommendation: "May indicate runtime code injection detection"
      },
      vmDetection: {
        id: "antidebug-vm-detection",
        description: "Detects virtual machine/bot detection",
        severity: "medium",
        patterns: [
          /navigator\.webdriver/,
          /window\.automation/,
          /isNaN\s*\(\s*NaN\s*\)/,
          /\$cdc_/,
          /__webdriver_script/
        ],
        message: "VM/Bot detection technique detected",
        recommendation: "Used to detect automated browsers"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      detectionCount: 0,
      debuggerDetection: 0,
      timingBypass: 0,
      stackTraceManipulation: 0,
      consoleManipulation: 0,
      eventDetection: 0
    };

    const result = {
      violations: [],
      statistics: {},
      riskLevel: "low"
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
        plugins: ["jsx", "typescript"]
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
      IfStatement(path) {
        self.checkDebuggerCheck(path);
      },
      CallExpression(path) {
        self.checkTimingCheck(path);
      },
      AssignmentExpression(path) {
        self.checkConsoleOverride(path);
      }
    });
  }

  checkDebuggerCheck(path) {
    const test = path.node.test;
    if (!test) return;

    const testCode = this.generateCode(test);
    if (testCode && /debugger/i.test(testCode)) {
      this.addViolation(this.rules.debuggerDetection, null, path.node.loc);
    }
  }

  checkTimingCheck(path) {
    const callee = path.node.callee;
    if (!callee) return;

    const calleeName = callee.name || (callee.property && callee.property.name);
    
    if (calleeName === 'setTimeout' || calleeName === 'setInterval') {
      const args = path.node.arguments;
      if (args.length > 0 && args[0].type === 'Literal' && args[0].value === 0) {
        this.addViolation(this.rules.timingBypass, 'setTimeout(0)', path.node.loc);
      }
    }
  }

  checkConsoleOverride(path) {
    const left = path.node.left;
    if (!left) return;

    if (left.type === 'MemberExpression' && 
        left.object && 
        left.object.name === 'console') {
      this.addViolation(this.rules.consoleManipulation, null, path.node.loc);
    }
  }

  generateCode(node) {
    if (!node) return '';
    try {
      const generate = require("@babel/generator").default;
      return generate(node).code;
    } catch {
      return node.type || '';
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

    this.stats.detectionCount++;
    
    if (rule.id.includes('debugger')) this.stats.debuggerDetection++;
    if (rule.id.includes('timing')) this.stats.timingBypass++;
    if (rule.id.includes('stack')) this.stats.stackTraceManipulation++;
    if (rule.id.includes('console')) this.stats.consoleManipulation++;
    if (rule.id.includes('event')) this.stats.eventDetection++;
  }

  calculateRiskLevel() {
    if (this.stats.detectionCount > 5) return "high";
    if (this.stats.detectionCount > 2) return "medium";
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
    this.stats = {
      detectionCount: 0,
      debuggerDetection: 0,
      timingBypass: 0,
      stackTraceManipulation: 0,
      consoleManipulation: 0,
      eventDetection: 0
    };
  }
}

module.exports = AntiDebugRules;
