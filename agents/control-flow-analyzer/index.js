/**
 * Control Flow Analyzer Agent - Module Loader
 * 
 * Production-grade entry point for the Control Flow Analyzer Agent.
 * This module provides comprehensive analysis capabilities with support for
 * synchronous and asynchronous operations, progress tracking, caching, and more.
 * 
 * Features:
 * - Synchronous and asynchronous analysis
 * - Input validation and error handling
 * - Progress tracking via events
 * - Result caching for repeated analyses
 * - Batch processing support
 * - Timeout control
 * - Framework detection integration
 * - Security and performance analysis
 * 
 * Usage:
 *   // Basic usage
 *   const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');
 *   const agent = new ControlFlowAnalyzer();
 *   const result = agent.analyze(code);
 * 
 *   // Async with events
 *   const { createAnalyzer } = require('./agents/control-flow-analyzer');
 *   const analyzer = createAnalyzer({ verboseLogging: true });
 *   analyzer.on('progress', (progress) => console.log(progress));
 *   const result = await analyzer.analyzeAsync(code);
 * 
 *   // Batch processing
 *   const { analyzeBatch } = require('./agents/control-flow-analyzer');
 *   const results = await analyzeBatch(codeArray);
 * 
 * For the core implementation, see control-flow-agent.js
 */

const ControlFlowAnalyzerAgent = require('./control-flow-agent');
const { EventEmitter } = require('events');

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  maxNestingDepth: 10,
  maxSwitchCases: 100,
  detectInfiniteLoops: true,
  detectRecursion: true,
  trackComplexity: true,
  generateCallGraph: false,
  analyzeDataFlow: false,
  webFrameworkSupport: true,
  securityAnalysis: false,
  performanceAnalysis: false,
  verboseLogging: false,
  timeout: 45000,
  enableCache: true,
  cacheTTL: 300000 // 5 minutes
};

/**
 * Cache storage for analysis results
 */
class AnalysisCache {
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
 * Extended analyzer with event support and caching
 */
class ControlFlowAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new ControlFlowAnalyzerAgent(this.options);
    this.cache = this.options.enableCache ? new AnalysisCache(this.options.cacheTTL) : null;
    this.analysisCount = 0;
    this.totalAnalysisTime = 0;
  }

  /**
   * Analyze code synchronously
   * @param {string} code - JavaScript code to analyze
   * @param {Object} context - Optional context information
   * @returns {Object} Analysis result
   */
  analyze(code, context = {}) {
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

    this.emit('analysisStart', { context });

    try {
      const result = this.agent.analyze(code, context);
      
      // Update statistics
      this.analysisCount++;
      this.totalAnalysisTime += Date.now() - startTime;
      
      // Cache result
      if (this.cache && !result.errors.length) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit('analysisComplete', { 
        analysisTime: result.analysisTime,
        statistics: result.statistics
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        timestamp: new Date().toISOString(),
        errors: [{
          type: 'analysis-error',
          message: error.message,
          stack: error.stack
        }],
        analysisTime: Date.now() - startTime
      };
      
      this.emit('analysisError', { error: error.message });
      return errorResult;
    }
  }

  /**
   * Analyze code asynchronously with timeout support
   * @param {string} code - JavaScript code to analyze
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Analysis result
   */
  analyzeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Analysis timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.analyze(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Analyze code with streaming progress updates
   * @param {string} code - JavaScript code to analyze
   * @param {AsyncIterable} output - Output stream for progress
   * @returns {Object} Analysis result
   */
  async analyzeWithProgress(code, output) {
    const phases = [
      { name: 'parsing', weight: 0.1 },
      { name: 'branchAnalysis', weight: 0.15 },
      { name: 'loopAnalysis', weight: 0.15 },
      { name: 'switchAnalysis', weight: 0.1 },
      { name: 'functionAnalysis', weight: 0.1 },
      { name: 'obfuscationDetection', weight: 0.15 },
      { name: 'complexityCalculation', weight: 0.1 },
      { name: 'frameworkDetection', weight: 0.075 },
      { name: 'securityAnalysis', weight: 0.075 }
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

    const result = this.analyze(code);
    
    this.emit('progress', {
      phase: 'complete',
      progress: 1,
      message: 'Analysis complete'
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
   * Get analysis statistics
   */
  getStatistics() {
    return {
      analysisCount: this.analysisCount,
      totalAnalysisTime: this.totalAnalysisTime,
      averageAnalysisTime: this.analysisCount > 0 
        ? this.totalAnalysisTime / this.analysisCount 
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
    this.analysisCount = 0;
    this.totalAnalysisTime = 0;
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
 * Factory function to create a new ControlFlowAnalyzer instance
 * @param {Object} options - Configuration options
 * @returns {ControlFlowAnalyzer} Analyzer instance
 */
function createControlFlowAnalyzer(options) {
  return new ControlFlowAnalyzer(options);
}

/**
 * Analyze code synchronously (convenience function)
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Object} Analysis result
 */
function analyze(code, options) {
  const analyzer = new ControlFlowAnalyzer(options);
  try {
    return analyzer.analyze(code);
  } finally {
    analyzer.dispose();
  }
}

/**
 * Analyze code asynchronously (convenience function)
 * @param {string} code - JavaScript code to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeAsync(code, options) {
  const analyzer = new ControlFlowAnalyzer(options);
  try {
    return await analyzer.analyzeAsync(code);
  } finally {
    analyzer.dispose();
  }
}

/**
 * Analyze multiple code snippets in batch
 * @param {string[]} codes - Array of JavaScript code snippets
 * @param {Object} options - Configuration options
 * @returns {Promise<Object[]>} Array of analysis results
 */
async function analyzeBatch(codes, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const onProgress = options.onProgress;
  
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(code => analyzeAsync(code, options))
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
 * Analyze code from a file
 * @param {string} filePath - Path to JavaScript file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeFile(filePath, options) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const absolutePath = path.resolve(filePath);
    const code = await fs.readFile(absolutePath, 'utf-8');
    return await analyzeAsync(code, options);
  } catch (error) {
    throw new Error(`Failed to analyze file: ${error.message}`);
  }
}

/**
 * Analyze code and return specific results
 * @param {string} code - JavaScript code to analyze
 * @param {string[]} fields - Fields to extract from results
 * @param {Object} options - Configuration options
 * @returns {Object} Selected analysis results
 */
function analyzeFields(code, fields, options = {}) {
  const result = analyze(code, options);
  const selected = {};
  
  for (const field of fields) {
    if (field in result) {
      selected[field] = result[field];
    }
  }
  
  return selected;
}

/**
 * Get supported analysis types
 */
function getSupportedAnalyses() {
  return {
    branches: {
      types: ['if', 'else', 'ternary', 'logical'],
      description: 'Conditional branch analysis'
    },
    loops: {
      types: ['for', 'while', 'do-while', 'for-in', 'for-of'],
      description: 'Loop structure analysis'
    },
    switches: {
      types: ['switch', 'state-machine'],
      description: 'Switch statement and state machine detection'
    },
    complexity: {
      metrics: ['cyclomatic', 'cognitive', 'nestingDepth', 'maintainabilityIndex'],
      description: 'Code complexity metrics'
    },
    obfuscation: {
      patterns: ['flattening', 'opaquePredicates', 'deadCode', 'bogusControlFlow'],
      description: 'Obfuscation pattern detection'
    },
    frameworks: {
      supported: ['react', 'vue', 'angular', 'svelte', 'nodejs', 'nextjs'],
      description: 'Web framework detection'
    },
    security: {
      vulnerabilities: ['codeInjection', 'pathTraversal', 'xss', 'hardcodedSecrets'],
      description: 'Security vulnerability scanning'
    },
    performance: {
      issues: ['largeLoop', 'infiniteLoop', 'largeFunction'],
      description: 'Performance issue identification'
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
      maxNestingDepth: {
        type: 'number',
        minimum: 1,
        maximum: 50,
        default: 10,
        description: 'Maximum nesting depth to analyze'
      },
      maxSwitchCases: {
        type: 'number',
        minimum: 1,
        maximum: 1000,
        default: 100,
        description: 'Maximum number of switch cases'
      },
      detectInfiniteLoops: {
        type: 'boolean',
        default: true,
        description: 'Detect potential infinite loops'
      },
      detectRecursion: {
        type: 'boolean',
        default: true,
        description: 'Detect recursive function calls'
      },
      trackComplexity: {
        type: 'boolean',
        default: true,
        description: 'Calculate complexity metrics'
      },
      generateCallGraph: {
        type: 'boolean',
        default: false,
        description: 'Generate function call graph'
      },
      analyzeDataFlow: {
        type: 'boolean',
        default: false,
        description: 'Perform data flow analysis'
      },
      webFrameworkSupport: {
        type: 'boolean',
        default: true,
        description: 'Detect web frameworks'
      },
      securityAnalysis: {
        type: 'boolean',
        default: false,
        description: 'Perform security analysis'
      },
      performanceAnalysis: {
        type: 'boolean',
        default: false,
        description: 'Perform performance analysis'
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
        description: 'Analysis timeout in milliseconds'
      },
      enableCache: {
        type: 'boolean',
        default: true,
        description: 'Enable result caching'
      }
    }
  };
}

// Export all utilities
module.exports = {
  // Main class
  ControlFlowAnalyzer,
  
  // Factory functions
  createControlFlowAnalyzer,
  
  // Convenience functions
  analyze,
  analyzeAsync,
  analyzeBatch,
  analyzeFile,
  analyzeFields,
  
  // Utilities
  getSupportedAnalyses,
  getConfigSchema,
  
  // Constants
  VERSION: '3.0.0',
  DEFAULT_OPTIONS,
  
  // Re-export agent for direct access
  ControlFlowAnalyzerAgent
};
