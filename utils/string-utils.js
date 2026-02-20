const crypto = require("crypto");

class StringUtils {
  constructor(options = {}) {
    this.name = "StringUtils";
    this.version = "3.0.0";
    this.options = {
      encoding: options.encoding || "utf8",
      hashAlgorithm: options.hashAlgorithm || "md5",
      maxTemplateSize: options.maxTemplateSize || 1024 * 1024,
    };
    this.statistics = {
      totalOperations: 0,
      conversions: 0,
      hashes: 0,
      comparisons: 0,
      templates: 0,
    };
  }

  camelCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^(.)/, (c) => c.toLowerCase());
  }

  snakeCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[-\s]+/g, "_")
      .toLowerCase();
  }

  pascalCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    const camel = this.camelCase(str);
    return camel.replace(/^(.)/, (c) => c.toUpperCase());
  }

  kebabCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[_\s]+/g, "-")
      .toLowerCase();
  }

  constantCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    return this.snakeCase(str).toUpperCase();
  }

  titleCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  sentenceCase(str) {
    this.statistics.totalOperations++;
    this.statistics.conversions++;
    if (typeof str !== "string") return "";
    return str.replace(/^(.)/, (c) => c.toUpperCase());
  }

  lowerCase(str) {
    this.statistics.totalOperations++;
    return typeof str === "string" ? str.toLowerCase() : "";
  }

  upperCase(str) {
    this.statistics.totalOperations++;
    return typeof str === "string" ? str.toUpperCase() : "";
  }

  capitalize(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string" || str.length === 0) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  uncapitalize(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string" || str.length === 0) return "";
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  truncate(str, length = 100, suffix = "...") {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  padLeft(str, length, char = " ") {
    this.statistics.totalOperations++;
    if (typeof str !== "string") str = String(str);
    return str.padStart(length, char);
  }

  padRight(str, length, char = " ") {
    this.statistics.totalOperations++;
    if (typeof str !== "string") str = String(str);
    return str.padEnd(length, char);
  }

  repeat(str, count) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    return str.repeat(Math.max(0, count));
  }

  reverse(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    return str.split("").reverse().join("");
  }

  hash(str, algorithm = this.options.hashAlgorithm) {
    this.statistics.totalOperations++;
    this.statistics.hashes++;
    if (typeof str !== "string") str = String(str);
    return crypto
      .createHash(algorithm)
      .update(str, this.options.encoding)
      .digest("hex");
  }

  hashShort(str) {
    return this.hash(str).substring(0, 8);
  }

  hashLong(str) {
    return crypto
      .createHash("sha256")
      .update(str, this.options.encoding)
      .digest("hex");
  }

  encodeBase64(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") str = String(str);
    return Buffer.from(str, this.options.encoding).toString("base64");
  }

  decodeBase64(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    try {
      return Buffer.from(str, "base64").toString(this.options.encoding);
    } catch {
      return "";
    }
  }

  encodeURL(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    return encodeURIComponent(str);
  }

  decodeURL(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  encodeHTML(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    };
    return str.replace(/[&<>"'`=/]/g, (c) => entities[c]);
  }

  decodeHTML(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#x27;": "'",
      "&#x2F;": "/",
      "&#x60;": "`",
      "&#x3D;": "=",
      "&nbsp;": " ",
    };
    return str.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
  }

  compare(str1, str2, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.comparisons++;
    if (options.caseSensitive === false) {
      str1 = str1?.toLowerCase();
      str2 = str2?.toLowerCase();
    }
    if (options.locale) {
      return str1.localeCompare(str2, options.locale, options.options);
    }
    if (str1 < str2) return -1;
    if (str1 > str2) return 1;
    return 0;
  }

  equals(str1, str2, options = {}) {
    return this.compare(str1, str2, options) === 0;
  }

  contains(str, substring, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string" || typeof substring !== "string") return false;
    if (options.caseSensitive === false) {
      str = str.toLowerCase();
      substring = substring.toLowerCase();
    }
    return str.includes(substring);
  }

  startsWith(str, prefix, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string" || typeof prefix !== "string") return false;
    if (options.caseSensitive === false) {
      str = str.toLowerCase();
      prefix = prefix.toLowerCase();
    }
    return str.startsWith(prefix);
  }

  endsWith(str, suffix, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string" || typeof suffix !== "string") return false;
    if (options.caseSensitive === false) {
      str = str.toLowerCase();
      suffix = suffix.toLowerCase();
    }
    return str.endsWith(suffix);
  }

  match(str, pattern) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return null;
    if (typeof pattern === "string") {
      pattern = new RegExp(pattern);
    }
    return str.match(pattern);
  }

  matchAll(str, pattern) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return [];
    if (typeof pattern === "string") {
      pattern = new RegExp(pattern, "g");
    }
    return Array.from(str.matchAll(pattern));
  }

  replace(str, pattern, replacement, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    if (typeof pattern === "string") {
      if (options.global !== false) {
        pattern = new RegExp(
          pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
      }
    }
    return str.replace(pattern, replacement);
  }

  replaceAll(str, pattern, replacement) {
    return this.replace(str, pattern, replacement, { global: true });
  }

  split(str, separator = /\s+/, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return [];
    const result = str.split(separator);
    if (options.limit) {
      return result.slice(0, options.limit);
    }
    if (options.trim !== false) {
      return result.map((s) => s.trim()).filter((s) => s);
    }
    return result;
  }

  join(arr, separator = " ") {
    this.statistics.totalOperations++;
    if (!Array.isArray(arr)) return "";
    return arr.join(separator);
  }

  trim(str, chars) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    if (chars) {
      const pattern = `[${chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`;
      return str.replace(new RegExp(`^${pattern}+|${pattern}+$`, "g"), "");
    }
    return str.trim();
  }

  trimLeft(str, chars) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    if (chars) {
      const pattern = `[${chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`;
      return str.replace(new RegExp(`^${pattern}+`, "g"), "");
    }
    return str.trimStart();
  }

  trimRight(str, chars) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return "";
    if (chars) {
      const pattern = `[${chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`;
      return str.replace(new RegExp(`${pattern}+$`, "g"), "");
    }
    return str.trimEnd();
  }

  wordCount(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return 0;
    return str
      .trim()
      .split(/\s+/)
      .filter((w) => w).length;
  }

  charCount(str, options = {}) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return 0;
    if (options.excludeSpaces) {
      return str.replace(/\s/g, "").length;
    }
    return str.length;
  }

  lineCount(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return 0;
    return str.split("\n").length;
  }

  isBlank(str) {
    return typeof str !== "string" || str.trim().length === 0;
  }

  isNotBlank(str) {
    return !this.isBlank(str);
  }

  isEmpty(str) {
    return typeof str !== "string" || str.length === 0;
  }

  isNotEmpty(str) {
    return !this.isEmpty(str);
  }

  isNumeric(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    return /^-?\d+\.?\d*$/.test(str.trim());
  }

  isAlpha(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    return /^[a-zA-Z]+$/.test(str);
  }

  isAlphaNumeric(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  isEmail(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  isURL(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  isJSON(str) {
    this.statistics.totalOperations++;
    if (typeof str !== "string") return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  template(str, data = {}, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.templates++;
    if (typeof str !== "string") return "";
    if (str.length > this.options.maxTemplateSize) {
      throw new Error(
        `Template exceeds maximum size of ${this.options.maxTemplateSize}`
      );
    }
    const delimiter = options.delimiter || "{{}}";
    const open = delimiter.slice(0, delimiter.length / 2);
    const close = delimiter.slice(delimiter.length / 2);
    const pattern = new RegExp(
      `${this._escapeRegex(open)}\\s*([^}]+?)\\s*${this._escapeRegex(close)}`,
      "g"
    );
    return str.replace(pattern, (_, key) => {
      const value = this._getNestedValue(data, key.trim());
      return value !== undefined ? String(value) : "";
    });
  }

  templateLiteral(strings, ...values) {
    this.statistics.totalOperations++;
    this.statistics.templates++;
    let result = "";
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      if (i < values.length) {
        result += String(values[i]);
      }
    }
    return result;
  }

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  _getNestedValue(obj, path) {
    if (!obj || typeof path !== "string") return undefined;
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      if (key.includes("[")) {
        const match = key.match(/^(\w+)\[(\d+)\]$/);
        if (match) {
          current = current[match[1]]?.[parseInt(match[2])];
        } else {
          current = undefined;
        }
      } else {
        current = current[key];
      }
    }
    return current;
  }

  sprintf(format, ...args) {
    this.statistics.totalOperations++;
    if (typeof format !== "string") return "";
    let i = 0;
    return format.replace(/%([%sdfi])/g, (_, spec) => {
      if (spec === "%") return "%";
      const value = args[i++];
      switch (spec) {
        case "s":
          return String(value);
        case "d":
        case "i":
          return parseInt(value, 10);
        case "f":
          return parseFloat(value);
        default:
          return "";
      }
    });
  }

  levenshtein(str1, str2) {
    this.statistics.totalOperations++;
    if (typeof str1 !== "string") str1 = "";
    if (typeof str2 !== "string") str2 = "";
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  similarity(str1, str2) {
    const distance = this.levenshtein(str1, str2);
    const maxLen = Math.max(str1?.length || 0, str2?.length || 0);
    if (maxLen === 0) return 1;
    return 1 - distance / maxLen;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  reset() {
    this.statistics = {
      totalOperations: 0,
      conversions: 0,
      hashes: 0,
      comparisons: 0,
      templates: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = StringUtils;
