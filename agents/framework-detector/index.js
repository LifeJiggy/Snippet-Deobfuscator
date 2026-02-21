/**
 * Framework Detector Agent - Module Loader
 *
 * Production-grade specialized agent for detecting JavaScript frameworks,
 * libraries, and build tools in obfuscated code.
 *
 * This module provides comprehensive framework detection capabilities with support for
 * synchronous and asynchronous operations, progress tracking, caching, and more.
 *
 * Features:
 * - Multi-framework detection (React, Vue, Angular, Svelte, Node.js, etc.)
 * - Library detection (50+ libraries)
 * - Build tool identification
 * - Version estimation
 * - Security pattern analysis
 * - Confidence scoring
 * - Obfuscation-resistant detection
 *
 * Usage:
 *   // Basic usage
 *   const { FrameworkDetector } = require('./agents/framework-detector');
 *   const agent = new FrameworkDetector();
 *   const result = agent.detect(code);
 *
 *   // Async with events
 *   const { createFrameworkDetector } = require('./agents/framework-detector');
 *   const detector = createFrameworkDetector({ verboseLogging: true });
 *   detector.on('progress', (progress) => console.log(progress));
 *   const result = await detector.detectAsync(code);
 *
 *   // Batch detection
 *   const { detectBatch } = require('./agents/framework-detector');
 *   const results = await detectBatch(codeArray);
 *
 * For the core implementation, see framework-detector-agent.js
 */

const FrameworkDetectorAgent = require("./framework-detector-agent");
const { EventEmitter } = require("events");

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  detectReact: true,
  detectVue: true,
  detectAngular: true,
  detectSvelte: true,
  detectNodejs: true,
  detectNextjs: true,
  detectLibraries: true,
  detectBuildTools: true,
  detectSecurity: true,
  estimateVersions: true,
  confidenceThreshold: 0.5,
  verboseLogging: false,
  timeout: 15000,
  enableCache: true,
  cacheTTL: 300000,
  parallel: false,
};

/**
 * Cache storage for detection results
 */
class DetectionCache {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate cache key from code and options
   */
  generateKey(code, options) {
    const hash = require("crypto")
      .createHash("md5")
      .update(code.substring(0, 2000) + JSON.stringify(options))
      .digest("hex");
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
      timestamp: Date.now(),
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
      entries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Extended detector with event support and caching
 */
class FrameworkDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.agent = new FrameworkDetectorAgent(this.options);
    this.cache = this.options.enableCache
      ? new DetectionCache(this.options.cacheTTL)
      : null;
    this.detectionCount = 0;
    this.totalDetectionTime = 0;
  }

  /**
   * Detect frameworks synchronously
   * @param {string} code - Code to analyze
   * @param {Object} context - Optional context information
   * @returns {Object} Detection result
   */
  detect(code, context = {}) {
    const startTime = Date.now();

    // Validate input
    this.validateInput(code);

    // Check cache
    if (this.cache) {
      const cacheKey = this.cache.generateKey(code, this.options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.emit("cacheHit", { key: cacheKey });
        return { ...cached, fromCache: true };
      }
    }

    this.emit("detectionStart", { context });

    try {
      const result = this.agent.analyze(code, context);

      // Update statistics
      this.detectionCount++;
      this.totalDetectionTime += Date.now() - startTime;

      // Cache result
      if (this.cache && result.frameworks?.length > 0) {
        const cacheKey = this.cache.generateKey(code, this.options);
        this.cache.set(cacheKey, result);
      }

      this.emit("detectionComplete", {
        detectionTime: result.analysisTime || Date.now() - startTime,
        frameworksFound: result.frameworks?.length || 0,
        librariesFound: result.libraries?.length || 0,
      });

      return result;
    } catch (error) {
      const errorResult = {
        agent: this.agent.name,
        version: this.agent.version,
        timestamp: new Date().toISOString(),
        frameworks: [],
        libraries: [],
        buildTools: [],
        security: [],
        errors: [
          {
            type: "detection-error",
            message: error.message,
            stack: error.stack,
          },
        ],
        analysisTime: Date.now() - startTime,
      };

      this.emit("detectionError", { error: error.message });
      return errorResult;
    }
  }

  /**
   * Detect frameworks asynchronously with timeout support
   * @param {string} code - Code to analyze
   * @param {Object} context - Optional context information
   * @returns {Promise<Object>} Detection result
   */
  detectAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Detection timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      try {
        const result = this.detect(code, context);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Detect with streaming progress updates
   * @param {string} code - Code to analyze
   * @returns {Object} Detection result
   */
  async detectWithProgress(code) {
    const phases = [
      { name: "parsing", weight: 0.1 },
      { name: "frameworkDetection", weight: 0.3 },
      { name: "libraryDetection", weight: 0.25 },
      { name: "buildToolDetection", weight: 0.15 },
      { name: "securityAnalysis", weight: 0.1 },
      { name: "versionEstimation", weight: 0.1 },
    ];

    let cumulativeWeight = 0;

    for (const phase of phases) {
      this.emit("progress", {
        phase: phase.name,
        progress: cumulativeWeight,
        message: `Running ${phase.name}...`,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      cumulativeWeight += phase.weight;
    }

    const result = this.detect(code);

    this.emit("progress", {
      phase: "complete",
      progress: 1,
      message: "Detection complete",
    });

    return result;
  }

  /**
   * Validate input code
   */
  validateInput(code) {
    if (typeof code !== "string") {
      throw new Error("Code must be a string");
    }

    if (!code.trim()) {
      throw new Error("Code cannot be empty");
    }

    if (code.length > 10000000) {
      // 10MB limit
      throw new Error("Code exceeds maximum length of 10MB");
    }

    this.emit("inputValidated", { length: code.length });
  }

  /**
   * Detect specific framework only
   * @param {string} code - Code to analyze
   * @param {string} framework - Framework name (react, vue, angular, svelte, nodejs)
   * @returns {Object} Detection result
   */
  detectFramework(code, framework) {
    const options = {
      detectReact: framework === "react",
      detectVue: framework === "vue",
      detectAngular: framework === "angular",
      detectSvelte: framework === "svelte",
      detectNodejs: framework === "nodejs",
      detectNextjs: framework === "nextjs",
      detectLibraries: false,
      detectBuildTools: false,
      detectSecurity: false,
    };

    const detector = new FrameworkDetector({ ...this.options, ...options });
    return detector.detect(code);
  }

  /**
   * Get supported frameworks
   * @returns {Array} List of supported frameworks
   */
  getSupportedFrameworks() {
    return [
      { name: "react", description: "React and React Native" },
      { name: "vue", description: "Vue.js 2.x and 3.x" },
      { name: "angular", description: "Angular" },
      { name: "svelte", description: "Svelte" },
      { name: "nodejs", description: "Node.js backend frameworks" },
      { name: "nextjs", description: "Next.js" },
    ];
  }

  /**
   * Get supported libraries
   * @returns {Array} List of supported libraries
   */
  getSupportedLibraries() {
    return [
      "jquery",
      "lodash",
      "axios",
      "moment",
      "dateFns",
      "underscore",
      "backbone",
      "expressValidator",
      "mongoose",
      "sequelize",
      "prisma",
      "socketio",
      "ws",
      "graphql",
      "redis",
      "amqp",
      "nodemailer",
      "bcrypt",
      "jsonwebtoken",
      "passport",
    ];
  }

  /**
   * Get detection statistics
   */
  getStatistics() {
    return {
      detectionCount: this.detectionCount,
      totalDetectionTime: this.totalDetectionTime,
      averageDetectionTime:
        this.detectionCount > 0
          ? this.totalDetectionTime / this.detectionCount
          : 0,
      cacheEnabled: !!this.cache,
      cacheStats: this.cache ? this.cache.getStats() : null,
      version: this.agent.version,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.detectionCount = 0;
    this.totalDetectionTime = 0;
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
 * Factory function to create a new FrameworkDetector instance
 * @param {Object} options - Configuration options
 * @returns {FrameworkDetector} Detector instance
 */
function createFrameworkDetector(options) {
  return new FrameworkDetector(options);
}

/**
 * Detect frameworks synchronously (convenience function)
 * @param {string} code - Code to analyze
 * @param {Object} options - Configuration options
 * @returns {Object} Detection result
 */
function detect(code, options) {
  const detector = new FrameworkDetector(options);
  try {
    return detector.detect(code);
  } finally {
    detector.dispose();
  }
}

/**
 * Detect frameworks asynchronously (convenience function)
 * @param {string} code - Code to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Detection result
 */
async function detectAsync(code, options) {
  const detector = new FrameworkDetector(options);
  try {
    return await detector.detectAsync(code);
  } finally {
    detector.dispose();
  }
}

/**
 * Detect frameworks for multiple code snippets in batch
 * @param {string[]} codes - Array of code snippets
 * @param {Object} options - Configuration options
 * @returns {Promise<Object[]>} Array of detection results
 */
async function detectBatch(codes, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const onProgress = options.onProgress;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((code) => detectAsync(code, options))
    );
    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, codes.length),
        total: codes.length,
        percentage: ((i + batchSize) / codes.length) * 100,
      });
    }
  }

  return results;
}

/**
 * Get supported frameworks
 */
function getSupportedFrameworks() {
  return [
    {
      name: "react",
      aliases: ["react", "react-dom", "react-native"],
      category: "frontend",
    },
    {
      name: "vue",
      aliases: ["vue", "nuxt", "vue-router", "vuex"],
      category: "frontend",
    },
    { name: "angular", aliases: ["@angular", "ng"], category: "frontend" },
    { name: "svelte", aliases: ["svelte", "sveltekit"], category: "frontend" },
    { name: "next", aliases: ["next", "nextjs"], category: "frontend" },
    { name: "nuxt", aliases: ["nuxt", "nuxtjs"], category: "frontend" },
    { name: "express", aliases: ["express"], category: "backend" },
    { name: "koa", aliases: ["koa"], category: "backend" },
    { name: "fastify", aliases: ["fastify"], category: "backend" },
    { name: "jquery", aliases: ["jquery", "$"], category: "library" },
    { name: "lodash", aliases: ["lodash", "_"], category: "library" },
    { name: "axios", aliases: ["axios"], category: "library" },
  ];
}

/**
 * Get supported libraries
 */
function getSupportedLibraries() {
  return [
    "react",
    "react-dom",
    "react-native",
    "react-router",
    "vue",
    "vue-router",
    "vuex",
    "nuxt",
    "@angular/core",
    "@angular/common",
    "@angular/router",
    "svelte",
    "sveltekit",
    "express",
    "koa",
    "fastify",
    "hapi",
    "jquery",
    "lodash",
    "underscore",
    "ramda",
    "axios",
    "fetch",
    "superagent",
    "got",
    "webpack",
    "rollup",
    "vite",
    "esbuild",
    "redux",
    "mobx",
    "zustand",
    "jotai",
    "mongoose",
    "sequelize",
    "typeorm",
    "prisma",
    "pg",
    "mysql",
    "mongodb",
    "redis",
  ];
}

/**
 * Get agent configuration schema
 */
function getConfigSchema() {
  return {
    type: "object",
    properties: {
      detectReact: {
        type: "boolean",
        default: true,
        description: "Enable React framework detection",
      },
      detectVue: {
        type: "boolean",
        default: true,
        description: "Enable Vue.js framework detection",
      },
      detectAngular: {
        type: "boolean",
        default: true,
        description: "Enable Angular framework detection",
      },
      detectSvelte: {
        type: "boolean",
        default: true,
        description: "Enable Svelte framework detection",
      },
      detectNodejs: {
        type: "boolean",
        default: true,
        description: "Enable Node.js backend detection",
      },
      detectNextjs: {
        type: "boolean",
        default: true,
        description: "Enable Next.js detection",
      },
      detectLibraries: {
        type: "boolean",
        default: true,
        description: "Enable library detection",
      },
      detectBuildTools: {
        type: "boolean",
        default: true,
        description: "Enable build tool detection",
      },
      detectSecurity: {
        type: "boolean",
        default: true,
        description: "Enable security pattern detection",
      },
      estimateVersions: {
        type: "boolean",
        default: true,
        description: "Estimate framework versions",
      },
      confidenceThreshold: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.5,
        description: "Minimum confidence score for detection (0-1)",
      },
      verboseLogging: {
        type: "boolean",
        default: false,
        description: "Enable verbose logging",
      },
      timeout: {
        type: "number",
        minimum: 1000,
        maximum: 60000,
        default: 15000,
        description: "Detection timeout in milliseconds",
      },
      enableCache: {
        type: "boolean",
        default: true,
        description: "Enable result caching",
      },
    },
  };
}

// Export all utilities
module.exports = {
  // Main class
  FrameworkDetector,

  // Factory functions
  createFrameworkDetector,

  // Convenience functions
  detect,
  detectAsync,
  detectBatch,

  // Utilities
  getSupportedFrameworks,
  getSupportedLibraries,
  getConfigSchema,

  // Constants
  VERSION: "3.0.0",
  DEFAULT_OPTIONS,

  // Re-export agent for direct access
  FrameworkDetectorAgent,
};
