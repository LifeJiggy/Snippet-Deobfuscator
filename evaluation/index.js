const CodeEvaluator = require("./code-evaluator");
const PerformanceEvaluator = require("./performance-evaluator");
const SecurityEvaluator = require("./security-evaluator");
const QualityEvaluator = require("./quality-evaluator");
const ComplexityEvaluator = require("./complexity-evaluator");
const MetricsCollector = require("./metrics-collector");

class EvaluationManager {
  constructor(options = {}) {
    this.name = "EvaluationManager";
    this.version = "3.0.0";
    this.options = {
      parallel: options.parallel !== false,
      timeout: options.timeout || 60000,
      includeDetails: options.includeDetails !== false,
    };
    this._evaluators = new Map();
    this._results = new Map();
    this._listeners = [];
    this.statistics = {
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      averageDuration: 0,
    };
    this._initializeEvaluators(options);
  }

  _initializeEvaluators(options) {
    this._evaluators.set("code", new CodeEvaluator(options.codeOptions));
    this._evaluators.set(
      "performance",
      new PerformanceEvaluator(options.performanceOptions)
    );
    this._evaluators.set(
      "security",
      new SecurityEvaluator(options.securityOptions)
    );
    this._evaluators.set(
      "quality",
      new QualityEvaluator(options.qualityOptions)
    );
    this._evaluators.set(
      "complexity",
      new ComplexityEvaluator(options.complexityOptions)
    );
    this._evaluators.set(
      "metrics",
      new MetricsCollector(options.metricsOptions)
    );
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const startTime = Date.now();
    const result = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      timestamp: startTime,
      code: options.includeCode
        ? code
        : { length: code.length, hash: this._hash(code) },
      results: {},
      summary: {},
      duration: 0,
    };
    try {
      const evaluators =
        options.evaluators || Array.from(this._evaluators.keys());
      const evaluationPromises = evaluators.map(async (name) => {
        if (!this._evaluators.has(name)) {
          return { name, error: `Unknown evaluator: ${name}` };
        }
        const evaluator = this._evaluators.get(name);
        const evalStart = Date.now();
        try {
          const evalResult = await this._runEvaluator(evaluator, code, options);
          return {
            name,
            result: evalResult,
            duration: Date.now() - evalStart,
            success: true,
          };
        } catch (error) {
          return {
            name,
            error: error.message,
            duration: Date.now() - evalStart,
            success: false,
          };
        }
      });
      const evaluationResults = await Promise.all(evaluationPromises);
      for (const evalResult of evaluationResults) {
        result.results[evalResult.name] = evalResult.success
          ? evalResult.result
          : { error: evalResult.error };
        this._emit("evaluator:complete", evalResult);
      }
      result.summary = this._generateSummary(result.results);
      this.statistics.successfulEvaluations++;
    } catch (error) {
      result.error = error.message;
      this.statistics.failedEvaluations++;
    }
    result.duration = Date.now() - startTime;
    this._updateAverageDuration(result.duration);
    this._results.set(result.id, result);
    this._emit("evaluation:complete", result);
    return result;
  }

  async _runEvaluator(evaluator, code, options) {
    const timeout = options.timeout || this.options.timeout;
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Evaluator timeout after ${timeout}ms`));
      }, timeout);
      try {
        const result = await evaluator.evaluate(code, options);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  _generateSummary(results) {
    const summary = {
      overallScore: 0,
      grades: {},
      issues: [],
      recommendations: [],
    };
    let totalScore = 0;
    let scoreCount = 0;
    for (const [name, result] of Object.entries(results)) {
      if (result.error) continue;
      if (result.score !== undefined) {
        totalScore += result.score;
        scoreCount++;
      }
      if (result.grade) {
        summary.grades[name] = result.grade;
      }
      if (result.issues) {
        summary.issues.push(
          ...result.issues.map((i) => ({ ...i, source: name }))
        );
      }
      if (result.recommendations) {
        summary.recommendations.push(
          ...result.recommendations.map((r) => ({ ...r, source: name }))
        );
      }
    }
    summary.overallScore =
      scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    summary.overallGrade = this._scoreToGrade(summary.overallScore);
    return summary;
  }

  _scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  _hash(code) {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(code).digest("hex").substring(0, 8);
  }

  _updateAverageDuration(duration) {
    const prevAvg = this.statistics.averageDuration;
    const count = this.statistics.totalEvaluations;
    this.statistics.averageDuration =
      (prevAvg * (count - 1) + duration) / count;
  }

  getEvaluator(name) {
    return this._evaluators.get(name);
  }

  registerEvaluator(name, evaluator) {
    if (this._evaluators.has(name)) {
      throw new Error(`Evaluator "${name}" already registered`);
    }
    this._evaluators.set(name, evaluator);
    return this;
  }

  unregisterEvaluator(name) {
    return this._evaluators.delete(name);
  }

  listEvaluators() {
    return Array.from(this._evaluators.keys());
  }

  getResult(id) {
    return this._results.get(id);
  }

  getResults(options = {}) {
    let results = Array.from(this._results.values());
    if (options.limit) {
      results = results.slice(-options.limit);
    }
    if (options.since) {
      results = results.filter((r) => r.timestamp >= options.since);
    }
    return results;
  }

  deleteResult(id) {
    return this._results.delete(id);
  }

  clearResults() {
    this._results.clear();
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

  _emit(event, data) {
    for (const listener of this._listeners) {
      if (listener.event === event || listener.event === "*") {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`EvaluationManager listener error: ${error.message}`);
        }
      }
    }
  }

  async compareEvaluations(id1, id2) {
    const result1 = this._results.get(id1);
    const result2 = this._results.get(id2);
    if (!result1 || !result2) {
      throw new Error("One or both results not found");
    }
    return {
      result1: { id: id1, summary: result1.summary },
      result2: { id: id2, summary: result2.summary },
      scoreDiff:
        (result2.summary?.overallScore || 0) -
        (result1.summary?.overallScore || 0),
      gradeDiff: {
        from: result1.summary?.overallGrade,
        to: result2.summary?.overallGrade,
      },
    };
  }

  getStatistics() {
    return {
      ...this.statistics,
      evaluators: this._evaluators.size,
      resultsCount: this._results.size,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._results.clear();
    this.statistics = {
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      averageDuration: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    for (const evaluator of this._evaluators.values()) {
      if (evaluator.dispose) evaluator.dispose();
    }
    this._evaluators.clear();
    this._listeners = [];
    this.options = {};
    return this;
  }
}

module.exports = EvaluationManager;
module.exports.CodeEvaluator = CodeEvaluator;
module.exports.PerformanceEvaluator = PerformanceEvaluator;
module.exports.SecurityEvaluator = SecurityEvaluator;
module.exports.QualityEvaluator = QualityEvaluator;
module.exports.ComplexityEvaluator = ComplexityEvaluator;
module.exports.MetricsCollector = MetricsCollector;
