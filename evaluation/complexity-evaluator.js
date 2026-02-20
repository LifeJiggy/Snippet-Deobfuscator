class ComplexityEvaluator {
  constructor(options = {}) {
    this.name = "ComplexityEvaluator";
    this.version = "3.0.0";
    this.options = {
      maxCyclomaticComplexity: options.maxCyclomaticComplexity || 10,
      maxCognitiveComplexity: options.maxCognitiveComplexity || 15,
      maxNestingDepth: options.maxNestingDepth || 4,
      maxFunctionLength: options.maxFunctionLength || 50,
    };
    this._thresholds = {
      cyclomatic: { low: 5, medium: 10, high: 20 },
      cognitive: { low: 10, medium: 20, high: 30 },
      nesting: { low: 2, medium: 4, high: 6 },
    };
    this.statistics = {
      totalEvaluations: 0,
      averageCyclomaticComplexity: 0,
      averageCognitiveComplexity: 0,
      highComplexityFunctions: 0,
    };
  }

  async evaluate(code, options = {}) {
    this.statistics.totalEvaluations++;
    const result = {
      score: 100,
      grade: "A",
      metrics: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maxNestingDepth: 0,
        functionCount: 0,
        functionComplexities: [],
      },
      issues: [],
      recommendations: [],
      timestamp: Date.now(),
    };
    if (!code || typeof code !== "string") {
      return { error: "Invalid code input", score: 0, grade: "F" };
    }
    try {
      const parser = require("@babel/parser");
      const traverse = require("@babel/traverse").default;
      const ast = parser.parse(code, { sourceType: "module" });
      const complexities = this._calculateComplexities(ast);
      result.metrics = complexities;
      result.issues = this._identifyIssues(complexities);
      result.score = this._calculateScore(result);
      result.grade = this._scoreToGrade(result.score);
      result.recommendations = this._generateRecommendations(result);
      this._updateStatistics(result.metrics);
    } catch (error) {
      result.error = error.message;
      result.score = 0;
      result.grade = "F";
    }
    return result;
  }

  _calculateComplexities(ast) {
    const traverse = require("@babel/traverse").default;
    const metrics = {
      cyclomaticComplexity: 1,
      cognitiveComplexity: 0,
      maxNestingDepth: 0,
      functionCount: 0,
      functionComplexities: [],
    };
    let currentNesting = 0;
    let currentFunctionCognitive = 0;
    traverse(ast, {
      FunctionDeclaration: {
        enter(path) {
          metrics.functionCount++;
          currentFunctionCognitive = 0;
        },
        exit(path) {
          const name = path.node.id?.name || "anonymous";
          metrics.functionComplexities.push({
            name,
            type: "declaration",
            cognitive: currentFunctionCognitive,
          });
        },
      },
      FunctionExpression: {
        enter(path) {
          metrics.functionCount++;
          currentFunctionCognitive = 0;
        },
        exit(path) {
          const name = path.node.id?.name || "anonymous";
          metrics.functionComplexities.push({
            name,
            type: "expression",
            cognitive: currentFunctionCognitive,
          });
        },
      },
      ArrowFunctionExpression: {
        enter(path) {
          metrics.functionCount++;
          currentFunctionCognitive = 0;
        },
        exit() {
          metrics.functionComplexities.push({
            name: "arrow",
            type: "arrow",
            cognitive: currentFunctionCognitive,
          });
        },
      },
      IfStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      ConditionalExpression() {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive++;
      },
      ForStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      ForInStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      ForOfStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      WhileStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      DoWhileStatement(path) {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive += currentNesting + 1;
        currentNesting++;
        metrics.maxNestingDepth = Math.max(
          metrics.maxNestingDepth,
          currentNesting
        );
      },
      SwitchCase() {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive++;
      },
      LogicalExpression(path) {
        if (path.node.operator === "&&" || path.node.operator === "||") {
          metrics.cyclomaticComplexity++;
          currentFunctionCognitive++;
        }
      },
      CatchClause() {
        metrics.cyclomaticComplexity++;
        currentFunctionCognitive++;
      },
    });
    traverse(ast, {
      enter(path) {
        let depth = 0;
        let current = path.parentPath;
        while (current) {
          if (
            [
              "IfStatement",
              "ForStatement",
              "ForInStatement",
              "ForOfStatement",
              "WhileStatement",
              "DoWhileStatement",
              "SwitchStatement",
              "TryStatement",
            ].includes(current.node.type)
          ) {
            depth++;
          }
          current = current.parentPath;
        }
        metrics.maxNestingDepth = Math.max(metrics.maxNestingDepth, depth);
      },
    });
    metrics.cognitiveComplexity = metrics.functionComplexities.reduce(
      (sum, f) => sum + f.cognitive,
      0
    );
    return metrics;
  }

  _identifyIssues(metrics) {
    const issues = [];
    if (metrics.cyclomaticComplexity > this.options.maxCyclomaticComplexity) {
      const severity = this._getSeverity(
        "cyclomatic",
        metrics.cyclomaticComplexity
      );
      issues.push({
        type: "cyclomatic-complexity",
        severity,
        message: `High cyclomatic complexity: ${metrics.cyclomaticComplexity} (max: ${this.options.maxCyclomaticComplexity})`,
        value: metrics.cyclomaticComplexity,
        threshold: this.options.maxCyclomaticComplexity,
      });
    }
    if (metrics.cognitiveComplexity > this.options.maxCognitiveComplexity) {
      const severity = this._getSeverity(
        "cognitive",
        metrics.cognitiveComplexity
      );
      issues.push({
        type: "cognitive-complexity",
        severity,
        message: `High cognitive complexity: ${metrics.cognitiveComplexity} (max: ${this.options.maxCognitiveComplexity})`,
        value: metrics.cognitiveComplexity,
        threshold: this.options.maxCognitiveComplexity,
      });
    }
    if (metrics.maxNestingDepth > this.options.maxNestingDepth) {
      const severity = this._getSeverity("nesting", metrics.maxNestingDepth);
      issues.push({
        type: "nesting-depth",
        severity,
        message: `Deep nesting detected: ${metrics.maxNestingDepth} levels (max: ${this.options.maxNestingDepth})`,
        value: metrics.maxNestingDepth,
        threshold: this.options.maxNestingDepth,
      });
    }
    for (const fn of metrics.functionComplexities) {
      if (fn.cognitive > 15) {
        issues.push({
          type: "complex-function",
          severity: "warning",
          message: `Function '${fn.name}' has high complexity: ${fn.cognitive}`,
          function: fn.name,
          value: fn.cognitive,
        });
        this.statistics.highComplexityFunctions++;
      }
    }
    return issues;
  }

  _getSeverity(type, value) {
    const thresholds = this._thresholds[type];
    if (!thresholds) return "warning";
    if (value >= thresholds.high) return "error";
    if (value >= thresholds.medium) return "warning";
    return "info";
  }

  _calculateScore(result) {
    let score = 100;
    const cc = result.metrics.cyclomaticComplexity;
    const cognC = result.metrics.cognitiveComplexity;
    const nesting = result.metrics.maxNestingDepth;
    if (cc > this.options.maxCyclomaticComplexity) {
      score -= Math.min(30, (cc - this.options.maxCyclomaticComplexity) * 3);
    }
    if (cognC > this.options.maxCognitiveComplexity) {
      score -= Math.min(25, (cognC - this.options.maxCognitiveComplexity) * 2);
    }
    if (nesting > this.options.maxNestingDepth) {
      score -= Math.min(20, (nesting - this.options.maxNestingDepth) * 5);
    }
    for (const issue of result.issues) {
      switch (issue.severity) {
        case "error":
          score -= 5;
          break;
        case "warning":
          score -= 3;
          break;
        case "info":
          score -= 1;
          break;
      }
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

  _generateRecommendations(result) {
    const recommendations = [];
    if (
      result.metrics.cyclomaticComplexity > this.options.maxCyclomaticComplexity
    ) {
      recommendations.push({
        type: "reduce-complexity",
        message:
          "Break down complex functions into smaller, single-responsibility functions",
      });
    }
    if (result.metrics.maxNestingDepth > this.options.maxNestingDepth) {
      recommendations.push({
        type: "reduce-nesting",
        message:
          "Use early returns, extract methods, or apply guard clauses to reduce nesting",
      });
    }
    if (result.issues.some((i) => i.type === "complex-function")) {
      recommendations.push({
        type: "refactor-functions",
        message:
          "Consider using polymorphism, strategy pattern, or extracting logic to helper functions",
      });
    }
    return recommendations;
  }

  _updateStatistics(metrics) {
    const prevAvgCC = this.statistics.averageCyclomaticComplexity;
    const prevAvgCog = this.statistics.averageCognitiveComplexity;
    const count = this.statistics.totalEvaluations;
    this.statistics.averageCyclomaticComplexity =
      (prevAvgCC * (count - 1) + metrics.cyclomaticComplexity) / count;
    this.statistics.averageCognitiveComplexity =
      (prevAvgCog * (count - 1) + metrics.cognitiveComplexity) / count;
  }

  setThresholds(thresholds) {
    this._thresholds = { ...this._thresholds, ...thresholds };
    return this;
  }

  getThresholds() {
    return { ...this._thresholds };
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.statistics = {
      totalEvaluations: 0,
      averageCyclomaticComplexity: 0,
      averageCognitiveComplexity: 0,
      highComplexityFunctions: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._thresholds = {};
    this.options = {};
    return this;
  }
}

module.exports = ComplexityEvaluator;
