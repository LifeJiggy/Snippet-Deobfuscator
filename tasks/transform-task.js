const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const template = require("@babel/template").default;

class TransformTask {
  constructor(options = {}) {
    this.name = "TransformTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      generatorOptions: {
        comments: options.comments !== false,
        compact: options.compact || false,
        sourceMaps: options.sourceMaps || false,
      },
      preserveComments: options.presureComments !== false,
      validateOutput: options.validateOutput !== false,
      maxTransforms: options.maxTransforms || 1000,
    };
    this.transforms = new Map();
    this.transformPipeline = [];
    this.results = new Map();
    this.statistics = {
      totalTransformed: 0,
      totalNodesModified: 0,
      totalTransformsApplied: 0,
      averageTransformTime: 0,
      errors: 0,
      warnings: 0,
    };
    this._transformTimes = [];
    this._transformCount = 0;
  }

  registerTransform(name, transformFn, options = {}) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Transform name must be a non-empty string");
    }
    if (typeof transformFn !== "function") {
      throw new Error("Transform must be a function");
    }
    const transform = {
      name,
      fn: transformFn,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      description: options.description || "",
      metadata: options.metadata || {},
      executions: 0,
      successes: 0,
      failures: 0,
    };
    this.transforms.set(name, transform);
    return this;
  }

  unregisterTransform(name) {
    if (!this.transforms.has(name)) {
      throw new Error(`Transform "${name}" is not registered`);
    }
    this.transforms.delete(name);
    return this;
  }

  getTransform(name) {
    return this.transforms.get(name);
  }

  hasTransform(name) {
    return this.transforms.has(name);
  }

  listTransforms() {
    return Array.from(this.transforms.entries()).map(([name, transform]) => ({
      name,
      priority: transform.priority,
      enabled: transform.enabled,
    }));
  }

  enableTransform(name) {
    const transform = this.transforms.get(name);
    if (!transform) {
      throw new Error(`Transform "${name}" is not registered`);
    }
    transform.enabled = true;
    return this;
  }

  disableTransform(name) {
    const transform = this.transforms.get(name);
    if (!transform) {
      throw new Error(`Transform "${name}" is not registered`);
    }
    transform.enabled = false;
    return this;
  }

  setTransformPriority(name, priority) {
    const transform = this.transforms.get(name);
    if (!transform) {
      throw new Error(`Transform "${name}" is not registered`);
    }
    transform.priority = priority;
    return this;
  }

  addToPipeline(transformNames) {
    const names = Array.isArray(transformNames)
      ? transformNames
      : [transformNames];
    for (const name of names) {
      if (!this.transforms.has(name)) {
        throw new Error(`Transform "${name}" is not registered`);
      }
      this.transformPipeline.push(name);
    }
    return this;
  }

  removeFromPipeline(transformName) {
    const index = this.transformPipeline.indexOf(transformName);
    if (index > -1) {
      this.transformPipeline.splice(index, 1);
    }
    return this;
  }

  clearPipeline() {
    this.transformPipeline = [];
    return this;
  }

  getPipeline() {
    return [...this.transformPipeline];
  }

  async transformCode(code, options = {}) {
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    const startTime = Date.now();
    const transformId = `transform-${startTime}`;
    try {
      const ast = this._parseCode(code, options);
      const transformedAST = await this.transformAST(ast, options);
      const output = this._generateCode(transformedAST, options);
      const duration = Date.now() - startTime;
      this._recordTransform(transformId, duration, {
        inputSize: code.length,
        outputSize: output.code.length,
      });
      return {
        id: transformId,
        code: output.code,
        map: output.map,
        duration,
      };
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Transform failed: ${error.message}`);
    }
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...options.parseOptions,
    };
    try {
      return parser.parse(code, parseOptions);
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  async transformAST(ast, options = {}) {
    if (!ast || typeof ast !== "object") {
      throw new Error("AST must be a valid object");
    }
    const transformNames = options.transforms || this.transformPipeline;
    if (transformNames.length === 0) {
      throw new Error("No transforms specified");
    }
    let currentAST = ast;
    const transformsApplied = [];
    for (const name of transformNames) {
      const transform = this.transforms.get(name);
      if (!transform || !transform.enabled) continue;
      const beforeValidation =
        options.validateBefore && this._validateAST(currentAST);
      try {
        const result = await this._applyTransform(
          currentAST,
          transform,
          options
        );
        currentAST = result.ast;
        transformsApplied.push({
          name,
          nodesModified: result.nodesModified,
          duration: result.duration,
        });
        if (options.validateAfter) {
          this._validateAST(currentAST);
        }
        transform.executions++;
        transform.successes++;
        this.statistics.totalTransformsApplied++;
        this.statistics.totalNodesModified += result.nodesModified;
      } catch (error) {
        transform.failures++;
        this.statistics.errors++;
        if (options.stopOnError !== false) {
          throw new Error(`Transform "${name}" failed: ${error.message}`);
        }
      }
    }
    return {
      ast: currentAST,
      transformsApplied,
    };
  }

  async _applyTransform(ast, transform, options = {}) {
    const startTime = Date.now();
    let nodesModified = 0;
    const self = this;
    const state = {
      options,
      nodesModified: 0,
      modified: false,
      warnings: [],
    };
    const visitors = transform.fn(state, options);
    if (!visitors || typeof visitors !== "object") {
      throw new Error("Transform must return a visitor object");
    }
    traverse(ast, visitors, undefined, state);
    nodesModified = state.nodesModified;
    const duration = Date.now() - startTime;
    this._transformTimes.push(duration);
    this._updateAverageTime();
    return { ast, nodesModified, duration };
  }

  _generateCode(ast, options = {}) {
    const generatorOptions = {
      ...this.options.generatorOptions,
      ...options.generatorOptions,
    };
    try {
      return generator(ast, generatorOptions);
    } catch (error) {
      throw new Error(`Code generation error: ${error.message}`);
    }
  }

  _validateAST(ast) {
    if (!ast || typeof ast !== "object") {
      throw new Error("Invalid AST structure");
    }
    if (!ast.type) {
      throw new Error("AST must have a type property");
    }
    if (ast.type === "Program" && !Array.isArray(ast.body)) {
      throw new Error("Program node must have a body array");
    }
    return true;
  }

  applyTransforms(ast, transformNames, options = {}) {
    let currentAST = ast;
    const results = [];
    for (const name of transformNames) {
      const transform = this.transforms.get(name);
      if (!transform || !transform.enabled) continue;
      const result = this._applyTransformSync(currentAST, transform, options);
      currentAST = result.ast;
      results.push(result);
    }
    return { ast: currentAST, results };
  }

  _applyTransformSync(ast, transform, options = {}) {
    const state = {
      options,
      nodesModified: 0,
      modified: false,
    };
    const visitors = transform.fn(state, options);
    traverse(ast, visitors, undefined, state);
    return { ast, nodesModified: state.nodesModified };
  }

  createTransformFromTemplate(templateCode) {
    const buildFn = template(templateCode);
    return function transformTemplate(state, options) {
      return {
        enter(path) {
          const newNode = buildFn(options.templateVars || {});
          path.replaceWith(newNode);
          state.nodesModified++;
        },
      };
    };
  }

  createTransformFromVisitor(visitor) {
    return function transformVisitor(state, options) {
      return visitor;
    };
  }

  _recordTransform(id, duration, metadata = {}) {
    this.results.set(id, {
      duration,
      metadata,
      timestamp: Date.now(),
    });
    this.statistics.totalTransformed++;
  }

  _updateAverageTime() {
    if (this._transformTimes.length > 100) {
      this._transformTimes = this._transformTimes.slice(-100);
    }
    const sum = this._transformTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageTransformTime = sum / this._transformTimes.length;
  }

  getResults(id) {
    return this.results.get(id);
  }

  getAllResults() {
    return Array.from(this.results.entries());
  }

  getStatistics() {
    return { ...this.statistics };
  }

  getTransformStatistics(name) {
    const transform = this.transforms.get(name);
    if (!transform) return null;
    return {
      executions: transform.executions,
      successes: transform.successes,
      failures: transform.failures,
      successRate:
        transform.executions > 0
          ? ((transform.successes / transform.executions) * 100).toFixed(2)
          : 0,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  setParseOptions(parseOptions) {
    this.options.parseOptions = {
      ...this.options.parseOptions,
      ...parseOptions,
    };
    return this;
  }

  setGeneratorOptions(generatorOptions) {
    this.options.generatorOptions = {
      ...this.options.generatorOptions,
      ...generatorOptions,
    };
    return this;
  }

  validateBeforeTransform(code) {
    try {
      this._parseCode(code);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  validateAfterTransform(code) {
    try {
      this._parseCode(code);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  compareASTs(ast1, ast2) {
    const code1 = this._generateCode(ast1).code;
    const code2 = this._generateCode(ast2).code;
    return {
      identical: code1 === code2,
      size1: code1.length,
      size2: code2.length,
      diff: Math.abs(code1.length - code2.length),
    };
  }

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  resetTransformStats() {
    for (const transform of this.transforms.values()) {
      transform.executions = 0;
      transform.successes = 0;
      transform.failures = 0;
    }
    return this;
  }

  reset() {
    this.transforms.clear();
    this.transformPipeline = [];
    this.results.clear();
    this._transformTimes = [];
    this._transformCount = 0;
    this.statistics = {
      totalTransformed: 0,
      totalNodesModified: 0,
      totalTransformsApplied: 0,
      averageTransformTime: 0,
      errors: 0,
      warnings: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = TransformTask;
