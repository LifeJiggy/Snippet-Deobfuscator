class IndexedStorage {
  constructor(options = {}) {
    this.name = "IndexedStorage";
    this.version = "3.0.0";
    this.options = {
      name: options.name || "default",
      version: options.version || 1,
      keyPath: options.keyPath || "id",
      autoIncrement: options.autoIncrement || false,
    };
    this._stores = new Map();
    this._indexes = new Map();
    this._sequences = new Map();
    this._currentStore = null;
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      indexQueries: 0,
    };
    this._initializeDefaultStore();
  }

  _initializeDefaultStore() {
    this._stores.set(this.options.name, new Map());
    this._indexes.set(this.options.name, new Map());
    this._sequences.set(this.options.name, 0);
    this._currentStore = this.options.name;
  }

  createStore(name, options = {}) {
    this.statistics.totalOperations++;
    if (this._stores.has(name)) {
      throw new Error(`Store "${name}" already exists`);
    }
    this._stores.set(name, new Map());
    this._indexes.set(name, new Map());
    this._sequences.set(name, 0);
    if (options.indexes) {
      for (const indexDef of options.indexes) {
        this.createIndex(
          name,
          indexDef.name,
          indexDef.keyPath,
          indexDef.options
        );
      }
    }
    return true;
  }

  deleteStore(name) {
    this.statistics.totalOperations++;
    if (!this._stores.has(name)) {
      throw new Error(`Store "${name}" not found`);
    }
    this._stores.delete(name);
    this._indexes.delete(name);
    this._sequences.delete(name);
    return true;
  }

  useStore(name) {
    if (!this._stores.has(name)) {
      throw new Error(`Store "${name}" not found`);
    }
    this._currentStore = name;
    return this;
  }

  createIndex(storeName, indexName, keyPath, options = {}) {
    this.statistics.totalOperations++;
    const store = this._stores.get(storeName || this._currentStore);
    if (!store) {
      throw new Error(`Store "${storeName}" not found`);
    }
    const indexes = this._indexes.get(storeName || this._currentStore);
    indexes.set(indexName, {
      keyPath,
      unique: options.unique || false,
      multiEntry: options.multiEntry || false,
      entries: new Map(),
    });
    for (const [key, value] of store) {
      this._addToIndex(storeName || this._currentStore, indexName, key, value);
    }
    return true;
  }

  deleteIndex(storeName, indexName) {
    this.statistics.totalOperations++;
    const indexes = this._indexes.get(storeName || this._currentStore);
    if (!indexes || !indexes.has(indexName)) {
      throw new Error(`Index "${indexName}" not found`);
    }
    indexes.delete(indexName);
    return true;
  }

  _addToIndex(storeName, indexName, key, value) {
    const indexes = this._indexes.get(storeName);
    if (!indexes) return;
    const index = indexes.get(indexName);
    if (!index) return;
    const indexKey = this._getIndexKey(value, index.keyPath);
    if (indexKey === undefined) return;
    if (index.unique && index.entries.has(indexKey)) {
      throw new Error(`Duplicate entry for unique index "${indexName}"`);
    }
    if (!index.entries.has(indexKey)) {
      index.entries.set(indexKey, new Set());
    }
    index.entries.get(indexKey).add(key);
  }

  _removeFromIndex(storeName, indexName, key, value) {
    const indexes = this._indexes.get(storeName);
    if (!indexes) return;
    const index = indexes.get(indexName);
    if (!index) return;
    const indexKey = this._getIndexKey(value, index.keyPath);
    if (indexKey === undefined) return;
    if (index.entries.has(indexKey)) {
      index.entries.get(indexKey).delete(key);
      if (index.entries.get(indexKey).size === 0) {
        index.entries.delete(indexKey);
      }
    }
  }

  _getIndexKey(value, keyPath) {
    if (typeof keyPath === "function") {
      return keyPath(value);
    }
    if (Array.isArray(keyPath)) {
      return keyPath.map((p) => this._getNestedValue(value, p));
    }
    return this._getNestedValue(value, keyPath);
  }

  _getNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    return current;
  }

  async get(key, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.reads++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    if (!store) {
      throw new Error(`Store "${storeName}" not found`);
    }
    return store.get(key);
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.writes++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    if (!store) {
      throw new Error(`Store "${storeName}" not found`);
    }
    const keyPath = options.keyPath || this.options.keyPath;
    let actualKey = key;
    if (!actualKey && keyPath && value[keyPath]) {
      actualKey = value[keyPath];
    }
    if (!actualKey && this.options.autoIncrement) {
      const seq = this._sequences.get(storeName);
      actualKey = seq + 1;
      this._sequences.set(storeName, actualKey);
    }
    if (!actualKey) {
      throw new Error("No key provided and autoIncrement is disabled");
    }
    if (store.has(actualKey)) {
      const oldValue = store.get(actualKey);
      for (const [indexName] of this._indexes.get(storeName)) {
        this._removeFromIndex(storeName, indexName, actualKey, oldValue);
      }
    }
    store.set(actualKey, value);
    for (const [indexName] of this._indexes.get(storeName)) {
      this._addToIndex(storeName, indexName, actualKey, value);
    }
    return actualKey;
  }

  async delete(key, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.deletes++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    if (!store) {
      throw new Error(`Store "${storeName}" not found`);
    }
    if (!store.has(key)) {
      return false;
    }
    const value = store.get(key);
    for (const [indexName] of this._indexes.get(storeName)) {
      this._removeFromIndex(storeName, indexName, key, value);
    }
    return store.delete(key);
  }

  async has(key, options = {}) {
    this.statistics.totalOperations++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    return store ? store.has(key) : false;
  }

  async clear(options = {}) {
    this.statistics.totalOperations++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    const indexes = this._indexes.get(storeName);
    if (store) store.clear();
    if (indexes) {
      for (const index of indexes.values()) {
        index.entries.clear();
      }
    }
    return true;
  }

  async keys(options = {}) {
    this.statistics.totalOperations++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    return store ? Array.from(store.keys()) : [];
  }

  async size(options = {}) {
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    return store ? store.size : 0;
  }

  async getMany(keys, options = {}) {
    this.statistics.totalOperations++;
    const result = {};
    for (const key of keys) {
      result[key] = await this.get(key, options);
    }
    return result;
  }

  async setMany(items, options = {}) {
    this.statistics.totalOperations++;
    const keys = [];
    for (const [key, value] of Object.entries(items)) {
      keys.push(await this.set(key, value, options));
    }
    return keys;
  }

  async deleteMany(keys, options = {}) {
    this.statistics.totalOperations++;
    let count = 0;
    for (const key of keys) {
      if (await this.delete(key, options)) {
        count++;
      }
    }
    return count;
  }

  async query(options = {}) {
    this.statistics.totalOperations++;
    this.statistics.indexQueries++;
    const storeName = options.store || this._currentStore;
    const store = this._stores.get(storeName);
    if (!store) {
      throw new Error(`Store "${storeName}" not found`);
    }
    if (options.index) {
      return this._queryByIndex(storeName, options);
    }
    let results = Array.from(store.values());
    if (options.filter) {
      results = results.filter(options.filter);
    }
    if (options.sort) {
      results.sort((a, b) => {
        for (const [key, order] of Object.entries(options.sort)) {
          const aVal = this._getNestedValue(a, key);
          const bVal = this._getNestedValue(b, key);
          if (aVal < bVal) return order === "desc" ? 1 : -1;
          if (aVal > bVal) return order === "desc" ? -1 : 1;
        }
        return 0;
      });
    }
    if (options.offset !== undefined) {
      results = results.slice(options.offset);
    }
    if (options.limit !== undefined) {
      results = results.slice(0, options.limit);
    }
    return results;
  }

  async _queryByIndex(storeName, options) {
    const indexes = this._indexes.get(storeName);
    const index = indexes.get(options.index);
    if (!index) {
      throw new Error(`Index "${options.index}" not found`);
    }
    const store = this._stores.get(storeName);
    const results = [];
    const indexKey = options.key;
    const range = options.range;
    if (indexKey !== undefined) {
      const keys = index.entries.get(indexKey);
      if (keys) {
        for (const key of keys) {
          results.push(store.get(key));
        }
      }
    } else if (range) {
      for (const [entryKey, keys] of index.entries) {
        if (this._inRange(entryKey, range)) {
          for (const key of keys) {
            results.push(store.get(key));
          }
        }
      }
    } else {
      for (const keys of index.entries.values()) {
        for (const key of keys) {
          results.push(store.get(key));
        }
      }
    }
    return results;
  }

  _inRange(value, range) {
    if (range.lower !== undefined && value < range.lower) return false;
    if (range.upper !== undefined && value > range.upper) return false;
    if (range.lower === value && range.lowerExclusive) return false;
    if (range.upper === value && range.upperExclusive) return false;
    return true;
  }

  async count(options = {}) {
    const results = await this.query(options);
    return results.length;
  }

  listStores() {
    return Array.from(this._stores.keys());
  }

  listIndexes(storeName) {
    const indexes = this._indexes.get(storeName || this._currentStore);
    return indexes ? Array.from(indexes.keys()) : [];
  }

  getStatistics() {
    const storeStats = {};
    for (const [name, store] of this._stores) {
      storeStats[name] = {
        size: store.size,
        indexes: this._indexes.get(name).size,
      };
    }
    return { ...this.statistics, stores: storeStats };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  async reset() {
    this._stores.clear();
    this._indexes.clear();
    this._sequences.clear();
    this._initializeDefaultStore();
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      indexQueries: 0,
    };
    return this;
  }

  async dispose() {
    await this.reset();
    this.options = {};
    return this;
  }
}

module.exports = IndexedStorage;
