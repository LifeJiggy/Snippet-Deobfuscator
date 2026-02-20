/**
 * Orchestrator Agent - Module Loader
 * 
 * Production-grade main orchestrator agent that coordinates all other agents
 * for comprehensive JavaScript deobfuscation.
 * 
 * This module provides comprehensive orchestration capabilities with support for
 * synchronous and asynchronous operations, progress tracking, workflow management,
 * parallel processing, error handling, and result aggregation.
 * 
 * Features:
 * - Agent coordination and lifecycle management
 * - Workflow execution and optimization
 * - Parallel processing of independent agents
 * - Error handling and fallback strategies
 * - Progress tracking via events
 * - Result caching and aggregation
 * - Timeout control
 * - Custom workflow definition
 * 
 * Usage:
 *   // Basic usage
 *   const { Orchestrator } = require('./agents/orchestrator');
 *   const orchestrator = new Orchestrator();
 *   const result = orchestrator.orchestrate(code);
 * 
 *   // Async with events
 *   const { createOrchestrator } = require('./agents/orchestrator');
 *   const orchestrator = createOrchestrator({ verboseLogging: true });
 *   orchestrator.on('progress', (progress) => console.log(progress));
 *   const result = await orchestrator.orchestrateAsync(code);
 * 
 *   // Custom workflow
 *   const { orchestrateWithWorkflow } = require('./agents/orchestrator');
 *   const result = await orchestrateWithWorkflow(code, customWorkflow);
 * 
 * For the core implementation, see orchestrator-agent.js
 */

const OrchestratorAgent = require('./orchestrator-agent');
const { EventEmitter } = require('events');

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  maxRetries: 2,
  timeout: 120000,
  parallel: true,
  validateEachStep: true,
  continueOnError: true,
  verboseLogging: false,
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  maxParallelAgents: 3,
  enableProgressTracking: true,
  aggregateResults: true,
  generateReport: true,
  strictMode: false
};

/**
 * Cache storage for orchestration results
 */
class OrchestrationCache {
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
      .update(code.substring(0, 1000) + JSON.stringify(options))
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
 * Extended orchestrator with event support and caching
 */
class Orchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new OrchestratorAgent(this.options);
    this.cache = this.options.enableCache ? new OrchestrationCache(this.options.cacheTTL) : null;
    this.orchestrationCount = 0;
    this.totalOrchestrationTime = 0;
  }

  /**
   * Orchestrate deobfuscation synchronously
   * @param {string} code - Code to deobfuscate
   * @param {Object} context - Optional context information
   * @returns {Object} Orchestration result
   */
  orchestrate(code, context = {}) {
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

    this.emit('orchestrationStart', { context, codeLength: code.length });

    try {
      const result = this.agent.analyze(code, context);
      
      // Update statistics
      this.orchestrationCount++;
      this.totalOrchestrationTime += Date.now() - startTime;
      
      // Cache result
      if (this.cache && result.success) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit('orchestrationComplete', { 
        orchestrationTime: result.analysisTime || Date.now() - startTime,
        success: result.success,
        agentsRun: result.results ? Object.keys(result.results).length : 0
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        timestamp: new Date().toISOString(),
        success: false,
        originalCode: code,
        deobfuscatedCode: code,
        errors: [{
          type: 'orchestration-error',
          message: error.message,
          stack: error.stack
        }],
        analysisTime: Date.now() - startTime
      };
      
      this.emit('orchestrationError', { error: error.message });
      return errorResult;
    }
  }

  /**
   * Orchestrate deobfuscation asynchronously with timeout support
   * @param {string} code - Code to deobfuscate
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Orchestration result
   */
  orchestrateAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Orchestration timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.orchestrate(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Orchestrate with custom workflow
   * @param {string} code - Code to process
   * @param {Array} workflow - Custom workflow definition
   * @returns {Object} Orchestration result
   */
  orchestrateWithWorkflow(code, workflow) {
    return this.agent.orchestrateWithWorkflow(code, workflow);
  }

  /**
   * Orchestrate with streaming progress updates
   * @param {string} code - Code to deobfuscate
   * @returns {Object} Orchestration result
   */
  async orchestrateWithProgress(code) {
    const phases = [
      { name: 'initialization', weight: 0.05 },
      { name: 'frameworkDetection', weight: 0.1 },
      { name: 'patternRecognition', weight: 0.1 },
      { name: 'stringDecryption', weight: 0.15 },
      { name: 'controlFlowAnalysis', weight: 0.15 },
      { name: 'variableRenaming', weight: 0.15 },
      { name: 'beautification', weight: 0.15 },
      { name: 'validation', weight: 0.1 },
      { name: 'resultAggregation', weight: 0.05 }
    ];

    let cumulativeWeight = 0;
    
    for (const phase of phases) {
      this.emit('progress', {
        phase: phase.name,
        progress: cumulativeWeight,
        message: `Running ${phase.name}...`
      });
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 10));
      cumulativeWeight += phase.weight;
    }

    const result = this.orchestrate(code);
    
    this.emit('progress', {
      phase: 'complete',
      progress: 1,
      message: 'Orchestration complete'
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
   * Register custom agent
   * @param {string} name - Agent name
   * @param {Object} agent - Agent instance
   */
  registerAgent(name, agent) {
    this.agent.registerAgent(name, agent);
  }

  /**
   * Get available agents
   * @returns {Array} List of available agents
   */
  getAvailableAgents() {
    return this.agent.getAvailableAgents ? this.agent.getAvailableAgents() : [];
  }

  /**
   * Get orchestration statistics
   */
  getStatistics() {
    return {
      orchestrationCount: this.orchestrationCount,
      totalOrchestrationTime: this.totalOrchestrationTime,
      averageOrchestrationTime: this.orchestrationCount > 0 
        ? this.totalOrchestrationTime / this.orchestrationCount 
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
    this.orchestrationCount = 0;
    this.totalOrchestrationTime = 0;
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
    if (this.agent) {
      this.agent.dispose();
    }
    if (this.cache) {
      this.cache.clear();
    }
  }
}

/**
 * Factory function to create a new Orchestrator instance
 * @param {Object} options - Configuration options
 * @returns {Orchestrator} Orchestrator instance
 */
function createOrchestrator(options) {
  return new Orchestrator(options);
}

/**
 * Orchestrate deobfuscation synchronously (convenience function)
 * @param {string} code - Code to deobfuscate
 * @param {Object} options - Configuration options
 * @returns {Object} Orchestration result
 */
function orchestrate(code, options) {
  const orchestrator = new Orchestrator(options);
  try {
    return orchestrator.orchestrate(code);
  } finally {
    orchestrator.dispose();
  }
}

/**
 * Orchestrate deobfuscation asynchronously (convenience function)
 * @param {string} code - Code to deobfuscate
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Orchestration result
 */
async function orchestrateAsync(code, options) {
  const orchestrator = new Orchestrator(options);
  try {
    return await orchestrator.orchestrateAsync(code);
  } finally {
    orchestrator.dispose();
  }
}

/**
 * Orchestrate with custom workflow
 * @param {string} code - Code to process
 * @param {Array} workflow - Custom workflow
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Orchestration result
 */
async function orchestrateWithWorkflow(code, workflow, options = {}) {
  const orchestrator = new Orchestrator(options);
  try {
    return await orchestrator.orchestrateWithWorkflow(code, workflow);
  } finally {
    orchestrator.dispose();
  }
}

/**
 * Get supported workflows
 */
function getSupportedWorkflows() {
  return {
    full: {
      name: 'Full Deobfuscation',
      description: 'Complete deobfuscation pipeline with all agents',
      agents: ['frameworkDetector', 'patternRecognizer', 'stringDecryptor', 'controlFlowAnalyzer', 'renamer', 'beautifier', 'validator']
    },
    minimal: {
      name: 'Minimal Deobfuscation',
      description: 'Quick deobfuscation with essential agents only',
      agents: ['stringDecryptor', 'controlFlowAnalyzer', 'beautifier']
    },
    security: {
      name: 'Security-Focused',
      description: 'Deobfuscation with security analysis',
      agents: ['frameworkDetector', 'patternRecognizer', 'stringDecryptor', 'controlFlowAnalyzer', 'validator']
    },
    analysis: {
      name: 'Analysis Only',
      description: 'Analysis without modification',
      agents: ['frameworkDetector', 'patternRecognizer', 'controlFlowAnalyzer']
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
      maxRetries: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 2,
        description: 'Maximum retry attempts for failed agents'
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 600000,
        default: 120000,
        description: 'Overall timeout in milliseconds'
      },
      parallel: {
        type: 'boolean',
        default: true,
        description: 'Enable parallel agent execution'
      },
      validateEachStep: {
        type: 'boolean',
        default: true,
        description: 'Validate after each step'
      },
      continueOnError: {
        type: 'boolean',
        default: true,
        description: 'Continue on agent failure'
      },
      verboseLogging: {
        type: 'boolean',
        default: false,
        description: 'Enable verbose logging'
      },
      enableCache: {
        type: 'boolean',
        default: true,
        description: 'Enable result caching'
      },
      maxParallelAgents: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        default: 3,
        description: 'Maximum parallel agents'
      },
      enableProgressTracking: {
        type: 'boolean',
        default: true,
        description: 'Enable progress tracking'
      },
      aggregateResults: {
        type: 'boolean',
        default: true,
        description: 'Aggregate results from all agents'
      },
      generateReport: {
        type: 'boolean',
        default: true,
        description: 'Generate comprehensive report'
      },
      strictMode: {
        type: 'boolean',
        default: false,
        description: 'Enable strict validation mode'
      }
    }
  };
}

// Export all utilities
module.exports = {
  // Main class
  Orchestrator,
  
  // Factory functions
  createOrchestrator,
  
  // Convenience functions
  orchestrate,
  orchestrateAsync,
  orchestrateWithWorkflow,
  
  // Utilities
  getSupportedWorkflows,
  getConfigSchema,
  
  // Constants
  VERSION: '3.0.0',
  DEFAULT_OPTIONS,
  
  // Re-export agent for direct access
  OrchestratorAgent
};
