/**
 * String Decryptor Agent - Module Loader
 * 
 * This is the main entry point for the String Decryptor Agent.
 * It loads and exports the core agent implementation with advanced features.
 * 
 * Usage:
 *   const { StringDecryptor } = require('./agents/string-decryptor');
 *   const agent = new StringDecryptor();
 *   const result = agent.analyze(code);
 * 
 * For the core implementation, see string-decryptor-agent.js
 */
const StringDecryptorAgent = require('./string-decryptor-agent');

/**
 * StringDecryptor Cache - TTL-based caching for decrypted strings
 */
class DecryptionCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }
}

/**
 * Enhanced StringDecryptor wrapper with caching, events, and utilities
 */
class StringDecryptor extends StringDecryptorAgent {
  constructor(options = {}) {
    super(options);
    this.cache = new DecryptionCache({
      ttl: options.cacheTTL || 300000,
      maxSize: options.cacheSize || 1000
    });
    this.listeners = new Map();
    this.results = [];
  }

  /**
   * Emit an event to all listeners
   */
  emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Event handler error for ${event}:`, err);
      }
    });
  }

  /**
   * Register an event listener
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }

  /**
   * Remove an event listener
   */
  off(event, handler) {
    if (!handler) {
      this.listeners.delete(event);
    } else {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Analyze code with caching support
   */
  analyze(code, context = {}) {
    const cacheKey = this.generateCacheKey(code, context);
    
    if (context.useCache !== false && this.cache.has(cacheKey)) {
      this.emit('cache-hit', { key: cacheKey });
      return this.cache.get(cacheKey);
    }

    this.emit('analysis-start', { codeLength: code.length });

    const result = super.analyze(code, context);
    
    if (context.useCache !== false) {
      this.cache.set(cacheKey, result);
    }

    this.results.push(result);
    this.emit('analysis-complete', {
      decryptedCount: result.decryptedStrings?.length || 0,
      patternsFound: result.encryptedPatterns?.length || 0
    });

    return result;
  }

  /**
   * Analyze code asynchronously with timeout support
   */
  analyzeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeout = context.timeout || this.options.timeout || 30000;
      
      const timer = setTimeout(() => {
        reject(new Error(`Analysis timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = this.analyze(code, context);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Analyze multiple strings in batch
   */
  analyzeBatch(codes, options = {}) {
    const results = [];
    const total = codes.length;

    codes.forEach((code, index) => {
      try {
        const result = this.analyze(code, options);
        results.push({
          index,
          success: true,
          result
        });
        this.emit('batch-progress', {
          current: index + 1,
          total,
          percent: ((index + 1) / total * 100).toFixed(0) + '%'
        });
      } catch (error) {
        results.push({
          index,
          success: false,
          error: error.message
        });
      }
    });

    return results;
  }

  /**
   * Get cached result if available
   */
  getCached(code, context = {}) {
    const cacheKey = this.generateCacheKey(code, context);
    return this.cache.get(cacheKey);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    this.emit('cache-cleared', {});
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Generate cache key from code and context
   */
  generateCacheKey(code, context) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(code);
    hash.update(JSON.stringify(context));
    return hash.digest('hex');
  }

  /**
   * Validate input before analysis
   */
  validateInput(code) {
    const errors = [];
    
    if (typeof code !== 'string') {
      errors.push('Code must be a string');
    }
    
    if (code.length === 0) {
      errors.push('Code cannot be empty');
    }
    
    if (code.length > 10000000) {
      errors.push('Code exceeds maximum size limit (10MB)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get analysis results history
   */
  getHistory() {
    return this.results;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.results = [];
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.clearCache();
    this.clearHistory();
    this.listeners.clear();
    super.dispose();
  }
}

/**
 * Create a new StringDecryptor instance
 * @param {Object} options - Configuration options
 * @returns {StringDecryptor} Agent instance
 */
function createStringDecryptor(options) {
  return new StringDecryptor(options);
}

/**
 * Decrypt strings synchronously
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Object} Decryption result
 */
function decrypt(code, options) {
  const validation = StringDecryptor.prototype.validateInput.call({}, code);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const agent = new StringDecryptor(options);
  return agent.analyze(code);
}

/**
 * Decrypt strings asynchronously
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Decryption result
 */
async function decryptAsync(code, options) {
  const agent = new StringDecryptor(options);
  return agent.analyzeAsync(code, options);
}

/**
 * Get supported encoding types
 * @returns {string[]} List of supported encodings
 */
function getSupportedEncodings() {
  return [
    'base64',
    'hex',
    'rot13',
    'rot47',
    'xor',
    'unicode',
    'url',
    'html-entity',
    'charcode',
    'binary',
    'octal',
    'reverse',
    'atbash',
    'caesar',
    'rail-fence',
    'bacon'
  ];
}

/**
 * Get configuration schema for validation
 * @returns {Object} JSON schema for agent configuration
 */
function getConfigSchema() {
  return {
    type: 'object',
    properties: {
      maxDepth: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 5
      },
      cacheEnabled: {
        type: 'boolean',
        default: true
      },
      cacheTTL: {
        type: 'number',
        minimum: 60000,
        default: 300000
      },
      cacheSize: {
        type: 'number',
        minimum: 100,
        default: 1000
      },
      confidenceThreshold: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.5
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        default: 30000
      },
      verboseLogging: {
        type: 'boolean',
        default: false
      },
      extractOnly: {
        type: 'boolean',
        default: false
      },
      tryMultiLayer: {
        type: 'boolean',
        default: true
      }
    },
    additionalProperties: false
  };
}

module.exports = {
  StringDecryptor,
  DecryptionCache,
  createStringDecryptor,
  decrypt,
  decryptAsync,
  getSupportedEncodings,
  getConfigSchema,
  VERSION: '3.0.0'
};
