/**
 * Accessibility Rules (a11y)
 * Production-grade accessibility best practices
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class AccessibilityRules {
  constructor() {
    this.name = "accessibility-rules";
    this.version = "1.0.0";
    this.rules = this.initializeRules();
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      semanticHTML: 0,
      ariaUsage: 0,
      keyboardNav: 0,
      altText: 0,
      focusManagement: 0
    };
  }

  initializeRules() {
    return {
      altText: {
        id: "a11y-alt",
        description: "Images must have alt text",
        severity: "error",
        pattern: /<img\s+(?!.*alt)[^>]*>/gi,
        message: "Images must have alt attribute for screen readers",
        recommendation: "Add alt='description' or alt='' for decorative images"
      },
      ariaLabel: {
        id: "a11y-aria-label",
        description: "Interactive elements need accessible names",
        severity: "error",
        pattern: /<(?:button|a|input)\s+(?!.*(?:aria-|id=))[^\/]*\/?>/gi,
        message: "Interactive elements need aria-label or visible text",
        recommendation: "Add aria-label or ensure element has accessible text"
      },
      headingOrder: {
        id: "a11y-heading-order",
        description: "Headings should be in logical order",
        severity: "warning",
        pattern: /<h([1-6])[^>]*>.*?<\/h\1>/gi,
        message: "Headings should go in order (h1 > h2 > h3, no skipping)",
        recommendation: "Use sequential heading levels without skipping"
      },
      tabIndex: {
        id: "a11y-tabindex",
        description: "Proper tabindex usage",
        severity: "warning",
        pattern: /tabindex=["']0["']/g,
        message: "Avoid tabindex='0' on non-interactive elements",
        recommendation: "Use semantic HTML elements instead of tabindex"
      },
      focusVisible: {
        id: "a11y-focus",
        description: "Ensure focus indicators are visible",
        severity: "error",
        pattern: /outline:\s*none|outline:\s*0/g,
        message: "Do not remove outline without providing alternative focus style",
        recommendation: "Use outline: none only with custom focus styles"
      },
      rolePresentation: {
        id: "a11y-role",
        description: "Use semantic roles appropriately",
        severity: "warning",
        pattern: /role=["'](?:presentation|none)["'][^>]*>(?!<img)/gi,
        message: "role='presentation' should only be on decorative elements",
        recommendation: "Use semantic elements instead of ARIA roles when possible"
      },
      labelAssociation: {
        id: "a11y-label",
        description: "Form inputs must have labels",
        severity: "error",
        pattern: /<input\s+(?!.*(?:aria-label|id=))[^\/]*\/?>/gi,
        message: "Form inputs must have associated labels",
        recommendation: "Use <label for='id'> or aria-label"
      },
      clickableChildren: {
        id: "a11y-clickable",
        description: "Non-interactive elements shouldn't have click handlers",
        severity: "warning",
        pattern: /<(?:div|span|section)[^>]*onclick[^>]*>/gi,
        message: "Click handlers on non-interactive elements are not accessible",
        recommendation: "Use <button> or add role='button' and keyboard handlers"
      },
      languageAttribute: {
        id: "a11y-lang",
        description: "HTML document should have lang attribute",
        severity: "warning",
        pattern: /<html(?!\s+lang)[^>]*>/gi,
        message: "Add lang attribute to the HTML element",
        recommendation: "<html lang='en'> helps screen readers pronounce correctly"
      },
      skipLink: {
        id: "a11y-skip-link",
        description: "Add skip navigation link",
        severity: "info",
        pattern: /<body(?!\s*(?:[^>]*\s)?class)/gi,
        message: "Consider adding a skip navigation link",
        recommendation: "<a href='#main'>Skip to main content</a> improves keyboard navigation"
      }
    };
  }

  apply(code, options = {}) {
    this.violations = [];
    this.stats = {
      totalChecks: 0,
      semanticHTML: 0,
      ariaUsage: 0,
      keyboardNav: 0,
      altText: 0,
      focusManagement: 0
    };

    const result = {
      violations: [],
      statistics: {},
      accessibilityScore: 0
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        // Fall back to regex for JSX/HTML
        this.checkPatterns(code);
      } else {
        this.checkPatterns(code);
        this.checkAST(ast);
      }

      result.violations = this.violations;
      result.statistics = this.getStatistics();
      result.accessibilityScore = this.calculateA11yScore();
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
      JSXElement(path) {
        const elementName = path.node.openingElement.name.name;
        
        if (elementName === 'img') {
          const hasAlt = path.node.openingElement.attributes.some(
            attr => attr.name && attr.name.name === 'alt'
          );
          if (!hasAlt) {
            self.addViolation(self.rules.altText, '<img>', path.node.loc);
          }
        }

        if (elementName === 'input') {
          const hasLabel = path.node.openingElement.attributes.some(
            attr => attr.name && (attr.name.name === 'aria-label' || attr.name.name === 'id')
          );
          if (!hasLabel) {
            self.addViolation(self.rules.labelAssociation, '<input>', path.node.loc);
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
    if (rule.severity === 'error') this.stats.semanticHTML++;
  }

  calculateA11yScore() {
    const total = this.stats.totalChecks;
    const errors = this.stats.semanticHTML;
    return Math.max(0, 100 - (errors * 12));
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
      semanticHTML: 0,
      ariaUsage: 0,
      keyboardNav: 0,
      altText: 0,
      focusManagement: 0
    };
  }
}

module.exports = AccessibilityRules;
