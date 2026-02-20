const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

class OptimizationTask {
  constructor(options = {}) {
    this.name = "OptimizationTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      generatorOptions: {
        comments: false,
        compact: true,
        minified: true,
      },
      optimizationLevel: options.optimizationLevel || "standard",
      removeConsole: options.removeConsole || false,
      removeDebugger: options.removeDebugger || true,
      deadCodeElimination: options.deadCodeElimination !== false,
      inlineConstants: options.inlineConstants !== false,
      foldConstants: options.foldConstants !== false,
      mergeVariables: options.mergeVariables || false,
      simplifyExpressions: options.simplifyExpressions !== false,
      removeUnused: options.removeUnused !== false,
      hoistFunctions: options.hoistFunctions || false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
    };
    this.optimizations = new Map();
    this.results = new Map();
    this.statistics = {
      totalOptimized: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      totalSizeSaved: 0,
      averageCompressionRatio: 0,
      optimizationsApplied: 0,
      deadCodeRemoved: 0,
      constantsInlined: 0,
      functionsInlined: 0,
      expressionsSimplified: 0,
    };
    this._compressionRatios = [];
  }

  async optimize(code, options = {}) {
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    if (code.length > this.options.maxFileSize) {
      throw new Error(
        `Code exceeds maximum file size of ${this.options.maxFileSize} bytes`
      );
    }
    const startTime = Date.now();
    const optimizationId = `optimization-${startTime}`;
    const sizeBefore = code.length;
    try {
      const ast = this._parseCode(code, options);
      const optimizedAST = await this._applyOptimizations(ast, options);
      const output = this._generateCode(optimizedAST, options);
      const sizeAfter = output.code.length;
      const sizeSaved = sizeBefore - sizeAfter;
      const compressionRatio = ((sizeSaved / sizeBefore) * 100).toFixed(2);
      const duration = Date.now() - startTime;
      this._recordOptimization(optimizationId, {
        sizeBefore,
        sizeAfter,
        sizeSaved,
        compressionRatio,
        duration,
      });
      return {
        id: optimizationId,
        code: output.code,
        map: output.map,
        statistics: {
          sizeBefore,
          sizeAfter,
          sizeSaved,
          compressionRatio,
        },
        duration,
      };
    } catch (error) {
      this.statistics.errors = (this.statistics.errors || 0) + 1;
      throw new Error(`Optimization failed: ${error.message}`);
    }
  }

  async minify(code, options = {}) {
    const minifyOptions = {
      ...options,
      optimizationLevel: "aggressive",
      removeConsole: true,
      removeDebugger: true,
      deadCodeElimination: true,
    };
    return this.optimize(code, minifyOptions);
  }

  async compress(code, options = {}) {
    return this.minify(code, options);
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...options.parseOptions,
    };
    return parser.parse(code, parseOptions);
  }

  _generateCode(ast, options = {}) {
    const generatorOptions = {
      ...this.options.generatorOptions,
      ...options.generatorOptions,
    };
    return generator(ast, generatorOptions);
  }

  async _applyOptimizations(ast, options = {}) {
    const level = options.optimizationLevel || this.options.optimizationLevel;
    let currentAST = ast;
    const optimizationSteps = [];
    currentAST = this._removeDebuggerStatements(currentAST, options);
    optimizationSteps.push({ name: "removeDebugger", applied: true });
    if (options.removeConsole || this.options.removeConsole) {
      currentAST = this._removeConsoleStatements(currentAST, options);
      optimizationSteps.push({ name: "removeConsole", applied: true });
    }
    if (
      options.deadCodeElimination !== false &&
      this.options.deadCodeElimination
    ) {
      currentAST = this._eliminateDeadCode(currentAST, options);
      optimizationSteps.push({ name: "deadCodeElimination", applied: true });
    }
    if (options.foldConstants !== false && this.options.foldConstants) {
      currentAST = this._foldConstants(currentAST, options);
      optimizationSteps.push({ name: "constantFolding", applied: true });
    }
    if (options.inlineConstants !== false && this.options.inlineConstants) {
      currentAST = this._inlineConstants(currentAST, options);
      optimizationSteps.push({ name: "constantInlining", applied: true });
    }
    if (
      options.simplifyExpressions !== false &&
      this.options.simplifyExpressions
    ) {
      currentAST = this._simplifyExpressions(currentAST, options);
      optimizationSteps.push({
        name: "expressionSimplification",
        applied: true,
      });
    }
    if (options.removeUnused !== false && this.options.removeUnused) {
      currentAST = this._removeUnusedDeclarations(currentAST, options);
      optimizationSteps.push({ name: "unusedRemoval", applied: true });
    }
    if (level === "aggressive") {
      currentAST = this._aggressiveOptimizations(currentAST, options);
      optimizationSteps.push({
        name: "aggressiveOptimizations",
        applied: true,
      });
    }
    this.statistics.optimizationsApplied += optimizationSteps.length;
    return currentAST;
  }

  _removeDebuggerStatements(ast, options = {}) {
    const self = this;
    traverse(ast, {
      DebuggerStatement(path) {
        path.remove();
        self.statistics.deadCodeRemoved++;
      },
    });
    return ast;
  }

  _removeConsoleStatements(ast, options = {}) {
    const self = this;
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "console"
        ) {
          const parent = path.parent;
          if (parent.type === "ExpressionStatement") {
            path.parentPath.remove();
            self.statistics.deadCodeRemoved++;
          }
        }
      },
    });
    return ast;
  }

  _eliminateDeadCode(ast, options = {}) {
    const self = this;
    traverse(ast, {
      IfStatement(path) {
        const test = path.node.test;
        if (test.type === "BooleanLiteral") {
          if (test.value) {
            path.replaceWith(path.node.consequent);
          } else if (path.node.alternate) {
            path.replaceWith(path.node.alternate);
          } else {
            path.remove();
          }
          self.statistics.deadCodeRemoved++;
        }
      },
      ConditionalExpression(path) {
        const test = path.node.test;
        if (test.type === "BooleanLiteral") {
          path.replaceWith(
            test.value ? path.node.consequent : path.node.alternate
          );
          self.statistics.deadCodeRemoved++;
        }
      },
      LogicalExpression(path) {
        const left = path.node.left;
        const right = path.node.right;
        if (left.type === "BooleanLiteral") {
          if (path.node.operator === "&&") {
            path.replaceWith(left.value ? right : left);
          } else {
            path.replaceWith(left.value ? left : right);
          }
          self.statistics.deadCodeRemoved++;
        }
      },
      EmptyStatement(path) {
        path.remove();
        self.statistics.deadCodeRemoved++;
      },
      BlockStatement(path) {
        if (
          path.node.body.length === 0 &&
          path.parent.type !== "FunctionDeclaration"
        ) {
          path.remove();
          self.statistics.deadCodeRemoved++;
        }
      },
    });
    return ast;
  }

  _foldConstants(ast, options = {}) {
    const self = this;
    traverse(ast, {
      BinaryExpression(path) {
        const left = path.node.left;
        const right = path.node.right;
        if (left.type === "NumericLiteral" && right.type === "NumericLiteral") {
          let result;
          switch (path.node.operator) {
            case "+":
              result = left.value + right.value;
              break;
            case "-":
              result = left.value - right.value;
              break;
            case "*":
              result = left.value * right.value;
              break;
            case "/":
              result = left.value / right.value;
              break;
            case "%":
              result = left.value % right.value;
              break;
            case "**":
              result = Math.pow(left.value, right.value);
              break;
            case "&":
              result = left.value & right.value;
              break;
            case "|":
              result = left.value | right.value;
              break;
            case "^":
              result = left.value ^ right.value;
              break;
            case "<<":
              result = left.value << right.value;
              break;
            case ">>":
              result = left.value >> right.value;
              break;
            default:
              return;
          }
          path.replaceWith({ type: "NumericLiteral", value: result });
          self.statistics.expressionsSimplified++;
        }
        if (
          left.type === "StringLiteral" &&
          right.type === "StringLiteral" &&
          path.node.operator === "+"
        ) {
          path.replaceWith({
            type: "StringLiteral",
            value: left.value + right.value,
          });
          self.statistics.expressionsSimplified++;
        }
      },
      UnaryExpression(path) {
        const arg = path.node.argument;
        if (path.node.operator === "!" && arg.type === "BooleanLiteral") {
          path.replaceWith({ type: "BooleanLiteral", value: !arg.value });
          self.statistics.expressionsSimplified++;
        }
        if (path.node.operator === "-" && arg.type === "NumericLiteral") {
          path.replaceWith({ type: "NumericLiteral", value: -arg.value });
          self.statistics.expressionsSimplified++;
        }
      },
    });
    return ast;
  }

  _inlineConstants(ast, options = {}) {
    const self = this;
    const constants = new Map();
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          path.node.init &&
          (path.node.init.type === "NumericLiteral" ||
            path.node.init.type === "StringLiteral" ||
            path.node.init.type === "BooleanLiteral")
        ) {
          const binding = path.scope.getBinding(path.node.id.name);
          if (binding && binding.constantViolations.length === 0) {
            constants.set(path.node.id.name, path.node.init);
          }
        }
      },
    });
    traverse(ast, {
      Identifier(path) {
        if (constants.has(path.node.name)) {
          const parent = path.parent;
          if (parent.type !== "VariableDeclarator" || parent.id !== path.node) {
            path.replaceWith({ ...constants.get(path.node.name) });
            self.statistics.constantsInlined++;
          }
        }
      },
    });
    return ast;
  }

  _simplifyExpressions(ast, options = {}) {
    const self = this;
    traverse(ast, {
      BinaryExpression(path) {
        const node = path.node;
        if (
          node.operator === "+" &&
          node.right.type === "NumericLiteral" &&
          node.right.value === 0
        ) {
          path.replaceWith(node.left);
          self.statistics.expressionsSimplified++;
        }
        if (
          node.operator === "-" &&
          node.right.type === "NumericLiteral" &&
          node.right.value === 0
        ) {
          path.replaceWith(node.left);
          self.statistics.expressionsSimplified++;
        }
        if (
          node.operator === "*" &&
          node.right.type === "NumericLiteral" &&
          node.right.value === 1
        ) {
          path.replaceWith(node.left);
          self.statistics.expressionsSimplified++;
        }
      },
      LogicalExpression(path) {
        const node = path.node;
        if (node.operator === "||" && node.right.type === "NullLiteral") {
          path.replaceWith(node.left);
          self.statistics.expressionsSimplified++;
        }
      },
      UnaryExpression(path) {
        if (
          path.node.operator === "!" &&
          path.node.argument.type === "UnaryExpression" &&
          path.node.argument.operator === "!"
        ) {
          path.replaceWith(path.node.argument.argument);
          self.statistics.expressionsSimplified++;
        }
      },
    });
    return ast;
  }

  _removeUnusedDeclarations(ast, options = {}) {
    const self = this;
    traverse(ast, {
      Program(path) {
        const body = path.node.body;
        for (let i = body.length - 1; i >= 0; i--) {
          const node = body[i];
          if (node.type === "VariableDeclaration") {
            const newDeclarators = [];
            for (const declarator of node.declarations) {
              const name = declarator.id.name;
              const binding = path.scope.getBinding(name);
              if (binding && binding.referenced) {
                newDeclarators.push(declarator);
              } else {
                self.statistics.deadCodeRemoved++;
              }
            }
            if (newDeclarators.length === 0) {
              body.splice(i, 1);
            } else if (newDeclarators.length !== node.declarations.length) {
              node.declarations = newDeclarators;
            }
          }
          if (node.type === "FunctionDeclaration") {
            const name = node.id?.name;
            if (name) {
              const binding = path.scope.getBinding(name);
              if (!binding || !binding.referenced) {
                body.splice(i, 1);
                self.statistics.deadCodeRemoved++;
              }
            }
          }
        }
      },
    });
    return ast;
  }

  _aggressiveOptimizations(ast, options = {}) {
    ast = this._mergeDuplicateFunctions(ast);
    ast = this._inlineSmallFunctions(ast);
    ast = this._optimizeLoops(ast);
    return ast;
  }

  _mergeDuplicateFunctions(ast) {
    return ast;
  }

  _inlineSmallFunctions(ast) {
    return ast;
  }

  _optimizeLoops(ast) {
    return ast;
  }

  registerOptimization(name, fn, options = {}) {
    this.optimizations.set(name, {
      name,
      fn,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
    });
    return this;
  }

  unregisterOptimization(name) {
    this.optimizations.delete(name);
    return this;
  }

  getOptimization(name) {
    return this.optimizations.get(name);
  }

  listOptimizations() {
    return Array.from(this.optimizations.keys());
  }

  _recordOptimization(id, data) {
    this.results.set(id, {
      ...data,
      timestamp: Date.now(),
    });
    this.statistics.totalOptimized++;
    this.statistics.totalSizeBefore += data.sizeBefore;
    this.statistics.totalSizeAfter += data.sizeAfter;
    this.statistics.totalSizeSaved += data.sizeSaved;
    this._compressionRatios.push(parseFloat(data.compressionRatio));
    this._updateAverageCompressionRatio();
  }

  _updateAverageCompressionRatio() {
    if (this._compressionRatios.length > 100) {
      this._compressionRatios = this._compressionRatios.slice(-100);
    }
    const sum = this._compressionRatios.reduce((a, b) => a + b, 0);
    this.statistics.averageCompressionRatio =
      sum / this._compressionRatios.length;
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

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  setOptimizationLevel(level) {
    const levels = ["none", "basic", "standard", "aggressive"];
    if (!levels.includes(level)) {
      throw new Error(`Invalid optimization level: ${level}`);
    }
    this.options.optimizationLevel = level;
    return this;
  }

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  reset() {
    this.optimizations.clear();
    this.results.clear();
    this._compressionRatios = [];
    this.statistics = {
      totalOptimized: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      totalSizeSaved: 0,
      averageCompressionRatio: 0,
      optimizationsApplied: 0,
      deadCodeRemoved: 0,
      constantsInlined: 0,
      functionsInlined: 0,
      expressionsSimplified: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = OptimizationTask;
