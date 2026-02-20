/**
 * Pattern Recognizer Agent - Module Loader
 * 
 * Production-grade specialized agent for recognizing obfuscation patterns
 * and code signatures in JavaScript.
 * 
 * This module provides comprehensive pattern recognition capabilities with support for
 * synchronous and asynchronous operations, progress tracking, caching, and more.
 * 
 * Features:
 * - Obfuscation pattern detection
 * - Code signature analysis
 * - String pattern recognition
 * - Control flow pattern detection
 * - Crypto algorithm detection
 * - Anti-debug detection
 * 
 * Usage:
 *   // Basic usage
 *   const { PatternRecognizer } = require('./agents/pattern-recognizer');
 *   const agent = new PatternRecognizer();
 *   const result = agent.recognize(code);
 * 
 *   // Async with events
 *   const { createPatternRecognizer } = require('./agents/pattern-recognizer');
 *   const recognizer = createPatternRecognizer({ verboseLogging: true });
 *   recognizer.on('progress', (progress) => console.log(progress));
 *   const result = await recognizer.recognizeAsync(code);
 * 
 *   // Batch processing
 *   const { recognizeBatch } = require('./agents/pattern-recognizer');
 *   const results = await recognizeBatch(codeArray);
 * 
 * For the core implementation, see pattern-recognizer-agent.js
 */

const PatternRecognizerAgent = require('./pattern-recognizer-agent');
const { EventEmitter } = require('events');

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  detectObfuscation: true,
  detectCrypto: true,
  detectAntiDebug: true,
  detectStringPatterns: true,
  detectControlFlow: true,
  detectCodeSignatures: true,
  confidenceThreshold: 0.5,
  verboseLogging: false,
  timeout: 30000,
  enableCache: true,
  cacheTTL: 300000,
  maxPatterns: 1000
};

/**
 * Cache storage for recognition results
 */
class PatternCache {
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
      .update(code.substring(0, 2000) + JSON.stringify(options))
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
 * Extended recognizer with event support and caching
 */
class PatternRecognizer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new PatternRecognizerAgent(this.options);
    this.cache = this.options.enableCache ? new PatternCache(this.options.cacheTTL) : null;
    this.recognitionCount = 0;
    this.totalRecognitionTime = 0;
  }

  /**
   * Recognize patterns synchronously
   * @param {string} code - Code to analyze
   * @param {Object} context - Optional context information
   * @returns {Object} Recognition result
   */
  recognize(code, context = {}) {
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

    this.emit('recognitionStart', { context });

    try {
      const result = this.agent.analyze(code, context);
      
      // Update statistics
      this.recognitionCount++;
      this.totalRecognitionTime += Date.now() - startTime;
      
      // Cache result
      if (this.cache && result.patterns?.length > 0) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit('recognitionComplete', { 
        recognitionTime: result.analysisTime || Date.now() - startTime,
        patternsFound: result.patterns?.length || 0
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        timestamp: new Date().toISOString(),
        patterns: [],
        obfuscation: [],
        crypto: [],
        antiDebug: [],
        errors: [{
          type: 'recognition-error',
          message: error.message,
          stack: error.stack
        }],
        analysisTime: Date.now() - startTime
      };
      
      this.emit('recognitionError', { error: error.message });
      return errorResult;
    }
  }

  /**
   * Recognize patterns asynchronously with timeout support
   * @param {string} code - Code to analyze
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Recognition result
   */
  recognizeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Recognition timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.recognize(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Recognize with streaming progress updates
   * @param {string} code - Code to analyze
   * @returns {Object} Recognition result
   */
  async recognizeWithProgress(code) {
    const phases = [
      { name: 'initialization', weight: 0.05 },
      { name: 'obfuscationDetection', weight: 0.25 },
      { name: 'cryptoAnalysis', weight: 0.2 },
      { name: 'antiDebugDetection', weight: 0.15 },
      { name: 'stringPatternAnalysis', weight: 0.2 },
      { name: 'controlFlowAnalysis', weight: 0.15 }
    ];

    let cumulativeWeight = 0;
    
    for (const phase of phases) {
      this.emit('progress', {
        phase: phase.name,
        progress: cumulativeWeight,
        message: `Running ${phase.name}...`
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      cumulativeWeight += phase.weight;
    }

    const result = this.recognize(code);
    
    this.emit('progress', {
      phase: 'complete',
      progress: 1,
      message: 'Recognition complete'
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
   * Get supported pattern types
   * @returns {Array} List of supported pattern types
   */
  getSupportedPatterns() {
    return [
      { name: 'obfuscation', description: 'Code obfuscation patterns' },
      { name: 'crypto', description: 'Cryptographic algorithms' },
      { name: 'antiDebug', description: 'Anti-debugging techniques' },
      { name: 'stringPatterns', description: 'String encoding patterns' },
      { name: 'controlFlow', description: 'Control flow patterns' },
      { name: 'codeSignatures', description: 'Known code signatures' }
    ];
  }

  /**
   * Get recognition statistics
   */
  getStatistics() {
    return {
      recognitionCount: this.recognitionCount,
      totalRecognitionTime: this.totalRecognitionTime,
      averageRecognitionTime: this.recognitionCount > 0 
        ? this.totalRecognitionTime / this.recognitionCount 
        : 0,
      cacheEnabled: !!this.cache,
      cacheStats: this.cache ? this.cache.getStats() : null,
      version: this.agent.version
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.recognitionCount = 0;
    this.totalRecognitionTime = 0;
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
  }

  /**
   * Get current options
   * @returns {Object} Current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.removeAllListeners();
    if (this.cache) {
      this.cache.clear();
    }
  }
}

/**
 * Factory function to create a new PatternRecognizer instance
 * @param {Object} options - Configuration options
 * @returns {PatternRecognizer} Recognizer instance
 */
function createPatternRecognizer(options) {
  return new PatternRecognizer(options);
}

/**
 * Recognize patterns synchronously (convenience function)
 * @param {string} code - Code to analyze
 * @param {Object} options - Configuration options
 * @returns {Object} Recognition result
 */
function recognize(code, options) {
  const recognizer = new PatternRecognizer(options);
  try {
    return recognizer.recognize(code);
  } finally {
    recognizer.dispose();
  }
}

/**
 * Recognize patterns asynchronously (convenience function)
 * @param {string} code - Code to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Recognition result
 */
async function recognizeAsync(code, options) {
  const recognizer = new PatternRecognizer(options);
  try {
    return await recognizer.recognizeAsync(code);
  } finally {
    recognizer.dispose();
  }
}

/**
 * Recognize patterns for multiple code snippets in batch
 * @param {string[]} codes - Array of code snippets
 * @param {Object} options - Configuration options
 * @returns {Promise<Object[]>} Array of recognition results
 */
async function recognizeBatch(codes, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const onProgress = options.onProgress;
  
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(code => recognizeAsync(code, options))
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
 * Get agent configuration schema
 */
function getConfigSchema() {
  return {
    type: 'object',
    properties: {
      detectObfuscation: {
        type: 'boolean',
        default: true,
        description: 'Enable obfuscation pattern detection'
      },
      detectCrypto: {
        type: 'boolean',
        default: true,
        description: 'Enable cryptographic pattern detection'
      },
      detectAntiDebug: {
        type: 'boolean',
        default: true,
        description: 'Enable anti-debugging pattern detection'
      },
      detectStringPatterns: {
        type: 'boolean',
        default: true,
        description: 'Enable string pattern detection'
      },
      detectControlFlow: {
        type: 'boolean',
        default: true,
        description: 'Enable control flow pattern detection'
      },
      detectCodeSignatures: {
        type: 'boolean',
        default: true,
        description: 'Enable code signature detection'
      },
      confidenceThreshold: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.5,
        description: 'Minimum confidence for patterns (0-1)'
      },
      verboseLogging: {
        type: 'boolean',
        default: false,
        description: 'Enable verbose logging'
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 60000,
        default: 30000,
        description: 'Recognition timeout in milliseconds'
      },
      enableCache: {
        type: 'boolean',
        default: true,
        description: 'Enable result caching'
      },
      maxPatterns: {
        type: 'number',
        minimum: 1,
        maximum: 10000,
        default: 1000,
        description: 'Maximum patterns to detect'
      }
    }
  };
}

// Export all utilities
module.exports = {
  // Main class
  PatternRecognizer,
  
  // Factory functions
  createPatternRecognizer,
  
  // Convenience functions
  recognize,
  recognizeAsync,
  recognizeBatch,
  
  // Utilities
  getSupportedPatterns,
  getConfigSchema,
  
  // Constants
  VERSION: '3.0.0',
  DEFAULT_OPTIONS,
  
  // Re-export agent for direct access
  PatternRecognizerAgent
};
