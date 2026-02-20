/**
 * Renamer Agent - Module Loader
 * 
 * This is the main entry point for the Renamer Agent.
 * It loads and exports the core agent implementation with advanced features.
 * 
 * Usage:
 *   const { Renamer } = require('./agents/renamer');
 *   const agent = new Renamer();
 *   const result = agent.analyze(code);
 * 
 * For the core implementation, see renamer-agent.js
 */
const RenamerAgent = require('./renamer-agent');

/**
 * Renamer Cache - TTL-based caching for rename mappings
 */
class RenameCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 500;
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
 * Enhanced Renamer wrapper with caching, events, and utilities
 */
class Renamer extends RenamerAgent {
  constructor(options = {}) {
    super(options);
    this.cache = new RenameCache({
      ttl: options.cacheTTL || 300000,
      maxSize: options.cacheSize || 500
    });
    this.listeners = new Map();
    this.results = [];
    this.dictionary = this.initializeDictionary();
  }

  /**
   * Initialize semantic naming dictionary
   */
  initializeDictionary() {
    return {
      loops: ['iterator', 'index', 'item', 'element', 'key', 'value', 'counter'],
      counters: ['count', 'total', 'sum', 'index', 'position', 'i', 'n'],
      strings: ['text', 'string', 'name', 'label', 'title', 'message', 'str'],
      numbers: ['value', 'amount', 'quantity', 'number', 'num', 'id', 'index'],
      booleans: ['isValid', 'isEnabled', 'hasValue', 'canEdit', 'shouldUpdate', 'flag'],
      arrays: ['items', 'list', 'collection', 'elements', 'data', 'values', 'array'],
      objects: ['config', 'options', 'settings', 'object', 'item', 'data', 'obj'],
      functions: ['handler', 'callback', 'action', 'function', 'fn', 'method', 'proc'],
      events: ['event', 'e', 'evt', 'context', 'target', 'source'],
      promises: ['promise', 'result', 'response', 'data', 'future'],
      errors: ['error', 'err', 'exception', 'ex', 'failure'],
      nodes: ['node', 'element', 'item', 'component', 'widget'],
      handlers: ['handler', 'listener', 'callback', 'controller', 'action']
    };
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
      renamesCount: result.renames?.length || 0,
      suggestionsCount: result.suggestions?.length || 0
    });

    return result;
  }

  /**
   * Analyze code asynchronously with timeout support
   */
  analyzeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeout = context.timeout || this.options.timeout || 40000;
      
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
   * Analyze multiple snippets in batch
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
   * Apply suggested renames to code
   */
  applyRenames(code, renames) {
    let result = code;
    
    for (const rename of renames) {
      if (rename.type === 'variable') {
        result = result.replace(new RegExp(`\\b${rename.original}\\b`, 'g'), rename.suggested);
      } else if (rename.type === 'function') {
        result = result.replace(new RegExp(`\\bfunction\\s+${rename.original}\\b`, 'g'), `function ${rename.suggested}`);
        result = result.replace(new RegExp(`\\b${rename.original}\\s*\\(`, 'g'), `${rename.suggested}(`);
      }
    }
    
    return result;
  }

  /**
   * Generate semantic name based on context
   */
  generateSemanticName(type, context = {}) {
    const category = context.category || 'objects';
    const names = this.dictionary[category] || this.dictionary.objects;
    const index = context.index || 0;
    const prefix = context.prefix || '';
    const suffix = context.suffix || '';
    
    return prefix + (names[index % names.length]) + suffix;
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
   * Extend dictionary with custom names
   */
  extendDictionary(category, names) {
    if (this.dictionary[category]) {
      this.dictionary[category].push(...names);
    } else {
      this.dictionary[category] = names;
    }
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
 * Create a new Renamer instance
 * @param {Object} options - Configuration options
 * @returns {Renamer} Agent instance
 */
function createRenamer(options) {
  return new Renamer(options);
}

/**
 * Analyze code for renaming opportunities
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Object} Analysis result
 */
function analyze(code, options) {
  const validation = Renamer.prototype.validateInput.call({}, code);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const agent = new Renamer(options);
  return agent.analyze(code);
}

/**
 * Analyze code asynchronously
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeAsync(code, options) {
  const agent = new Renamer(options);
  return agent.analyzeAsync(code, options);
}

/**
 * Get supported rename types
 * @returns {string[]} List of supported rename types
 */
function getSupportedRenameTypes() {
  return [
    'variable',
    'function',
    'class',
    'method',
    'property',
    'parameter',
    'constant',
    'event',
    'callback',
    'handler'
  ];
}

/**
 * Get supported frameworks
 * @returns {string[]} List of supported frameworks
 */
function getSupportedFrameworks() {
  return [
    'react',
    'vue',
    'angular',
    'svelte',
    'nodejs',
    'nextjs',
    'vanilla'
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
      framework: {
        type: 'string',
        enum: ['react', 'vue', 'angular', 'svelte', 'nodejs', 'nextjs', 'vanilla'],
        default: 'vanilla'
      },
      maxNameLength: {
        type: 'number',
        minimum: 5,
        maximum: 50,
        default: 20
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
        default: 500
      },
      preservePrefixes: {
        type: 'array',
        items: { type: 'string' },
        default: ['_', '$']
      },
      semanticNaming: {
        type: 'boolean',
        default: true
      },
      contextAware: {
        type: 'boolean',
        default: true
      },
      generateSuggestions: {
        type: 'boolean',
        default: true
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        default: 40000
      },
      verboseLogging: {
        type: 'boolean',
        default: false
      }
    },
    additionalProperties: false
  };
}

module.exports = {
  Renamer,
  RenameCache,
  createRenamer,
  analyze,
  analyzeAsync,
  getSupportedRenameTypes,
  getSupportedFrameworks,
  getConfigSchema,
  VERSION: '3.0.0'
};
