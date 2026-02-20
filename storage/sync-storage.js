const crypto = require("crypto");

class SyncStorage {
  constructor(options = {}) {
    this.name = "SyncStorage";
    this.version = "3.0.0";
    this.options = {
      strategy: options.strategy || "last-write-wins",
      conflictResolution: options.conflictResolution || "auto",
      maxVersions: options.maxVersions || 10,
      syncInterval: options.syncInterval || 30000,
      remoteUrl: options.remoteUrl || null,
    };
    this._data = new Map();
    this._versions = new Map();
    this._locks = new Map();
    this._pendingSync = new Map();
    this._conflicts = [];
    this._listeners = [];
    this.statistics = {
      totalOperations: 0,
      syncs: 0,
      conflicts: 0,
      resolutions: 0,
      pendingChanges: 0,
    };
  }

  async get(key) {
    this.statistics.totalOperations++;
    const entry = this._data.get(key);
    if (!entry) return undefined;
    return entry.value;
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    const version = this._generateVersion();
    const existing = this._data.get(key);
    if (existing && options.version && existing.version !== options.version) {
      const conflict = {
        key,
        localValue: existing.value,
        localVersion: existing.version,
        remoteValue: value,
        remoteVersion: options.version,
        timestamp: Date.now(),
        resolved: false,
      };
      this._conflicts.push(conflict);
      this.statistics.conflicts++;
      if (this.options.conflictResolution === "auto") {
        return this._resolveConflict(conflict, value, version);
      }
      throw new Error(`Conflict detected for key "${key}"`);
    }
    const entry = {
      value,
      version,
      timestamp: Date.now(),
      author: options.author || "local",
      synced: false,
    };
    this._data.set(key, entry);
    this._addVersion(key, entry);
    this._pendingSync.set(key, entry);
    this.statistics.pendingChanges = this._pendingSync.size;
    this._notifyListeners("set", { key, value, version });
    return { version, synced: false };
  }

  async delete(key, options = {}) {
    this.statistics.totalOperations++;
    const existing = this._data.get(key);
    if (!existing) return false;
    if (options.version && existing.version !== options.version) {
      throw new Error(`Conflict detected for key "${key}"`);
    }
    const version = this._generateVersion();
    const entry = {
      value: null,
      version,
      timestamp: Date.now(),
      author: options.author || "local",
      synced: false,
      deleted: true,
    };
    this._data.set(key, entry);
    this._addVersion(key, entry);
    this._pendingSync.set(key, entry);
    this.statistics.pendingChanges = this._pendingSync.size;
    this._notifyListeners("delete", { key, version });
    return true;
  }

  async has(key) {
    this.statistics.totalOperations++;
    const entry = this._data.get(key);
    return entry && !entry.deleted;
  }

  async clear() {
    this.statistics.totalOperations++;
    this._data.clear();
    this._versions.clear();
    this._pendingSync.clear();
    this._conflicts = [];
    this.statistics.pendingChanges = 0;
    return true;
  }

  async keys() {
    this.statistics.totalOperations++;
    const keys = [];
    for (const [key, entry] of this._data) {
      if (!entry.deleted) {
        keys.push(key);
      }
    }
    return keys;
  }

  async size() {
    return (await this.keys()).length;
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
    const results = {};
    for (const [key, value] of Object.entries(items)) {
      results[key] = await this.set(key, value, options);
    }
    return results;
  }

  async getVersion(key) {
    const entry = this._data.get(key);
    return entry ? entry.version : null;
  }

  async getHistory(key, options = {}) {
    this.statistics.totalOperations++;
    const versions = this._versions.get(key) || [];
    const limit = options.limit || this.options.maxVersions;
    return versions.slice(0, limit);
  }

  async rollback(key, version, options = {}) {
    this.statistics.totalOperations++;
    const versions = this._versions.get(key) || [];
    const targetEntry = versions.find((v) => v.version === version);
    if (!targetEntry) {
      throw new Error(`Version "${version}" not found for key "${key}"`);
    }
    return this.set(key, targetEntry.value, { ...options, author: "rollback" });
  }

  async lock(key, options = {}) {
    this.statistics.totalOperations++;
    const timeout = options.timeout || 5000;
    const maxWait = options.maxWait || 30000;
    const startTime = Date.now();
    while (this._locks.has(key)) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(`Lock timeout for key "${key}"`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this._locks.set(key, {
      timestamp: Date.now(),
      timeout,
      owner: options.owner || "unknown",
    });
    setTimeout(() => this._releaseLock(key), timeout);
    return true;
  }

  async unlock(key) {
    return this._releaseLock(key);
  }

  _releaseLock(key) {
    return this._locks.delete(key);
  }

  async sync(options = {}) {
    this.statistics.totalOperations++;
    this.statistics.syncs++;
    if (!this.options.remoteUrl) {
      throw new Error("No remote URL configured");
    }
    const pending = Array.from(this._pendingSync.entries());
    for (const [key, entry] of pending) {
      try {
        await this._syncEntry(key, entry, options);
        entry.synced = true;
        this._pendingSync.delete(key);
      } catch (error) {
        console.error(`Failed to sync "${key}":`, error.message);
      }
    }
    this.statistics.pendingChanges = this._pendingSync.size;
    return {
      synced: pending.length - this._pendingSync.size,
      pending: this._pendingSync.size,
    };
  }

  async _syncEntry(key, entry, options) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 10);
    });
  }

  async pull(options = {}) {
    this.statistics.totalOperations++;
    this.statistics.syncs++;
    return { pulled: 0, conflicts: 0 };
  }

  async push(options = {}) {
    this.statistics.totalOperations++;
    this.statistics.syncs++;
    const pending = this._pendingSync.size;
    await this.sync(options);
    return { pushed: pending, pending: this._pendingSync.size };
  }

  async getConflicts() {
    return this._conflicts.filter((c) => !c.resolved);
  }

  async resolveConflict(key, resolution, options = {}) {
    this.statistics.totalOperations++;
    const conflict = this._conflicts.find((c) => c.key === key && !c.resolved);
    if (!conflict) {
      throw new Error(`No unresolved conflict for key "${key}"`);
    }
    let resolvedValue;
    switch (resolution) {
      case "local":
        resolvedValue = conflict.localValue;
        break;
      case "remote":
        resolvedValue = conflict.remoteValue;
        break;
      case "merge":
        if (options.mergeFn) {
          resolvedValue = options.mergeFn(
            conflict.localValue,
            conflict.remoteValue
          );
        } else {
          resolvedValue = { ...conflict.localValue, ...conflict.remoteValue };
        }
        break;
      case "custom":
        resolvedValue = options.value;
        break;
      default:
        throw new Error(`Unknown resolution strategy: ${resolution}`);
    }
    const version = this._generateVersion();
    const entry = {
      value: resolvedValue,
      version,
      timestamp: Date.now(),
      author: options.author || "conflict-resolution",
      synced: false,
    };
    this._data.set(key, entry);
    this._addVersion(key, entry);
    this._pendingSync.set(key, entry);
    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolvedValue = resolvedValue;
    this.statistics.resolutions++;
    this.statistics.pendingChanges = this._pendingSync.size;
    return { version, resolution };
  }

  _resolveConflict(conflict, value, version) {
    let resolvedValue;
    switch (this.options.strategy) {
      case "last-write-wins":
        resolvedValue = value;
        break;
      case "first-write-wins":
        resolvedValue = conflict.localValue;
        break;
      case "merge":
        if (
          typeof conflict.localValue === "object" &&
          typeof value === "object"
        ) {
          resolvedValue = { ...conflict.localValue, ...value };
        } else {
          resolvedValue = value;
        }
        break;
      default:
        resolvedValue = value;
    }
    const entry = {
      value: resolvedValue,
      version,
      timestamp: Date.now(),
      author: "auto-resolution",
      synced: false,
    };
    this._data.set(conflict.key, entry);
    this._addVersion(conflict.key, entry);
    this._pendingSync.set(conflict.key, entry);
    conflict.resolved = true;
    conflict.resolution = this.options.strategy;
    conflict.resolvedValue = resolvedValue;
    this.statistics.resolutions++;
    this.statistics.pendingChanges = this._pendingSync.size;
    return { version, resolution: this.options.strategy };
  }

  _generateVersion() {
    return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  _addVersion(key, entry) {
    if (!this._versions.has(key)) {
      this._versions.set(key, []);
    }
    const versions = this._versions.get(key);
    versions.unshift(entry);
    if (versions.length > this.options.maxVersions) {
      versions.pop();
    }
  }

  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      const index = this._listeners.indexOf(callback);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  _notifyListeners(event, data) {
    for (const listener of this._listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error("Listener error:", error);
      }
    }
  }

  async export() {
    this.statistics.totalOperations++;
    const data = {};
    for (const [key, entry] of this._data) {
      data[key] = {
        value: entry.value,
        version: entry.version,
        timestamp: entry.timestamp,
        deleted: entry.deleted,
      };
    }
    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  async import(data, options = {}) {
    this.statistics.totalOperations++;
    let imported = 0;
    for (const [key, entry] of Object.entries(data.data || data)) {
      const existing = this._data.get(key);
      if (!existing || options.overwrite || entry.version > existing.version) {
        this._data.set(key, {
          ...entry,
          synced: true,
        });
        this._addVersion(key, entry);
        imported++;
      }
    }
    return imported;
  }

  getStatistics() {
    return {
      ...this.statistics,
      size: this._data.size,
      conflicts: this._conflicts.length,
      unresolvedConflicts: this._conflicts.filter((c) => !c.resolved).length,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  async reset() {
    this._data.clear();
    this._versions.clear();
    this._pendingSync.clear();
    this._locks.clear();
    this._conflicts = [];
    this._listeners = [];
    this.statistics = {
      totalOperations: 0,
      syncs: 0,
      conflicts: 0,
      resolutions: 0,
      pendingChanges: 0,
    };
    return this;
  }

  async dispose() {
    await this.reset();
    this.options = {};
    return this;
  }
}

module.exports = SyncStorage;
