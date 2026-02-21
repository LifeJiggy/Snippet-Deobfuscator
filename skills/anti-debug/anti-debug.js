/**
 * Anti-Debug Skill
 * Production-grade anti-debugging technique detection and bypass
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class AntiDebugSkill {
  constructor() {
    this.name = "anti-debug";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      detected: 0,
      bypassed: 0,
      failed: 0,
    };
    this.patterns = this.initializePatterns();
    this.bypasses = this.initializeBypasses();
  }

  execute(code, options = {}) {
    const detectResult = this.detect(code, options);
    if (options.bypass && detectResult.detected.length > 0) {
      const bypassResult = this.bypass(code, detectResult.detected);
      return {
        ...detectResult,
        bypassed: true,
        bypassedCode: bypassResult.code,
      };
    }
    return detectResult;
  }

  initializePatterns() {
    this.bypasses = this.initializeBypasses();
  }

  initializePatterns() {
    return {
      debuggerStatement: {
        pattern: /\bdebugger\b/g,
        severity: "high",
        category: "debugger",
        description: "Debugger statement detected",
        bypassable: true,
      },
      infiniteLoop: {
        pattern: /while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/g,
        severity: "critical",
        category: "loop",
        description: "Infinite loop detected",
        bypassable: true,
      },
      timingCheck: {
        pattern: /Date\.now\(\)|performance\.now\(\)|new\s+Date\(\)/g,
        severity: "medium",
        category: "timing",
        description: "Timing-based detection detected",
        bypassable: true,
      },
      devToolsDetection: {
        pattern: /window\.(outerWidth|outerHeight|innerWidth|innerHeight)/g,
        severity: "high",
        category: "devtools",
        description: "DevTools detection pattern detected",
        bypassable: true,
      },
      consoleDetection: {
        pattern: /console\.(log|clear|table|debug|info|warn|error)/g,
        severity: "medium",
        category: "console",
        description: "Console detection pattern detected",
        bypassable: true,
      },
      stackTrace: {
        pattern: /arguments\.callee\.caller|new\s+Error\(\)\.stack/g,
        severity: "high",
        category: "stacktrace",
        description: "Stack trace inspection detected",
        bypassable: true,
      },
      headlessCheck: {
        pattern: /navigator\.(webdriver|languages|plugins)/g,
        severity: "medium",
        category: "environment",
        description: "Headless browser check detected",
        bypassable: true,
      },
      toStringCheck: {
        pattern: /\.toString\(\)|Function\.prototype\.toString/g,
        severity: "medium",
        category: "function",
        description: "Function toString check detected",
        bypassable: true,
      },
      debuggerBreakpoint: {
        pattern: /setInterval\s*\([^)]*\)\s*;?\s*debugger/g,
        severity: "critical",
        category: "debugger",
        description: "Debugging breakpoint with interval detected",
        bypassable: true,
      },
      evalDetection: {
        pattern: /eval\s*\(|Function\s*\(/g,
        severity: "high",
        category: "execution",
        description: "Dynamic code execution detected",
        bypassable: true,
      },
    };
  }

  initializeBypasses() {
    return {
      debuggerStatement: (code) => {
        return code.replace(/\bdebugger\b;?/g, "");
      },
      infiniteLoop: (code) => {
        let result = code;
        result = result.replace(/while\s*\(\s*(true|1)\s*\)/g, "while(false)");
        result = result.replace(
          /for\s*\(\s*;\s*;\s*\)/g,
          "for(let __i=0;__i<1000;__i++)"
        );
        return result;
      },
      timingCheck: (code) => {
        let result = code;
        result = result.replace(/Date\.now\(\)/g, "0");
        result = result.replace(/performance\.now\(\)/g, "0");
        result = result.replace(/new\s+Date\(\)/g, 'new Date("2024-01-01")');
        return result;
      },
      devToolsDetection: (code) => {
        return code.replace(
          /window\.(outerWidth|outerHeight|innerWidth|innerHeight)/g,
          "0"
        );
      },
      consoleDetection: (code) => {
        return code.replace(/console\.(log|clear|table|debug|info)/g, "void");
      },
      stackTrace: (code) => {
        let result = code;
        result = result.replace(/arguments\.callee\.caller/g, "null");
        result = result.replace(/new\s+Error\(\)\.stack/g, '""');
        return result;
      },
      headlessCheck: (code) => {
        let result = code;
        result = result.replace(/navigator\.webdriver/g, "false");
        result = result.replace(/navigator\.languages/g, '["en-US"]');
        result = result.replace(/navigator\.plugins/g, "[]");
        return result;
      },
      toStringCheck: (code) => {
        return code.replace(
          /\.toString\(\)/g,
          '.toString = function() { return "[native code]"; }'
        );
      },
      debuggerBreakpoint: (code) => {
        return code.replace(/setInterval\s*\([^)]*\)\s*;?\s*debugger/g, "");
      },
      evalDetection: (code) => {
        return code;
      },
    };
  }

  detect(code, options = {}) {
    const result = {
      detected: [],
      bypassed: false,
      bypassedCode: code,
      statistics: {},
      warnings: [],
      errors: [],
    };

    try {
      for (const [name, config] of Object.entries(this.patterns)) {
        const matches = code.match(config.pattern);
        if (matches && matches.length > 0) {
          result.detected.push({
            name,
            severity: config.severity,
            category: config.category,
            description: config.description,
            count: matches.length,
            samples: matches.slice(0, 3),
            bypassable: config.bypassable,
          });
          this.stats.detected++;
        }
      }

      result.statistics = {
        totalDetected: result.detected.length,
        criticalCount: result.detected.filter((d) => d.severity === "critical")
          .length,
        highCount: result.detected.filter((d) => d.severity === "high").length,
        mediumCount: result.detected.filter((d) => d.severity === "medium")
          .length,
      };

      if (options.autoBypass !== false) {
        const bypassResult = this.bypass(code, result.detected);
        result.bypassedCode = bypassResult.code;
        result.bypassed = bypassResult.success;
        result.bypasses = bypassResult.applied;
      }
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  bypass(code, detections) {
    let bypassedCode = code;
    const applied = [];
    let success = true;

    for (const detection of detections) {
      const bypassFn = this.bypasses[detection.name];
      if (bypassFn && detection.bypassable) {
        try {
          bypassedCode = bypassFn(bypassedCode);
          applied.push({
            name: detection.name,
            success: true,
          });
          this.stats.bypassed++;
        } catch (error) {
          applied.push({
            name: detection.name,
            success: false,
            error: error.message,
          });
          success = false;
          this.stats.failed++;
        }
      }
    }

    return { code: bypassedCode, applied, success };
  }

  detectWithAST(code, options = {}) {
    const result = {
      detected: [],
      nodes: [],
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

      traverse(ast, {
        DebuggerStatement: (path) => {
          result.detected.push({
            type: "debugger-statement",
            location: path.node.loc,
            severity: "high",
            bypassable: true,
          });
          result.nodes.push(path.node);
        },

        WhileStatement: (path) => {
          if (this.isInfiniteWhile(path.node)) {
            result.detected.push({
              type: "infinite-loop-while",
              location: path.node.loc,
              severity: "critical",
              bypassable: true,
            });
            result.nodes.push(path.node);
          }
        },

        ForStatement: (path) => {
          if (this.isInfiniteFor(path.node)) {
            result.detected.push({
              type: "infinite-loop-for",
              location: path.node.loc,
              severity: "critical",
              bypassable: true,
            });
            result.nodes.push(path.node);
          }
        },

        CallExpression: (path) => {
          this.checkTimingCall(path, result);
          this.checkConsoleCall(path, result);
          this.checkStackTraceCall(path, result);
        },

        MemberExpression: (path) => {
          this.checkDevToolsAccess(path, result);
          this.checkNavigatorAccess(path, result);
        },
      });

      result.statistics = {
        totalDetected: result.detected.length,
        bySeverity: this.countBySeverity(result.detected),
        byType: this.countByType(result.detected),
      };
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

  isInfiniteWhile(node) {
    if (!node.test) return true;
    if (node.test.type === "BooleanLiteral" && node.test.value === true)
      return true;
    if (node.test.type === "NumericLiteral" && node.test.value === 1)
      return true;
    return false;
  }

  isInfiniteFor(node) {
    return !node.test && !node.update;
  }

  checkTimingCall(path, result) {
    const callee = path.node.callee;
    if (
      callee.type === "MemberExpression" &&
      callee.object.name === "Date" &&
      callee.property.name === "now"
    ) {
      result.detected.push({
        type: "timing-check",
        location: path.node.loc,
        severity: "medium",
        bypassable: true,
      });
    }
    if (
      callee.type === "MemberExpression" &&
      callee.object.name === "performance" &&
      callee.property.name === "now"
    ) {
      result.detected.push({
        type: "timing-check",
        location: path.node.loc,
        severity: "medium",
        bypassable: true,
      });
    }
  }

  checkConsoleCall(path, result) {
    const callee = path.node.callee;
    if (
      callee.type === "MemberExpression" &&
      callee.object.name === "console"
    ) {
      result.detected.push({
        type: "console-detection",
        location: path.node.loc,
        severity: "medium",
        bypassable: true,
      });
    }
  }

  checkStackTraceCall(path, result) {
    const callee = path.node.callee;
    if (
      callee.type === "MemberExpression" &&
      callee.object.name === "arguments" &&
      callee.property.name === "callee"
    ) {
      result.detected.push({
        type: "stack-trace",
        location: path.node.loc,
        severity: "high",
        bypassable: true,
      });
    }
  }

  checkDevToolsAccess(path, result) {
    if (
      path.node.object.name === "window" &&
      ["outerWidth", "outerHeight", "innerWidth", "innerHeight"].includes(
        path.node.property.name
      )
    ) {
      result.detected.push({
        type: "devtools-detection",
        location: path.node.loc,
        severity: "high",
        bypassable: true,
      });
    }
  }

  checkNavigatorAccess(path, result) {
    if (
      path.node.object.name === "navigator" &&
      ["webdriver", "languages", "plugins"].includes(path.node.property.name)
    ) {
      result.detected.push({
        type: "headless-check",
        location: path.node.loc,
        severity: "medium",
        bypassable: true,
      });
    }
  }

  countBySeverity(detected) {
    return detected.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {});
  }

  countByType(detected) {
    return detected.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {});
  }

  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.detected > 0
          ? (this.stats.bypassed / this.stats.detected).toFixed(2)
          : 0,
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.patterns = {};
    this.bypasses = {};
  }
}

module.exports = AntiDebugSkill;
