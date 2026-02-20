class MemoryStorage {
  constructor(options = {}) {
    this.name = "MemoryStorage";
    this.version = "3.0.0";
    this.options = {
      maxSize: options.maxSize || 10000,
      defaultTTL: options.defaultTTL || 0,
      cleanupInterval: options.cleanupInterval || 60000,
    };
    this._store = new Map();
    this._ttl = new Map();
    this._accessOrder = [];
    this._cleanupTimer = null;
    this.statistics = {
      totalOperations: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
    if (this.options.cleanupInterval > 0) {
      this._startCleanup();
    }
  }

  async get(key) {
    this.statistics.totalOperations++;
    if (this._isExpired(key)) {
      await this.delete(key);
      this.statistics.misses++;
      return undefined;
    }
    if (this._store.has(key)) {
      this.statistics.hits++;
      this._updateAccessOrder(key);
      return this._store.get(key);
    }
    this.statistics.misses++;
    return undefined;
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    if (this._store.size >= this.options.maxSize && !this._store.has(key)) {
      this._evict();
    }
    this._store.set(key, value);
    this._updateAccessOrder(key);
    const ttl =
      options.ttl !== undefined ? options.ttl : this.options.defaultTTL;
    if (ttl > 0) {
      this._ttl.set(key, Date.now() + ttl);
    } else {
      this._ttl.delete(key);
    }
    return true;
  }

  async delete(key) {
    this.statistics.totalOperations++;
    this._store.delete(key);
    this._ttl.delete(key);
    const index = this._accessOrder.indexOf(key);
    if (index > -1) {
      this._accessOrder.splice(index, 1);
    }
    return true;
  }

  async has(key) {
    this.statistics.totalOperations++;
    if (this._isExpired(key)) {
      await this.delete(key);
      return false;
    }
    return this._store.has(key);
  }

  async clear() {
    this.statistics.totalOperations++;
    this._store.clear();
    this._ttl.clear();
    this._accessOrder = [];
    return true;
  }

  async keys() {
    this.statistics.totalOperations++;
    const validKeys = [];
    for (const key of this._store.keys()) {
      if (!this._isExpired(key)) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }

  async size() {
    this.statistics.totalOperations++;
    let count = 0;
    for (const key of this._store.keys()) {
      if (!this._isExpired(key)) {
        count++;
      }
    }
    return count;
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
      if (this._store.has(key)) {
        await this.delete(key);
        count++;
      }
    }
    return count;
  }

  async increment(key, amount = 1) {
    this.statistics.totalOperations++;
    const current = (await this.get(key)) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key, amount = 1) {
    return this.increment(key, -amount);
  }

  async push(key, ...values) {
    this.statistics.totalOperations++;
    const current = (await this.get(key)) || [];
    if (!Array.isArray(current)) {
      throw new Error(`Value at "${key}" is not an array`);
    }
    current.push(...values);
    await this.set(key, current);
    return current.length;
  }

  async pop(key) {
    this.statistics.totalOperations++;
    const current = (await this.get(key)) || [];
    if (!Array.isArray(current)) {
      throw new Error(`Value at "${key}" is not an array`);
    }
    const value = current.pop();
    await this.set(key, current);
    return value;
  }

  async getTTL(key) {
    if (!this._ttl.has(key)) {
      return -1;
    }
    const expiry = this._ttl.get(key);
    const remaining = expiry - Date.now();
    return remaining > 0 ? remaining : -2;
  }

  async setTTL(key, ttl) {
    if (!this._store.has(key)) {
      return false;
    }
    if (ttl > 0) {
      this._ttl.set(key, Date.now() + ttl);
    } else {
      this._ttl.delete(key);
    }
    return true;
  }

  _isExpired(key) {
    if (!this._ttl.has(key)) {
      return false;
    }
    return Date.now() > this._ttl.get(key);
  }

  _updateAccessOrder(key) {
    const index = this._accessOrder.indexOf(key);
    if (index > -1) {
      this._accessOrder.splice(index, 1);
    }
    this._accessOrder.push(key);
  }

  _evict() {
    if (this._accessOrder.length === 0) {
      return;
    }
    const keyToEvict = this._accessOrder.shift();
    this._store.delete(keyToEvict);
    this._ttl.delete(keyToEvict);
    this.statistics.evictions++;
  }

  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      this._cleanup();
    }, this.options.cleanupInterval);
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this._ttl) {
      if (now > expiry) {
        this._store.delete(key);
        this._ttl.delete(key);
        const index = this._accessOrder.indexOf(key);
        if (index > -1) {
          this._accessOrder.splice(index, 1);
        }
        this.statistics.expirations++;
      }
    }
  }

  _stopCleanup() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  getStatistics() {
    return {
      ...this.statistics,
      size: this._store.size,
      maxSize: this.options.maxSize,
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
      expirations: 0,
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

module.exports = MemoryStorage;
