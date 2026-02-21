/**
 * Validation Utils
 * Comprehensive validation utilities for deobfuscated code
 * Version: 3.0.0
 */
const parser = require("@babel/parser");
const t = require("@babel/types");

class ValidationUtils {
  constructor(options = {}) {
    this.name = "ValidationUtils";
    this.version = "3.0.0";
    this.options = {
      strictMode: options.strictMode !== false,
      allowJsx: options.allowJsx !== false,
      allowTypescript: options.allowTypescript !== false,
      maxDepth: options.maxDepth || 50,
      maxNodes: options.maxNodes || 10000,
      checkSyntax: options.checkSyntax !== false,
      checkSecurity: options.checkSecurity !== false,
      checkBestPractices: options.checkBestPractices !== false,
    };
    this.errors = [];
    this.warnings = [];
    this.statistics = {
      totalValidations: 0,
      validCount: 0,
      invalidCount: 0,
      errorsFound: 0,
      warningsFound: 0,
    };
    this._initializeValidators();
  }

  _initializeValidators() {
    this.validators = {
      syntax: this._validateSyntax.bind(this),
      security: this._validateSecurity.bind(this),
      structure: this._validateStructure.bind(this),
      bestPractices: this._validateBestPractices.bind(this),
    };
  }

  validate(code, options = {}) {
    const validationId = `validation-${Date.now()}`;
    this.statistics.totalValidations++;

    const config = { ...this.options, ...options };
    this.errors = [];
    this.warnings = [];

    try {
      if (config.checkSyntax) {
        const syntaxResult = this.validators.syntax(code, config);
        if (!syntaxResult.valid) {
          this.errors.push(...syntaxResult.errors);
        }
      }

      if (config.checkSecurity) {
        const securityResult = this.validators.security(code, config);
        if (!securityResult.valid) {
          this.errors.push(...securityResult.errors);
        }
        this.warnings.push(...securityResult.warnings);
      }

      if (config.checkBestPractices) {
        const bestPracticesResult = this.validators.bestPractices(code, config);
        this.warnings.push(...bestPracticesResult.warnings);
      }

      const structureResult = this.validators.structure(code, config);
      if (!structureResult.valid) {
        this.errors.push(...structureResult.errors);
      }

      this.statistics.errorsFound += this.errors.length;
      this.statistics.warningsFound += this.warnings.length;

      if (this.errors.length === 0) {
        this.statistics.validCount++;
      } else {
        this.statistics.invalidCount++;
      }

      return {
        id: validationId,
        valid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });
      this.statistics.invalidCount++;
      this.statistics.errorsFound++;

      return {
        id: validationId,
        valid: false,
        errors: this.errors,
        warnings: this.warnings,
        timestamp: Date.now(),
      };
    }
  }

  _validateSyntax(code, config) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
        errorRecovery: true,
        plugins: config.allowJsx ? ["jsx"] : [],
      });

      if (!ast) {
        errors.push({
          type: "syntax",
          message: "Failed to parse code",
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        type: "syntax",
        message: error.message,
        severity: "error",
        line: error.loc?.line,
        column: error.loc?.column,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  _validateSecurity(code, config) {
    const errors = [];
    const warnings = [];

    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: "Use of 'eval' is dangerous",
        severity: "error",
      },
      {
        pattern: /Function\s*\(/g,
        message: "Use of 'Function' constructor is dangerous",
        severity: "error",
      },
      {
        pattern: /innerHTML\s*=/g,
        message: "Direct innerHTML assignment can lead to XSS",
        severity: "warning",
      },
      {
        pattern: /document\s*\.\s*write/g,
        message: "Use of document.write is discouraged",
        severity: "warning",
      },
      {
        pattern: /setTimeout\s*\(\s*['"]/g,
        message: "setTimeout with string argument is dangerous",
        severity: "warning",
      },
      {
        pattern: /setInterval\s*\(\s*['"]/g,
        message: "setInterval with string argument is dangerous",
        severity: "warning",
      },
      {
        pattern: /\.\s*cookie/g,
        message: "Cookie manipulation detected",
        severity: "warning",
      },
      {
        pattern: /localStorage\s*\.\s*setItem/g,
        message: "localStorage usage detected",
        severity: "info",
      },
    ];

    for (const dangerous of dangerousPatterns) {
      const matches = code.match(dangerous.pattern);
      if (matches) {
        for (const match of matches) {
          const issue = {
            type: "security",
            message: dangerous.message,
            severity: dangerous.severity,
            match,
          };

          if (dangerous.severity === "error") {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  _validateStructure(code, config) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
        errorRecovery: true,
      });

      let nodeCount = 0;
      let maxDepth = 0;
      let currentDepth = 0;

      const traverse = require("@babel/traverse").default;

      traverse(ast, {
        enter(path) {
          nodeCount++;
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);

          if (nodeCount > config.maxNodes) {
            errors.push({
              type: "structure",
              message: "Too many nodes in AST",
              severity: "error",
            });
            path.stop();
          }
        },
        exit() {
          currentDepth--;
        },
      });

      if (maxDepth > config.maxDepth) {
        errors.push({
          type: "structure",
          message: `AST depth (${maxDepth}) exceeds maximum (${config.maxDepth})`,
          severity: "error",
        });
      }

      const unclosedBrackets = this._checkBracketBalance(code);
      if (unclosedBrackets) {
        errors.push({
          type: "structure",
          message: unclosedBrackets,
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        type: "structure",
        message: error.message,
        severity: "error",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  _checkBracketBalance(code) {
    const brackets = {
      "(": ")",
      "[": "]",
      "{": "}",
      "<": ">",
    };
    const stack = [];
    const pairs = Object.entries(brackets);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      for (const [open, close] of pairs) {
        if (char === open) {
          stack.push({ char: open, index: i });
        } else if (char === close) {
          if (stack.length === 0) {
            return `Unmatched closing bracket '${char}' at position ${i}`;
          }
          const last = stack[stack.length - 1];
          if (last.char !== open) {
            return `Mismatched brackets at position ${i}: expected '${brackets[last.char]}' but found '${char}'`;
          }
          stack.pop();
        }
      }
    }

    if (stack.length > 0) {
      const last = stack[stack.length - 1];
      return `Unclosed bracket '${last.char}' at position ${last.index}`;
    }

    return null;
  }

  _validateBestPractices(code, config) {
    const warnings = [];

    const bestPracticePatterns = [
      {
        pattern: /var\s+/g,
        message: "Use 'const' or 'let' instead of 'var'",
        severity: "info",
      },
      {
        pattern: /==\s*[^=]/g,
        message: "Use '===' for strict equality",
        severity: "info",
      },
      {
        pattern: /!=\s*[^=]/g,
        message: "Use '!==' for strict inequality",
        severity: "info",
      },
      {
        pattern: /console\.log/g,
        message: "Remove console.log statements in production",
        severity: "info",
      },
      {
        pattern: /debugger/g,
        message: "Remove debugger statements",
        severity: "info",
      },
      {
        pattern: /new\s+Array\s*\(/g,
        message: "Use array literal [] instead of new Array()",
        severity: "info",
      },
      {
        pattern: /new\s+Object\s*\(/g,
        message: "Use object literal {} instead of new Object()",
        severity: "info",
      },
    ];

    for (const pattern of bestPracticePatterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        for (const match of matches) {
          warnings.push({
            type: "bestPractices",
            message: pattern.message,
            severity: pattern.severity,
            match,
          });
        }
      }
    }

    return {
      warnings,
    };
  }

  validateAST(ast, options = {}) {
    const errors = [];
    const warnings = [];

    if (!ast || typeof ast !== "object") {
      errors.push({
        type: "validation",
        message: "AST must be a valid object",
        severity: "error",
      });
      return { valid: false, errors, warnings };
    }

    if (!ast.type) {
      errors.push({
        type: "validation",
        message: "AST must have a type property",
        severity: "error",
      });
    }

    const requiredProperties = ["type", "loc"];
    for (const prop of requiredProperties) {
      if (!ast[prop]) {
        warnings.push({
          type: "validation",
          message: `AST node missing '${prop}' property`,
          severity: "warning",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateJSON(jsonString, options = {}) {
    const errors = [];

    try {
      const parsed = JSON.parse(jsonString);

      if (options.schema) {
        const schemaErrors = this._validateSchema(parsed, options.schema);
        errors.push(...schemaErrors);
      }

      return {
        valid: errors.length === 0,
        parsed,
        errors,
      };
    } catch (error) {
      errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });

      return {
        valid: false,
        errors,
      };
    }
  }

  _validateSchema(data, schema) {
    const errors = [];

    if (schema.type && typeof data !== schema.type) {
      errors.push({
        type: "schema",
        message: `Expected type '${schema.type}', got '${typeof data}'`,
        severity: "error",
      });
    }

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push({
            type: "schema",
            message: `Missing required field: '${field}'`,
            severity: "error",
          });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const propErrors = this._validateSchema(data[key], propSchema);
          errors.push(...propErrors);
        }
      }
    }

    return errors;
  }

  validateFunction(code, functionName) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
      });

      const traverse = require("@babel/traverse").default;
      let found = false;

      traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id && path.node.id.name === functionName) {
            found = true;

            if (path.node.params.length === 0) {
              errors.push({
                type: "function",
                message: "Function has no parameters",
                severity: "warning",
              });
            }

            if (!path.node.body) {
              errors.push({
                type: "function",
                message: "Function has no body",
                severity: "error",
              });
            }

            if (
              path.node.body &&
              path.node.body.type === "BlockStatement" &&
              path.node.body.body.length === 0
            ) {
              errors.push({
                type: "function",
                message: "Function body is empty",
                severity: "warning",
              });
            }
          }
        },
      });

      if (!found) {
        errors.push({
          type: "function",
          message: `Function '${functionName}' not found`,
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateClass(code, className) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
      });

      const traverse = require("@babel/traverse").default;
      let found = false;

      traverse(ast, {
        ClassDeclaration(path) {
          if (path.node.id && path.node.id.name === className) {
            found = true;

            if (!path.node.superClass) {
              errors.push({
                type: "class",
                message: "Class does not extend any superclass",
                severity: "info",
              });
            }

            let hasConstructor = false;
            path.node.body.body.forEach((member) => {
              if (member.type === "ClassMethod" && member.kind === "constructor") {
                hasConstructor = true;
              }
            });

            if (!hasConstructor) {
              errors.push({
                type: "class",
                message: "Class has no constructor",
                severity: "info",
              });
            }
          }
        },
      });

      if (!found) {
        errors.push({
          type: "class",
          message: `Class '${className}' not found`,
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateImport(code, importPath) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
      });

      const traverse = require("@babel/traverse").default;
      let found = false;

      traverse(ast, {
        ImportDeclaration(path) {
          if (path.node.source.value === importPath) {
            found = true;

            if (path.node.specifiers.length === 0) {
              errors.push({
                type: "import",
                message: "Import has no specifiers",
                severity: "warning",
              });
            }
          }
        },
      });

      if (!found) {
        errors.push({
          type: "import",
          message: `Import '${importPath}' not found`,
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateVariable(code, variableName) {
    const errors = [];

    try {
      const ast = parser.parse(code, {
        sourceType: "module",
      });

      const traverse = require("@babel/traverse").default;
      let declared = false;
      let used = false;

      traverse(ast, {
        VariableDeclarator(path) {
          if (path.node.id && path.node.id.name === variableName) {
            declared = true;

            if (!path.node.init) {
              errors.push({
                type: "variable",
                message: "Variable is declared but not initialized",
                severity: "warning",
              });
            }
          }
        },
        Identifier(path) {
          if (path.node.name === variableName && !path.isBindingIdentifier()) {
            used = true;
          }
        },
      });

      if (!declared) {
        errors.push({
          type: "variable",
          message: `Variable '${variableName}' is not declared`,
          severity: "error",
        });
      }

      if (!used) {
        errors.push({
          type: "variable",
          message: `Variable '${variableName}' is declared but never used`,
          severity: "warning",
        });
      }
    } catch (error) {
      errors.push({
        type: "validation",
        message: error.message,
        severity: "error",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getErrors() {
    return [...this.errors];
  }

  getWarnings() {
    return [...this.warnings];
  }

  getStatistics() {
    return {
      ...this.statistics,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
    };
  }

  clearErrors() {
    this.errors = [];
    this.warnings = [];
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  getOptions() {
    return { ...this.options };
  }

  reset() {
    this.errors = [];
    this.warnings = [];
    this.statistics = {
      totalValidations: 0,
      validCount: 0,
      invalidCount: 0,
      errorsFound: 0,
      warningsFound: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = ValidationUtils;
