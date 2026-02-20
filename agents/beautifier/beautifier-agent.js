/**
 * Beautifier Agent - Core Implementation
 * Production-grade code beautification and formatting system
 *
 * This module provides comprehensive code beautification including:
 * - Multi-language support (JS, TS, JSX, TSX, JSON, CSS, HTML)
 * - Syntax error detection and fixing
 * - Custom formatting rules
 * - Prettier integration with fallbacks
 */
const prettier = require("prettier");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const { parse } = require("@babel/parser");

class BeautifierAgent {
  constructor(options = {}) {
    this.name = "beautifier";
    this.version = "3.0.0";
    this.options = this.initializeOptions(options);
    this.stats = {
      linesFormatted: 0,
      commentsPreserved: 0,
      syntaxFixed: 0,
      formattingPasses: 0,
    };
    this.formattingRules = this.initializeFormattingRules();
  }

  initializeOptions(options) {
    return {
      tabWidth: options.tabWidth || 2,
      useTabs: options.useTabs || false,
      semi: options.semi !== false,
      singleQuote: options.singleQuote !== false,
      trailingComma: options.trailingComma || "es5",
      bracketSpacing: options.bracketSpacing !== false,
      arrowParens: options.arrowParens || "always",
      endOfLine: options.endOfLine || "lf",
      printWidth: options.printWidth || 100,
      proseWrap: options.proseWrap || "preserve",
      verboseLogging: options.verboseLogging || false,
      timeout: options.timeout || 60000,
      ...options,
    };
  }

  initializeFormattingRules() {
    return {
      javascript: {
        parser: "babel",
        plugins: ["babel", "babel-ts", "babel-flow"],
      },
      typescript: {
        parser: "typescript",
        plugins: ["typescript"],
      },
      jsx: {
        parser: "babel",
        plugins: ["babel", "jsx"],
      },
      tsx: {
        parser: "typescript",
        plugins: ["typescript", "jsx"],
      },
      json: {
        parser: "json",
        plugins: ["json"],
      },
      css: {
        parser: "css",
        plugins: ["postcss"],
      },
      html: {
        parser: "html",
        plugins: ["html"],
      },
      markdown: {
        parser: "markdown",
        plugins: ["markdown"],
      },
    };
  }

  analyze(code, context = {}) {
    const startTime = Date.now();
    this.stats = {
      linesFormatted: 0,
      commentsPreserved: 0,
      syntaxFixed: 0,
      formattingPasses: 0,
    };

    const result = {
      agent: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      formatted: "",
      originalLength: code.length,
      formattedLength: 0,
      language: null,
      statistics: {},
      changes: [],
      warnings: [],
      errors: [],
      analysisTime: 0,
    };

    try {
      if (this.options.verboseLogging) {
        console.log("[BeautifierAgent] Starting beautification...");
      }

      const language = this.detectLanguage(code);
      result.language = language;

      const preprocessed = this.preprocessCode(code);

      const fixed = this.applySyntaxFixes(preprocessed);
      if (fixed !== preprocessed) {
        this.stats.syntaxFixed++;
        result.changes.push({
          type: "syntax-fix",
          description: "Applied syntax corrections",
        });
      }

      const formatted = this.formatWithPrettier(fixed, language);
      result.formatted = formatted;

      const postProcessed = this.postProcess(formatted);
      result.formatted = postProcessed;
      result.formattedLength = postProcessed.length;
      result.statistics = this.calculateStatistics(code, postProcessed);
      this.stats.linesFormatted = postProcessed.split("\n").length;

      result.analysisTime = Date.now() - startTime;

      if (this.options.verboseLogging) {
        console.log(
          `[BeautifierAgent] Beautification complete in ${result.analysisTime}ms`
        );
      }
    } catch (error) {
      result.errors.push({
        type: "beautification-error",
        message: error.message,
        stack: error.stack,
      });
      result.formatted = this.basicFormat(code);
      result.formattedLength = result.formatted.length;
    }

    return result;
  }

  detectLanguage(code) {
    if (
      /:\s*(string|number|boolean|any|void|never|unknown)\s*[,=;)]]/.test(code)
    ) {
      if (/<[A-Z]/.test(code) || /interface\s+\w+/.test(code)) {
        return "tsx";
      }
      return "typescript";
    }

    if (
      /<[A-Z]/.test(code) ||
      /<[a-z]+[^>]*>/.test(code) ||
      /\{[^}]*<[a-z]/.test(code)
    ) {
      if (/:\s*(string|number)/.test(code)) {
        return "tsx";
      }
      return "jsx";
    }

    if (/^\s*[\[{]/.test(code) && /[\]}]\s*$/.test(code)) {
      try {
        JSON.parse(code);
        return "json";
      } catch (e) {}
    }

    if (
      /[.#][\w-]+\s*\{/.test(code) ||
      /@media|@keyframes|@import/.test(code)
    ) {
      return "css";
    }

    if (/<html|<div|<span|<p>|<!DOCTYPE/i.test(code)) {
      return "html";
    }

    if (
      /^#{1,6}\s/m.test(code) ||
      /^\s*[-*]\s/m.test(code) ||
      /^\s*\d+\.\s/m.test(code)
    ) {
      return "markdown";
    }

    return "javascript";
  }

  preprocessCode(code) {
    let processed = code;
    processed = processed.replace(/\/\/#\s*sourceMappingURL=.*$/gm, "");
    processed = processed.replace(/\/\*\s*@sourceMappingURL.*?\*\//g, "");
    processed = processed.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (processed.charCodeAt(0) === 0xfeff) {
      processed = processed.slice(1);
    }
    processed = this.fixCommonSyntaxIssues(processed);
    processed = processed.replace(/[ \t]+/g, " ");
    processed = processed.replace(/\n{3,}/g, "\n\n");
    return processed;
  }

  fixCommonSyntaxIssues(code) {
    let fixed = code;
    fixed = fixed.replace(/([a-zA-Z0-9\]\)])(?=\s*\()/g, "$1;");
    fixed = fixed.replace(/,\s*}/g, "}");
    fixed = fixed.replace(/,\s*\]/g, "]");
    fixed = fixed.replace(/;{2,}/g, ";");
    return fixed;
  }

  applySyntaxFixes(code) {
    let fixed = code;
    try {
      parse(code, {
        sourceType: "unambiguous",
        errorRecovery: true,
        plugins: ["jsx", "typescript", "classProperties"],
      });
    } catch (error) {
      fixed = this.tryFixParseError(code, error);
    }
    return fixed;
  }

  tryFixParseError(code, error) {
    let fixed = code;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      fixed += "]".repeat(openBrackets - closeBrackets);
    }
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      fixed += "}".repeat(openBraces - closeBraces);
    }
    const openParens = (fixed.match(/\(/g) || []).length;
    const closeParens = (fixed.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      fixed += ")".repeat(openParens - closeParens);
    }
    return fixed;
  }

  formatWithPrettier(code, language) {
    const parser = this.getParser(language);
    try {
      this.stats.formattingPasses++;
      return prettier.format(code, {
        ...this.options,
        parser,
        plugins: prettier.getSupportInfo().plugins,
      });
    } catch (error) {
      return this.fallbackFormat(code, language);
    }
  }

  getParser(language) {
    const parserMap = {
      javascript: "babel",
      typescript: "typescript",
      jsx: "babel",
      tsx: "typescript",
      json: "json",
      css: "css",
      html: "html",
      markdown: "markdown",
    };
    return parserMap[language] || "babel";
  }

  fallbackFormat(code, language) {
    try {
      const ast = parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
      return generate(ast, {
        comments: true,
        compact: false,
        concise: false,
        retainLines: true,
      }).code;
    } catch (error) {
      return this.basicFormat(code);
    }
  }

  basicFormat(code) {
    let formatted = code;
    formatted = formatted.replace(/;\s*(?=[a-zA-Z{}])/g, ";\n");
    formatted = formatted.replace(/\}\s*(?=[a-zA-Z{}])/g, "}\n");
    const lines = formatted.split("\n");
    let indent = 0;
    formatted = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("}")) {
          indent = Math.max(0, indent - 1);
        }
        const result = "  ".repeat(indent) + trimmed;
        if (trimmed.endsWith("{")) {
          indent++;
        }
        return result;
      })
      .join("\n");
    return formatted;
  }

  postProcess(code) {
    let processed = code;
    processed = processed.replace(/\n+$/, "\n");
    if (!processed.endsWith("\n")) {
      processed += "\n";
    }
    processed = processed.replace(/[ \t]+$/gm, "");
    processed = processed.replace(/\s*([+\-*/%=<>!&|^~?:])\s*/g, " $1 ");
    processed = processed.replace(/ {2,}/g, " ");
    return processed;
  }

  calculateStatistics(original, formatted) {
    const originalLines = original.split("\n").length;
    const formattedLines = formatted.split("\n").length;
    return {
      originalLength: original.length,
      formattedLength: formatted.length,
      originalLines: originalLines,
      formattedLines: formattedLines,
      linesChanged: Math.abs(formattedLines - originalLines),
      reduction:
        ((1 - formatted.length / original.length) * 100).toFixed(2) + "%",
      commentsPreserved: this.stats.commentsPreserved,
      syntaxFixed: this.stats.syntaxFixed,
      formattingPasses: this.stats.formattingPasses,
    };
  }

  formatSection(code, startLine, endLine, options = {}) {
    const lines = code.split("\n");
    const section = lines.slice(startLine - 1, endLine).join("\n");
    const formatted = prettier.format(section, {
      ...this.options,
      ...options,
      parser:
        this.detectLanguage(section) === "javascript" ? "babel" : "typescript",
    });
    const formattedLines = formatted.split("\n");
    lines.splice(startLine - 1, endLine - startLine + 1, ...formattedLines);
    return lines.join("\n");
  }

  formatWithCustomRules(code, rules) {
    let formatted = code;
    for (const rule of rules) {
      switch (rule.type) {
        case "indent":
          formatted = this.applyCustomIndentation(formatted, rule.options);
          break;
        case "line-width":
          formatted = this.enforceLineWidth(formatted, rule.maxWidth);
          break;
        case "brace-style":
          formatted = this.fixBraceStyle(formatted, rule.style);
          break;
        case "quotes":
          formatted = this.normalizeQuotes(formatted, rule.quoteType);
          break;
        case "semicolons":
          formatted = this.normalizeSemicolons(formatted, rule.require);
          break;
        case "whitespace":
          formatted = this.normalizeWhitespace(formatted, rule.options);
          break;
      }
    }
    return formatted;
  }

  applyCustomIndentation(code, options = {}) {
    const indentSize = options.size || 2;
    const useTabs = options.useTabs || false;
    const indentChar = useTabs ? "\t" : " ".repeat(indentSize);
    const lines = code.split("\n");
    return lines
      .map((line) => {
        const match = line.match(/^(\s*)/);
        const currentIndent = match ? match[1].length : 0;
        const newIndent = Math.round(currentIndent / indentSize) * indentSize;
        return (
          indentChar.repeat(newIndent / (useTabs ? 1 : indentSize)) +
          line.trim()
        );
      })
      .join("\n");
  }

  enforceLineWidth(code, maxWidth = 100) {
    const lines = code.split("\n");
    return lines
      .map((line) => {
        if (line.length <= maxWidth) return line;
        const parts = line.split(/\s+/);
        if (parts.length === 1) return line;
        let currentLine = "";
        const brokenLines = [];
        for (const part of parts) {
          if ((currentLine + " " + part).length <= maxWidth) {
            currentLine = currentLine ? currentLine + " " + part : part;
          } else {
            if (currentLine) brokenLines.push(currentLine);
            currentLine = part;
          }
        }
        if (currentLine) brokenLines.push(currentLine);
        return brokenLines.join("\n" + " ".repeat(this.options.tabWidth * 2));
      })
      .join("\n");
  }

  fixBraceStyle(code, style = "1tbs") {
    if (style === "1tbs") {
      return code
        .replace(/if\s*\([^)]+\)\s*[^{]/g, "if ($&)\n  {")
        .replace(/}\s*else\s*/g, "\n} else ")
        .replace(/}\s*catch\s*\(/g, "\n} catch (")
        .replace(/}\s*finally\s*/g, "\n} finally ");
    } else if (style === "allman") {
      return code
        .replace(/if\s*\([^)]+\)\s*\{/g, "if ($&)\n{")
        .replace(/else\s*\{/g, "else\n{");
    }
    return code;
  }

  normalizeQuotes(code, quoteType = "single") {
    if (quoteType === "single") {
      return code.replace(/"(?=[^"\\]*(?:\\.[^"\\]*)*")/g, "'");
    } else if (quoteType === "double") {
      return code.replace(/'(?=[^'\\]*(?:\\.[^'\\]*)*')/g, '"');
    }
    return code;
  }

  normalizeSemicolons(code, require = true) {
    if (require) {
      return code.replace(/([^;}\n])\s*$/gm, "$1;");
    } else {
      return code.replace(/;\s*}/g, "}");
    }
  }

  normalizeWhitespace(code, options = {}) {
    let normalized = code;
    if (options.removeExtra) {
      normalized = normalized.replace(/\s+/g, " ");
    }
    if (options.normalizeNewlines) {
      normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }
    if (options.trimLines) {
      const lines = normalized.split("\n");
      normalized = lines.map((line) => line.trim()).join("\n");
    }
    return normalized;
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  getOptions() {
    return { ...this.options };
  }

  getStatistics() {
    return { ...this.stats };
  }

  dispose() {
    this.formattingRules = {};
  }
}

module.exports = BeautifierAgent;
