/**
 * Internationalization Rules (i18n)
 * Production-grade i18n/l10n best practices
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class I18nRules {
  constructor() {
    this.name = "i18n-rules";
    this.version = "1.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      hardcodedStrings: 0,
      interpolation: 0,
      pluralization: 0,
      localeHandling: 0
    };
  }

  initializeRules() {
    return {
      hardcodedStrings: {
        id: "i18n-hardcoded",
        description: "Avoid hardcoded user-facing strings",
        severity: "error",
        pattern: /["'](?:Hello|Welcome|Error|Success|Cancel|Submit)[^"']*["']/gi,
        message: "User-facing strings should use i18n functions",
        recommendation: "Use t('hello') or i18n.t('hello') instead of 'Hello'"
      },
      consoleLog: {
        id: "i18n-no-console",
        description: "Avoid console.log in production",
        severity: "warning",
        pattern: /console\.(log|debug|info)\s*\(/g,
        message: "Remove console statements or use proper logging",
        recommendation: "Use a logging library with proper log levels"
      },
      interpolation: {
        id: "i18n-interpolation",
        description: "Use interpolation for dynamic values",
        severity: "warning",
        pattern: /["'][^"']*\$\{/g,
        message: "Use interpolation syntax properly in i18n",
        recommendation: "Use { count } interpolation, not string concatenation"
      },
      pluralization: {
        id: "i18n-plural",
        description: "Handle plural forms properly",
        severity: "warning",
        pattern: /if\s*\([^)]*count[^)]*>\s*1[^)]*\)/g,
        message: "Use pluralization for count-based messages",
        recommendation: "Use i18n plural forms: t('item', { count })"
      },
      dateFormatting: {
        id: "i18n-date",
        description: "Use locale-aware date formatting",
        severity: "warning",
        pattern: /new\s+Date\(\)\.to(?:Locale)?String\s*\(\s*\)/g,
        message: "Use locale-aware date formatting",
        recommendation: "Use toLocaleDateString(locales, options) for international dates"
      },
      numberFormatting: {
        id: "i18n-number",
        description: "Use locale-aware number formatting",
        severity: "warning",
        pattern: /(?<!\.toLocaleString)\(\d+\.\d+\)/g,
        message: "Use locale-aware number formatting",
        recommendation: "Use (1234.56).toLocaleString() for currency/percentages"
      },
      currencyFormatting: {
        id: "i18n-currency",
        description: "Use proper currency formatting",
        severity: "warning",
        pattern: /["']\$\s*\d+["']|\d+\s*USD/gi,
        message: "Use locale-aware currency formatting",
        recommendation: "Use Intl.NumberFormat with currency style"
      },
      rtlSupport: {
        id: "i18n-rtl",
        description: "Consider RTL layout support",
        severity: "info",
        pattern: /text-align:\s*(?:left|right)/gi,
        message: "Consider RTL languages in CSS",
        recommendation: "Use logical properties: start/end instead of left/right"
      },
      translationKey: {
        id: "i18n-key",
        description: "Use semantic translation keys",
        severity: "info",
        pattern: /t\s*\(\s*['"]\w+['"]\s*\)/g,
        message: "Use semantic keys instead of content",
        recommendation: "t('user.login.button') is better than t('Login')"
      },
      missingReturn: {
        id: "i18n-missing",
        description: "Check for missing translation fallback",
        severity: "warning",
        pattern: /t\s*\(\s*['"][^'"]+['"]\s*(?:,\s*\{[^}]*\})?\s*\)/g,
        message: "Handle missing translations gracefully",
        recommendation: "Provide fallback values for missing keys"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      hardcodedStrings: 0,
      interpolation: 0,
      pluralization: 0,
      localeHandling: 0
    };

    const result = {
      violations: [],
      statistics: {},
      i18nScore: 0
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
      result.i18nScore = this.calculateI18nScore();
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
    // Exclude i18n function calls from hardcoded string detection
    const excludePatterns = [
      /t\s*\(/,
      /i18n\.t\s*\(/,
      /_\s*\(/,
      /intl\.formatMessage\s*\(/,
      /defineMessage\s*\(/,
      /defineNestedMessage\s*\(/
    ];

    for (const [ruleId, rule] of Object.entries(this.rules)) {
      if (!rule.pattern) continue;

      const matches = code.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          // Skip if it's inside an i18n function
          const isExcluded = excludePatterns.some(pattern => {
            const before = code.substring(0, code.indexOf(match));
            const lastI18n = Math.max(
              before.lastIndexOf('t('),
              before.lastIndexOf('i18n.t('),
              before.lastIndexOf('_( ')
            );
            return lastI18n > before.lastIndexOf(match);
          });

          if (!isExcluded) {
            this.addViolation(rule, match, null);
          }
        }
      }
    }
  }

  checkAST(ast) {
    const self = this;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        
        if (callee.type === 'Identifier') {
          if (callee.name === 't' || callee.name === '_') {
            if (path.node.arguments.length > 0) {
              const firstArg = path.node.arguments[0];
              if (firstArg.type === 'StringLiteral') {
                const key = firstArg.value;
                if (key && key.length > 0 && !key.includes('.')) {
                  self.addViolation(self.rules.translationKey, key, path.node.loc);
                }
              }
            }
          }
        }

        if (callee.type === 'MemberExpression') {
          if (callee.object.name === 'Intl' && 
              callee.property.name === 'NumberFormat') {
            // Good - using Intl.NumberFormat
          }
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
    if (rule.severity === 'error') this.stats.hardcodedStrings++;
  }

  calculateI18nScore() {
    const total = this.stats.totalChecks;
    const errors = this.stats.hardcodedStrings;
    return Math.max(0, 100 - (errors * 10));
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
      hardcodedStrings: 0,
      interpolation: 0,
      pluralization: 0,
      localeHandling: 0
    };
  }
}

module.exports = I18nRules;
