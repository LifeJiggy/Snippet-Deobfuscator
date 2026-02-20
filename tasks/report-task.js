const fs = require("fs");
const path = require("path");

class ReportTask {
  constructor(options = {}) {
    this.name = "ReportTask";
    this.version = "3.0.0";
    this.options = {
      outputDir: options.outputDir || "./reports",
      defaultFormat: options.defaultFormat || "json",
      includeTimestamp: options.includeTimestamp !== false,
      prettyPrint: options.prettyPrint !== false,
      maxReportSize: options.maxReportSize || 10 * 1024 * 1024,
      templateDir: options.templateDir || "./templates",
    };
    this.templates = new Map();
    this.reports = new Map();
    this.formatters = new Map();
    this.statistics = {
      totalGenerated: 0,
      totalSize: 0,
      byFormat: {},
      averageGenerationTime: 0,
      errors: 0,
    };
    this._generationTimes = [];
    this._initializeFormatters();
    this._initializeTemplates();
  }

  _initializeFormatters() {
    this.registerFormatter("json", {
      extension: ".json",
      contentType: "application/json",
      format: (data, options) => this._formatJSON(data, options),
    });
    this.registerFormatter("html", {
      extension: ".html",
      contentType: "text/html",
      format: (data, options) => this._formatHTML(data, options),
    });
    this.registerFormatter("markdown", {
      extension: ".md",
      contentType: "text/markdown",
      format: (data, options) => this._formatMarkdown(data, options),
    });
    this.registerFormatter("csv", {
      extension: ".csv",
      contentType: "text/csv",
      format: (data, options) => this._formatCSV(data, options),
    });
    this.registerFormatter("xml", {
      extension: ".xml",
      contentType: "application/xml",
      format: (data, options) => this._formatXML(data, options),
    });
    this.registerFormatter("text", {
      extension: ".txt",
      contentType: "text/plain",
      format: (data, options) => this._formatText(data, options),
    });
  }

  _initializeTemplates() {
    this.registerTemplate("analysis", {
      name: "Analysis Report",
      sections: ["summary", "metrics", "issues", "recommendations"],
    });
    this.registerTemplate("validation", {
      name: "Validation Report",
      sections: ["summary", "violations", "warnings", "suggestions"],
    });
    this.registerTemplate("transformation", {
      name: "Transformation Report",
      sections: ["summary", "changes", "before", "after"],
    });
    this.registerTemplate("optimization", {
      name: "Optimization Report",
      sections: ["summary", "sizeComparison", "optimizations", "savings"],
    });
    this.registerTemplate("extraction", {
      name: "Extraction Report",
      sections: ["summary", "strings", "functions", "variables", "classes"],
    });
  }

  async generateReport(data, options = {}) {
    if (!data || typeof data !== "object") {
      throw new Error("Data must be a valid object");
    }
    const startTime = Date.now();
    const reportId = `report-${startTime}`;
    const format = options.format || this.options.defaultFormat;
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }
    try {
      const templateName = options.template || "analysis";
      const template = this.templates.get(templateName);
      const reportData = this._prepareData(data, template, options);
      const content = await formatter.format(reportData, options);
      const report = {
        id: reportId,
        format,
        content,
        size: content.length,
        template: templateName,
        generatedAt: new Date().toISOString(),
        metadata: options.metadata || {},
      };
      if (options.outputFile) {
        await this._writeReport(options.outputFile, content, format);
        report.file = options.outputFile;
      }
      this._recordGeneration(reportId, report);
      return report;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  _prepareData(data, template, options) {
    if (!template) {
      return data;
    }
    const prepared = {
      title: data.title || template.name || "Report",
      generatedAt: new Date().toISOString(),
      sections: {},
    };
    for (const section of template.sections) {
      if (data[section] !== undefined) {
        prepared.sections[section] = data[section];
      } else {
        prepared.sections[section] = this._generateSection(
          section,
          data,
          options
        );
      }
    }
    prepared.summary = this._generateSummary(data, options);
    return prepared;
  }

  _generateSection(section, data, options) {
    switch (section) {
      case "summary":
        return this._generateSummary(data, options);
      case "metrics":
        return this._extractMetrics(data, options);
      case "issues":
        return this._extractIssues(data, options);
      case "recommendations":
        return this._generateRecommendations(data, options);
      case "violations":
        return this._extractViolations(data, options);
      case "warnings":
        return this._extractWarnings(data, options);
      case "suggestions":
        return this._generateSuggestions(data, options);
      case "changes":
        return this._extractChanges(data, options);
      case "before":
        return data.before || {};
      case "after":
        return data.after || {};
      case "sizeComparison":
        return this._generateSizeComparison(data, options);
      case "optimizations":
        return data.optimizations || [];
      case "savings":
        return this._calculateSavings(data, options);
      case "strings":
        return data.strings || [];
      case "functions":
        return data.functions || [];
      case "variables":
        return data.variables || [];
      case "classes":
        return data.classes || [];
      default:
        return data[section] || {};
    }
  }

  _generateSummary(data, options) {
    return {
      totalItems: this._countItems(data),
      timestamp: new Date().toISOString(),
      status: data.status || "completed",
      duration: data.duration || 0,
    };
  }

  _countItems(data) {
    let count = 0;
    for (const key in data) {
      if (Array.isArray(data[key])) {
        count += data[key].length;
      } else if (typeof data[key] === "object" && data[key] !== null) {
        count += Object.keys(data[key]).length;
      }
    }
    return count;
  }

  _extractMetrics(data, options) {
    const metrics = {};
    if (data.statistics) {
      metrics.statistics = data.statistics;
    }
    if (data.metrics) {
      metrics.custom = data.metrics;
    }
    return metrics;
  }

  _extractIssues(data, options) {
    const issues = [];
    if (data.violations) {
      issues.push(...data.violations);
    }
    if (data.errors) {
      issues.push(...data.errors);
    }
    return issues;
  }

  _generateRecommendations(data, options) {
    const recommendations = [];
    if (data.violations && data.violations.length > 0) {
      recommendations.push({
        type: "fix-violations",
        message: `Address ${data.violations.length} violations found`,
        priority: "high",
      });
    }
    if (data.statistics && data.statistics.averageExecutionTime > 1000) {
      recommendations.push({
        type: "performance",
        message: "Consider optimizing for better performance",
        priority: "medium",
      });
    }
    return recommendations;
  }

  _extractViolations(data, options) {
    return data.violations || [];
  }

  _extractWarnings(data, options) {
    return data.warnings || [];
  }

  _generateSuggestions(data, options) {
    return data.suggestions || [];
  }

  _extractChanges(data, options) {
    return data.changes || [];
  }

  _generateSizeComparison(data, options) {
    return {
      before: data.sizeBefore || 0,
      after: data.sizeAfter || 0,
      saved: data.sizeSaved || 0,
      ratio: data.compressionRatio || 0,
    };
  }

  _calculateSavings(data, options) {
    return {
      bytes: data.sizeSaved || 0,
      percentage: data.compressionRatio || 0,
      optimizations: data.optimizations?.length || 0,
    };
  }

  _formatJSON(data, options = {}) {
    const indent = options.prettyPrint !== false ? 2 : 0;
    return JSON.stringify(data, null, indent);
  }

  _formatHTML(data, options = {}) {
    const title = this._escapeHTML(data.title || "Report");
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px; }
        .metadata { color: #666; font-size: 14px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #007bff; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .success { color: #28a745; }
        pre { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="metadata">
            <p>Generated: ${data.generatedAt || new Date().toISOString()}</p>
        </div>`;
    if (data.summary) {
      html += `
        <div class="section">
            <h2>Summary</h2>
            ${this._formatSummaryHTML(data.summary)}
        </div>`;
    }
    if (data.sections) {
      for (const [name, content] of Object.entries(data.sections)) {
        html += `
        <div class="section">
            <h2>${this._escapeHTML(this._formatSectionName(name))}</h2>
            ${this._formatSectionHTML(name, content)}
        </div>`;
      }
    }
    html += `
    </div>
</body>
</html>`;
    return html;
  }

  _formatSummaryHTML(summary) {
    let html = "<table><tbody>";
    for (const [key, value] of Object.entries(summary)) {
      html += `<tr><th>${this._escapeHTML(key)}</th><td>${this._escapeHTML(
        String(value)
      )}</td></tr>`;
    }
    html += "</tbody></table>";
    return html;
  }

  _formatSectionName(name) {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

  _formatSectionHTML(name, content) {
    if (!content) return "<p>No data</p>";
    if (Array.isArray(content)) {
      if (content.length === 0) return "<p>No items</p>";
      return this._formatArrayHTML(content);
    }
    if (typeof content === "object") {
      return this._formatObjectHTML(content);
    }
    return `<p>${this._escapeHTML(String(content))}</p>`;
  }

  _formatArrayHTML(array) {
    let html = "<table><thead><tr>";
    const keys = this._getObjectKeys(array);
    for (const key of keys) {
      html += `<th>${this._escapeHTML(key)}</th>`;
    }
    html += "</tr></thead><tbody>";
    for (const item of array) {
      html += "<tr>";
      for (const key of keys) {
        const value = item[key];
        html += `<td>${this._formatValueHTML(value)}</td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  _formatObjectHTML(obj, depth = 0) {
    if (depth > 3) return "<p>...</p>";
    let html = "<table><tbody>";
    for (const [key, value] of Object.entries(obj)) {
      html += `<tr><th>${this._escapeHTML(key)}</th>`;
      if (typeof value === "object" && value !== null) {
        html += `<td>${this._formatObjectHTML(value, depth + 1)}</td>`;
      } else {
        html += `<td>${this._formatValueHTML(value)}</td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  _formatValueHTML(value) {
    if (value === null || value === undefined) return "<em>null</em>";
    if (typeof value === "boolean") {
      return `<span class="${value ? "success" : "error"}">${value}</span>`;
    }
    if (typeof value === "object") {
      return this._formatObjectHTML(value);
    }
    return this._escapeHTML(String(value));
  }

  _getObjectKeys(array) {
    const keys = new Set();
    for (const item of array) {
      if (typeof item === "object" && item !== null) {
        Object.keys(item).forEach((key) => keys.add(key));
      }
    }
    return Array.from(keys).slice(0, 10);
  }

  _escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  _formatMarkdown(data, options = {}) {
    let md = `# ${data.title || "Report"}\n\n`;
    md += `**Generated:** ${data.generatedAt || new Date().toISOString()}\n\n`;
    if (data.summary) {
      md += `## Summary\n\n`;
      md += this._formatSummaryMD(data.summary);
    }
    if (data.sections) {
      for (const [name, content] of Object.entries(data.sections)) {
        md += `\n## ${this._formatSectionName(name)}\n\n`;
        md += this._formatSectionMD(name, content);
      }
    }
    return md;
  }

  _formatSummaryMD(summary) {
    let md = "| Property | Value |\n| --- | --- |\n";
    for (const [key, value] of Object.entries(summary)) {
      md += `| ${key} | ${value} |\n`;
    }
    return md + "\n";
  }

  _formatSectionMD(name, content) {
    if (!content) return "*No data*\n";
    if (Array.isArray(content)) {
      if (content.length === 0) return "*No items*\n";
      return this._formatArrayMD(content);
    }
    if (typeof content === "object") {
      return this._formatObjectMD(content);
    }
    return `${content}\n`;
  }

  _formatArrayMD(array) {
    if (array.length === 0) return "*No items*\n";
    const keys = this._getObjectKeys(array);
    let md = "| " + keys.join(" | ") + " |\n";
    md += "| " + keys.map(() => "---").join(" | ") + " |\n";
    for (const item of array.slice(0, 50)) {
      md +=
        "| " +
        keys.map((k) => this._formatValueMD(item[k])).join(" | ") +
        " |\n";
    }
    return md + "\n";
  }

  _formatObjectMD(obj, depth = 0) {
    if (depth > 3) return "...\n";
    let md = "";
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        md += `- **${key}:**\n`;
        md +=
          "  " +
          this._formatObjectMD(value, depth + 1)
            .split("\n")
            .join("\n  ");
      } else {
        md += `- **${key}:** ${this._formatValueMD(value)}\n`;
      }
    }
    return md;
  }

  _formatValueMD(value) {
    if (value === null || value === undefined) return "*null*";
    if (typeof value === "object") return this._formatObjectMD(value);
    return String(value);
  }

  _formatCSV(data, options = {}) {
    const rows = [];
    if (data.summary) {
      rows.push(["Summary"]);
      for (const [key, value] of Object.entries(data.summary)) {
        rows.push([key, String(value)]);
      }
      rows.push([]);
    }
    if (data.sections) {
      for (const [name, content] of Object.entries(data.sections)) {
        rows.push([name]);
        if (Array.isArray(content) && content.length > 0) {
          const keys = this._getObjectKeys(content);
          rows.push(keys);
          for (const item of content) {
            rows.push(keys.map((k) => this._formatValueCSV(item[k])));
          }
        }
        rows.push([]);
      }
    }
    return rows.map((row) => row.join(",")).join("\n");
  }

  _formatValueCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  _formatXML(data, options = {}) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<report>\n";
    xml += `  <title>${this._escapeXML(data.title || "Report")}</title>\n`;
    xml += `  <generatedAt>${
      data.generatedAt || new Date().toISOString()
    }</generatedAt>\n`;
    if (data.summary) {
      xml += "  <summary>\n";
      for (const [key, value] of Object.entries(data.summary)) {
        xml += `    <${key}>${this._escapeXML(String(value))}</${key}>\n`;
      }
      xml += "  </summary>\n";
    }
    if (data.sections) {
      xml += "  <sections>\n";
      for (const [name, content] of Object.entries(data.sections)) {
        xml += `    <${name}>\n`;
        xml += this._formatSectionXML(content, 3);
        xml += `    </${name}>\n`;
      }
      xml += "  </sections>\n";
    }
    xml += "</report>";
    return xml;
  }

  _formatSectionXML(content, indent = 0) {
    const spaces = "  ".repeat(indent);
    if (!content) return "";
    if (Array.isArray(content)) {
      let xml = "";
      for (const item of content) {
        xml += `${spaces}<item>\n`;
        xml += this._formatSectionXML(item, indent + 1);
        xml += `${spaces}</item>\n`;
      }
      return xml;
    }
    if (typeof content === "object") {
      let xml = "";
      for (const [key, value] of Object.entries(content)) {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
        if (typeof value === "object" && value !== null) {
          xml += `${spaces}<${safeKey}>\n`;
          xml += this._formatSectionXML(value, indent + 1);
          xml += `${spaces}</${safeKey}>\n`;
        } else {
          xml += `${spaces}<${safeKey}>${this._escapeXML(
            String(value)
          )}</${safeKey}>\n`;
        }
      }
      return xml;
    }
    return `${spaces}${this._escapeXML(String(content))}\n`;
  }

  _escapeXML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  _formatText(data, options = {}) {
    let text = `${data.title || "Report"}\n${"=".repeat(
      (data.title || "Report").length
    )}\n\n`;
    text += `Generated: ${data.generatedAt || new Date().toISOString()}\n\n`;
    if (data.summary) {
      text += "SUMMARY\n-------\n";
      for (const [key, value] of Object.entries(data.summary)) {
        text += `${key}: ${value}\n`;
      }
      text += "\n";
    }
    if (data.sections) {
      for (const [name, content] of Object.entries(data.sections)) {
        text += `${this._formatSectionName(name).toUpperCase()}\n${"-".repeat(
          name.length
        )}\n`;
        text += this._formatSectionText(content);
        text += "\n";
      }
    }
    return text;
  }

  _formatSectionText(content) {
    if (!content) return "No data\n";
    if (Array.isArray(content)) {
      if (content.length === 0) return "No items\n";
      return (
        content
          .map((item, i) => `${i + 1}. ${JSON.stringify(item)}`)
          .join("\n") + "\n"
      );
    }
    if (typeof content === "object") {
      return JSON.stringify(content, null, 2) + "\n";
    }
    return String(content) + "\n";
  }

  async _writeReport(filename, content, format) {
    const outputDir = this.options.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, content, "utf8");
    return filePath;
  }

  async exportReport(reportId, format, options = {}) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }
    const content = await formatter.format(JSON.parse(report.content), options);
    return {
      content,
      format,
      size: content.length,
    };
  }

  registerFormatter(name, config) {
    this.formatters.set(name, {
      extension: config.extension,
      contentType: config.contentType,
      format: config.format,
    });
    return this;
  }

  unregisterFormatter(name) {
    this.formatters.delete(name);
    return this;
  }

  getFormatter(name) {
    return this.formatters.get(name);
  }

  listFormatters() {
    return Array.from(this.formatters.keys());
  }

  registerTemplate(name, config) {
    this.templates.set(name, {
      name: config.name || name,
      sections: config.sections || [],
    });
    return this;
  }

  unregisterTemplate(name) {
    this.templates.delete(name);
    return this;
  }

  getTemplate(name) {
    return this.templates.get(name);
  }

  listTemplates() {
    return Array.from(this.templates.keys());
  }

  _recordGeneration(id, report) {
    this.reports.set(id, report);
    this.statistics.totalGenerated++;
    this.statistics.totalSize += report.size;
    this.statistics.byFormat[report.format] =
      (this.statistics.byFormat[report.format] || 0) + 1;
    this._generationTimes.push(
      report.generatedAt ? new Date(report.generatedAt).getTime() : Date.now()
    );
  }

  getReport(id) {
    return this.reports.get(id);
  }

  getAllReports() {
    return Array.from(this.reports.entries());
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  clearReports() {
    const count = this.reports.size;
    this.reports.clear();
    return count;
  }

  reset() {
    this.reports.clear();
    this._generationTimes = [];
    this.statistics = {
      totalGenerated: 0,
      totalSize: 0,
      byFormat: {},
      averageGenerationTime: 0,
      errors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.templates.clear();
    this.formatters.clear();
    this.options = {};
    return this;
  }
}

module.exports = ReportTask;
