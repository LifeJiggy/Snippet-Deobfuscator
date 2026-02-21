/**
 * Crypto Utils
 * Cryptographic utilities for deobfuscation operations
 * Version: 3.0.0
 */
const crypto = require("crypto");

class CryptoUtils {
  constructor(options = {}) {
    this.name = "CryptoUtils";
    this.version = "3.0.0";
    this.options = {
      defaultAlgorithm: options.defaultAlgorithm || "aes-256-cbc",
      keyLength: options.keyLength || 32,
      ivLength: options.ivLength || 16,
      saltLength: options.saltLength || 16,
      iterations: options.iterations || 100000,
      digest: options.digest || "sha256",
    };
    this.statistics = {
      totalEncryptions: 0,
      totalDecryptions: 0,
      totalHashes: 0,
      totalComparisons: 0,
      errors: 0,
    };
  }

  encrypt(text, key, algorithm = null) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const iv = crypto.randomBytes(this.options.ivLength);
      const cipher = crypto.createCipheriv(
        algo,
        this._ensureKey(key),
        iv
      );

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      this.statistics.totalEncryptions++;

      return {
        success: true,
        encrypted,
        iv: iv.toString("hex"),
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

  decrypt(encrypted, key, iv, algorithm = null) {
    try {
      const algo = algorithm || this.options.defaultAlgorithm;
      const decipher = crypto.createDecipheriv(
        algo,
        this._ensureKey(key),
        Buffer.from(iv, "hex")
      );

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      this.statistics.totalDecryptions++;

      return {
        success: true,
        decrypted,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hash(data, algorithm = null) {
    try {
      const algo = algorithm || this.options.digest;
      const hash = crypto.createHash(algo);

      if (typeof data === "object") {
        data = JSON.stringify(data);
      }

      const hashed = hash.update(data).digest("hex");

      this.statistics.totalHashes++;

      return {
        success: true,
        hash: hashed,
        algorithm: algo,
        length: hashed.length,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  hashMultiple(dataArray, algorithm = null) {
    return dataArray.map((data) => this.hash(data, algorithm));
  }

  generateKey(length = null) {
    const len = length || this.options.keyLength;
    return crypto.randomBytes(len).toString("hex");
  }

  generateIV() {
    return crypto.randomBytes(this.options.ivLength).toString("hex");
  }

  generateSalt() {
    return crypto.randomBytes(this.options.saltLength).toString("hex");
  }

  generateRandomString(length = 32, charset = "alphanumeric") {
    let chars;
    switch (charset) {
      case "alpha":
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        break;
      case "numeric":
        chars = "0123456789";
        break;
      case "hex":
        chars = "0123456789abcdef";
        break;
      case "special":
        chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        break;
      case "alphanumeric":
      default:
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        break;
    }

    let result = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }

    return result;
  }

  deriveKey(password, salt = null) {
    const useSalt = salt || this.generateSalt();
    const key = crypto.pbkdf2Sync(
      password,
      useSalt,
      this.options.iterations,
      this.options.keyLength,
      this.options.digest
    );

    return {
      key: key.toString("hex"),
      salt: useSalt,
    };
  }

  compareHash(data, hash, algorithm = null) {
    try {
      const computed = this.hash(data, algorithm);

      if (!computed.success) {
        return {
          success: false,
          match: false,
          error: computed.error,
        };
      }

      const match = crypto.timingSafeEqual(
        Buffer.from(computed.hash),
        Buffer.from(hash)
      );

      this.statistics.totalComparisons++;

      return {
        success: true,
        match,
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

  compareHashFast(data, hash, algorithm = null) {
    const computed = this.hash(data, algorithm);

    if (!computed.success) {
      return {
        success: false,
        match: false,
        error: computed.error,
      };
    }

    const match = computed.hash === hash;
    this.statistics.totalComparisons++;

    return {
      success: true,
      match,
    };
  }

  hmac(data, key, algorithm = null) {
    try {
      const algo = algorithm || this.options.digest;
      const hmac = crypto.createHmac(algo, key);

      if (typeof data === "object") {
        data = JSON.stringify(data);
      }

      const signed = hmac.update(data).digest("hex");

      this.statistics.totalHashes++;

      return {
        success: true,
        signature: signed,
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

  verifyHmac(data, key, signature, algorithm = null) {
    const computed = this.hmac(data, key, algorithm);

    if (!computed.success) {
      return {
        success: false,
        valid: false,
        error: computed.error,
      };
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(computed.signature),
      Buffer.from(signature)
    );

    return {
      success: true,
      valid,
    };
  }

  encryptObject(obj, key, algorithm = null) {
    const json = JSON.stringify(obj);
    return this.encrypt(json, key, algorithm);
  }

  decryptObject(encrypted, key, iv, algorithm = null) {
    const result = this.decrypt(encrypted, key, iv, algorithm);

    if (!result.success) {
      return result;
    }

    try {
      const obj = JSON.parse(result.decrypted);
      return {
        success: true,
        decrypted: obj,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to parse decrypted JSON: " + error.message,
      };
    }
  }

  encodeBase64(data) {
    try {
      const encoded =
        typeof data === "string"
          ? Buffer.from(data).toString("base64")
          : Buffer.from(JSON.stringify(data)).toString("base64");

      return {
        success: true,
        encoded,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  decodeBase64(encoded, parseJson = false) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");

      if (parseJson) {
        return {
          success: true,
          decoded: JSON.parse(decoded),
        };
      }

      return {
        success: true,
        decoded,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  encodeHex(data) {
    try {
      const encoded =
        typeof data === "string"
          ? Buffer.from(data).toString("hex")
          : Buffer.from(JSON.stringify(data)).toString("hex");

      return {
        success: true,
        encoded,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  decodeHex(encoded, parseJson = false) {
    try {
      const decoded = Buffer.from(encoded, "hex").toString("utf8");

      if (parseJson) {
        return {
          success: true,
          decoded: JSON.parse(decoded),
        };
      }

      return {
        success: true,
        decoded,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateKeyPair(algorithm = "rsa", options = {}) {
    try {
      let keyPair;

      if (algorithm === "rsa") {
        const modulusLength = options.modulusLength || 2048;
        keyPair = crypto.generateKeyPairSync("rsa", {
          modulusLength,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        });
      } else if (algorithm === "ec") {
        const namedCurve = options.namedCurve || "prime256v1";
        keyPair = crypto.generateKeyPairSync("ec", {
          namedCurve,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        });
      } else if (algorithm === "ed25519") {
        keyPair = crypto.generateKeyPairSync("ed25519", {
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        });
      }

      return {
        success: true,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        algorithm,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  encryptWithPublicKey(data, publicKey, algorithm = "RSA-PKCS1-OAEP") {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(typeof data === "string" ? data : JSON.stringify(data))
      );

      return {
        success: true,
        encrypted: encrypted.toString("base64"),
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  decryptWithPrivateKey(encrypted, privateKey, algorithm = "RSA-PKCS1-OAEP") {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(encrypted, "base64")
      );

      return {
        success: true,
        decrypted: decrypted.toString("utf8"),
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  sign(data, privateKey, algorithm = null) {
    try {
      const sign = crypto.createSign(
        algorithm || "SHA256"
      );
      sign.update(typeof data === "string" ? data : JSON.stringify(data));
      sign.end();

      const signature = sign.sign(privateKey, "hex");

      this.statistics.totalHashes++;

      return {
        success: true,
        signature,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verify(data, signature, publicKey, algorithm = null) {
    try {
      const verify = crypto.createVerify(
        algorithm || "SHA256"
      );
      verify.update(typeof data === "string" ? data : JSON.stringify(data));
      verify.end();

      const valid = verify.verify(publicKey, signature, "hex");

      this.statistics.totalComparisons++;

      return {
        success: true,
        valid,
      };
    } catch (error) {
      this.statistics.errors++;
      return {
        success: false,
        valid: false,
        error: error.message,
      };
    }
  }

  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("base64url");
  }

  hashFile(filePath, algorithm = null) {
    try {
      const algo = algorithm || this.options.digest;
      const hash = crypto.createHash(algo);
      const fs = require("fs");

      const stream = fs.createReadStream(filePath);

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => {
          const hashed = hash.digest("hex");
          this.statistics.totalHashes++;
          resolve({
            success: true,
            hash: hashed,
            algorithm: algo,
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

  verifyFileHash(filePath, expectedHash, algorithm = null) {
    const result = this.hashFile(filePath, algorithm);

    if (!result.success) {
      return result;
    }

    const match = result.hash === expectedHash;
    this.statistics.totalComparisons++;

    return {
      success: true,
      match,
      hash: result.hash,
    };
  }

  _ensureKey(key) {
    if (Buffer.isBuffer(key)) {
      return key;
    }
    if (typeof key === "string") {
      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length === this.options.keyLength) {
        return keyBuffer;
      }
      return crypto
        .createHash(this.options.digest)
        .update(key)
        .digest()
        .slice(0, this.options.keyLength);
    }
    throw new Error("Invalid key format");
  }

  getStatistics() {
    return { ...this.statistics };
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
      totalEncryptions: 0,
      totalDecryptions: 0,
      totalHashes: 0,
      totalComparisons: 0,
      errors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = CryptoUtils;
