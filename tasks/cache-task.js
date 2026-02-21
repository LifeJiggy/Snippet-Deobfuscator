/**
 * Cache Task
 * Manages caching of deobfuscation results with advanced features
 * Version: 3.0.0
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class CacheTask {
  constructor(options = {}) {
    this.name = "CacheTask";
    this.version = "3.0.0";
    this.options = {
      maxSize: options.maxSize || 100,
      ttl: options.ttl || 3600000,
      storageType: options.storageType || "memory",
      storagePath: options.storagePath || "./cache",
      enablePersistence: options.enablePersistence || false,
      enableCompression: options.enableCompression || false,
      hashAlgorithm: options.hashAlgorithm || "md5",
      maxMemory: options.maxMemory || 50 * 1024 * 1024,
      cleanupInterval: options.cleanupInterval || 60000,
      cachePrefix: options.cachePrefix || "cache_",
    };
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.evictions = 0;
    this.totalMemory = 0;
    this.statistics = {
      totalRequests: 0,
      hitRate: 0,
      missRate: 0,
      averageGetTime: 0,
      averageSetTime: 0,
      lastCleanup: 0,
    };
    this._accessTimes = new Map();
    this._getTimes = [];
    this._setTimes = [];
    this._cleanupTimer = null;
    this._initializeStorage();
  }

  _initializeStorage() {
    if (this.options.enablePersistence && this.options.storageType === "file") {
      if (!fs.existsSync(this.options.storagePath)) {
        fs.mkdirSync(this.options.storagePath, { recursive: true });
      }
    }
  }

  async execute(code, context = {}) {
    const operation = context.operation || "get";
    const startTime = Date.now();

    try {
      this.statistics.totalRequests++;

      if (operation === "get") {
        return await this._executeGet(code, context, startTime);
      } else if (operation === "set") {
        return await this._executeSet(code, context, startTime);
      } else if (operation === "delete") {
        return await this._executeDelete(code, context, startTime);
      } else if (operation === "clear") {
        return await this._executeClear(context, startTime);
      } else if (operation === "has") {
        return await this._executeHas(code, context, startTime);
      } else if (operation === "getOrSet") {
        return await this._executeGetOrSet(code, context, startTime);
      }

      throw new Error(`Unknown operation: ${operation}`);
    } catch (error) {
      this.errors++;
      throw error;
    }
  }

  async _executeGet(code, context, startTime) {
    const key = this.generateKey(code, context);
    const cached = await this.get(key, context);

    const duration = Date.now() - startTime;
    this._recordGetTime(duration);

    if (cached) {
      this.hits++;
      this._accessTimes.set(key, Date.now());
      this.statistics.hitRate = this.hits / this.statistics.totalRequests;
      this.statistics.missRate = this.misses / this.statistics.totalRequests;

      return {
        success: true,
        cached: true,
        result: cached.result,
        metadata: cached.metadata,
        key,
        timestamp: Date.now(),
        duration,
      };
    } else {
      this.misses++;
      this.statistics.hitRate = this.hits / this.statistics.totalRequests;
      this.statistics.missRate = this.misses / this.statistics.totalRequests;

      return {
        success: true,
        cached: false,
        key,
        timestamp: Date.now(),
        duration,
      };
    }
  }

  async _executeSet(code, context, startTime) {
    const key = this.generateKey(code, context);
    const result = await this.set(key, code, context);

    const duration = Date.now() - startTime;
    this._recordSetTime(duration);

    return {
      success: true,
      key,
      stored: result,
      timestamp: Date.now(),
      duration,
    };
  }

  async _executeDelete(code, context, startTime) {
    const key = this.generateKey(code, context);
    const deleted = await this.delete(key);

    const duration = Date.now() - startTime;

    return {
      success: true,
      key,
      deleted,
      timestamp: Date.now(),
      duration,
    };
  }

  async _executeClear(context, startTime) {
    const cleared = await this.clear();

    const duration = Date.now() - startTime;

    return {
      success: true,
      cleared,
      timestamp: Date.now(),
      duration,
    };
  }

  async _executeHas(code, context, startTime) {
    const key = this.generateKey(code, context);
    const has = await this.has(key);

    const duration = Date.now() - startTime;

    return {
      success: true,
      key,
      has,
      timestamp: Date.now(),
      duration,
    };
  }

  async _executeGetOrSet(code, context, startTime) {
    const key = this.generateKey(code, context);
    const cached = await this.get(key, context);

    if (cached) {
      this.hits++;
      this._accessTimes.set(key, Date.now());
      this.statistics.hitRate = this.hits / this.statistics.totalRequests;

      const duration = Date.now() - startTime;

      return {
        success: true,
        cached: true,
        result: cached.result,
        key,
        timestamp: Date.now(),
        duration,
      };
    }

    const duration = Date.now() - startTime;
    return {
      success: true,
      cached: false,
      key,
      timestamp: Date.now(),
      duration,
    };
  }

  generateKey(code, context = {}) {
    const hash = crypto.createHash(this.options.hashAlgorithm);
    hash.update(code);

    if (context.options) {
      hash.update(JSON.stringify(context.options));
    }

    if (context.filename) {
      hash.update(context.filename);
    }

    if (context.environment) {
      hash.update(context.environment);
    }

    if (context.metadata) {
      hash.update(JSON.stringify(context.metadata));
    }

    return this.options.cachePrefix + hash.digest("hex");
  }

  async get(key, context = {}) {
    if (this.options.storageType === "file") {
      return this._getFromFile(key);
    }
    return this._getFromMemory(key);
  }

  _getFromMemory(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this._accessTimes.delete(key);
      return null;
    }

    return entry.result;
  }

  async _getFromFile(key) {
    const filePath = this._getFilePath(key);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const entry = JSON.parse(content);

      if (Date.now() - entry.timestamp > this.options.ttl) {
        fs.unlinkSync(filePath);
        return null;
      }

      return entry.result;
    } catch (error) {
      this.errors++;
      return null;
    }
  }

  async set(key, value, context = {}) {
    if (this.options.storageType === "file") {
      return this._setToFile(key, value, context);
    }
    return this._setToMemory(key, value, context);
  }

  _setToMemory(key, value, context = {}) {
    if (this.cache.size >= this.options.maxSize) {
      this._evictLRU();
    }

    const size = this._estimateSize(value);
    const entry = {
      result: value,
      timestamp: Date.now(),
      size,
      metadata: {
        created: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        context,
      },
    };

    this.cache.set(key, entry);
    this.totalMemory += size;
    this._accessTimes.set(key, Date.now());

    this._checkMemoryLimit();

    return true;
  }

  async _setToFile(key, value, context = {}) {
    const filePath = this._getFilePath(key);

    try {
      const entry = {
        result: value,
        timestamp: Date.now(),
        metadata: {
          created: Date.now(),
          context,
        },
      };

      const content = JSON.stringify(entry);
      fs.writeFileSync(filePath, content, "utf8");

      return true;
    } catch (error) {
      this.errors++;
      return false;
    }
  }

  _getFilePath(key) {
    return path.join(this.options.storagePath, `${key}.json`);
  }

  _estimateSize(obj) {
    const str = JSON.stringify(obj);
    return Buffer.byteLength(str, "utf8");
  }

  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this._accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.totalMemory -= entry.size;
      }
      this.cache.delete(oldestKey);
      this._accessTimes.delete(oldestKey);
      this.evictions++;
    }
  }

  _checkMemoryLimit() {
    while (this.totalMemory > this.options.maxMemory && this.cache.size > 0) {
      this._evictLRU();
    }
  }

  has(key) {
    if (this.options.storageType === "file") {
      const filePath = this._getFilePath(key);
      return fs.existsSync(filePath);
    }
    return this.cache.has(key);
  }

  delete(key) {
    if (this.options.storageType === "file") {
      const filePath = this._getFilePath(key);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
        return false;
      } catch (error) {
        this.errors++;
        return false;
      }
    }

    const entry = this.cache.get(key);
    if (entry) {
      this.totalMemory -= entry.size;
    }
    this.cache.delete(key);
    this._accessTimes.delete(key);
    return true;
  }

  clear() {
    if (this.options.storageType === "file") {
      try {
        const files = fs.readdirSync(this.options.storagePath);
        let count = 0;
        for (const file of files) {
          if (file.startsWith(this.options.cachePrefix)) {
            fs.unlinkSync(path.join(this.options.storagePath, file));
            count++;
          }
        }
        return count;
      } catch (error) {
        this.errors++;
        return 0;
      }
    }

    const count = this.cache.size;
    this.cache.clear();
    this._accessTimes.clear();
    this.totalMemory = 0;
    return count;
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    if (this.options.storageType === "file") {
      try {
        const files = fs.readdirSync(this.options.storagePath);
        for (const file of files) {
          if (!file.startsWith(this.options.cachePrefix)) continue;

          const filePath = path.join(this.options.storagePath, file);
          const content = fs.readFileSync(filePath, "utf8");
          const entry = JSON.parse(content);

          if (now - entry.timestamp > this.options.ttl) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        }
      } catch (error) {
        this.errors++;
      }
    } else {
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.options.ttl) {
          this.totalMemory -= entry.size;
          this.cache.delete(key);
          this._accessTimes.delete(key);
          cleaned++;
        }
      }
    }

    this.statistics.lastCleanup = now;
    return cleaned;
  }

  startAutoCleanup() {
    if (this._cleanupTimer) {
      return;
    }

    this._cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  stopAutoCleanup() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  _recordGetTime(duration) {
    this._getTimes.push(duration);
    if (this._getTimes.length > 100) {
      this._getTimes = this._getTimes.slice(-100);
    }
    const sum = this._getTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageGetTime = sum / this._getTimes.length;
  }

  _recordSetTime(duration) {
    this._setTimes.push(duration);
    if (this._setTimes.length > 100) {
      this._setTimes = this._setTimes.slice(-100);
    }
    const sum = this._setTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageSetTime = sum / this._setTimes.length;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      memory: this.totalMemory,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      errors: this.errors,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + "%" : "0%",
      missRate: total > 0 ? ((this.misses / total) * 100).toFixed(2) + "%" : "0%",
      averageGetTime: this.statistics.averageGetTime.toFixed(2) + "ms",
      averageSetTime: this.statistics.averageSetTime.toFixed(2) + "ms",
      lastCleanup: this.statistics.lastCleanup,
      totalRequests: this.statistics.totalRequests,
    };
  }

  getKeys() {
    if (this.options.storageType === "file") {
      try {
        const files = fs.readdirSync(this.options.storagePath);
        return files
          .filter((f) => f.startsWith(this.options.cachePrefix))
          .map((f) => f.replace(".json", ""));
      } catch (error) {
        this.errors++;
        return [];
      }
    }
    return Array.from(this.cache.keys());
  }

  getEntry(key) {
    if (this.options.storageType === "file") {
      const filePath = this._getFilePath(key);
      try {
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
      } catch (error) {
        this.errors++;
        return null;
      }
    }
    return this.cache.get(key);
  }

  getSize() {
    if (this.options.storageType === "file") {
      try {
        const files = fs.readdirSync(this.options.storagePath);
        return files.filter((f) => f.startsWith(this.options.cachePrefix)).length;
      } catch (error) {
        return 0;
      }
    }
    return this.cache.size;
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  getOptions() {
    return { ...this.options };
  }

  mergeOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  exportCache() {
    const data = {};
    for (const [key, entry] of this.cache.entries()) {
      data[key] = entry;
    }
    return data;
  }

  importCache(data) {
    for (const [key, entry] of Object.entries(data)) {
      this.cache.set(key, entry);
      this.totalMemory += entry.size || 0;
      this._accessTimes.set(key, entry.timestamp || Date.now());
    }
    this._checkMemoryLimit();
  }

  reset() {
    this.cache.clear();
    this._accessTimes.clear();
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.evictions = 0;
    this.totalMemory = 0;
    this._getTimes = [];
    this._setTimes = [];
    this.statistics = {
      totalRequests: 0,
      hitRate: 0,
      missRate: 0,
      averageGetTime: 0,
      averageSetTime: 0,
      lastCleanup: 0,
    };
    return this;
  }

  dispose() {
    this.stopAutoCleanup();
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = CacheTask;
