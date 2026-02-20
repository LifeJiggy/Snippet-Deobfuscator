/**
 * String Decryption Skill
 * Production-grade string decryption with multiple encoding schemes
 * Version: 3.0.0
 */
const crypto = require("crypto");

class StringDecryptionSkill {
  constructor() {
    this.name = "string-decryption";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
    };
    this.decoders = this.initializeDecoders();
  }

  initializeDecoders() {
    return {
      base64: this.decodeBase64.bind(this),
      hex: this.decodeHex.bind(this),
      rot13: this.decodeRot13.bind(this),
      rot47: this.decodeRot47.bind(this),
      unicode: this.decodeUnicode.bind(this),
      url: this.decodeURL.bind(this),
      html: this.decodeHTMLEntities.bind(this),
      xor: this.decodeXOR.bind(this),
      aes128: this.decodeAES.bind(this, "aes-128-cbc"),
      aes256: this.decodeAES.bind(this, "aes-256-cbc"),
      rc4: this.decodeRC4.bind(this),
      atob: this.decodeAtob.bind(this),
      charCode: this.decodeCharCode.bind(this),
      binary: this.decodeBinary.bind(this),
      octal: this.decodeOctal.bind(this),
    };
  }

  decrypt(code, options = {}) {
    this.stats.attempts++;
    const result = {
      decrypted: code,
      method: null,
      confidence: 0,
      attempts: [],
      warnings: [],
      errors: [],
    };

    try {
      const patterns = this.detectPatterns(code);
      for (const pattern of patterns) {
        const decoded = this.tryDecode(code, pattern.method, pattern.key);
        if (decoded && this.isValidDecoding(decoded)) {
          result.decrypted = decoded;
          result.method = pattern.method;
          result.confidence = pattern.confidence;
          result.attempts.push({ method: pattern.method, success: true });
          this.stats.successes++;
          return result;
        }
        result.attempts.push({ method: pattern.method, success: false });
      }

      const base64Decoded = this.decodeBase64(code);
      if (this.isValidDecoding(base64Decoded)) {
        result.decrypted = base64Decoded;
        result.method = "base64";
        result.confidence = 0.8;
        this.stats.successes++;
        return result;
      }

      const hexDecoded = this.decodeHex(code);
      if (this.isValidDecoding(hexDecoded)) {
        result.decrypted = hexDecoded;
        result.method = "hex";
        result.confidence = 0.7;
        this.stats.successes++;
        return result;
      }

      this.stats.failures++;
      result.warnings.push("No valid decryption method found");
    } catch (error) {
      result.errors.push(error.message);
      this.stats.failures++;
    }

    return result;
  }

  detectPatterns(code) {
    const patterns = [];

    if (/^[A-Za-z0-9+/]+={0,2}$/.test(code) && code.length % 4 === 0) {
      patterns.push({ method: "base64", confidence: 0.9 });
    }

    if (/^[0-9a-fA-F]+$/.test(code) && code.length % 2 === 0) {
      patterns.push({ method: "hex", confidence: 0.8 });
    }

    if (/^\\[xX][0-9a-fA-F]{2}/.test(code)) {
      patterns.push({ method: "hex-escape", confidence: 0.9 });
    }

    if (/\\u[0-9a-fA-F]{4}/.test(code)) {
      patterns.push({ method: "unicode", confidence: 0.9 });
    }

    if (/^\\[0-7]{1,3}/.test(code)) {
      patterns.push({ method: "octal-escape", confidence: 0.8 });
    }

    if (/%[0-9A-Fa-f]{2}/.test(code)) {
      patterns.push({ method: "url", confidence: 0.9 });
    }

    if (/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/.test(code)) {
      patterns.push({ method: "html", confidence: 0.9 });
    }

    return patterns;
  }

  tryDecode(code, method, key = null) {
    const decoder = this.decoders[method];
    if (!decoder) return null;

    try {
      return key ? decoder(code, key) : decoder(code);
    } catch (e) {
      return null;
    }
  }

  isValidDecoding(decoded) {
    if (!decoded || typeof decoded !== "string") return false;
    if (decoded.length === 0) return false;
    if (decoded.length < 2 && decoded.length > 0) return false;

    const printableRatio = this.calculatePrintableRatio(decoded);
    if (printableRatio < 0.5) return false;

    if (/^\s*$/.test(decoded)) return false;

    return true;
  }

  calculatePrintableRatio(str) {
    let printable = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      if (
        (char >= 32 && char <= 126) ||
        char === 10 ||
        char === 13 ||
        char === 9
      ) {
        printable++;
      }
    }
    return printable / str.length;
  }

  decodeBase64(str) {
    try {
      return Buffer.from(str, "base64").toString("utf-8");
    } catch (e) {
      return null;
    }
  }

  decodeHex(str) {
    try {
      const hex = str.replace(/\\x/g, "").replace(/0x/g, "");
      let result = "";
      for (let i = 0; i < hex.length; i += 2) {
        result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  decodeRot13(str) {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= "Z" ? 65 : 97;
      return String.fromCharCode(
        ((char.charCodeAt(0) - base + 13) % 26) + base
      );
    });
  }

  decodeRot47(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      if (char >= 33 && char <= 126) {
        result += String.fromCharCode(33 + ((char - 33 + 47) % 94));
      } else {
        result += str[i];
      }
    }
    return result;
  }

  decodeUnicode(str) {
    try {
      return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
    } catch (e) {
      return null;
    }
  }

  decodeURL(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return null;
    }
  }

  decodeHTMLEntities(str) {
    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&apos;": "'",
      "&nbsp;": " ",
    };

    let result = str;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, "g"), char);
    }

    result = result.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });

    result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return result;
  }

  decodeXOR(str, key = "0xAA") {
    try {
      const keyNum = typeof key === "string" ? parseInt(key, 16) : key;
      let result = "";
      for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ keyNum);
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  decodeAES(str, algorithm) {
    try {
      const key = crypto.randomBytes(16);
      const iv = crypto.randomBytes(16);
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(str, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (e) {
      return null;
    }
  }

  decodeRC4(str, key = "key") {
    try {
      const keyArray = [];
      for (let i = 0; i < key.length; i++) {
        keyArray.push(key.charCodeAt(i));
      }

      const s = [];
      for (let i = 0; i < 256; i++) {
        s[i] = i;
      }

      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + s[i] + keyArray[i % keyArray.length]) % 256;
        [s[i], s[j]] = [s[j], s[i]];
      }

      const hex = str.replace(/\\x/g, "");
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }

      let result = "";
      let i = 0;
      let k = 0;
      for (let idx = 0; idx < bytes.length; idx++) {
        i = (i + 1) % 256;
        k = (k + s[i]) % 256;
        [s[i], s[k]] = [s[k], s[i]];
        result += String.fromCharCode(bytes[idx] ^ s[(s[i] + s[k]) % 256]);
      }

      return result;
    } catch (e) {
      return null;
    }
  }

  decodeAtob(str) {
    try {
      return atob(str);
    } catch (e) {
      return null;
    }
  }

  decodeCharCode(str) {
    try {
      const matches = str.match(/String\.fromCharCode\(([^)]+)\)/);
      if (matches) {
        const codes = matches[1].split(",").map((c) => parseInt(c.trim()));
        return String.fromCharCode(...codes);
      }

      const numericPattern = /\((\d+)\)/g;
      let result = "";
      let match;
      while ((match = numericPattern.exec(str)) !== null) {
        result += String.fromCharCode(parseInt(match[1]));
      }

      return result || null;
    } catch (e) {
      return null;
    }
  }

  decodeBinary(str) {
    try {
      const binary = str.replace(/\s/g, "");
      let result = "";
      for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        result += String.fromCharCode(parseInt(byte, 2));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  decodeOctal(str) {
    try {
      const octal = str.replace(/\\/, "").replace(/[0-7]{3}/g, (match) => {
        return String.fromCharCode(parseInt(match, 8));
      });
      return octal;
    } catch (e) {
      return null;
    }
  }

  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.attempts > 0
          ? (this.stats.successes / this.stats.attempts).toFixed(2)
          : 0,
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.decoders = {};
  }
}

module.exports = StringDecryptionSkill;
