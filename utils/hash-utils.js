/**
 * Hash Utils
 * Comprehensive hashing utilities for deobfuscation operations
 * Version: 3.0.0
 */
const crypto = require("crypto");

class HashUtils {
  constructor(options = {}) {
    this.name = "HashUtils";
    this.version = "3.0.0";
    this.options = {
      defaultAlgorithm: options.defaultAlgorithm || "sha256",
      encoding: options.encoding || "hex",
      iterations: options.iterations || 1,
      saltLength: options.saltLength || 16,
      keyLength: options.keyLength || 64,
    };
    this.statistics = {
      totalHashes: 0,
      totalComparisons: 0,
      cacheHits: 0,
      errors: 0,
    };
    this.hashCache = new Map();
    this._initializeAlgorithms();
  }

  _initializeAlgorithms() {
    this.algorithms = {
      md5: { secure: false, length: 32 },
      sha1: { secure: false, length: 40 },
      sha256: { secure: true, length: 64 },
      sha384: { secure: true, length: 96 },
      sha512: { secure: true, length: 128 },
      ripemd160: { secure: false, length: 40 },
      whirlpool: { secure: true, length: 128 },
      blake2b: { secure: true, length: 128 },
      blake2s: { secure: true, length: 64 },
      sha3_224: { secure: true, length: 56 },
      sha3_256: { secure: true, length: 64 },
      sha3_384: { secure: true, length: 96 },
      sha3_512: { secure: true, length: 128 },
    };
  }

  hash(data, algorithm = null, options = {}) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.encoding;
      const iterations = options.iterations || this.options.iterations;

      const hash = crypto.createHash(algo);
      let result = data;

      for (let i = 0; i < iterations; i++) {
        hash.update(typeof result === "string" ? result : JSON.stringify(result));
        result = hash.digest(encoding);
        if (i < iterations - 1) {
          hash = crypto.createHash(algo);
        }
      }

      this.statistics.totalHashes++;

      return {
        success: true,
        hash: result,
        algorithm: algo,
        iterations,
        encoding,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hashFile(filePath, algorithm = null, options = {}) {
    try {
      const fs = require("fs");
      const algo = algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.encoding;

      const hash = crypto.createHash(algo);
      const stream = fs.createReadStream(filePath);

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => {
          const result = hash.digest(encoding);
          this.statistics.totalHashes++;
          resolve({
            success: true,
            hash: result,
            algorithm: algo,
            encoding,
          });
        });
        stream.on("error", (error) => {
          this.statistics.errors++;
          reject({
            success: false,
            error: error.message,
          });
        });
      });
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hashStream(stream, algorithm = null, options = {}) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.encoding;

      const hash = crypto.createHash(algo);

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => {
          const result = hash.digest(encoding);
          this.statistics.totalHashes++;
          resolve({
            success: true,
            hash: result,
            algorithm: algo,
            encoding,
          });
        });
        stream.on("error", (error) => {
          this.statistics.errors++;
          reject({
            success: false,
            error: error.message,
          });
        });
      });
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hashBuffer(buffer, algorithm = null, options = {}) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.encoding;

      const hash = crypto.createHash(algo);
      hash.update(buffer);
      const result = hash.digest(encoding);

      this.statistics.totalHashes++;

      return {
        success: true,
        hash: result,
        algorithm: algo,
        encoding,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hashObject(obj, algorithm = null, options = {}) {
    return this.hash(JSON.stringify(obj), algorithm, options);
  }

  hashMultiple(dataArray, algorithm = null, options = {}) {
    return dataArray.map((data) => this.hash(data, algorithm, options));
  }

  compareHash(hash1, hash2) {
    try {
      if (hash1.length !== hash2.length) {
        return {
          success: true,
          match: false,
        };
      }

      const result = crypto.timingSafeEqual(
        Buffer.from(hash1),
        Buffer.from(hash2)
      );

      this.statistics.totalComparisons++;

      return {
        success: true,
        match: result,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        match: false,
        error: error.message,
      };
    }
  }

  compareHashFast(hash1, hash2) {
    const match = hash1 === hash2;
    this.statistics.totalComparisons++;

    return {
      success: true,
      match,
    };
  }

  getCachedHash(key) {
    return this.hashCache.get(key);
  }

  setCachedHash(key, value) {
    this.hashCache.set(key, value);
    if (this.hashCache.size > 1000) {
      const firstKey = this.hashCache.keys().next().value;
      this.hashCache.delete(firstKey);
    }
  }

  clearCache() {
    const size = this.hashCache.size;
    this.hashCache.clear();
    return size;
  }

  generateSalt(length = null) {
    const len = length || this.options.saltLength;
    return crypto.randomBytes(len).toString(this.options.encoding);
  }

  hashWithSalt(data, salt = null, algorithm = null, options = {}) {
    const useSalt = salt || this.generateSalt();
    const algo = algorithm || this.options.defaultAlgorithm;

    const combined = useSalt + String(data);
    return this.hash(combined, algo, options);
  }

  hashWithKey(data, key, algorithm = null, options = {}) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.encoding;

      const hmac = crypto.createHmac(algo, key);
      const result = hmac.update(String(data)).digest(encoding);

      this.statistics.totalHashes++;

      return {
        success: true,
        hash: result,
        algorithm: algo,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  pbkdf2(password, salt = null, iterations = null, keyLength = null, algorithm = null) {
    try {
      const useSalt = salt || this.generateSalt();
      const iter = iterations || this.options.iterations;
      const len = keyLength || this.options.keyLength;
      const algo = algorithm || this.options.defaultAlgorithm;

      const key = crypto.pbkdf2Sync(password, useSalt, iter, len, algo);

      return {
        success: true,
        key: key.toString(this.options.encoding),
        salt: useSalt,
        iterations: iter,
        keyLength: len,
        algorithm: algo,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyPbkdf2(password, salt, key, iterations = null, keyLength = null, algorithm = null) {
    const computed = this.pbkdf2(password, salt, iterations, keyLength, algorithm);

    if (!computed.success) {
      return {
        success: false,
        valid: false,
        error: computed.error,
      };
    }

    const match = this.compareHash(key, computed.key);
    return {
      success: true,
      valid: match.match,
    };
  }

  scrypt(password, salt = null, keyLength = null, options = {}) {
    try {
      const useSalt = salt || this.generateSalt();
      const len = keyLength || this.options.keyLength;
      const cost = options.cost || 16384;
      const blockSize = options.blockSize || 8;
      const parallelization = options.parallelization || 1;

      const key = crypto.scryptSync(password, useSalt, len, {
        cost,
        blockSize,
        parallelization,
      });

      return {
        success: true,
        key: key.toString(this.options.encoding),
        salt: useSalt,
        cost,
        keyLength: len,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyScrypt(password, salt, key, keyLength = null, options = {}) {
    const computed = this.scrypt(password, salt, keyLength, options);

    if (!computed.success) {
      return {
        success: false,
        valid: false,
        error: computed.error,
      };
    }

    const match = this.compareHash(key, computed.key);
    return {
      success: true,
      valid: match.match,
    };
  }

  generateHashChain(seed, count, algorithm = null) {
    const hashes = [seed];
    let current = seed;

    for (let i = 1; i < count; i++) {
      const result = this.hash(current, algorithm);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }
      current = result.hash;
      hashes.push(current);
    }

    return {
      success: true,
      hashes,
      count,
      algorithm: algorithm || this.options.defaultAlgorithm,
    };
  }

  getAlgorithmInfo(algorithm) {
    return this.algorithms[algorithm.toLowerCase()] || null;
  }

  listAlgorithms() {
    return Object.keys(this.algorithms);
  }

  isSecureAlgorithm(algorithm) {
    const info = this.algorithms[algorithm.toLowerCase()];
    return info ? info.secure : false;
  }

  getHashLength(algorithm) {
    const info = this.algorithms[algorithm.toLowerCase()];
    return info ? info.length : null;
  }

  getCacheSize() {
    return this.hashCache.size;
  }

  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.hashCache.size,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  getOptions() {
    return { ...this.options };
  }

  reset() {
    this.statistics = {
      totalHashes: 0,
      totalComparisons: 0,
      cacheHits: 0,
      errors: 0,
    };
    this.hashCache.clear();
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = HashUtils;
