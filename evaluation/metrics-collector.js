class MetricsCollector {
  constructor(options = {}) {
    this.name = "MetricsCollector";
    this.version = "3.0.0";
    this.options = {
      collectInterval: options.collectInterval || 1000,
      historySize: options.historySize || 1000,
      enableRealtime: options.enableRealtime !== false,
    };
    this._metrics = new Map();
    this._history = [];
    this._timers = new Map();
    this._listeners = [];
    this._collectInterval = null;
    this.statistics = {
      totalCollections: 0,
      totalMetrics: 0,
      averageCollectionTime: 0,
    };
    if (this.options.enableRealtime) {
      this.startCollection();
    }
  }

  async evaluate(code, options = {}) {
    this.statistics.totalCollections++;
    const startTime = Date.now();
    const result = {
      score: 100,
      grade: "A",
      metrics: {},
      timestamp: startTime,
      duration: 0,
    };
    if (!code || typeof code !== "string") {
      return { error: "Invalid code input", score: 0, grade: "F" };
    }
    result.metrics = await this._collectAllMetrics(code);
    result.duration = Date.now() - startTime;
    this._updateAverageCollectionTime(result.duration);
    this._addToHistory(result.metrics);
    result.score = this._calculateScore(result.metrics);
    result.grade = this._scoreToGrade(result.score);
    return result;
  }

  async _collectAllMetrics(code) {
    const metrics = {
      size: this._collectSizeMetrics(code),
      structure: this._collectStructureMetrics(code),
      syntax: this._collectSyntaxMetrics(code),
      maintainability: this._collectMaintainabilityMetrics(code),
      custom: this._collectCustomMetrics(code),
    };
    this.statistics.totalMetrics += Object.keys(metrics).reduce((sum, key) => {
      return sum + Object.keys(metrics[key]).length;
    }, 0);
    return metrics;
  }

  _collectSizeMetrics(code) {
    const lines = code.split("\n");
    return {
      bytes: Buffer.byteLength(code, "utf8"),
      characters: code.length,
      lines: lines.length,
      nonEmptyLines: lines.filter((l) => l.trim().length > 0).length,
      averageLineLength:
        lines.length > 0 ? Math.round(code.length / lines.length) : 0,
      maxLineLength: Math.max(...lines.map((l) => l.length), 0),
    };
  }

  _collectStructureMetrics(code) {
    const metrics = {
      functions: 0,
      classes: 0,
      imports: 0,
      exports: 0,
      variables: 0,
      constants: 0,
      loops: 0,
      conditionals: 0,
      tryCatch: 0,
      comments: 0,
      asyncAwait: 0,
      promises: 0,
    };
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      traverse(ast, {
        FunctionDeclaration() {
          metrics.functions++;
        },
        FunctionExpression() {
          metrics.functions++;
        },
        ArrowFunctionExpression() {
          metrics.functions++;
        },
        ClassDeclaration() {
          metrics.classes++;
        },
        ClassExpression() {
          metrics.classes++;
        },
        ImportDeclaration() {
          metrics.imports++;
        },
        ExportNamedDeclaration() {
          metrics.exports++;
        },
        ExportDefaultDeclaration() {
          metrics.exports++;
        },
        ExportAllDeclaration() {
          metrics.exports++;
        },
        VariableDeclarator(path) {
          if (path.parent.kind === "const") {
            metrics.constants++;
          } else {
            metrics.variables++;
          }
        },
        ForStatement() {
          metrics.loops++;
        },
        ForInStatement() {
          metrics.loops++;
        },
        ForOfStatement() {
          metrics.loops++;
        },
        WhileStatement() {
          metrics.loops++;
        },
        DoWhileStatement() {
          metrics.loops++;
        },
        IfStatement() {
          metrics.conditionals++;
        },
        SwitchStatement() {
          metrics.conditionals++;
        },
        ConditionalExpression() {
          metrics.conditionals++;
        },
        TryStatement() {
          metrics.tryCatch++;
        },
        AwaitExpression() {
          metrics.asyncAwait++;
        },
        NewExpression(path) {
          if (path.node.callee.name === "Promise") {
            metrics.promises++;
          }
        },
      });
      if (ast.comments) {
        metrics.comments = ast.comments.length;
      }
    } catch (e) {
      // Parse error, use defaults
    }
    return metrics;
  }

  _collectSyntaxMetrics(code) {
    const metrics = {
      es6Features: 0,
      commonJS: 0,
      typescriptSpecific: 0,
      jsxElements: 0,
    };
    if (code.includes("=>")) metrics.es6Features++;
    if (code.includes("const ") || code.includes("let ")) metrics.es6Features++;
    if (code.includes("class ")) metrics.es6Features++;
    if (code.includes("import ") && code.includes("from "))
      metrics.es6Features++;
    if (code.includes("export ")) metrics.es6Features++;
    if (code.includes("async ") || code.includes("await "))
      metrics.es6Features++;
    if (code.includes("require(")) metrics.commonJS++;
    if (code.includes("module.exports")) metrics.commonJS++;
    if (code.includes(": ") && /[a-z]+\s*:\s*[A-Z]/i.test(code))
      metrics.typescriptSpecific++;
    if (code.includes("<") && code.includes("/>") && /<[A-Z]/.test(code))
      metrics.jsxElements++;
    return metrics;
  }

  _collectMaintainabilityMetrics(code) {
    const lines = code.split("\n");
    let commentLines = 0;
    let codeLines = 0;
    let inBlockComment = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || inBlockComment) {
        commentLines++;
        if (trimmed.includes("/*")) inBlockComment = true;
        if (trimmed.includes("*/")) inBlockComment = false;
      } else if (trimmed.startsWith("/*")) {
        commentLines++;
        inBlockComment = true;
        if (trimmed.includes("*/")) inBlockComment = false;
      } else if (trimmed.length > 0) {
        codeLines++;
      }
    }
    const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;
    let cyclomaticComplexity = 1;
    const controlFlowPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
    ];
    for (const pattern of controlFlowPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    }
    const halsteadVolume = this._estimateHalstead(code);
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        171 -
          5.2 * Math.log(halsteadVolume) -
          0.23 * cyclomaticComplexity -
          16.2 * Math.log(lines.length)
      )
    );
    return {
      commentRatio: commentRatio.toFixed(3),
      cyclomaticComplexity,
      estimatedHalsteadVolume: halsteadVolume,
      maintainabilityIndex: maintainabilityIndex.toFixed(2),
      linesOfCode: codeLines,
      commentLines,
    };
  }

  _estimateHalstead(code) {
    const operators =
      code.match(/[\+\-\*\/\=\>\<\!\&\|\^\~\?\:\,\.;\[\]\(\)\{\}]/g) || [];
    const operands = code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    const totalOperators = operators.length;
    const totalOperands = operands.length;
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;
    return length * Math.log2(vocabulary || 1);
  }

  _collectCustomMetrics(code) {
    return {
      hasStrictMode:
        code.includes("'use strict'") || code.includes('"use strict"'),
      hasSourceMap: code.includes("sourceMappingURL"),
      isMinified: this._isMinified(code),
      dependencyCount: (code.match(/require\(|import /g) || []).length,
      errorHandlingPresent: code.includes("try") && code.includes("catch"),
    };
  }

  _isMinified(code) {
    const lines = code.split("\n");
    if (lines.length < 5 && code.length > 500) return true;
    const avgLineLength = code.length / lines.length;
    return avgLineLength > 200;
  }

  _calculateScore(metrics) {
    let score = 100;
    const maint = metrics.maintainability;
    if (parseFloat(maint.maintainabilityIndex) < 50) {
      score -= 20;
    } else if (parseFloat(maint.maintainabilityIndex) < 65) {
      score -= 10;
    }
    if (maint.cyclomaticComplexity > 20) {
      score -= Math.min(30, (maint.cyclomaticComplexity - 20) * 2);
    }
    if (parseFloat(maint.commentRatio) < 0.05) {
      score -= 10;
    }
    return Math.max(0, Math.min(100, score));
  }

  _scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  _updateAverageCollectionTime(duration) {
    const prevAvg = this.statistics.averageCollectionTime;
    const count = this.statistics.totalCollections;
    this.statistics.averageCollectionTime =
      (prevAvg * (count - 1) + duration) / count;
  }

  _addToHistory(metrics) {
    this._history.push({
      timestamp: Date.now(),
      metrics,
    });
    if (this._history.length > this.options.historySize) {
      this._history.shift();
    }
  }

  startCollection() {
    if (this._collectInterval) return false;
    this._collectInterval = setInterval(() => {
      this._collectSystemMetrics();
    }, this.options.collectInterval);
    return true;
  }

  stopCollection() {
    if (this._collectInterval) {
      clearInterval(this._collectInterval);
      this._collectInterval = null;
    }
    return true;
  }

  _collectSystemMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    this.emit("system-metrics", {
      timestamp: Date.now(),
      memory: mem,
      cpu,
    });
  }

  registerMetric(name, collector) {
    this._metrics.set(name, collector);
    return this;
  }

  unregisterMetric(name) {
    return this._metrics.delete(name);
  }

  getHistory(limit = 100) {
    return this._history.slice(-limit);
  }

  clearHistory() {
    this._history = [];
    return true;
  }

  on(event, callback) {
    this._listeners.push({ event, callback });
    return () => {
      const index = this._listeners.findIndex(
        (l) => l.event === event && l.callback === callback
      );
      if (index > -1) this._listeners.splice(index, 1);
    };
  }

  emit(event, data) {
    for (const listener of this._listeners) {
      if (listener.event === event || listener.event === "*") {
        try {
          listener.callback(data);
        } catch (e) {
          console.error(`MetricsCollector listener error: ${e.message}`);
        }
      }
    }
  }

  getStatistics() {
    return {
      ...this.statistics,
      historySize: this._history.length,
      customMetrics: this._metrics.size,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._history = [];
    this._metrics.clear();
    this._timers.clear();
    this.statistics = {
      totalCollections: 0,
      totalMetrics: 0,
      averageCollectionTime: 0,
    };
    return this;
  }

  dispose() {
    this.stopCollection();
    this.reset();
    this._listeners = [];
    this.options = {};
    return this;
  }
}

module.exports = MetricsCollector;
