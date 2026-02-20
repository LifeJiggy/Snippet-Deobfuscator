const MemoryStorage = require("./memory-storage");
const FileStorage = require("./file-storage");
const CacheStorage = require("./cache-storage");
const SessionStorage = require("./session-storage");
const IndexedStorage = require("./indexed-storage");
const SyncStorage = require("./sync-storage");

class StorageManager {
  constructor(options = {}) {
    this.name = "StorageManager";
    this.version = "3.0.0";
    this.options = {
      defaultBackend: options.defaultBackend || "memory",
      fallbackBackend: options.fallbackBackend || "memory",
      autoSync: options.autoSync !== false,
      syncInterval: options.syncInterval || 60000,
    };
    this._backends = new Map();
    this._aliases = new Map();
    this._migrations = [];
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
      migrations: 0,
    };
    this._initializeBackends(options);
  }

  _initializeBackends(options) {
    if (options.memory !== false) {
      this._backends.set("memory", new MemoryStorage(options.memoryOptions));
    }
    if (options.file !== false) {
      this._backends.set("file", new FileStorage(options.fileOptions));
    }
    if (options.cache !== false) {
      this._backends.set("cache", new CacheStorage(options.cacheOptions));
    }
    if (options.session !== false) {
      this._backends.set("session", new SessionStorage(options.sessionOptions));
    }
    if (options.indexed !== false) {
      this._backends.set("indexed", new IndexedStorage(options.indexedOptions));
    }
    if (options.sync !== false) {
      this._backends.set("sync", new SyncStorage(options.syncOptions));
    }
    this._aliases.set("default", this.options.defaultBackend);
    this._aliases.set("primary", this.options.defaultBackend);
    this._aliases.set("fallback", this.options.fallbackBackend);
  }

  getBackend(name) {
    const backendName = this._aliases.get(name) || name;
    if (!this._backends.has(backendName)) {
      throw new Error(`Storage backend "${backendName}" not found`);
    }
    return this._backends.get(backendName);
  }

  registerBackend(name, backend) {
    if (this._backends.has(name)) {
      throw new Error(`Storage backend "${name}" already registered`);
    }
    this._backends.set(name, backend);
    return this;
  }

  unregisterBackend(name) {
    if (!this._backends.has(name)) {
      throw new Error(`Storage backend "${name}" not found`);
    }
    this._backends.delete(name);
    return this;
  }

  listBackends() {
    return Array.from(this._backends.keys());
  }

  setAlias(alias, backendName) {
    this._aliases.set(alias, backendName);
    return this;
  }

  removeAlias(alias) {
    this._aliases.delete(alias);
    return this;
  }

  async get(key, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.reads++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    try {
      return await backend.get(key);
    } catch (error) {
      this.statistics.errors++;
      if (options.fallback !== false) {
        const fallbackBackend = this.getBackend(this.options.fallbackBackend);
        return await fallbackBackend.get(key);
      }
      throw error;
    }
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.writes++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    try {
      await backend.set(key, value, options);
      if (options.replicate) {
        await this._replicateToBackends(key, value, options);
      }
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  async delete(key, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.deletes++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    try {
      await backend.delete(key);
      if (options.replicate) {
        await this._deleteFromBackends(key, options);
      }
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  async has(key, options = {}) {
    this.statistics.totalOperations++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.has(key);
  }

  async clear(options = {}) {
    this.statistics.totalOperations++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.clear();
  }

  async keys(options = {}) {
    this.statistics.totalOperations++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.keys();
  }

  async size(options = {}) {
    this.statistics.totalOperations++;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.size();
  }

  async getMany(keys, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.reads += keys.length;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.getMany(keys);
  }

  async setMany(items, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.writes += items.length;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.setMany(items, options);
  }

  async deleteMany(keys, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.deletes += keys.length;
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return await backend.deleteMany(keys);
  }

  async _replicateToBackends(key, value, options) {
    const backends =
      options.replicate === true
        ? Array.from(this._backends.keys())
        : options.replicate;
    const promises = backends
      .filter((name) => this._backends.has(name))
      .map((name) => this._backends.get(name).set(key, value, options));
    await Promise.allSettled(promises);
  }

  async _deleteFromBackends(key, options) {
    const backends =
      options.replicate === true
        ? Array.from(this._backends.keys())
        : options.replicate;
    const promises = backends
      .filter((name) => this._backends.has(name))
      .map((name) => this._backends.get(name).delete(key));
    await Promise.allSettled(promises);
  }

  async migrate(fromBackend, toBackend, options = {}) {
    this.statistics.migrations++;
    const source = this.getBackend(fromBackend);
    const target = this.getBackend(toBackend);
    const keys = await source.keys();
    const batchSize = options.batchSize || 100;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const items = await source.getMany(batch);
      await target.setMany(items, options);
    }
    if (options.clearSource) {
      await source.clear();
    }
    return keys.length;
  }

  addMigration(name, migrationFn) {
    this._migrations.push({ name, fn: migrationFn, applied: false });
    return this;
  }

  async runMigrations(options = {}) {
    const results = [];
    for (const migration of this._migrations) {
      if (!migration.applied) {
        try {
          await migration.fn(this);
          migration.applied = true;
          results.push({ name: migration.name, success: true });
          this.statistics.migrations++;
        } catch (error) {
          results.push({
            name: migration.name,
            success: false,
            error: error.message,
          });
          if (options.stopOnError) {
            break;
          }
        }
      }
    }
    return results;
  }

  async export(options = {}) {
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    const keys = await backend.keys();
    const items = await backend.getMany(keys);
    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      items,
    };
  }

  async import(data, options = {}) {
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    if (options.clear) {
      await backend.clear();
    }
    await backend.setMany(data.items, options);
    return data.items.length;
  }

  async sync(options = {}) {
    const sourceBackend = this.getBackend(
      options.source || this.options.defaultBackend
    );
    const targetBackend = this.getBackend(
      options.target || this.options.fallbackBackend
    );
    const sourceKeys = new Set(await sourceBackend.keys());
    const targetKeys = new Set(await targetBackend.keys());
    const toAdd = [...sourceKeys].filter((k) => !targetKeys.has(k));
    const toDelete = [...targetKeys].filter((k) => !sourceKeys.has(k));
    if (toAdd.length > 0) {
      const items = await sourceBackend.getMany(toAdd);
      await targetBackend.setMany(items);
    }
    if (toDelete.length > 0 && options.deleteMissing) {
      await targetBackend.deleteMany(toDelete);
    }
    return { added: toAdd.length, deleted: toDelete.length };
  }

  createNamespace(name, options = {}) {
    const backend = this.getBackend(
      options.backend || this.options.defaultBackend
    );
    return {
      get: (key) => backend.get(`${name}:${key}`),
      set: (key, value, opts) => backend.set(`${name}:${key}`, value, opts),
      delete: (key) => backend.delete(`${name}:${key}`),
      has: (key) => backend.has(`${name}:${key}`),
      keys: () =>
        backend
          .keys()
          .then((keys) => keys.filter((k) => k.startsWith(`${name}:`))),
    };
  }

  getStatistics() {
    const backendStats = {};
    for (const [name, backend] of this._backends) {
      backendStats[name] = backend.getStatistics ? backend.getStatistics() : {};
    }
    return { ...this.statistics, backends: backendStats };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  async reset() {
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
      migrations: 0,
    };
    for (const backend of this._backends.values()) {
      if (backend.reset) {
        await backend.reset();
      }
    }
    return this;
  }

  async dispose() {
    await this.reset();
    for (const backend of this._backends.values()) {
      if (backend.dispose) {
        await backend.dispose();
      }
    }
    this._backends.clear();
    this._aliases.clear();
    this._migrations = [];
    return this;
  }
}

module.exports = StorageManager;
module.exports.MemoryStorage = MemoryStorage;
module.exports.FileStorage = FileStorage;
module.exports.CacheStorage = CacheStorage;
module.exports.SessionStorage = SessionStorage;
module.exports.IndexedStorage = IndexedStorage;
module.exports.SyncStorage = SyncStorage;
