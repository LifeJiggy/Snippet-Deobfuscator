/**
 * Beautifier Agent - Module Loader
 * 
 * Production-grade code beautification and formatting system.
 * This module provides comprehensive code beautification capabilities with support for
 * synchronous and asynchronous operations, progress tracking, caching, and more.
 * 
 * Features:
 * - Multi-language support (JavaScript, TypeScript, JSX, TSX, JSON, CSS, HTML, Markdown)
 * - Prettier integration with fallbacks
 * - Syntax error detection and fixing
 * - Custom formatting rules
 * - Synchronous and asynchronous operations
 * - Progress tracking via events
 * - Result caching for repeated formatting
 * - Batch processing support
 * - Timeout control
 * 
 * Usage:
 *   // Basic usage
 *   const { Beautifier } = require('./agents/beautifier');
 *   const agent = new Beautifier();
 *   const result = agent.format(code);
 * 
 *   // Async with events
 *   const { createBeautifier } = require('./agents/beautifier');
 *   const beautifier = createBeautifier({ verboseLogging: true });
 *   beautifier.on('progress', (progress) => console.log(progress));
 *   const result = await beautifier.formatAsync(code);
 * 
 *   // Batch processing
 *   const { formatBatch } = require('./agents/beautifier');
 *   const results = await formatBatch(codeArray);
 * 
 * For the core implementation, see beautifier-agent.js
 */

const BeautifierAgent = require('./beautifier-agent');
const { EventEmitter } = require('events');

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  printWidth: 100,
  proseWrap: 'preserve',
  verboseLogging: false,
  timeout: 60000,
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  detectLanguage: true,
  preserveComments: true,
  fixSyntaxErrors: true,
  applyPrettier: true
};

/**
 * Cache storage for formatting results
 */
class FormatCache {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate cache key from code and options
   */
  generateKey(code, options) {
    const hash = require('crypto')
      .createHash('md5')
      .update(code + JSON.stringify(options))
      .digest('hex');
    return hash;
  }

  /**
   * Get cached result if available and not expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.result;
  }

  /**
   * Store result in cache
   */
  set(key, result) {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached results
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * Extended beautifier with event support and caching
 */
class Beautifier extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new BeautifierAgent(this.options);
    this.cache = this.options.enableCache ? new FormatCache(this.options.cacheTTL) : null;
    this.formatCount = 0;
    this.totalFormatTime = 0;
  }

  /**
   * Format code synchronously
   * @param {string} code - Code to format
   * @param {Object} context - Optional context information
   * @returns {Object} Formatting result
   */
  format(code, context = {}) {
    const startTime = Date.now();
    
    // Validate input
    this.validateInput(code);
    
    // Check cache
    if (this.cache) {
      const cacheKey = this.cache.generateKey(code, this.options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.emit('cacheHit', { key: cacheKey });
        return { ...cached, fromCache: true };
      }
    }

    this.emit('formatStart', { context });

    try {
      const result = this.agent.analyze(code, context);
      
      // Update statistics
      this.formatCount++;
      this.totalFormatTime += Date.now() - startTime;
      
      // Cache result
      if (this.cache && result.errors.length === 0) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit('formatComplete', { 
        formatTime: result.analysisTime || Date.now() - startTime,
        language: result.language,
        reduction: result.statistics?.reduction
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        timestamp: new Date().toISOString(),
        formatted: code,
        errors: [{
          type: 'beautification-error',
          message: error.message,
          stack: error.stack
        }],
        analysisTime: Date.now() - startTime
      };
      
      this.emit('formatError', { error: error.message });
      return errorResult;
    }
  }

  /**
   * Format code asynchronously with timeout support
   * @param {string} code - Code to format
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Formatting result
   */
  formatAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Format timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.format(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Format code with streaming progress updates
   * @param {string} code - Code to format
   * @returns {Object} Formatting result
   */
  async formatWithProgress(code) {
    const phases = [
      { name: 'languageDetection', weight: 0.1 },
      { name: 'preprocessing', weight: 0.15 },
      { name: 'syntaxFixing', weight: 0.2 },
      { name: 'formatting', weight: 0.3 },
      { name: 'postProcessing', weight: 0.15 },
      { name: 'statistics', weight: 0.1 }
    ];

    let cumulativeWeight = 0;
    
    for (const phase of phases) {
      this.emit('progress', {
        phase: phase.name,
        progress: cumulativeWeight,
        message: `Running ${phase.name}...`
      });
      
      // Simulate work (actual work done in agent.analyze)
      await new Promise(resolve => setTimeout(resolve, 10));
      cumulativeWeight += phase.weight;
    }

    const result = this.format(code);
    
    this.emit('progress', {
      phase: 'complete',
      progress: 1,
      message: 'Formatting complete'
    });

    return result;
  }

  /**
   * Validate input code
   */
  validateInput(code) {
    if (typeof code !== 'string') {
      throw new Error('Code must be a string');
    }
    
    if (!code.trim()) {
      throw new Error('Code cannot be empty');
    }
    
    if (code.length > 10000000) { // 10MB limit
      throw new Error('Code exceeds maximum length of 10MB');
    }

    this.emit('inputValidated', { length: code.length });
  }

  /**
   * Format specific section of code
   * @param {string} code - Full code
   * @param {number} startLine - Start line number
   * @param {number} endLine - End line number
   * @param {Object} options - Optional formatting options
   * @returns {Object} Formatting result
   */
  formatSection(code, startLine, endLine, options = {}) {
    const formatted = this.agent.formatSection(code, startLine, endLine, options);
    return {
      formatted,
      originalLength: code.length,
      formattedLength: formatted.length
    };
  }

  /**
   * Format with custom rules
   * @param {string} code - Code to format
   * @param {Array} rules - Custom formatting rules
   * @returns {Object} Formatting result
   */
  formatWithCustomRules(code, rules) {
    const formatted = this.agent.formatWithCustomRules(code, rules);
    return {
      formatted,
      originalLength: code.length,
      formattedLength: formatted.length
    };
  }

  /**
   * Detect language of code
   * @param {string} code - Code to analyze
   * @returns {string} Detected language
   */
  detectLanguage(code) {
    return this.agent.detectLanguage(code);
  }

  /**
   * Get formatting statistics
   */
  getStatistics() {
    return {
      formatCount: this.formatCount,
      totalFormatTime: this.totalFormatTime,
      averageFormatTime: this.formatCount > 0 
        ? this.totalFormatTime / this.formatCount 
        : 0,
      cacheEnabled: !!this.cache,
      cacheStats: this.cache ? this.cache.getStats() : null,
      agentStats: this.agent.getStatistics(),
      version: this.agent.version
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.formatCount = 0;
    this.totalFormatTime = 0;
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * Set options
   * @param {Object} options - Options to update
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.agent.setOptions(options);
  }

  /**
   * Get current options
   * @returns {Object} Current options
   */
  getOptions() {
    return this.agent.getOptions();
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.removeAllListeners();
    if (this.agent) {
      this.agent.dispose();
    }
    if (this.cache) {
      this.cache.clear();
    }
  }
}

/**
 * Factory function to create a new Beautifier instance
 * @param {Object} options - Configuration options
 * @returns {Beautifier} Beautifier instance
 */
function createBeautifier(options) {
  return new Beautifier(options);
}

/**
 * Format code synchronously (convenience function)
 * @param {string} code - Code to format
 * @param {Object} options - Configuration options
 * @returns {Object} Formatting result
 */
function format(code, options) {
  const beautifier = new Beautifier(options);
  try {
    return beautifier.format(code);
  } finally {
    beautifier.dispose();
  }
}

/**
 * Format code asynchronously (convenience function)
 * @param {string} code - Code to format
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Formatting result
 */
async function formatAsync(code, options) {
  const beautifier = new Beautifier(options);
  try {
    return await beautifier.formatAsync(code);
  } finally {
    beautifier.dispose();
  }
}

/**
 * Format multiple code snippets in batch
 * @param {string[]} codes - Array of code snippets
 * @param {Object} options - Configuration options
 * @returns {Promise<Object[]>} Array of formatting results
 */
async function formatBatch(codes, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const onProgress = options.onProgress;
  
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(code => formatAsync(code, options))
    );
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, codes.length),
        total: codes.length,
        percentage: ((i + batchSize) / codes.length) * 100
      });
    }
  }
  
  return results;
}

/**
 * Format code from a file
 * @param {string} filePath - Path to file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Formatting result
 */
async function formatFile(filePath, options) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const absolutePath = path.resolve(filePath);
    const code = await fs.readFile(absolutePath, 'utf-8');
    return await formatAsync(code, options);
  } catch (error) {
    throw new Error(`Failed to format file: ${error.message}`);
  }
}

/**
 * Get supported languages
 */
function getSupportedLanguages() {
  return {
    javascript: {
      extensions: ['.js', '.mjs', '.cjs'],
      description: 'JavaScript/ECMAScript'
    },
    typescript: {
      extensions: ['.ts', '.mts', '.cts'],
      description: 'TypeScript'
    },
    jsx: {
      extensions: ['.jsx'],
      description: 'React JSX'
    },
    tsx: {
      extensions: ['.tsx'],
      description: 'React TypeScript'
    },
    json: {
      extensions: ['.json'],
      description: 'JSON'
    },
    css: {
      extensions: ['.css', '.scss', '.sass', '.less'],
      description: 'CSS and preprocessors'
    },
    html: {
      extensions: ['.html', '.htm'],
      description: 'HTML'
    },
    markdown: {
      extensions: ['.md', '.markdown'],
      description: 'Markdown'
    }
  };
}

/**
 * Get agent configuration schema
 */
function getConfigSchema() {
  return {
    type: 'object',
    properties: {
      tabWidth: {
        type: 'number',
        minimum: 1,
        maximum: 8,
        default: 2,
        description: 'Number of spaces per indentation level'
      },
      useTabs: {
        type: 'boolean',
        default: false,
        description: 'Use tabs instead of spaces'
      },
      semi: {
        type: 'boolean',
        default: true,
        description: 'Add semicolons at end of statements'
      },
      singleQuote: {
        type: 'boolean',
        default: true,
        description: 'Use single quotes instead of double'
      },
      trailingComma: {
        type: 'string',
        enum: ['es5', 'all', 'none'],
        default: 'es5',
        description: 'Trailing comma style'
      },
      bracketSpacing: {
        type: 'boolean',
        default: true,
        description: 'Add spaces between braces in objects'
      },
      arrowParens: {
        type: 'string',
        enum: ['always', 'avoid'],
        default: 'always',
        description: 'Include parens in arrow functions'
      },
      endOfLine: {
        type: 'string',
        enum: ['lf', 'cr', 'crlf'],
        default: 'lf',
        description: 'Line ending style'
      },
      printWidth: {
        type: 'number',
        minimum: 10,
        maximum: 500,
        default: 100,
        description: 'Maximum line length'
      },
      verboseLogging: {
        type: 'boolean',
        default: false,
        description: 'Enable verbose logging'
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 300000,
        default: 60000,
        description: 'Format timeout in milliseconds'
      },
      enableCache: {
        type: 'boolean',
        default: true,
        description: 'Enable result caching'
      },
      detectLanguage: {
        type: 'boolean',
        default: true,
        description: 'Auto-detect language'
      },
      preserveComments: {
        type: 'boolean',
        default: true,
        description: 'Preserve comments in output'
      },
      fixSyntaxErrors: {
        type: 'boolean',
        default: true,
        description: 'Attempt to fix syntax errors'
      }
    }
  };
}

// Export all utilities
module.exports = {
  // Main class
  Beautifier,
  
  // Factory functions
  createBeautifier,
  
  // Convenience functions
  format,
  formatAsync,
  formatBatch,
  formatFile,
  
  // Utilities
  getSupportedLanguages,
  getConfigSchema,
  
  // Constants
  VERSION: '3.0.0',
  DEFAULT_OPTIONS,
  
  // Re-export agent for direct access
  BeautifierAgent
};
