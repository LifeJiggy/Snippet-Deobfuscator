class CacheStorage {
  constructor(options = {}) {
    this.name = "CacheStorage";
    this.version = "3.0.0";
    this.options = {
      maxSize: options.maxSize || 1000,
      maxMemory: options.maxMemory || 100 * 1024 * 1024,
      defaultTTL: options.defaultTTL || 3600000,
      strategy: options.strategy || "lru",
      cleanupInterval: options.cleanupInterval || 60000,
    };
    this._cache = new Map();
    this._accessLog = new Map();
    this._memoryUsage = 0;
    this._cleanupTimer = null;
    this.statistics = {
      totalOperations: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryEvictions: 0,
      ttlEvictions: 0,
    };
    if (this.options.cleanupInterval > 0) {
      this._startCleanup();
    }
  }

  async get(key) {
    this.statistics.totalOperations++;
    const entry = this._cache.get(key);
    if (!entry) {
      this.statistics.misses++;
      return undefined;
    }
    if (this._isExpired(entry)) {
      await this.delete(key);
      this.statistics.misses++;
      return undefined;
    }
    this._recordAccess(key);
    this.statistics.hits++;
    return entry.value;
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    const size = this._estimateSize(value);
    if (size > this.options.maxMemory) {
      throw new Error("Value exceeds maximum memory limit");
    }
    while (
      (this._cache.size >= this.options.maxSize ||
        this._memoryUsage + size > this.options.maxMemory) &&
      this._cache.size > 0
    ) {
      this._evict();
    }
    const ttl =
      options.ttl !== undefined ? options.ttl : this.options.defaultTTL;
    const entry = {
      value,
      size,
      createdAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
      accessCount: 0,
    };
    if (this._cache.has(key)) {
      const oldEntry = this._cache.get(key);
      this._memoryUsage -= oldEntry.size;
    }
    this._cache.set(key, entry);
    this._memoryUsage += size;
    this._recordAccess(key);
    return true;
  }

  async delete(key) {
    this.statistics.totalOperations++;
    const entry = this._cache.get(key);
    if (entry) {
      this._memoryUsage -= entry.size;
      this._cache.delete(key);
      this._accessLog.delete(key);
      return true;
    }
    return false;
  }

  async has(key) {
    this.statistics.totalOperations++;
    const entry = this._cache.get(key);
    if (!entry) return false;
    if (this._isExpired(entry)) {
      await this.delete(key);
      return false;
    }
    return true;
  }

  async clear() {
    this.statistics.totalOperations++;
    this._cache.clear();
    this._accessLog.clear();
    this._memoryUsage = 0;
    return true;
  }

  async keys() {
    this.statistics.totalOperations++;
    const validKeys = [];
    for (const [key, entry] of this._cache) {
      if (!this._isExpired(entry)) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }

  async size() {
    return this._cache.size;
  }

  async getMany(keys) {
    this.statistics.totalOperations++;
    const result = {};
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    return result;
  }

  async setMany(items, options = {}) {
    this.statistics.totalOperations++;
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value, options);
    }
    return Object.keys(items).length;
  }

  async deleteMany(keys) {
    this.statistics.totalOperations++;
    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  async getOrSet(key, factory, options = {}) {
    const cached = await this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = typeof factory === "function" ? await factory() : factory;
    await this.set(key, value, options);
    return value;
  }

  async getTTL(key) {
    const entry = this._cache.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -2;
  }

  async setTTL(key, ttl) {
    const entry = this._cache.get(key);
    if (!entry) return false;
    entry.expiresAt = ttl > 0 ? Date.now() + ttl : null;
    return true;
  }

  async touch(key) {
    const entry = this._cache.get(key);
    if (!entry) return false;
    entry.accessCount++;
    this._recordAccess(key);
    return true;
  }

  async getStatistics(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    return {
      size: entry.size,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      accessCount: entry.accessCount,
      ttl: await this.getTTL(key),
    };
  }

  _isExpired(entry) {
    return entry.expiresAt && Date.now() > entry.expiresAt;
  }

  _recordAccess(key) {
    this._accessLog.set(key, {
      lastAccess: Date.now(),
      accessCount: (this._accessLog.get(key)?.accessCount || 0) + 1,
    });
  }

  _estimateSize(value) {
    if (value === null || value === undefined) return 8;
    switch (typeof value) {
      case "number":
        return 8;
      case "boolean":
        return 4;
      case "string":
        return value.length * 2;
      case "object":
        try {
          return JSON.stringify(value).length * 2;
        } catch {
          return 1024;
        }
      default:
        return 64;
    }
  }

  _evict() {
    let keyToEvict;
    switch (this.options.strategy) {
      case "lru":
        keyToEvict = this._findLRU();
        break;
      case "lfu":
        keyToEvict = this._findLFU();
        break;
      case "fifo":
        keyToEvict = this._findFIFO();
        break;
      case "random":
        keyToEvict = this._findRandom();
        break;
      default:
        keyToEvict = this._findLRU();
    }
    if (keyToEvict) {
      const entry = this._cache.get(keyToEvict);
      this._memoryUsage -= entry.size;
      this._cache.delete(keyToEvict);
      this._accessLog.delete(keyToEvict);
      this.statistics.evictions++;
    }
  }

  _findLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, log] of this._accessLog) {
      if (log.lastAccess < oldestTime) {
        oldestTime = log.lastAccess;
        oldestKey = key;
      }
    }
    return oldestKey || this._cache.keys().next().value;
  }

  _findLFU() {
    let leastKey = null;
    let leastCount = Infinity;
    for (const [key, log] of this._accessLog) {
      if (log.accessCount < leastCount) {
        leastCount = log.accessCount;
        leastKey = key;
      }
    }
    return leastKey || this._cache.keys().next().value;
  }

  _findFIFO() {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, entry] of this._cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    return oldestKey;
  }

  _findRandom() {
    const keys = Array.from(this._cache.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }

  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      this._cleanupExpired();
    }, this.options.cleanupInterval);
  }

  _cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this._cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this._memoryUsage -= entry.size;
        this._cache.delete(key);
        this._accessLog.delete(key);
        this.statistics.ttlEvictions++;
      }
    }
  }

  _stopCleanup() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  setStrategy(strategy) {
    this.options.strategy = strategy;
    return this;
  }

  getStatistics() {
    return {
      ...this.statistics,
      size: this._cache.size,
      maxSize: this.options.maxSize,
      memoryUsage: this._memoryUsage,
      maxMemory: this.options.maxMemory,
      hitRate:
        this.statistics.hits /
          (this.statistics.hits + this.statistics.misses) || 0,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  async reset() {
    await this.clear();
    this.statistics = {
      totalOperations: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryEvictions: 0,
      ttlEvictions: 0,
    };
    return this;
  }

  async dispose() {
    this._stopCleanup();
    await this.reset();
    this.options = {};
    return this;
  }
}

module.exports = CacheStorage;
