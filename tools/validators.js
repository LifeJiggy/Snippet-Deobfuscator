/**
 * Validators
 * Production-grade input validation utilities
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");

class Validators {
  constructor() {
    this.name = "validators";
    this.version = "3.0.0";
  }

  /**
   * Validate JavaScript code
   */
  validateCode(code, options = {}) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      stats: {},
    };

    if (!code || typeof code !== "string") {
      result.errors.push({
        type: "invalid-input",
        message: "Code must be a non-empty string",
      });
      return result;
    }

    if (options.maxLength && code.length > options.maxLength) {
      result.errors.push({
        type: "too-long",
        message: `Code exceeds maximum length of ${options.maxLength}`,
      });
      return result;
    }

    try {
      const ast = parse(code, {
        sourceType: options.sourceType || "unambiguous",
        plugins: options.plugins || ["jsx", "typescript", "classProperties"],
        errorRecovery: options.errorRecovery || false,
      });

      result.valid = true;
      result.stats = {
        lines: code.split("\n").length,
        characters: code.length,
        nodes: this.countNodes(ast),
      };
    } catch (error) {
      result.errors.push({
        type: "parse-error",
        message: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
      });
    }

    return result;
  }

  /**
   * Count AST nodes
   */
  countNodes(ast) {
    let count = 0;
    const traverse = require("@babel/traverse").default;

    traverse(ast, {
      enter() {
        count++;
      },
    });

    return count;
  }

  /**
   * Check if code is safe (no dangerous patterns)
   */
  async isSafeCode(code, options = {}) {
    const warnings = [];

    // Check for dangerous patterns
    const dangerous = [
      { pattern: /eval\s*\(/, name: "eval", severity: "critical" },
      {
        pattern: /new\s+Function\s*\(/,
        name: "Function constructor",
        severity: "critical",
      },
      {
        pattern: /document\.write\s*\(/,
        name: "document.write",
        severity: "high",
      },
      {
        pattern: /setTimeout\s*\(\s*["'`]/,
        name: "setTimeout string",
        severity: "high",
      },
      {
        pattern: /__importStart|import\s*\(\s*["'`]/,
        name: "dynamic import",
        severity: "medium",
      },
      {
        pattern: /child_process|exec\s*\(/,
        name: "shell execution",
        severity: "critical",
      },
      {
        pattern: /process\.exit|socket\.write/,
        name: "process/network",
        severity: "high",
      },
    ];

    for (const check of dangerous) {
      if (check.pattern.test(code)) {
        warnings.push({
          pattern: check.name,
          severity: check.severity,
          message: `Potentially dangerous pattern: ${check.name}`,
        });
      }
    }

    return {
      safe: warnings.filter((w) => w.severity === "critical").length === 0,
      warnings,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config, schema = {}) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key];

      // Required check
      if (rules.required && value === undefined) {
        errors.push({ key, message: `${key} is required` });
        continue;
      }

      if (value === undefined) continue;

      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push({
          key,
          message: `${key} must be of type ${rules.type}, got ${typeof value}`,
        });
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          key,
          message: `${key} must be one of: ${rules.enum.join(", ")}`,
        });
      }

      // Min/max for numbers
      if (rules.type === "number") {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ key, message: `${key} must be >= ${rules.min}` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ key, message: `${key} must be <= ${rules.max}` });
        }
      }

      // Min/max for strings
      if (rules.type === "string") {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({
            key,
            message: `${key} must be at least ${rules.minLength} characters`,
          });
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({
            key,
            message: `${key} must be at most ${rules.maxLength} characters`,
          });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            key,
            message: `${key} does not match required pattern`,
          });
        }
      }

      // Array validation
      if (rules.type === "array") {
        if (!Array.isArray(value)) {
          errors.push({ key, message: `${key} must be an array` });
        } else {
          if (rules.minItems !== undefined && value.length < rules.minItems) {
            errors.push({
              key,
              message: `${key} must have at least ${rules.minItems} items`,
            });
          }
          if (rules.maxItems !== undefined && value.length > rules.maxItems) {
            errors.push({
              key,
              message: `${key} must have at most ${rules.maxItems} items`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file path
   */
  validatePath(filePath, options = {}) {
    const errors = [];
    const warnings = [];

    if (!filePath || typeof filePath !== "string") {
      errors.push("Path must be a non-empty string");
      return { valid: false, errors, warnings };
    }

    // Check for path traversal
    if (filePath.includes("..")) {
      warnings.push("Path contains parent directory references");
    }

    // Check for absolute path if relative required
    if (options.requireRelative && path.isAbsolute(filePath)) {
      errors.push("Path must be relative");
    }

    // Check for absolute path if absolute required
    if (options.requireAbsolute && !path.isAbsolute(filePath)) {
      errors.push("Path must be absolute");
    }

    // Check extension
    if (options.allowedExtensions) {
      const ext = require("path").extname(filePath);
      if (!options.allowedExtensions.includes(ext)) {
        errors.push(
          `Extension ${ext} not allowed. Allowed: ${options.allowedExtensions.join(
            ", "
          )}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate JSON
   */
  validateJSON(json, options = {}) {
    const result = {
      valid: false,
      errors: [],
      data: null,
    };

    let parsed;

    if (typeof json === "string") {
      try {
        parsed = JSON.parse(json);
      } catch (error) {
        result.errors.push({
          type: "parse-error",
          message: error.message,
        });
        return result;
      }
    } else {
      parsed = json;
    }

    // Validate against schema if provided
    if (options.schema) {
      const schemaErrors = this.validateConfig(parsed, options.schema);
      if (!schemaErrors.valid) {
        result.errors.push(...schemaErrors.errors);
        return result;
      }
    }

    result.valid = true;
    result.data = parsed;

    return result;
  }

  /**
   * Validate URL
   */
  validateURL(url, options = {}) {
    const result = {
      valid: false,
      errors: [],
      parsed: null,
    };

    try {
      const parsed = new URL(url);
      result.parsed = {
        protocol: parsed.protocol,
        host: parsed.host,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
      };

      // Check protocol
      if (options.allowedProtocols) {
        const protocol = parsed.protocol.replace(":", "");
        if (!options.allowedProtocols.includes(protocol)) {
          result.errors.push(`Protocol ${protocol} not allowed`);
          return result;
        }
      }

      // Check hostname
      if (options.allowedHosts && !options.allowedHosts.includes(parsed.host)) {
        result.errors.push(`Host ${parsed.host} not allowed`);
        return result;
      }

      result.valid = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        type: "invalid-url",
        message: error.message,
      });
    }

    return result;
  }

  /**
   * Validate email
   */
  validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: pattern.test(email),
      errors: pattern.test(email) ? [] : ["Invalid email format"],
    };
  }

  /**
   * Validate object structure
   */
  validateObject(obj, schema) {
    const errors = [];
    const warnings = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      if (rules.required && value === undefined) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      if (value === undefined) continue;

      if (rules.type) {
        const actualType = Array.isArray(value) ? "array" : typeof value;
        if (actualType !== rules.type) {
          errors.push(`Field ${key} must be ${rules.type}, got ${actualType}`);
        }
      }

      if (rules.schema) {
        const nestedResult = this.validateObject(value, rules.schema);
        errors.push(...nestedResult.errors.map((e) => `${key}.${e}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input, options = {}) {
    if (typeof input !== "string") return input;

    let result = input;

    // Remove null bytes
    if (options.removeNullBytes) {
      result = result.replace(/\0/g, "");
    }

    // Trim whitespace
    if (options.trim !== false) {
      result = result.trim();
    }

    // Escape HTML
    if (options.escapeHTML) {
      result = result
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }

    // Remove control characters
    if (options.removeControlChars) {
      result = result.replace(/[\x00-\x1F\x7F]/g, "");
    }

    // Limit length
    if (options.maxLength && result.length > options.maxLength) {
      result = result.substring(0, options.maxLength);
    }

    return result;
  }

  /**
   * Validate number range
   */
  validateNumber(value, options = {}) {
    const errors = [];

    if (typeof value !== "number") {
      errors.push("Value must be a number");
      return { valid: false, errors };
    }

    if (options.min !== undefined && value < options.min) {
      errors.push(`Value must be at least ${options.min}`);
    }

    if (options.max !== undefined && value > options.max) {
      errors.push(`Value must be at most ${options.max}`);
    }

    if (options.integer && !Number.isInteger(value)) {
      errors.push("Value must be an integer");
    }

    if (options.positive && value <= 0) {
      errors.push("Value must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new Validators();
