/**
 * Configuration Manager
 * Production-grade configuration management system
 * Version: 3.0.0
 */
const fs = require("fs");
const path = require("path");

class ConfigManager {
  constructor(options = {}) {
    this.name = "config";
    this.version = "3.0.0";
    this.config = new Map();
    this.defaults = new Map();
    this.envPrefix = options.envPrefix || "DEOB_";
    this.schema = new Map();

    // Initialize defaults
    this.initializeDefaults();
  }

  /**
   * Initialize default configurations
   */
  initializeDefaults() {
    const defaults = {
      // Agent settings
      "agents.enabled": true,
      "agents.maxRetries": 3,
      "agents.timeout": 120000,
      "agents.parallel": true,
      "agents.validateEachStep": true,
      "agents.continueOnError": true,

      // String decryptor
      "decryptor.enabled": true,
      "decryptor.methods": ["base64", "hex", "rot13", "unicode"],
      "decryptor.maxDepth": 5,

      // Control flow
      "controlFlow.enabled": true,
      "controlFlow.maxDepth": 10,
      "controlFlow.detectFlattening": true,

      // Pattern recognizer
      "patterns.enabled": true,
      "patterns.minConfidence": 0.5,
      "patterns.maxPatterns": 100,

      // Renamer
      "renamer.enabled": true,
      "renamer.conflictResolution": "suffix",
      "renamer.maxSuggestions": 10,

      // Beautifier
      "beautifier.enabled": true,
      "beautifier.tabWidth": 2,
      "beautifier.useTabs": false,
      "beautifier.semi": true,
      "beautifier.singleQuote": true,
      "beautifier.trailingComma": "es5",
      "beautifier.printWidth": 100,

      // Validator
      "validator.enabled": true,
      "validator.strict": false,
      "validator.checkSecurity": true,
      "validator.checkQuality": true,

      // Logger settings
      "logger.level": "info",
      "logger.output": "console",
      "logger.file": null,
      "logger.json": false,
      "logger.colors": true,

      // Cache settings
      "cache.enabled": true,
      "cache.ttl": 300000,
      "cache.maxSize": 1000,

      // Performance
      "performance.maxMemory": 512 * 1024 * 1024,
      "performance.gcInterval": 60000,

      // CLI settings
      "cli.verbose": false,
      "cli.color": true,
      "cli.prompt": "> ",

      // Security
      "security.sandbox": false,
      "security.maxEvalSize": 1024 * 1024,
      "security.allowNetwork": false,
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.defaults.set(key, value);
      this.config.set(key, value);
    }
  }

  /**
   * Load configuration from object
   */
  load(config = {}) {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value);
    }
    return this;
  }

  /**
   * Load from file
   */
  loadFile(filePath) {
    try {
      const ext = path.extname(filePath);
      let config;

      if (ext === ".json") {
        config = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } else if (ext === ".js") {
        config = require(filePath);
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }

      this.load(config);
      return this;
    } catch (error) {
      throw new Error(
        `Failed to load config from ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Load from environment variables
   */
  loadEnv() {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(this.envPrefix)) {
        const configKey = key.slice(this.envPrefix.length).toLowerCase();
        this.set(configKey, this.parseValue(value));
      }
    }
    return this;
  }

  /**
   * Parse value from string
   */
  parseValue(value) {
    // Try JSON parse
    try {
      return JSON.parse(value);
    } catch (e) {}

    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Null
    if (value === "null") return null;
    if (value === "undefined") return undefined;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    // String
    return value;
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = null) {
    const value = this.config.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    // Validate against schema
    if (this.schema.has(key)) {
      const schema = this.schema.get(key);
      if (!this.validateValue(key, value, schema)) {
        throw new Error(`Invalid value for ${key}: ${JSON.stringify(value)}`);
      }
    }

    this.config.set(key, value);
    return this;
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.config.has(key);
  }

  /**
   * Delete key
   */
  delete(key) {
    this.config.delete(key);
    return this;
  }

  /**
   * Get all config as object
   */
  toObject() {
    const obj = {};
    for (const [key, value] of this.config) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Get subset of config
   */
  getSection(section) {
    const result = {};
    const prefix = `${section}.`;

    for (const [key, value] of this.config) {
      if (key.startsWith(prefix)) {
        result[key.slice(prefix.length)] = value;
      }
    }

    return result;
  }

  /**
   * Define schema for validation
   */
  defineSchema(key, schema) {
    this.schema.set(key, schema);
    return this;
  }

  /**
   * Validate value against schema
   */
  validateValue(key, value, schema) {
    if (schema.type) {
      const actualType = typeof value;
      if (actualType !== schema.type) {
        return false;
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      return false;
    }

    if (schema.min !== undefined && value < schema.min) {
      return false;
    }

    if (schema.max !== undefined && value > schema.max) {
      return false;
    }

    if (schema.pattern && typeof value === "string") {
      if (!schema.pattern.test(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.config.clear();
    for (const [key, value] of this.defaults) {
      this.config.set(key, value);
    }
    return this;
  }

  /**
   * Save to file
   */
  save(filePath) {
    try {
      const ext = path.extname(filePath);

      if (ext === ".json") {
        fs.writeFileSync(
          filePath,
          JSON.stringify(this.toObject(), null, 2),
          "utf8"
        );
      } else if (ext === ".js") {
        const content = `module.exports = ${JSON.stringify(
          this.toObject(),
          null,
          2
        )};`;
        fs.writeFileSync(filePath, content, "utf8");
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }

      return this;
    } catch (error) {
      throw new Error(`Failed to save config to ${filePath}: ${error.message}`);
    }
  }

  /**
   * Merge with another config
   */
  merge(other) {
    if (other instanceof ConfigManager) {
      for (const [key, value] of other.config) {
        this.set(key, value);
      }
    } else if (typeof other === "object") {
      this.load(other);
    }
    return this;
  }

  /**
   * Watch for changes
   */
  watch(key, callback) {
    const originalSet = this.set.bind(this);
    this.set = (k, v) => {
      if (k === key || key === "*") {
        callback(k, v);
      }
      return originalSet(k, v);
    };
    return this;
  }

  /**
   * Freeze config (make immutable)
   */
  freeze() {
    const frozenConfig = new Map(this.config);
    this.config = new Proxy(frozenConfig, {
      set: () => {
        throw new Error("Config is frozen");
      },
      deleteProperty: () => {
        throw new Error("Config is frozen");
      },
    });
    return this;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalKeys: this.config.size,
      defaultsCount: this.defaults.size,
      schemaCount: this.schema.size,
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.config.clear();
    this.defaults.clear();
    this.schema.clear();
  }
}

module.exports = ConfigManager;
