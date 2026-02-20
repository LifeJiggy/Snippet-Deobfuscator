const StringUtils = require("./string-utils");
const ASTUtils = require("./ast-utils");
const CodeUtils = require("./code-utils");
const FileUtils = require("./file-utils");
const ObjectUtils = require("./object-utils");
const AsyncUtils = require("./async-utils");

class UtilsRegistry {
  constructor(options = {}) {
    this.name = "UtilsRegistry";
    this.version = "3.0.0";
    this.options = {
      cacheEnabled: options.cacheEnabled !== false,
      cacheSize: options.cacheSize || 1000,
      strictMode: options.strictMode || false,
    };
    this._utils = new Map();
    this._cache = new Map();
    this._shortcuts = new Map();
    this._chains = [];
    this.statistics = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageExecutionTime: 0,
    };
    this._executionTimes = [];
    this._initializeUtils();
    this._initializeShortcuts();
  }

  _initializeUtils() {
    this._utils.set("string", new StringUtils());
    this._utils.set("ast", new ASTUtils());
    this._utils.set("code", new CodeUtils());
    this._utils.set("file", new FileUtils());
    this._utils.set("object", new ObjectUtils());
    this._utils.set("async", new AsyncUtils());
  }

  _initializeShortcuts() {
    this._shortcuts.set("camelCase", (str) =>
      this.get("string").camelCase(str)
    );
    this._shortcuts.set("snakeCase", (str) =>
      this.get("string").snakeCase(str)
    );
    this._shortcuts.set("pascalCase", (str) =>
      this.get("string").pascalCase(str)
    );
    this._shortcuts.set("kebabCase", (str) =>
      this.get("string").kebabCase(str)
    );
    this._shortcuts.set("traverse", (ast, visitors) =>
      this.get("ast").traverseAST(ast, visitors)
    );
    this._shortcuts.set("findNodes", (ast, type) =>
      this.get("ast").findNodes(ast, type)
    );
    this._shortcuts.set("format", (code, options) =>
      this.get("code").formatCode(code, options)
    );
    this._shortcuts.set("minify", (code, options) =>
      this.get("code").minifyCode(code, options)
    );
    this._shortcuts.set("read", (path) => this.get("file").readFile(path));
    this._shortcuts.set("write", (path, content) =>
      this.get("file").writeFile(path, content)
    );
    this._shortcuts.set("clone", (obj) => this.get("object").deepClone(obj));
    this._shortcuts.set("merge", (...objs) =>
      this.get("object").deepMerge(...objs)
    );
    this._shortcuts.set("parallel", (tasks) =>
      this.get("async").parallel(tasks)
    );
    this._shortcuts.set("series", (tasks) => this.get("async").series(tasks));
    this._shortcuts.set("retry", (fn, options) =>
      this.get("async").retry(fn, options)
    );
  }

  get(name) {
    if (!this._utils.has(name)) {
      throw new Error(`Utility "${name}" not found`);
    }
    return this._utils.get(name);
  }

  has(name) {
    return this._utils.has(name);
  }

  register(name, utility) {
    if (this._utils.has(name)) {
      throw new Error(`Utility "${name}" already registered`);
    }
    this._utils.set(name, utility);
    return this;
  }

  unregister(name) {
    if (!this._utils.has(name)) {
      throw new Error(`Utility "${name}" not found`);
    }
    this._utils.delete(name);
    return this;
  }

  list() {
    return Array.from(this._utils.keys());
  }

  shortcut(name, ...args) {
    const startTime = Date.now();
    this.statistics.totalCalls++;
    if (!this._shortcuts.has(name)) {
      this.statistics.errors++;
      throw new Error(`Shortcut "${name}" not found`);
    }
    try {
      const cacheKey = this._getCacheKey(name, args);
      if (this.options.cacheEnabled && this._cache.has(cacheKey)) {
        this.statistics.cacheHits++;
        return this._cache.get(cacheKey);
      }
      this.statistics.cacheMisses++;
      const result = this._shortcuts.get(name)(...args);
      if (this.options.cacheEnabled) {
        this._setCache(cacheKey, result);
      }
      this._recordExecution(Date.now() - startTime);
      return result;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  registerShortcut(name, fn) {
    if (typeof fn !== "function") {
      throw new Error("Shortcut must be a function");
    }
    this._shortcuts.set(name, fn);
    return this;
  }

  unregisterShortcut(name) {
    this._shortcuts.delete(name);
    return this;
  }

  listShortcuts() {
    return Array.from(this._shortcuts.keys());
  }

  chain() {
    const chainObj = {
      _value: undefined,
      _utils: this,
    };
    const proxy = new Proxy(chainObj, {
      get(target, prop) {
        if (prop === "value") {
          return target._value;
        }
        if (prop === "done") {
          return () => target._value;
        }
        return function (...args) {
          if (target._utils._shortcuts.has(prop)) {
            const allArgs =
              target._value !== undefined ? [target._value, ...args] : args;
            target._value = target._utils._shortcuts.get(prop)(...allArgs);
          } else if (target._utils._utils.has(prop)) {
            return target._utils.get(prop);
          }
          return proxy;
        };
      },
    });
    return proxy;
  }

  pipe(initialValue, ...operations) {
    let result = initialValue;
    for (const op of operations) {
      if (typeof op === "string") {
        result = this.shortcut(op, result);
      } else if (typeof op === "function") {
        result = op(result);
      }
    }
    return result;
  }

  compose(...operations) {
    const self = this;
    return function (initialValue) {
      return operations.reduceRight((value, op) => {
        if (typeof op === "string") {
          return self.shortcut(op, value);
        }
        return op(value);
      }, initialValue);
    };
  }

  memoize(fn, options = {}) {
    const cache = new Map();
    const self = this;
    return function (...args) {
      const key = self._getCacheKey(fn.name || "anonymous", args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
      if (options.ttl) {
        setTimeout(() => cache.delete(key), options.ttl);
      }
      if (options.maxSize && cache.size > options.maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      return result;
    };
  }

  debounce(fn, delay = 300) {
    let timeoutId = null;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  throttle(fn, limit = 300) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  curry(fn) {
    const arity = fn.length;
    const curried = (...args) => {
      if (args.length >= arity) {
        return fn(...args);
      }
      return (...more) => curried(...args, ...more);
    };
    return curried;
  }

  partial(fn, ...presetArgs) {
    return (...laterArgs) => fn(...presetArgs, ...laterArgs);
  }

  _getCacheKey(name, args) {
    try {
      return `${name}:${JSON.stringify(args)}`;
    } catch {
      return `${name}:${args.length}`;
    }
  }

  _setCache(key, value) {
    if (this._cache.size >= this.options.cacheSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  }

  _recordExecution(duration) {
    this._executionTimes.push(duration);
    if (this._executionTimes.length > 100) {
      this._executionTimes = this._executionTimes.slice(-100);
    }
    const sum = this._executionTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageExecutionTime = sum / this._executionTimes.length;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  getCacheStats() {
    return {
      size: this._cache.size,
      maxSize: this.options.cacheSize,
      hitRate:
        this.statistics.totalCalls > 0
          ? (
              (this.statistics.cacheHits / this.statistics.totalCalls) *
              100
            ).toFixed(2)
          : 0,
    };
  }

  clearCache() {
    const size = this._cache.size;
    this._cache.clear();
    return size;
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._cache.clear();
    this._chains = [];
    this._executionTimes = [];
    this.statistics = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageExecutionTime: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._utils.clear();
    this._shortcuts.clear();
    return this;
  }
}

const utils = new UtilsRegistry();

module.exports = utils;
module.exports.UtilsRegistry = UtilsRegistry;
module.exports.StringUtils = StringUtils;
module.exports.ASTUtils = ASTUtils;
module.exports.CodeUtils = CodeUtils;
module.exports.FileUtils = FileUtils;
module.exports.ObjectUtils = ObjectUtils;
module.exports.AsyncUtils = AsyncUtils;
