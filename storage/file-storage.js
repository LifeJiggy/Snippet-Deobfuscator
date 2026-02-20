const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class FileStorage {
  constructor(options = {}) {
    this.name = "FileStorage";
    this.version = "3.0.0";
    this.options = {
      directory: options.directory || "./storage",
      extension: options.extension || ".json",
      encoding: options.encoding || "utf8",
      pretty: options.pretty !== false,
      compress: options.compress || false,
      encrypt: options.encrypt || false,
      encryptionKey: options.encryptionKey || null,
    };
    this._locks = new Map();
    this._cache = new Map();
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
      cacheHits: 0,
    };
    this._ensureDirectory();
  }

  _ensureDirectory() {
    if (!fs.existsSync(this.options.directory)) {
      fs.mkdirSync(this.options.directory, { recursive: true });
    }
  }

  _getFilePath(key) {
    const sanitizedKey = this._sanitizeKey(key);
    return path.join(
      this.options.directory,
      `${sanitizedKey}${this.options.extension}`
    );
  }

  _sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 255);
  }

  async get(key) {
    this.statistics.totalOperations++;
    this.statistics.reads++;
    if (this._cache.has(key)) {
      this.statistics.cacheHits++;
      return this._cache.get(key);
    }
    const filePath = this._getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    try {
      await this._acquireLock(key);
      let content = fs.readFileSync(filePath, this.options.encoding);
      if (this.options.encrypt) {
        content = this._decrypt(content);
      }
      if (this.options.compress) {
        content = this._decompress(content);
      }
      const data = JSON.parse(content);
      this._cache.set(key, data);
      return data;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Failed to get "${key}": ${error.message}`);
    } finally {
      this._releaseLock(key);
    }
  }

  async set(key, value, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.writes++;
    const filePath = this._getFilePath(key);
    try {
      await this._acquireLock(key);
      let content = JSON.stringify(value, null, this.options.pretty ? 2 : 0);
      if (this.options.compress) {
        content = this._compress(content);
      }
      if (this.options.encrypt) {
        content = this._encrypt(content);
      }
      fs.writeFileSync(filePath, content, this.options.encoding);
      this._cache.set(key, value);
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Failed to set "${key}": ${error.message}`);
    } finally {
      this._releaseLock(key);
    }
  }

  async delete(key) {
    this.statistics.totalOperations++;
    this.statistics.deletes++;
    const filePath = this._getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    try {
      await this._acquireLock(key);
      fs.unlinkSync(filePath);
      this._cache.delete(key);
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Failed to delete "${key}": ${error.message}`);
    } finally {
      this._releaseLock(key);
    }
  }

  async has(key) {
    this.statistics.totalOperations++;
    const filePath = this._getFilePath(key);
    return fs.existsSync(filePath);
  }

  async clear() {
    this.statistics.totalOperations++;
    const files = fs.readdirSync(this.options.directory);
    for (const file of files) {
      if (file.endsWith(this.options.extension)) {
        const filePath = path.join(this.options.directory, file);
        fs.unlinkSync(filePath);
      }
    }
    this._cache.clear();
    return true;
  }

  async keys() {
    this.statistics.totalOperations++;
    const files = fs.readdirSync(this.options.directory);
    return files
      .filter((f) => f.endsWith(this.options.extension))
      .map((f) => f.replace(this.options.extension, ""));
  }

  async size() {
    this.statistics.totalOperations++;
    const keys = await this.keys();
    return keys.length;
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

  async rename(oldKey, newKey) {
    this.statistics.totalOperations++;
    const oldPath = this._getFilePath(oldKey);
    const newPath = this._getFilePath(newKey);
    if (!fs.existsSync(oldPath)) {
      throw new Error(`Key "${oldKey}" does not exist`);
    }
    fs.renameSync(oldPath, newPath);
    const value = this._cache.get(oldKey);
    if (value !== undefined) {
      this._cache.delete(oldKey);
      this._cache.set(newKey, value);
    }
    return true;
  }

  async copy(sourceKey, destKey) {
    this.statistics.totalOperations++;
    const value = await this.get(sourceKey);
    if (value === undefined) {
      throw new Error(`Key "${sourceKey}" does not exist`);
    }
    await this.set(destKey, value);
    return true;
  }

  async getStats(key) {
    this.statistics.totalOperations++;
    const filePath = this._getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
    };
  }

  async _acquireLock(key) {
    const maxWait = 5000;
    const interval = 50;
    let waited = 0;
    while (this._locks.has(key) && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      waited += interval;
    }
    if (waited >= maxWait) {
      throw new Error(`Lock timeout for key "${key}"`);
    }
    this._locks.set(key, Date.now());
  }

  _releaseLock(key) {
    this._locks.delete(key);
  }

  _encrypt(content) {
    const key =
      this.options.encryptionKey || "default-key-change-in-production";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      crypto.scryptSync(key, "salt", 32),
      iv
    );
    let encrypted = cipher.update(content, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  _decrypt(content) {
    const key =
      this.options.encryptionKey || "default-key-change-in-production";
    const [ivHex, encrypted] = content.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      crypto.scryptSync(key, "salt", 32),
      iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  _compress(content) {
    const zlib = require("zlib");
    return zlib.deflateSync(content).toString("base64");
  }

  _decompress(content) {
    const zlib = require("zlib");
    return zlib.inflateSync(Buffer.from(content, "base64")).toString("utf8");
  }

  async backup(targetDir) {
    this.statistics.totalOperations++;
    const backupPath = path.join(targetDir, `backup-${Date.now()}`);
    fs.mkdirSync(backupPath, { recursive: true });
    const keys = await this.keys();
    for (const key of keys) {
      const srcPath = this._getFilePath(key);
      const destPath = path.join(backupPath, `${key}${this.options.extension}`);
      fs.copyFileSync(srcPath, destPath);
    }
    return { path: backupPath, keys: keys.length };
  }

  async restore(sourceDir) {
    this.statistics.totalOperations++;
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      if (file.endsWith(this.options.extension)) {
        const key = file.replace(this.options.extension, "");
        const srcPath = path.join(sourceDir, file);
        const destPath = this._getFilePath(key);
        fs.copyFileSync(srcPath, destPath);
      }
    }
    return files.length;
  }

  getStatistics() {
    return { ...this.statistics, cacheSize: this._cache.size };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    this._ensureDirectory();
    return this;
  }

  async reset() {
    await this.clear();
    this._cache.clear();
    this.statistics = {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
      cacheHits: 0,
    };
    return this;
  }

  async dispose() {
    await this.reset();
    this._locks.clear();
    this.options = {};
    return this;
  }
}

module.exports = FileStorage;
