class PerformanceEvaluator {
  constructor(options = {}) {
    this.name = "PerformanceEvaluator";
    this.version = "3.0.0";
    this.options = {
      iterations: options.iterations || 100,
      warmupIterations: options.warmupIterations || 10,
      timeout: options.timeout || 30000,
      memoryTracking: options.memoryTracking !== false,
    };
    this._benchmarks = new Map();
    this._history = [];
    this.statistics = {
      totalEvaluations: 0,
      averageExecutionTime: 0,
      averageMemoryUsage: 0,
      benchmarksRun: 0,
    };
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const result = {
      score: 100,
      grade: "A",
      metrics: {},
      issues: [],
      recommendations: [],
      benchmarks: {},
      timestamp: Date.now(),
    };
    try {
      const startTime = Date.now();
      const memoryBefore = this.options.memoryTracking
        ? process.memoryUsage()
        : null;
      const syncResult = this._evaluateSyncPatterns(code);
      result.metrics = {
        ...syncResult.metrics,
        estimatedComplexity: syncResult.complexity,
      };
      if (options.runBenchmarks) {
        result.benchmarks = await this._runBenchmarks(code);
      }
      const memoryAfter = this.options.memoryTracking
        ? process.memoryUsage()
        : null;
      if (memoryBefore && memoryAfter) {
        result.metrics.memory = {
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          external: memoryAfter.external - memoryBefore.external,
          rss: memoryAfter.rss - memoryBefore.rss,
        };
      }
      result.metrics.executionTime = Date.now() - startTime;
      result.issues = this._detectPerformanceIssues(code, result.metrics);
      result.score = this._calculateScore(result);
      result.grade = this._scoreToGrade(result.score);
      result.recommendations = this._generateRecommendations(result);
      this._updateStatistics(result);
    } catch (error) {
      result.error = error.message;
      result.score = 0;
      result.grade = "F";
    }
    return result;
  }

  _evaluateSyncPatterns(code) {
    const parser = require("@babel/parser");
    const traverse = require("@babel/traverse").default;
    let ast;
    try {
      ast = parser.parse(code, { sourceType: "module" });
    } catch {
      return { metrics: {}, complexity: "unknown" };
    }
    const metrics = {
      loops: 0,
      nestedLoops: 0,
      functionCalls: 0,
      arrayMethods: 0,
      domOperations: 0,
      syncOperations: 0,
      maxLoopNesting: 0,
      potentialBottlenecks: 0,
    };
    let currentLoopNesting = 0;
    traverse(ast, {
      ForStatement() {
        metrics.loops++;
        currentLoopNesting++;
        if (currentLoopNesting > 1) metrics.nestedLoops++;
        metrics.maxLoopNesting = Math.max(
          metrics.maxLoopNesting,
          currentLoopNesting
        );
      },
      ForInStatement() {
        metrics.loops++;
        currentLoopNesting++;
        if (currentLoopNesting > 1) metrics.nestedLoops++;
        metrics.maxLoopNesting = Math.max(
          metrics.maxLoopNesting,
          currentLoopNesting
        );
      },
      ForOfStatement() {
        metrics.loops++;
        currentLoopNesting++;
        if (currentLoopNesting > 1) metrics.nestedLoops++;
        metrics.maxLoopNesting = Math.max(
          metrics.maxLoopNesting,
          currentLoopNesting
        );
      },
      WhileStatement() {
        metrics.loops++;
        currentLoopNesting++;
        if (currentLoopNesting > 1) metrics.nestedLoops++;
        metrics.maxLoopNesting = Math.max(
          metrics.maxLoopNesting,
          currentLoopNesting
        );
      },
      CallExpression(path) {
        metrics.functionCalls++;
        const callee = path.node.callee;
        if (callee.type === "MemberExpression") {
          const method = callee.property.name;
          const arrayMethods = [
            "map",
            "filter",
            "reduce",
            "forEach",
            "find",
            "some",
            "every",
            "sort",
          ];
          if (arrayMethods.includes(method)) {
            metrics.arrayMethods++;
          }
          if (
            [
              "getElementById",
              "querySelector",
              "querySelectorAll",
              "createElement",
            ].includes(method)
          ) {
            metrics.domOperations++;
          }
        }
        if (callee.name === "eval" || callee.name === "Function") {
          metrics.potentialBottlenecks++;
        }
      },
      SyncFS() {
        metrics.syncOperations++;
      },
    });
    const complexity = this._estimateComplexity(metrics);
    return { metrics, complexity };
  }

  _estimateComplexity(metrics) {
    if (metrics.maxLoopNesting >= 3) return "O(n^3+)";
    if (metrics.nestedLoops > 0) return "O(n^2)";
    if (metrics.loops > 0) return "O(n)";
    return "O(1)";
  }

  async _runBenchmarks(code) {
    const benchmarks = {};
    const benchmarksToRun = ["parse", "execution"];
    for (const name of benchmarksToRun) {
      try {
        benchmarks[name] = await this._runBenchmark(name, code);
        this.statistics.benchmarksRun++;
      } catch (error) {
        benchmarks[name] = { error: error.message };
      }
    }
    return benchmarks;
  }

  async _runBenchmark(name, code) {
    const iterations = this.options.iterations;
    const warmup = this.options.warmupIterations;
    for (let i = 0; i < warmup; i++) {
      await this._runSingleIteration(name, code);
    }
    const times = [];
    const memorySnapshots = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this._runSingleIteration(name, code);
      const end = performance.now();
      times.push(end - start);
      if (this.options.memoryTracking) {
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }
    }
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const sortedTimes = [...times].sort((a, b) => a - b);
    const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const stdDev = Math.sqrt(
      times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length
    );
    return {
      iterations,
      avgTime: avgTime.toFixed(4),
      minTime: minTime.toFixed(4),
      maxTime: maxTime.toFixed(4),
      medianTime: medianTime.toFixed(4),
      stdDev: stdDev.toFixed(4),
      opsPerSecond: Math.round(1000 / avgTime),
    };
  }

  async _runSingleIteration(name, code) {
    switch (name) {
      case "parse":
        const parser = require("@babel/parser");
        parser.parse(code, { sourceType: "module" });
        break;
      case "execution":
        return new Promise((resolve) => {
          setImmediate(resolve);
        });
      default:
        break;
    }
  }

  _detectPerformanceIssues(code, metrics) {
    const issues = [];
    if (metrics.maxLoopNesting >= 3) {
      issues.push({
        type: "nested-loops",
        severity: "warning",
        message: `Deeply nested loops detected (depth: ${metrics.maxLoopNesting}). Consider optimizing.`,
      });
    }
    if (metrics.arrayMethods > 5) {
      issues.push({
        type: "chain-operations",
        severity: "info",
        message:
          "Multiple array method calls detected. Consider combining operations.",
      });
    }
    if (code.includes("document.write")) {
      issues.push({
        type: "blocking-api",
        severity: "warning",
        message: "document.write blocks page rendering",
      });
    }
    if (code.includes("innerHTML +=") || code.includes("innerHTML+=")) {
      issues.push({
        type: "inefficient-dom",
        severity: "warning",
        message:
          "Incremental innerHTML is inefficient. Use DOM methods or document fragment.",
      });
    }
    return issues;
  }

  _calculateScore(result) {
    let score = 100;
    for (const issue of result.issues) {
      switch (issue.severity) {
        case "error":
          score -= 20;
          break;
        case "warning":
          score -= 10;
          break;
        case "info":
          score -= 2;
          break;
      }
    }
    if (result.metrics.maxLoopNesting >= 3) score -= 15;
    if (result.metrics.maxLoopNesting === 2) score -= 5;
    return Math.max(0, Math.min(100, score));
  }

  _scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  _generateRecommendations(result) {
    const recommendations = [];
    if (result.metrics.maxLoopNesting > 1) {
      recommendations.push({
        type: "algorithm",
        message:
          "Consider using more efficient data structures to reduce nested loops",
      });
    }
    if (result.benchmarks?.execution?.avgTime > 100) {
      recommendations.push({
        type: "optimization",
        message:
          "Consider caching or memoization for frequently called functions",
      });
    }
    return recommendations;
  }

  _updateStatistics(result) {
    const prevAvg = this.statistics.averageExecutionTime;
    const count = this.statistics.totalEvaluations;
    this.statistics.averageExecutionTime =
      (prevAvg * (count - 1) + (result.metrics.executionTime || 0)) / count;
  }

  registerBenchmark(name, fn) {
    this._benchmarks.set(name, fn);
    return this;
  }

  unregisterBenchmark(name) {
    return this._benchmarks.delete(name);
  }

  getHistory(limit = 100) {
    return this._history.slice(-limit);
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._history = [];
    this.statistics = {
      totalEvaluations: 0,
      averageExecutionTime: 0,
      averageMemoryUsage: 0,
      benchmarksRun: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._benchmarks.clear();
    this.options = {};
    return this;
  }
}

module.exports = PerformanceEvaluator;
