/**
 * Formatter Utilities
 * Production-grade output formatting utilities
 * Version: 3.0.0
 */

class Formatter {
  constructor(options = {}) {
    this.name = "formatter";
    this.version = "3.0.0";
    this.options = {
      indent: options.indent || 2,
      colorize: options.colorize !== false,
      maxWidth: options.maxWidth || 80,
      theme: options.theme || "default",
      timestamp: options.timestamp || false,
    };
    this.stats = {
      formatted: 0,
      json: 0,
      tables: 0,
      markdown: 0,
      html: 0,
      reports: 0,
    };
    this.colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
    };
  }

  formatJSON(data) {
    try {
      const formatted = JSON.stringify(data, null, this.options.indent);

      this.stats.formatted++;
      this.stats.json++;

      return {
        success: true,
        output: formatted,
        size: formatted.length,
        lines: formatted.split("\n").length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  formatCompactJSON(data) {
    try {
      const formatted = JSON.stringify(data);

      this.stats.formatted++;
      this.stats.json++;

      return {
        success: true,
        output: formatted,
        size: formatted.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  formatTable(data, columns = null) {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: "Data must be a non-empty array" };
      }

      const cols = columns || this._detectColumns(data);
      const rows = data;

      const colWidths = this._calculateColumnWidths(rows, cols);
      const separator = this._createSeparator(colWidths);
      const header = this._createHeader(cols, colWidths);
      const body = this._createBody(rows, cols, colWidths);

      const table = [separator, header, separator, ...body, separator].join(
        "\n"
      );

      this.stats.formatted++;
      this.stats.tables++;

      return {
        success: true,
        output: table,
        rows: rows.length,
        columns: cols.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _detectColumns(data) {
    if (data.length === 0) return [];

    const firstRow = data[0];
    if (typeof firstRow === "object" && firstRow !== null) {
      return Object.keys(firstRow);
    }

    return ["value"];
  }

  _calculateColumnWidths(rows, columns) {
    const widths = columns.map((col) => col.length);

    for (const row of rows) {
      columns.forEach((col, i) => {
        const value = this._getValue(row, col);
        const strValue = String(value);
        widths[i] = Math.max(widths[i], strValue.length);
      });
    }

    return widths.map((w) => Math.min(w, this.options.maxWidth));
  }

  _createSeparator(widths) {
    const parts = widths.map((w) => "-".repeat(w + 2));
    return "+" + parts.join("+") + "+";
  }

  _createHeader(columns, widths) {
    const parts = columns.map((col, i) => {
      const padded = col.padEnd(widths[i]);
      return " " + padded + " ";
    });
    return "|" + parts.join("|") + "|";
  }

  _createBody(rows, columns, widths) {
    return rows.map((row) => {
      const parts = columns.map((col, i) => {
        const value = this._getValue(row, col);
        const strValue = this._truncate(String(value), widths[i]);
        const padded = strValue.padEnd(widths[i]);
        return " " + padded + " ";
      });
      return "|" + parts.join("|") + "|";
    });
  }

  _getValue(row, column) {
    if (typeof row === "object" && row !== null) {
      return row[column] !== undefined ? row[column] : "";
    }
    return row;
  }

  _truncate(str, maxWidth) {
    if (str.length <= maxWidth) {
      return str;
    }
    return str.slice(0, maxWidth - 3) + "...";
  }

  formatMarkdown(data) {
    try {
      let output = "";

      if (Array.isArray(data)) {
        output = this._formatMarkdownArray(data);
      } else if (typeof data === "object" && data !== null) {
        output = this._formatMarkdownObject(data);
      } else {
        output = String(data);
      }

      this.stats.formatted++;
      this.stats.markdown++;

      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _formatMarkdownArray(data) {
    if (data.length === 0) return "";

    if (typeof data[0] === "object" && data[0] !== null) {
      const columns = Object.keys(data[0]);
      let md = "| " + columns.join(" | ") + " |\n";
      md += "| " + columns.map(() => "---").join(" | ") + " |\n";

      for (const row of data) {
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "";
          if (typeof val === "object") return JSON.stringify(val);
          return String(val);
        });
        md += "| " + values.join(" | ") + " |\n";
      }

      return md;
    }

    return data.map((item) => "- " + String(item)).join("\n");
  }

  _formatMarkdownObject(data) {
    const lines = [];

    for (const [key, value] of Object.entries(data)) {
      const header = "## " + key + "\n\n";

      if (Array.isArray(value)) {
        lines.push(header + this._formatMarkdownArray(value));
      } else if (typeof value === "object" && value !== null) {
        lines.push(
          header + "```json\n" + JSON.stringify(value, null, 2) + "\n```"
        );
      } else {
        lines.push(header + String(value));
      }
    }

    return lines.join("\n\n");
  }

  formatHTML(data) {
    try {
      let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
      html += '<meta charset="UTF-8">\n';
      html +=
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
      html += "<title>Output</title>\n";
      html += "<style>\n";
      html += this._getDefaultStyles();
      html += "</style>\n";
      html += "</head>\n<body>\n";

      if (Array.isArray(data)) {
        html += this._formatHTMLArray(data);
      } else if (typeof data === "object" && data !== null) {
        html += this._formatHTMLObject(data);
      } else {
        html += "<p>" + this._escapeHTML(String(data)) + "</p>";
      }

      html += "\n</body>\n</html>";

      this.stats.formatted++;
      this.stats.html++;

      return { success: true, output: html };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _formatHTMLArray(data) {
    if (data.length === 0) return "<p>Empty array</p>";

    if (typeof data[0] === "object" && data[0] !== null) {
      const columns = Object.keys(data[0]);

      let html = '<table class="data-table">\n<thead>\n<tr>\n';
      for (const col of columns) {
        html += "<th>" + this._escapeHTML(col) + "</th>\n";
      }
      html += "</tr>\n</thead>\n<tbody>\n";

      for (const row of data) {
        html += "<tr>\n";
        for (const col of columns) {
          const val = row[col];
          html += "<td>" + this._escapeHTML(String(val ?? "")) + "</td>\n";
        }
        html += "</tr>\n";
      }

      html += "</tbody>\n</table>";
      return html;
    }

    let html = "<ul>\n";
    for (const item of data) {
      html += "<li>" + this._escapeHTML(String(item)) + "</li>\n";
    }
    html += "</ul>";
    return html;
  }

  _formatHTMLObject(data) {
    let html = '<div class="object-container">\n';

    for (const [key, value] of Object.entries(data)) {
      html += '<div class="section">\n';
      html += "<h2>" + this._escapeHTML(key) + "</h2>\n";

      if (Array.isArray(value)) {
        html += this._formatHTMLArray(value);
      } else if (typeof value === "object" && value !== null) {
        html +=
          '<pre class="json">' +
          this._escapeHTML(JSON.stringify(value, null, 2)) +
          "</pre>";
      } else {
        html += "<p>" + this._escapeHTML(String(value)) + "</p>";
      }

      html += "</div>\n";
    }

    html += "</div>";
    return html;
  }

  _escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _getDefaultStyles() {
    return "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; } .object-container { max-width: 1200px; margin: 0 auto; } .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); } h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; } .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; } .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; } .data-table th { background: #f8f9fa; font-weight: 600; } .data-table tr:hover { background: #f8f9fa; } .json { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; } p { color: #555; line-height: 1.6; } ul { list-style-type: disc; padding-left: 20px; } li { margin: 8px 0; color: #555; }";
  }

  formatReport(analysis) {
    try {
      const sections = [];

      sections.push(this._createReportHeader(analysis));

      if (analysis.structure) {
        sections.push(this._formatStructureSection(analysis.structure));
      }

      if (analysis.dependencies) {
        sections.push(this._formatDependenciesSection(analysis.dependencies));
      }

      if (analysis.exports) {
        sections.push(this._formatExportsSection(analysis.exports));
      }

      if (analysis.complexity) {
        sections.push(this._formatComplexitySection(analysis.complexity));
      }

      if (analysis.patterns) {
        sections.push(this._formatPatternsSection(analysis.patterns));
      }

      sections.push(this._createReportFooter());

      const report = sections.join("\n\n");

      this.stats.formatted++;
      this.stats.reports++;

      return { success: true, output: report };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _createReportHeader(analysis) {
    const lines = [];
    lines.push("=".repeat(60));
    lines.push("CODE ANALYSIS REPORT");
    lines.push("=".repeat(60));

    if (this.options.timestamp) {
      lines.push("Generated: " + new Date().toISOString());
    }

    if (analysis.file) {
      lines.push("File: " + analysis.file);
    }

    lines.push("-".repeat(60));
    return lines.join("\n");
  }

  _formatStructureSection(structure) {
    const lines = [];
    lines.push("STRUCTURE ANALYSIS");
    lines.push("-".repeat(40));

    if (structure.functions) {
      lines.push("Functions: " + structure.functions.length);
    }

    if (structure.classes) {
      lines.push("Classes: " + structure.classes.length);
    }

    if (structure.variables) {
      lines.push("Variables: " + structure.variables.length);
    }

    return lines.join("\n");
  }

  _formatDependenciesSection(deps) {
    const lines = [];
    lines.push("DEPENDENCIES");
    lines.push("-".repeat(40));

    if (deps.imports) {
      lines.push("Imports: " + deps.imports.length);
      deps.imports.slice(0, 5).forEach((imp) => {
        lines.push("  - " + imp.source);
      });
      if (deps.imports.length > 5) {
        lines.push("  ... and " + (deps.imports.length - 5) + " more");
      }
    }

    if (deps.external) {
      lines.push("External: " + deps.external.length);
    }

    return lines.join("\n");
  }

  _formatExportsSection(exports) {
    const lines = [];
    lines.push("EXPORTS");
    lines.push("-".repeat(40));

    if (exports.named && exports.named.length > 0) {
      lines.push("Named Exports: " + exports.named.length);
      exports.named.forEach((exp) => {
        lines.push("  - " + exp.name + " (" + exp.type + ")");
      });
    }

    if (exports.default) {
      lines.push(
        "Default Export: " + (exports.default.name || exports.default.type)
      );
    }

    return lines.join("\n");
  }

  _formatComplexitySection(complexity) {
    const lines = [];
    lines.push("COMPLEXITY METRICS");
    lines.push("-".repeat(40));

    lines.push("Cyclomatic Complexity: " + complexity.cyclomatic);
    lines.push("Cognitive Complexity: " + complexity.cognitive);
    lines.push("Lines of Code: " + complexity.lines);
    lines.push("Functions: " + complexity.functions);
    lines.push("Classes: " + complexity.classes);
    lines.push("Max Nesting: " + complexity.maxNesting);

    if (complexity.maintainability !== undefined) {
      lines.push(
        "Maintainability Index: " + complexity.maintainability.toFixed(2)
      );
    }

    return lines.join("\n");
  }

  _formatPatternsSection(patterns) {
    const lines = [];
    lines.push("PATTERNS DETECTED");
    lines.push("-".repeat(40));

    if (patterns.obfuscation && patterns.obfuscation.length > 0) {
      lines.push("Obfuscation Patterns: " + patterns.obfuscation.length);
      patterns.obfuscation.slice(0, 3).forEach((p) => {
        lines.push("  - " + p.type + ": " + p.message);
      });
    }

    if (patterns.designPatterns && patterns.designPatterns.length > 0) {
      lines.push("Design Patterns: " + patterns.designPatterns.length);
    }

    if (patterns.codeSmells && patterns.codeSmells.length > 0) {
      lines.push("Code Smells: " + patterns.codeSmells.length);
    }

    if (patterns.securityIssues && patterns.securityIssues.length > 0) {
      lines.push("Security Issues: " + patterns.securityIssues.length);
      patterns.securityIssues.forEach((s) => {
        lines.push("  - " + s.type + " (" + s.severity + "): " + s.message);
      });
    }

    return lines.join("\n");
  }

  _createReportFooter() {
    const lines = [];
    lines.push("=".repeat(60));
    lines.push("END OF REPORT");
    lines.push("=".repeat(60));
    return lines.join("\n");
  }

  formatColor(text, color) {
    if (!this.options.colorize) {
      return text;
    }

    const colorCode = this.colors[color];
    if (!colorCode) {
      return text;
    }

    return colorCode + text + this.colors.reset;
  }

  formatSuccess(text) {
    return this.formatColor(text, "green");
  }

  formatError(text) {
    return this.formatColor(text, "red");
  }

  formatWarning(text) {
    return this.formatColor(text, "yellow");
  }

  formatInfo(text) {
    return this.formatColor(text, "cyan");
  }

  formatBold(text) {
    if (!this.options.colorize) {
      return text;
    }
    return this.colors.bright + text + this.colors.reset;
  }

  formatDim(text) {
    if (!this.options.colorize) {
      return text;
    }
    return this.colors.dim + text + this.colors.reset;
  }

  formatList(items, options = {}) {
    const bullet = options.bullet || "-";
    const indent = options.indent || "  ";
    const lines = [];

    for (const item of items) {
      if (typeof item === "object" && item !== null) {
        lines.push(indent + bullet + " " + (item.text || JSON.stringify(item)));
        if (item.children && item.children.length > 0) {
          const childLines = this.formatList(item.children, {
            bullet,
            indent: indent + "  ",
          });
          lines.push(childLines);
        }
      } else {
        lines.push(indent + bullet + " " + String(item));
      }
    }

    return lines.join("\n");
  }

  formatTree(data, indent = "") {
    const lines = [];
    const entries = Object.entries(data);

    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        lines.push(indent + prefix + key);
        lines.push(this.formatTree(value, indent + childPrefix));
      } else if (Array.isArray(value)) {
        lines.push(indent + prefix + key + " [" + value.length + " items]");
      } else {
        lines.push(indent + prefix + key + ": " + value);
      }
    });

    return lines.join("\n");
  }

  formatProgressBar(progress, width = 40) {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const percent = Math.round(progress * 100);

    return "[" + bar + "] " + percent + "%";
  }

  formatKeyValue(data, options = {}) {
    const separator = options.separator || ": ";
    const padding = options.padding || 20;
    const lines = [];

    for (const [key, value] of Object.entries(data)) {
      const paddedKey = key.padEnd(padding);
      const displayValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      lines.push(paddedKey + separator + displayValue);
    }

    return lines.join("\n");
  }

  formatCode(code, options = {}) {
    const lines = code.split("\n");
    const numbered = options.lineNumbers !== false;
    const startLine = options.startLine || 1;
    const output = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = startLine + i;
      const line = lines[i];

      if (numbered) {
        const numStr = String(lineNum).padStart(4);
        output.push(numStr + " | " + line);
      } else {
        output.push(line);
      }
    }

    return output.join("\n");
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      formatted: 0,
      json: 0,
      tables: 0,
      markdown: 0,
      html: 0,
      reports: 0,
    };
  }

  dispose() {
    this.reset();
  }
}

module.exports = Formatter;
