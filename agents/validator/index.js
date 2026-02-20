/**
 * Validator Agent - Module Loader
 * 
 * Production-grade code validation and integrity checking system.
 * This module provides comprehensive validation capabilities with support for
 * synchronous and asynchronous operations, progress tracking, caching, and more.
 * 
 * Features:
 * - Synchronous and asynchronous validation
 * - Input validation and error handling
 * - Progress tracking via events
 * - Result caching for repeated validations
 * - Batch processing support
 * - Timeout control
 * - Security vulnerability scanning
 * - Code quality analysis
 * - Test suggestion generation
 * 
 * Usage:
 *   // Basic usage
 *   const { Validator } = require('./agents/validator');
 *   const agent = new Validator();
 *   const result = agent.validate(code);
 * 
 *   // Async with events
 *   const { createValidator } = require('./agents/validator');
 *   const validator = createValidator({ verboseLogging: true });
 *   validator.on('progress', (progress) => console.log(progress));
 *   const result = await validator.validateAsync(code);
 * 
 *   // Batch processing
 *   const { validateBatch } = require('./agents/validator');
 *   const results = await validateBatch(codeArray);
 * 
 * For the core implementation, see validator-agent.js
 */

const ValidatorAgent = require('./validator-agent');
const { EventEmitter } = require('events');

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  checkSyntax: true,
  checkSecurity: true,
  checkQuality: true,
  checkSemantics: true,
  strictMode: false,
  verboseLogging: false,
  timeout: 45000,
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  maxErrors: 100,
  maxWarnings: 50,
  failOnCritical: true,
  generateSuggestions: true,
  includeAST: false
};

/**
 * Cache storage for validation results
 */
class ValidationCache {
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
 * Extended validator with event support and caching
 */
class Validator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new ValidatorAgent();
    this.cache = this.options.enableCache ? new ValidationCache(this.options.cacheTTL) : null;
    this.validationCount = 0;
    this.totalValidationTime = 0;
  }

  /**
   * Validate code synchronously
   * @param {string} code - JavaScript code to validate
   * @param {Object} context - Optional context information
   * @returns {Object} Validation result
   */
  validate(code, context = {}) {
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

    this.emit('validationStart', { context });

    try {
      const result = this.agent.analyze(code, context);
      
      // Update statistics
      this.validationCount++;
      this.totalValidationTime += Date.now() - startTime;
      
      // Cache result (only if valid or has no critical errors)
      if (this.cache && result.errors.filter(e => e.type === 'critical').length === 0) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit('validationComplete', { 
        validationTime: result.statistics?.validationTime || Date.now() - startTime,
        valid: result.valid,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        valid: false,
        errors: [{
          type: 'validation-error',
          message: error.message,
          stack: error.stack
        }],
        validatedAt: new Date().toISOString()
      };
      
      this.emit('validationError', { error: error.message });
      return errorResult;
    }
  }

  /**
   * Validate code asynchronously with timeout support
   * @param {string} code - JavaScript code to validate
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Validation result
   */
  validateAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Validation timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.validate(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Validate code with streaming progress updates
   * @param {string} code - JavaScript code to validate
   * @returns {Object} Validation result
   */
  async validateWithProgress(code) {
    const phases = [
      { name: 'syntax', weight: 0.15 },
      { name: 'semantic', weight: 0.2 },
      { name: 'security', weight: 0.25 },
      { name: 'quality', weight: 0.2 },
      { name: 'suggestions', weight: 0.1 },
      { name: 'reporting', weight: 0.1 }
    ];

    let cumulativeWeight = 0;
    
    for (const phase of phases) {
      this.emit('progress', {
        phase: phase.name,
        progress: cumulativeWeight,
        message: `Running ${phase.name} validation...`
      });
      
      // Simulate work (actual work done in agent.analyze)
      await new Promise(resolve => setTimeout(resolve, 10));
      cumulativeWeight += phase.weight;
    }

    const result = this.validate(code);
    
    this.emit('progress', {
      phase: 'complete',
      progress: 1,
      message: 'Validation complete'
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
   * Validate specific line
   * @param {string} code - Full code
   * @param {number} lineNumber - Line number to validate
   * @returns {Object} Line validation result
   */
  validateLine(code, lineNumber) {
    return this.agent.validateLine(code, lineNumber);
  }

  /**
   * Check for specific pattern
   * @param {string} code - Code to check
   * @param {string} pattern - Regex pattern
   * @returns {Object} Pattern check result
   */
  checkPattern(code, pattern) {
    return this.agent.checkPattern(code, pattern);
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    return {
      validationCount: this.validationCount,
      totalValidationTime: this.totalValidationTime,
      averageValidationTime: this.validationCount > 0 
        ? this.totalValidationTime / this.validationCount 
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
    this.validationCount = 0;
    this.totalValidationTime = 0;
    if (this.cache) {
      this.cache.clear();
    }
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
 * Factory function to create a new Validator instance
 * @param {Object} options - Configuration options
 * @returns {Validator} Validator instance
 */
function createValidator(options) {
  return new Validator(options);
}

/**
 * Validate code synchronously (convenience function)
 * @param {string} code - JavaScript code to validate
 * @param {Object} options - Configuration options
 * @returns {Object} Validation result
 */
function validate(code, options) {
  const validator = new Validator(options);
  try {
    return validator.validate(code);
  } finally {
    validator.dispose();
  }
}

/**
 * Validate code asynchronously (convenience function)
 * @param {string} code - JavaScript code to validate
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Validation result
 */
async function validateAsync(code, options) {
  const validator = new Validator(options);
  try {
    return await validator.validateAsync(code);
  } finally {
    validator.dispose();
  }
}

/**
 * Validate multiple code snippets in batch
 * @param {string[]} codes - Array of JavaScript code snippets
 * @param {Object} options - Configuration options
 * @returns {Promise<Object[]>} Array of validation results
 */
async function validateBatch(codes, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const onProgress = options.onProgress;
  
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(code => validateAsync(code, options))
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
 * Validate code from a file
 * @param {string} filePath - Path to JavaScript file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Validation result
 */
async function validateFile(filePath, options) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const absolutePath = path.resolve(filePath);
    const code = await fs.readFile(absolutePath, 'utf-8');
    return await validateAsync(code, options);
  } catch (error) {
    throw new Error(`Failed to validate file: ${error.message}`);
  }
}

/**
 * Get supported validation types
 */
function getSupportedValidations() {
  return {
    syntax: {
      checks: ['javascript', 'typescript', 'jsx', 'tsx'],
      description: 'Code syntax validation'
    },
    semantic: {
      checks: ['undefined-variables', 'type-mismatch', 'unused-variables', 'dead-code'],
      description: 'Code semantic analysis'
    },
    security: {
      issues: ['code-injection', 'xss', 'prototype-pollution', 'command-injection', 'hardcoded-secrets'],
      description: 'Security vulnerability scanning'
    },
    quality: {
      checks: ['function-length', 'nesting-depth', 'naming-conventions', 'best-practices'],
      description: 'Code quality assessment'
    },
    testing: {
      suggestions: ['function-tests', 'async-tests', 'export-tests'],
      description: 'Test case generation'
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
      checkSyntax: {
        type: 'boolean',
        default: true,
        description: 'Enable syntax validation'
      },
      checkSecurity: {
        type: 'boolean',
        default: true,
        description: 'Enable security scanning'
      },
      checkQuality: {
        type: 'boolean',
        default: true,
        description: 'Enable code quality checks'
      },
      checkSemantics: {
        type: 'boolean',
        default: true,
        description: 'Enable semantic analysis'
      },
      strictMode: {
        type: 'boolean',
        default: false,
        description: 'Enable strict validation mode'
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
        default: 45000,
        description: 'Validation timeout in milliseconds'
      },
      enableCache: {
        type: 'boolean',
        default: true,
        description: 'Enable result caching'
      },
      maxErrors: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        default: 100,
        description: 'Maximum errors to collect'
      },
      maxWarnings: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        default: 50,
        description: 'Maximum warnings to collect'
      },
      failOnCritical: {
        type: 'boolean',
        default: true,
        description: 'Mark validation as failed on critical issues'
      },
      generateSuggestions: {
        type: 'boolean',
        default: true,
        description: 'Generate test suggestions'
      },
      includeAST: {
        type: 'boolean',
        default: false,
        description: 'Include AST in results'
      }
    }
  };
}

// Export all utilities
module.exports = {
  // Main class
  Validator,
  
  // Factory functions
  createValidator,
  
  // Convenience functions
  validate,
  validateAsync,
  validateBatch,
  validateFile,
  
  // Utilities
  getSupportedValidations,
  getConfigSchema,
  
  // Constants
  VERSION: '3.0.0',
  DEFAULT_OPTIONS,
  
  // Re-export agent for direct access
  ValidatorAgent
};
