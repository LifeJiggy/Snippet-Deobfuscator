/**
 * Validator Agent
 * Production-grade code validation and integrity checking system
 * Version: 3.0.0
 */
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const { parse } = require("@babel/parser");

class ValidatorAgent {
  constructor() {
    this.name = "validator";
    this.version = "3.0.0";
    this.errors = [];
    this.warnings = [];
    this.stats = {
      syntaxErrors: 0,
      semanticErrors: 0,
      securityIssues: 0,
      warnings: 0,
      validationsRun: 0,
    };

    // Security patterns to check
    this.securityPatterns = this.initializeSecurityPatterns();

    // Quality rules
    this.qualityRules = this.initializeQualityRules();
  }

  /**
   * Initialize security patterns
   */
  initializeSecurityPatterns() {
    return {
      // Critical security issues
      evalUsage: {
        pattern: /eval\s*\(/g,
        severity: "critical",
        message: "Dangerous eval() usage - potential code injection",
        category: "code-injection",
      },
      functionConstructor: {
        pattern: /(new\s+Function|Function)\s*\(/g,
        severity: "critical",
        message: "Function constructor allows dynamic code execution",
        category: "code-injection",
      },
      documentWrite: {
        pattern: /document\.write\s*\(/g,
        severity: "high",
        message: "document.write can lead to XSS vulnerabilities",
        category: "xss",
      },
      innerHTML: {
        pattern: /\.innerHTML\s*=/g,
        severity: "high",
        message: "innerHTML assignment can lead to XSS",
        category: "xss",
      },
      // Prototype pollution
      prototypePollution: {
        pattern: /(__proto__|prototype)\s*\[/g,
        severity: "critical",
        message: "Potential prototype pollution vulnerability",
        category: "prototype-pollution",
      },
      // Command injection
      childProcess: {
        pattern: /(exec|execSync|spawn|spawnSync)\s*\(/g,
        severity: "high",
        message: "Shell command execution - validate input",
        category: "command-injection",
      },
      // Data exfiltration
      networkExfil: {
        pattern: /(fetch|XMLHttpRequest|WebSocket)\s*\([^)]*\.(send|write)\)/g,
        severity: "medium",
        message: "Network request detected - ensure data is not exfiltrated",
        category: "data-exfiltration",
      },
      // Cookie access
      cookieAccess: {
        pattern: /document\.cookie/g,
        severity: "medium",
        message: "Cookie access - ensure HttpOnly cookies",
        category: "security",
      },
      // Local storage
      localStorage: {
        pattern: /localStorage\.(setItem|getItem)/g,
        severity: "low",
        message: "localStorage usage - do not store sensitive data",
        category: "security",
      },
      // Debugger statements
      debuggerStatement: {
        pattern: /\bdebugger\b/g,
        severity: "low",
        message: "debugger statement found - remove in production",
        category: "debug",
      },
      // Console statements
      consoleLog: {
        pattern: /console\.(log|debug|info|warn|error)/g,
        severity: "low",
        message: "Console statement - remove in production",
        category: "debug",
      },
      // Hardcoded credentials
      hardcodedCredentials: {
        pattern:
          /(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/gi,
        severity: "critical",
        message: "Potential hardcoded credentials detected",
        category: "credentials",
      },
      // Insecure random
      insecureRandom: {
        pattern: /Math\.random\s*\(\s*\)/g,
        severity: "medium",
        message: "Math.random() is not cryptographically secure",
        category: "crypto",
      },
      // SSL verification disabled
      sslDisabled: {
        pattern: /(rejectUnauthorized|secureProtocol)\s*:\s*false/g,
        severity: "critical",
        message: "SSL/TLS certificate verification disabled",
        category: "crypto",
      },
      // CORS wildcard
      corsWildcard: {
        pattern: /Access-Control-Allow-Origin\s*:\s*[*]/g,
        severity: "high",
        message: "CORS wildcard origin is insecure",
        category: "cors",
      },
    };
  }

  /**
   * Initialize quality rules
   */
  initializeQualityRules() {
    return {
      // Error handling
      missingErrorHandling: {
        pattern: /try\s*\{[^}]*\}(\s*catch)?[^}]*$/g,
        severity: "medium",
        message: "Missing error handling for async operations",
        category: "error-handling",
      },
      // Unused variables
      unusedVariables: {
        check: "ast",
        severity: "low",
        message: "Potential unused variable detected",
        category: "code-quality",
      },
      // Deep nesting
      deepNesting: {
        threshold: 5,
        severity: "low",
        message: "Deep nesting detected - consider refactoring",
        category: "code-quality",
      },
      // Long functions
      longFunction: {
        threshold: 100,
        severity: "low",
        message: "Function exceeds recommended line count",
        category: "code-quality",
      },
      // TODO comments
      todoComment: {
        pattern: /\/\/\s*TODO|\/\*\s*TODO/g,
        severity: "low",
        message: "TODO comment found",
        category: "code-quality",
      },
      // console.log in production
      consoleInProduction: {
        pattern: /console\.(log|debug|info)\s*\(/g,
        severity: "low",
        message: "Console statement in production code",
        category: "code-quality",
      },
      // Magic numbers
      magicNumber: {
        pattern: /(?<![a-zA-Z_$])(?<!\d\.)\d{3,}(?![a-zA-Z\d_$])/g,
        severity: "low",
        message: "Magic number detected - consider using constant",
        category: "code-quality",
      },
    };
  }

  /**
   * Main validation method
   */
  analyze(code, context = {}) {
    this.stats = {
      syntaxErrors: 0,
      semanticErrors: 0,
      securityIssues: 0,
      warnings: 0,
      validationsRun: 0,
    };
    this.errors = [];
    this.warnings = [];

    const result = {
      agent: this.name,
      version: this.version,
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
      qualityIssues: [],
      statistics: {},
      testSuggestions: [],
      recommendations: [],
      validatedAt: new Date().toISOString(),
    };

    try {
      // 1. Syntax validation
      this.stats.validationsRun++;
      const syntaxResult = this.validateSyntax(code);
      if (!syntaxResult.valid) {
        result.errors.push(...syntaxResult.errors);
        result.valid = false;
        this.stats.syntaxErrors = syntaxResult.errors.length;
      }

      // 2. Parse AST for further analysis
      const ast = this.parseCode(code);
      result.ast = ast ? true : false;

      // 3. Semantic validation
      if (ast) {
        this.stats.validationsRun++;
        const semanticResult = this.validateSemantics(ast);
        result.warnings.push(...semanticResult.warnings);
        this.stats.semanticErrors = semanticResult.errors.length;
        this.stats.warnings = semanticResult.warnings.length;
      }

      // 4. Security scan
      this.stats.validationsRun++;
      const securityResult = this.scanSecurity(code);
      result.securityIssues = securityResult.issues;
      this.stats.securityIssues = securityResult.issues.length;

      if (securityResult.issues.some((i) => i.severity === "critical")) {
        result.valid = false;
      }

      // 5. Quality check
      if (ast) {
        this.stats.validationsRun++;
        const qualityResult = this.checkQuality(ast);
        result.qualityIssues = qualityResult.issues;
      }

      // 6. Generate test suggestions
      this.stats.validationsRun++;
      result.testSuggestions = this.generateTestSuggestions(code, ast);

      // 7. Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      // Calculate statistics
      result.statistics = this.calculateStatistics(result);
    } catch (error) {
      result.errors.push({
        type: "validation-error",
        message: error.message,
        stack: error.stack,
      });
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate syntax
   */
  validateSyntax(code) {
    const result = { valid: true, errors: [] };

    try {
      parse(code, {
        sourceType: "unambiguous",
        errorRecovery: true,
        plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
      });
    } catch (error) {
      result.valid = false;
      result.errors.push({
        type: "syntax-error",
        message: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
        pos: error.pos,
        formatted: this.formatError(error),
      });
    }

    // Additional syntax checks
    const syntaxChecks = this.performAdditionalSyntaxChecks(code);
    result.errors.push(...syntaxChecks.errors);
    if (syntaxChecks.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  /**
   * Perform additional syntax checks
   */
  performAdditionalSyntaxChecks(code) {
    const errors = [];

    // Check for unbalanced brackets
    const brackets = { "(": ")", "[": "]", "{": "}" };
    const stack = [];
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const prevChar = code[i - 1];

      // Handle strings
      if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        // Check brackets
        if (brackets[char]) {
          stack.push({ char, pos: i });
        } else if (Object.values(brackets).includes(char)) {
          if (stack.length === 0) {
            errors.push({
              type: "syntax-error",
              message: `Unexpected closing bracket '${char}' at position ${i}`,
              pos: i,
            });
          } else {
            const last = stack.pop();
            if (brackets[last.char] !== char) {
              errors.push({
                type: "syntax-error",
                message: `Mismatched brackets: expected '${
                  brackets[last.char]
                }' but found '${char}' at position ${i}`,
                pos: i,
              });
            }
          }
        }
      }
    }

    // Check for unclosed brackets
    if (stack.length > 0) {
      errors.push({
        type: "syntax-error",
        message: `Unclosed bracket '${
          stack[stack.length - 1].char
        }' at position ${stack[stack.length - 1].pos}`,
        pos: stack[stack.length - 1].pos,
      });
    }

    return { errors };
  }

  /**
   * Format error message
   */
  formatError(error) {
    const location = error.loc
      ? ` (${error.loc.line}:${error.loc.column})`
      : "";
    return `${error.message}${location}`;
  }

  /**
   * Parse code into AST
   */
  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        errorRecovery: true,
        plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Validate semantics
   */
  validateSemantics(ast) {
    const result = { errors: [], warnings: [] };

    // Traverse AST for semantic analysis
    traverse(ast, {
      // Check for undefined variables
      Identifier: (path) => {
        if (path.isReferencedIdentifier()) {
          const name = path.node.name;

          // Check for undefined globals
          if (!this.isDefined(name) && !this.isBuiltin(name)) {
            // Check if it's used before declaration
            const binding = path.scope.getBinding(name);
            if (!binding) {
              result.warnings.push({
                type: "semantic-warning",
                message: `Variable '${name}' may not be defined`,
                line: path.node.loc?.start?.line,
                severity: "low",
              });
            }
          }
        }
      },

      // Check for unreachable code
      ReturnStatement: (path) => {
        const func = path.getFunctionParent();
        if (func) {
          const body = func.get("body");
          if (body.isBlockStatement()) {
            const statements = body.get("body");
            const returnIdx = statements.indexOf(path);

            // Check for code after return
            for (let i = returnIdx + 1; i < statements.length; i++) {
              if (!statements[i].isEmptyStatement()) {
                result.warnings.push({
                  type: "unreachable-code",
                  message: "Unreachable code detected after return statement",
                  line: statements[i].node.loc?.start?.line,
                  severity: "low",
                });
                break;
              }
            }
          }
        }
      },

      // Check for assignments in conditions
      IfStatement: (path) => {
        if (path.node.test && path.node.test.type === "AssignmentExpression") {
          result.warnings.push({
            type: "assignment-in-condition",
            message: "Assignment in condition - did you mean to use ===?",
            line: path.node.loc?.start?.line,
            severity: "medium",
          });
        }
      },

      // Check for comparisons with null/undefined
      BinaryExpression: (path) => {
        if (path.node.operator === "==" || path.node.operator === "!=") {
          result.warnings.push({
            type: "loose-comparison",
            message: `Use ${path.node.operator}= for type-safe comparison`,
            line: path.node.loc?.start?.line,
            severity: "low",
          });
        }
      },

      // Check for suspicious typeof usage
      UnaryExpression: (path) => {
        if (path.node.operator === "typeof") {
          const arg = path.node.argument;
          if (arg.type === "Literal" && arg.value !== undefined) {
            result.warnings.push({
              type: "typeof-literal",
              message: "typeof on a literal always returns a known value",
              line: path.node.loc?.start?.line,
              severity: "low",
            });
          }
        }
      },
    });

    return result;
  }

  /**
   * Check if identifier is a built-in
   */
  isBuiltin(name) {
    const builtins = [
      "console",
      "window",
      "document",
      "Math",
      "JSON",
      "Array",
      "Object",
      "String",
      "Number",
      "Boolean",
      "Function",
      "Symbol",
      "BigInt",
      "Date",
      "RegExp",
      "Error",
      "Promise",
      "Map",
      "Set",
      "WeakMap",
      "WeakSet",
      "Proxy",
      "Reflect",
      "parseInt",
      "parseFloat",
      "isNaN",
      "isFinite",
      "encodeURI",
      "decodeURI",
      "encodeURIComponent",
      "decodeURIComponent",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "require",
      "module",
      "exports",
      "global",
      "process",
      "Buffer",
      "__dirname",
      "__filename",
      "exports",
      "print",
      "exit",
    ];
    return builtins.includes(name);
  }

  /**
   * Check if identifier is defined
   */
  isDefined(name) {
    // Simplified check - in real implementation would analyze scope
    return false;
  }

  /**
   * Scan for security issues
   */
  scanSecurity(code) {
    const issues = [];

    for (const [name, rule] of Object.entries(this.securityPatterns)) {
      const matches = code.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          issues.push({
            type: rule.category,
            severity: rule.severity,
            message: rule.message,
            code: match.substring(0, 50),
            rule: name,
          });
        }
      }
    }

    return { issues };
  }

  /**
   * Check code quality
   */
  checkQuality(ast) {
    const issues = [];

    traverse(ast, {
      // Check function length
      FunctionDeclaration: (path) => {
        const body = path.node.body;
        if (body.type === "BlockStatement") {
          const lineCount = body.loc?.end?.line - body.loc?.start?.line;
          if (lineCount > 100) {
            issues.push({
              type: "long-function",
              severity: "low",
              message: `Function '${
                path.node.id?.name || "anonymous"
              }' has ${lineCount} lines`,
              line: path.node.loc?.start?.line,
            });
          }
        }
      },

      // Check nesting depth
      IfStatement: (path) => {
        let depth = 0;
        let current = path;
        while (current.parent) {
          if (
            current.parent.type === "IfStatement" ||
            current.parent.type === "ForStatement" ||
            current.parent.type === "WhileStatement"
          ) {
            depth++;
          }
          current = current.parent;
        }

        if (depth > 5) {
          issues.push({
            type: "deep-nesting",
            severity: "low",
            message: "Code nesting depth exceeds recommended level",
            line: path.node.loc?.start?.line,
          });
        }
      },
    });

    return { issues };
  }

  /**
   * Generate test suggestions
   */
  generateTestSuggestions(code, ast) {
    const suggestions = [];

    // Suggest tests based on functions
    if (ast) {
      const functions = [];

      traverse(ast, {
        FunctionDeclaration: (path) => {
          if (path.node.id && path.node.id.name) {
            functions.push({
              name: path.node.id.name,
              params: path.node.params.length,
              line: path.node.loc?.start?.line,
            });
          }
        },
      });

      for (const func of functions.slice(0, 5)) {
        suggestions.push({
          type: "function-test",
          function: func.name,
          suggestion: `describe('${
            func.name
          }', () => { it('should work', () => { expect(${func.name}(${Array(
            func.params
          )
            .fill("mock")
            .join(", ")})).toBeDefined(); }); });`,
        });
      }
    }

    // Suggest tests for exports
    if (/module\.exports|export\s+(default|function|class)/.test(code)) {
      suggestions.push({
        type: "export-test",
        suggestion: "Add tests to verify exported functions work correctly",
      });
    }

    // Suggest tests for async functions
    if (/async\s+function|\.then\(|\.catch\(/.test(code)) {
      suggestions.push({
        type: "async-test",
        suggestion:
          "Add tests for async operations with proper async/await handling",
      });
    }

    return suggestions;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(result) {
    const recommendations = [];

    if (result.errors.length > 0) {
      recommendations.push({
        priority: "high",
        message: "Fix syntax errors before proceeding",
      });
    }

    if (result.securityIssues.some((i) => i.severity === "critical")) {
      recommendations.push({
        priority: "critical",
        message: "Address critical security issues immediately",
      });
    }

    if (result.securityIssues.some((i) => i.severity === "high")) {
      recommendations.push({
        priority: "high",
        message: "Review and fix high severity security issues",
      });
    }

    if (result.qualityIssues.length > 10) {
      recommendations.push({
        priority: "medium",
        message: "Consider refactoring to improve code quality",
      });
    }

    if (result.testSuggestions.length > 0) {
      recommendations.push({
        priority: "low",
        message: "Add unit tests for better coverage",
      });
    }

    return recommendations;
  }

  /**
   * Calculate statistics
   */
  calculateStatistics(result) {
    return {
      totalErrors: result.errors.length,
      totalWarnings: result.warnings.length,
      totalSecurityIssues: result.securityIssues.length,
      criticalSecurityIssues: result.securityIssues.filter(
        (i) => i.severity === "critical"
      ).length,
      highSecurityIssues: result.securityIssues.filter(
        (i) => i.severity === "high"
      ).length,
      qualityIssues: result.qualityIssues.length,
      valid: result.valid,
      testSuggestions: result.testSuggestions.length,
    };
  }

  /**
   * Validate specific line
   */
  validateLine(code, lineNumber) {
    const lines = code.split("\n");
    const line = lines[lineNumber - 1];

    if (!line) {
      return { valid: false, error: "Line number out of range" };
    }

    try {
      parse(line, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        line: lineNumber,
        content: line,
      };
    }
  }

  /**
   * Check for specific pattern
   */
  checkPattern(code, pattern) {
    const regex = new RegExp(pattern, "g");
    const matches = code.match(regex);

    return {
      found: matches !== null,
      count: matches ? matches.length : 0,
      matches: matches ? matches.slice(0, 10) : [],
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.errors = [];
    this.warnings = [];
    this.securityPatterns = {};
    this.qualityRules = {};
  }
}

module.exports = ValidatorAgent;
