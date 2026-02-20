class ObjectUtils {
  constructor(options = {}) {
    this.name = "ObjectUtils";
    this.version = "3.0.0";
    this.options = {
      maxDepth: options.maxDepth || 100,
      maxArrayLength: options.maxArrayLength || 10000,
      circularRef: options.circularRef || "[Circular]",
    };
    this.statistics = {
      totalOperations: 0,
      clones: 0,
      merges: 0,
      comparisons: 0,
      transformations: 0,
    };
  }

  deepClone(obj, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.clones++;
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    const seen = new WeakMap();
    return this._deepCloneInternal(obj, seen, 0, options);
  }

  _deepCloneInternal(obj, seen, depth, options) {
    if (depth > (options.maxDepth || this.options.maxDepth)) {
      return null;
    }
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (seen.has(obj)) {
      return this.options.circularRef;
    }
    seen.set(obj, true);
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this._deepCloneInternal(item, seen, depth + 1, options)
      );
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags);
    }
    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of obj) {
        cloned.set(
          this._deepCloneInternal(key, seen, depth + 1, options),
          this._deepCloneInternal(value, seen, depth + 1, options)
        );
      }
      return cloned;
    }
    if (obj instanceof Set) {
      const cloned = new Set();
      for (const value of obj) {
        cloned.add(this._deepCloneInternal(value, seen, depth + 1, options));
      }
      return cloned;
    }
    if (Buffer.isBuffer(obj)) {
      return Buffer.from(obj);
    }
    if (typeof obj === "function") {
      return obj;
    }
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this._deepCloneInternal(
          obj[key],
          seen,
          depth + 1,
          options
        );
      }
    }
    return cloned;
  }

  shallowClone(obj) {
    this.statistics.totalOperations++;
    this.statistics.clones++;
    if (Array.isArray(obj)) {
      return [...obj];
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags);
    }
    if (obj instanceof Map) {
      return new Map(obj);
    }
    if (obj instanceof Set) {
      return new Set(obj);
    }
    return { ...obj };
  }

  deepMerge(...objects) {
    this.statistics.totalOperations++;
    this.statistics.merges++;
    return objects.reduce((acc, obj) => this._deepMergeInternal(acc, obj), {});
  }

  _deepMergeInternal(target, source) {
    if (source === null || typeof source !== "object") {
      return source;
    }
    if (target === null || typeof target !== "object") {
      return this.deepClone(source);
    }
    if (Array.isArray(source)) {
      return this.deepClone(source);
    }
    const result = { ...target };
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === "object" &&
          target[key] !== null
        ) {
          result[key] = this._deepMergeInternal(target[key], source[key]);
        } else {
          result[key] = this.deepClone(source[key]);
        }
      }
    }
    return result;
  }

  merge(...objects) {
    this.statistics.totalOperations++;
    this.statistics.merges++;
    return Object.assign({}, ...objects);
  }

  deepEqual(obj1, obj2, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.comparisons++;
    const seen = new WeakMap();
    return this._deepEqualInternal(obj1, obj2, seen, options);
  }

  _deepEqualInternal(a, b, seen, options) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (typeof a !== "object") return a === b;
    if (seen.has(a) && seen.get(a) === b) return true;
    seen.set(a, b);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) =>
        this._deepEqualInternal(item, b[i], seen, options)
      );
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, value] of a) {
        if (!b.has(key)) return false;
        if (!this._deepEqualInternal(value, b.get(key), seen, options))
          return false;
      }
      return true;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const value of a) {
        if (!b.has(value)) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    if (options.ignoreKeys && options.ignoreKeys.length > 0) {
      const ignoreSet = new Set(options.ignoreKeys);
      const filteredA = keysA.filter((k) => !ignoreSet.has(k));
      const filteredB = keysB.filter((k) => !ignoreSet.has(k));
      if (filteredA.length !== filteredB.length) return false;
    }
    return keysA.every((key) => {
      if (options.ignoreKeys && options.ignoreKeys.includes(key)) return true;
      return (
        Object.prototype.hasOwnProperty.call(b, key) &&
        this._deepEqualInternal(a[key], b[key], seen, options)
      );
    });
  }

  shallowEqual(obj1, obj2) {
    this.statistics.totalOperations++;
    this.statistics.comparisons++;
    if (obj1 === obj2) return true;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;
    if (obj1 === null || obj2 === null) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) => obj1[key] === obj2[key]);
  }

  getValue(obj, path, defaultValue = undefined) {
    this.statistics.totalOperations++;
    if (!obj || typeof path !== "string") return defaultValue;
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return defaultValue;
      if (key.includes("[")) {
        const match = key.match(/^(\w+)\[(\d+)\]$/);
        if (match) {
          current = current[match[1]];
          if (current === undefined) return defaultValue;
          current = current[parseInt(match[2])];
        } else {
          return defaultValue;
        }
      } else {
        current = current[key];
      }
    }
    return current === undefined ? defaultValue : current;
  }

  setValue(obj, path, value) {
    this.statistics.totalOperations++;
    if (!obj || typeof path !== "string") return obj;
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return obj;
  }

  hasKey(obj, path) {
    this.statistics.totalOperations++;
    if (!obj || typeof path !== "string") return false;
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return false;
      if (!(key in current)) return false;
      current = current[key];
    }
    return true;
  }

  deleteKey(obj, path) {
    this.statistics.totalOperations++;
    if (!obj || typeof path !== "string") return obj;
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) return obj;
      current = current[key];
    }
    delete current[keys[keys.length - 1]];
    return obj;
  }

  pick(obj, keys) {
    this.statistics.totalOperations++;
    const result = {};
    const keySet = new Set(Array.isArray(keys) ? keys : [keys]);
    for (const key of keySet) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  omit(obj, keys) {
    this.statistics.totalOperations++;
    const result = { ...obj };
    const keySet = new Set(Array.isArray(keys) ? keys : [keys]);
    for (const key of keySet) {
      delete result[key];
    }
    return result;
  }

  flatten(obj, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    const separator = options.separator || ".";
    const prefix = options.prefix || "";
    this._flattenInternal(obj, result, prefix, separator, options);
    return result;
  }

  _flattenInternal(obj, result, prefix, separator, options) {
    if (obj === null || typeof obj !== "object") {
      result[prefix] = obj;
      return;
    }
    if (Array.isArray(obj)) {
      if (options.flattenArrays) {
        for (let i = 0; i < obj.length; i++) {
          this._flattenInternal(
            obj[i],
            result,
            prefix ? `${prefix}[${i}]` : `[${i}]`,
            separator,
            options
          );
        }
      } else {
        result[prefix] = obj;
      }
      return;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      result[prefix] = {};
      return;
    }
    for (const key of keys) {
      const newPrefix = prefix ? `${prefix}${separator}${key}` : key;
      this._flattenInternal(obj[key], result, newPrefix, separator, options);
    }
  }

  unflatten(obj, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    const separator = options.separator || ".";
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this._unflattenInternal(result, key, obj[key], separator);
      }
    }
    return result;
  }

  _unflattenInternal(obj, key, value, separator) {
    const keys = key.split(separator);
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      let k = keys[i];
      const arrayMatch = k.match(/^(.+?)\[(\d+)\]$/);
      if (arrayMatch) {
        const prop = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        if (!(prop in current)) {
          current[prop] = [];
        }
        while (current[prop].length <= index) {
          current[prop].push({});
        }
        current = current[prop][index];
      } else {
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }
    }
    const lastKey = keys[keys.length - 1];
    const lastArrayMatch = lastKey.match(/^(.+?)\[(\d+)\]$/);
    if (lastArrayMatch) {
      const prop = lastArrayMatch[1];
      const index = parseInt(lastArrayMatch[2]);
      if (!(prop in current)) {
        current[prop] = [];
      }
      current[prop][index] = value;
    } else {
      current[lastKey] = value;
    }
  }

  mapKeys(obj, mapper) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey =
          typeof mapper === "function" ? mapper(key, obj[key]) : mapper;
        result[newKey] = obj[key];
      }
    }
    return result;
  }

  mapValues(obj, mapper) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] =
          typeof mapper === "function" ? mapper(obj[key], key) : mapper;
      }
    }
    return result;
  }

  mapEntries(obj, mapper) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const [newKey, newValue] = mapper(key, obj[key]);
        result[newKey] = newValue;
      }
    }
    return result;
  }

  filterKeys(obj, predicate) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (
          typeof predicate === "function" ? predicate(key, obj[key]) : predicate
        ) {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  filterValues(obj, predicate) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (
          typeof predicate === "function" ? predicate(obj[key], key) : predicate
        ) {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  keys(obj) {
    this.statistics.totalOperations++;
    return Object.keys(obj || {});
  }

  values(obj) {
    this.statistics.totalOperations++;
    return Object.values(obj || {});
  }

  entries(obj) {
    this.statistics.totalOperations++;
    return Object.entries(obj || {});
  }

  fromEntries(entries) {
    this.statistics.totalOperations++;
    return Object.fromEntries(entries);
  }

  invert(obj) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === "string" || typeof value === "number") {
          result[value] = key;
        }
      }
    }
    return result;
  }

  isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === "object") return Object.keys(obj).length === 0;
    if (typeof obj === "string") return obj.length === 0;
    return false;
  }

  isPlainObject(value) {
    if (typeof value !== "object" || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
  }

  typeOf(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (value instanceof RegExp) return "regexp";
    if (value instanceof Map) return "map";
    if (value instanceof Set) return "set";
    if (Buffer.isBuffer(value)) return "buffer";
    if (value instanceof Error) return "error";
    if (typeof value === "object") return "object";
    return typeof value;
  }

  size(obj) {
    if (obj === null || obj === undefined) return 0;
    if (Array.isArray(obj)) return obj.length;
    if (obj instanceof Map || obj instanceof Set) return obj.size;
    if (typeof obj === "object") return Object.keys(obj).length;
    if (typeof obj === "string") return obj.length;
    return 0;
  }

  freeze(obj, deep = false) {
    this.statistics.totalOperations++;
    if (deep) {
      return this._deepFreeze(obj);
    }
    return Object.freeze(obj);
  }

  _deepFreeze(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    Object.freeze(obj);
    const keys = Object.keys(obj);
    for (const key of keys) {
      const value = obj[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Object.isFrozen(value)
      ) {
        this._deepFreeze(value);
      }
    }
    return obj;
  }

  isFrozen(obj) {
    return Object.isFrozen(obj);
  }

  seal(obj, deep = false) {
    this.statistics.totalOperations++;
    if (deep) {
      return this._deepSeal(obj);
    }
    return Object.seal(obj);
  }

  _deepSeal(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    Object.seal(obj);
    const keys = Object.keys(obj);
    for (const key of keys) {
      const value = obj[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Object.isSealed(value)
      ) {
        this._deepSeal(value);
      }
    }
    return obj;
  }

  isSealed(obj) {
    return Object.isSealed(obj);
  }

  getPrototype(obj) {
    return Object.getPrototypeOf(obj);
  }

  setPrototype(obj, proto) {
    return Object.setPrototypeOf(obj, proto);
  }

  getPropertyNames(obj) {
    return Object.getOwnPropertyNames(obj);
  }

  getPropertySymbols(obj) {
    return Object.getOwnPropertySymbols(obj);
  }

  getOwnPropertyDescriptors(obj) {
    return Object.getOwnPropertyDescriptors(obj);
  }

  defineProperty(obj, prop, descriptor) {
    Object.defineProperty(obj, prop, descriptor);
    return obj;
  }

  defineProperties(obj, descriptors) {
    Object.defineProperties(obj, descriptors);
    return obj;
  }

  transform(obj, transformer) {
    this.statistics.totalOperations++;
    this.statistics.transformations++;
    return transformer(obj);
  }

  pipe(obj, ...transformers) {
    this.statistics.totalOperations++;
    this.statistics.transformations += transformers.length;
    return transformers.reduce(
      (current, transformer) => transformer(current),
      obj
    );
  }

  defaults(obj, ...defaults) {
    this.statistics.totalOperations++;
    const result = {};
    for (const def of defaults) {
      Object.assign(result, def);
    }
    Object.assign(result, obj);
    return result;
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
      totalOperations: 0,
      clones: 0,
      merges: 0,
      comparisons: 0,
      transformations: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = ObjectUtils;
