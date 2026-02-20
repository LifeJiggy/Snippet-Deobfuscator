const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class StyleRules {
  constructor() {
    this.name = "StyleRules";
    this.version = "3.0.0";
    this.violations = [];
    this.sourceCode = "";
    this.lines = [];
    this.statistics = {
      totalChecks: 0,
      styleIssues: 0,
      indentationIssues: 0,
      spacingIssues: 0,
      semicolonIssues: 0,
      quoteIssues: 0,
      braceIssues: 0,
      lineLengthIssues: 0,
      trailingWhitespaceIssues: 0,
      blankLineIssues: 0,
    };
    this.rules = {};
    this.config = {
      indentStyle: "space",
      indentSize: 4,
      semicolons: true,
      quotes: "single",
      braceStyle: "1tbs",
      maxLineLength: 120,
      allowTrailingWhitespace: false,
      maxBlankLines: 2,
    };
  }

  initializeRules() {
    this.rules = {
      indentation: {
        name: "indentation",
        description: "Enforces consistent indentation style",
        severity: "low",
        enabled: true,
        options: {
          style: this.config.indentStyle,
          size: this.config.indentSize,
        },
      },
      spacing: {
        operators: {
          name: "operator-spacing",
          description: "Requires spaces around operators",
          severity: "low",
          enabled: true,
        },
        keywords: {
          name: "keyword-spacing",
          description: "Requires spaces after keywords",
          severity: "low",
          enabled: true,
        },
        brackets: {
          name: "bracket-spacing",
          description: "Requires spaces inside brackets",
          severity: "low",
          enabled: true,
        },
        commas: {
          name: "comma-spacing",
          description: "Requires space after commas",
          severity: "low",
          enabled: true,
        },
      },
      semicolons: {
        name: "semicolons",
        description: "Enforces semicolon usage",
        severity: "medium",
        enabled: true,
        options: {
          required: this.config.semicolons,
        },
      },
      quotes: {
        name: "quotes",
        description: "Enforces consistent quote style",
        severity: "low",
        enabled: true,
        options: {
          style: this.config.quotes,
        },
      },
      braces: {
        name: "brace-style",
        description: "Enforces consistent brace style",
        severity: "medium",
        enabled: true,
        options: {
          style: this.config.braceStyle,
        },
      },
      lineLength: {
        name: "max-line-length",
        description: "Enforces maximum line length",
        severity: "low",
        enabled: true,
        options: {
          max: this.config.maxLineLength,
        },
      },
      trailingWhitespace: {
        name: "no-trailing-whitespace",
        description: "Disallows trailing whitespace",
        severity: "low",
        enabled: true,
      },
      blankLines: {
        name: "no-multiple-blank-lines",
        description: "Limits consecutive blank lines",
        severity: "low",
        enabled: true,
        options: {
          max: this.config.maxBlankLines,
        },
      },
    };
    return this.rules;
  }

  apply(code, options = {}) {
    this.reset();
    this.sourceCode = code;
    this.lines = code.split("\n");
    this.initializeRules();

    this.config = {
      ...this.config,
      ...options,
    };

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        allowReturnOutsideFunction: true,
        errorRecovery: true,
        tokens: true,
        comment: true,
      });
    } catch (error) {
      this.violations.push({
        rule: "parse-error",
        message: `Failed to parse code: ${error.message}`,
        severity: "critical",
        line: 0,
        column: 0,
      });
      return this.violations;
    }

    this.checkStyle(ast, code);
    this.statistics.totalChecks = this.violations.length;

    return this.violations;
  }

  checkStyle(ast, code) {
    this.checkIndentation();
    this.checkLineLength();
    this.checkTrailingWhitespace();
    this.checkBlankLines();
    this.checkASTStyle(ast, code);
  }

  checkIndentation() {
    let expectedIndent = 0;
    const indentChar =
      this.config.indentStyle === "tab"
        ? "\t"
        : " ".repeat(this.config.indentSize);

    this.lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.trim().length === 0) return;

      let actualIndent = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === " " || line[i] === "\t") {
          actualIndent++;
        } else {
          break;
        }
      }

      const trimmed = line.trim();

      if (
        trimmed.startsWith("}") ||
        trimmed.startsWith("]") ||
        trimmed.startsWith(")")
      ) {
        expectedIndent = Math.max(0, expectedIndent - 1);
      }

      const expectedIndentSize =
        expectedIndent *
        (this.config.indentStyle === "tab" ? 1 : this.config.indentSize);

      if (actualIndent !== expectedIndentSize) {
        const expectedChars =
          this.config.indentStyle === "tab" ? "tabs" : "spaces";

        this.addViolation({
          rule: this.rules.indentation.name,
          message: `Expected indentation of ${expectedIndentSize} ${expectedChars} but found ${actualIndent}`,
          severity: this.rules.indentation.severity,
          line: lineNum,
          column: 1,
          suggestion: `Adjust indentation to match the expected style`,
        });
        this.statistics.indentationIssues++;
        this.statistics.styleIssues++;
      }

      if (this.config.indentStyle === "space") {
        const hasTabs = /\t/.test(line.substring(0, actualIndent));
        if (hasTabs) {
          this.addViolation({
            rule: this.rules.indentation.name,
            message: "Tabs found when spaces are expected",
            severity: this.rules.indentation.severity,
            line: lineNum,
            column: 1,
            suggestion: "Replace tabs with spaces",
          });
          this.statistics.indentationIssues++;
          this.statistics.styleIssues++;
        }
      } else {
        const hasSpaces = /  /.test(line.substring(0, actualIndent));
        if (hasSpaces && actualIndent > 0) {
          this.addViolation({
            rule: this.rules.indentation.name,
            message: "Spaces found when tabs are expected",
            severity: this.rules.indentation.severity,
            line: lineNum,
            column: 1,
            suggestion: "Replace spaces with tabs",
          });
          this.statistics.indentationIssues++;
          this.statistics.styleIssues++;
        }
      }

      const openBraces = (trimmed.match(/{/g) || []).length;
      const closeBraces = (trimmed.match(/}/g) || []).length;
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;

      expectedIndent += openBraces + openBrackets + openParens;
      expectedIndent -= closeBraces + closeBrackets + closeParens;
      expectedIndent = Math.max(0, expectedIndent);
    });
  }

  checkLineLength() {
    const maxLength = this.config.maxLineLength;

    this.lines.forEach((line, index) => {
      if (line.length > maxLength) {
        this.addViolation({
          rule: this.rules.lineLength.name,
          message: `Line exceeds maximum length of ${maxLength} characters (${line.length} characters)`,
          severity: this.rules.lineLength.severity,
          line: index + 1,
          column: maxLength + 1,
          suggestion: "Break the line into multiple lines",
        });
        this.statistics.lineLengthIssues++;
        this.statistics.styleIssues++;
      }
    });
  }

  checkTrailingWhitespace() {
    if (this.config.allowTrailingWhitespace) return;

    this.lines.forEach((line, index) => {
      if (/[ \t]$/.test(line)) {
        this.addViolation({
          rule: this.rules.trailingWhitespace.name,
          message: "Trailing whitespace detected",
          severity: this.rules.trailingWhitespace.severity,
          line: index + 1,
          column: line.length,
          suggestion: "Remove trailing whitespace",
        });
        this.statistics.trailingWhitespaceIssues++;
        this.statistics.styleIssues++;
      }
    });
  }

  checkBlankLines() {
    let consecutiveBlankLines = 0;

    this.lines.forEach((line, index) => {
      if (line.trim().length === 0) {
        consecutiveBlankLines++;
      } else {
        if (consecutiveBlankLines > this.config.maxBlankLines) {
          this.addViolation({
            rule: this.rules.blankLines.name,
            message: `Too many blank lines (${consecutiveBlankLines} consecutive, max ${this.config.maxBlankLines})`,
            severity: this.rules.blankLines.severity,
            line: index - consecutiveBlankLines + 1,
            column: 1,
            suggestion: "Remove extra blank lines",
          });
          this.statistics.blankLineIssues++;
          this.statistics.styleIssues++;
        }
        consecutiveBlankLines = 0;
      }
    });
  }

  checkASTStyle(ast, code) {
    const self = this;

    traverse(ast, {
      StringLiteral(path) {
        self.checkQuoteStyle(path, code);
      },
      TemplateLiteral(path) {
        self.checkTemplateLiteralStyle(path);
      },
      VariableDeclaration(path) {
        self.checkSemicolon(path, code);
      },
      ExpressionStatement(path) {
        self.checkSemicolon(path, code);
      },
      ReturnStatement(path) {
        self.checkSemicolon(path, code);
      },
      IfStatement(path) {
        self.checkBraceStyle(path, code);
      },
      ForStatement(path) {
        self.checkBraceStyle(path, code);
      },
      WhileStatement(path) {
        self.checkBraceStyle(path, code);
      },
      FunctionDeclaration(path) {
        self.checkBraceStyle(path, code);
      },
      BinaryExpression(path) {
        self.checkOperatorSpacing(path, code);
      },
      LogicalExpression(path) {
        self.checkOperatorSpacing(path, code);
      },
      AssignmentExpression(path) {
        self.checkOperatorSpacing(path, code);
      },
      CallExpression(path) {
        self.checkCommaSpacing(path, code);
      },
      FunctionExpression(path) {
        self.checkKeywordSpacing(path, code);
      },
      ArrowFunctionExpression(path) {
        self.checkKeywordSpacing(path, code);
      },
    });
  }

  checkQuoteStyle(path, code) {
    if (!path.node.loc) return;

    const line = this.lines[path.node.loc.start.line - 1];
    const raw = this.extractRawString(line, path.node.loc);

    if (!raw) return;

    const hasSingleQuote = raw.startsWith("'") && raw.endsWith("'");
    const hasDoubleQuote = raw.startsWith('"') && raw.endsWith('"');

    if (this.config.quotes === "single" && hasDoubleQuote) {
      const value = path.node.value;
      if (!value.includes("'")) {
        this.addViolation({
          rule: this.rules.quotes.name,
          message: "Double quotes used when single quotes are preferred",
          severity: this.rules.quotes.severity,
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
          suggestion: "Use single quotes instead of double quotes",
        });
        this.statistics.quoteIssues++;
        this.statistics.styleIssues++;
      }
    } else if (this.config.quotes === "double" && hasSingleQuote) {
      const value = path.node.value;
      if (!value.includes('"')) {
        this.addViolation({
          rule: this.rules.quotes.name,
          message: "Single quotes used when double quotes are preferred",
          severity: this.rules.quotes.severity,
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
          suggestion: "Use double quotes instead of single quotes",
        });
        this.statistics.quoteIssues++;
        this.statistics.styleIssues++;
      }
    }
  }

  checkTemplateLiteralStyle(path) {
    const expressions = path.node.expressions;
    const quasis = path.node.quasis;

    if (expressions.length === 0 && quasis.length === 1) {
      this.addViolation({
        rule: this.rules.quotes.name,
        message:
          "Template literal without expressions should use regular quotes",
        severity: this.rules.quotes.severity,
        line: path.node.loc ? path.node.loc.start.line : 0,
        column: path.node.loc ? path.node.loc.start.column : 0,
        suggestion: "Use regular string quotes instead of template literal",
      });
      this.statistics.quoteIssues++;
      this.statistics.styleIssues++;
    }
  }

  checkSemicolon(path, code) {
    if (!path.node.loc) return;

    const line = this.lines[path.node.loc.end.line - 1];
    const endIndex = path.node.loc.end.column;

    if (endIndex <= line.length) {
      const charAfter = line.substring(endIndex).trim();
      const hasSemicolon = line.substring(0, endIndex).trim().endsWith(";");

      if (this.config.semicolons && !hasSemicolon && charAfter === "") {
        this.addViolation({
          rule: this.rules.semicolons.name,
          message: "Missing semicolon",
          severity: this.rules.semicolons.severity,
          line: path.node.loc.end.line,
          column: path.node.loc.end.column,
          suggestion: "Add a semicolon at the end of the statement",
        });
        this.statistics.semicolonIssues++;
        this.statistics.styleIssues++;
      } else if (!this.config.semicolons && hasSemicolon) {
        this.addViolation({
          rule: this.rules.semicolons.name,
          message: "Unnecessary semicolon",
          severity: this.rules.semicolons.severity,
          line: path.node.loc.end.line,
          column: path.node.loc.end.column,
          suggestion: "Remove the semicolon",
        });
        this.statistics.semicolonIssues++;
        this.statistics.styleIssues++;
      }
    }
  }

  checkBraceStyle(path, code) {
    if (!path.node.loc) return;

    const node = path.node;
    let body;
    let hasBlockBody = false;

    if (t.isIfStatement(node)) {
      body = node.consequent;
      hasBlockBody = t.isBlockStatement(body);

      if (!hasBlockBody && this.config.braceStyle !== "none") {
        this.addViolation({
          rule: this.rules.braces.name,
          message: "Missing braces around if statement body",
          severity: this.rules.braces.severity,
          line: node.loc.start.line,
          column: node.loc.start.column,
          suggestion: "Add braces around the statement body",
        });
        this.statistics.braceIssues++;
        this.statistics.styleIssues++;
      }

      if (hasBlockBody && node.loc.start.line === body.loc.start.line) {
        if (this.config.braceStyle === "allman") {
          this.addViolation({
            rule: this.rules.braces.name,
            message: "Opening brace should be on a new line (Allman style)",
            severity: this.rules.braces.severity,
            line: body.loc.start.line,
            column: body.loc.start.column,
            suggestion: "Move opening brace to a new line",
          });
          this.statistics.braceIssues++;
          this.statistics.styleIssues++;
        }
      } else if (hasBlockBody && node.loc.start.line !== body.loc.start.line) {
        if (this.config.braceStyle === "1tbs") {
          this.addViolation({
            rule: this.rules.braces.name,
            message: "Opening brace should be on the same line (1TBS style)",
            severity: this.rules.braces.severity,
            line: node.loc.end.line,
            column: node.loc.end.column,
            suggestion: "Move opening brace to the same line as the statement",
          });
          this.statistics.braceIssues++;
          this.statistics.styleIssues++;
        }
      }
    } else if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) {
      body = node.body;
      hasBlockBody = t.isBlockStatement(body);

      if (node.loc && body.loc) {
        if (node.loc.start.line !== body.loc.start.line) {
          if (this.config.braceStyle === "1tbs") {
            this.addViolation({
              rule: this.rules.braces.name,
              message: "Opening brace should be on the same line (1TBS style)",
              severity: this.rules.braces.severity,
              line: node.loc.end.line,
              column: node.loc.end.column,
              suggestion:
                "Move opening brace to the same line as the function declaration",
            });
            this.statistics.braceIssues++;
            this.statistics.styleIssues++;
          }
        } else {
          if (this.config.braceStyle === "allman") {
            this.addViolation({
              rule: this.rules.braces.name,
              message: "Opening brace should be on a new line (Allman style)",
              severity: this.rules.braces.severity,
              line: body.loc.start.line,
              column: body.loc.start.column,
              suggestion: "Move opening brace to a new line",
            });
            this.statistics.braceIssues++;
            this.statistics.styleIssues++;
          }
        }
      }
    }
  }

  checkOperatorSpacing(path, code) {
    if (!path.node.loc) return;

    const line = this.lines[path.node.loc.start.line - 1];
    const operator = path.node.operator;

    const startCol = path.node.loc.start.column;
    const endCol = path.node.loc.end.column;
    const segment = line.substring(startCol, endCol);

    const operatorPattern = new RegExp(
      `([^ ])${this.escapeRegex(operator)}|${this.escapeRegex(operator)}([^ ])`
    );

    if (operatorPattern.test(segment)) {
      this.addViolation({
        rule: this.rules.spacing.operators.name,
        message: `Missing spaces around operator '${operator}'`,
        severity: this.rules.spacing.operators.severity,
        line: path.node.loc.start.line,
        column: path.node.loc.start.column,
        suggestion: `Add spaces around the '${operator}' operator`,
      });
      this.statistics.spacingIssues++;
      this.statistics.styleIssues++;
    }
  }

  checkCommaSpacing(path, code) {
    if (!path.node.loc) return;

    const args = path.node.arguments;

    for (let i = 0; i < args.length - 1; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      if (
        arg.loc &&
        nextArg.loc &&
        arg.loc.end.line === nextArg.loc.start.line
      ) {
        const line = this.lines[arg.loc.end.line - 1];
        const between = line.substring(
          arg.loc.end.column,
          nextArg.loc.start.column
        );

        const commaIndex = between.indexOf(",");
        if (commaIndex !== -1) {
          const afterComma = between.substring(commaIndex + 1);
          if (!afterComma.startsWith(" ")) {
            this.addViolation({
              rule: this.rules.spacing.commas.name,
              message: "Missing space after comma",
              severity: this.rules.spacing.commas.severity,
              line: arg.loc.end.line,
              column: arg.loc.end.column + commaIndex + 1,
              suggestion: "Add a space after the comma",
            });
            this.statistics.spacingIssues++;
            this.statistics.styleIssues++;
          }
        }
      }
    }
  }

  checkKeywordSpacing(path, code) {
    if (!path.node.loc) return;

    const node = path.node;

    if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) {
      if (node.id && node.loc) {
        const line = this.lines[node.loc.start.line - 1];
        const keywordIndex = line.indexOf("function");

        if (keywordIndex !== -1) {
          const beforeKeyword = line.substring(0, keywordIndex);
          if (beforeKeyword.length > 0 && !beforeKeyword.endsWith(" ")) {
            this.addViolation({
              rule: this.rules.spacing.keywords.name,
              message: "Missing space before function keyword",
              severity: this.rules.spacing.keywords.severity,
              line: node.loc.start.line,
              column: keywordIndex,
              suggestion: "Add a space before the function keyword",
            });
            this.statistics.spacingIssues++;
            this.statistics.styleIssues++;
          }
        }
      }
    }
  }

  extractRawString(line, loc) {
    if (!loc) return null;

    const start = loc.start.column;
    const end = loc.end.column;

    return line.substring(start, end);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  addViolation(violation) {
    this.violations.push({
      ...violation,
      timestamp: Date.now(),
    });
  }

  getViolations() {
    return [...this.violations];
  }

  getStatistics() {
    return { ...this.statistics };
  }

  reset() {
    this.violations = [];
    this.sourceCode = "";
    this.lines = [];
    this.statistics = {
      totalChecks: 0,
      styleIssues: 0,
      indentationIssues: 0,
      spacingIssues: 0,
      semicolonIssues: 0,
      quoteIssues: 0,
      braceIssues: 0,
      lineLengthIssues: 0,
      trailingWhitespaceIssues: 0,
      blankLineIssues: 0,
    };
    this.rules = {};
  }
}

module.exports = StyleRules;
