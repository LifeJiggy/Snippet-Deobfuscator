/**
 * Orchestrator Agent - Core Implementation
 * Production-grade main orchestrator for coordinating all specialized agents
 *
 * This module provides comprehensive workflow orchestration including:
 * - Agent coordination and lifecycle management
 * - Workflow pipeline execution
 * - Parallel and sequential processing
 * - Error handling with fallbacks
 * - Result aggregation and reporting
 */
const { EventEmitter } = require("events");
const path = require("path");
const fs = require("fs");

class OrchestratorAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = "orchestrator";
    this.version = "1.0.0";
    this.options = this.initializeOptions(options);
    this.agents = new Map();
    this.initializeAgents();
    this.workflow = this.initializeWorkflow();
    this.state = {
      currentStep: 0,
      totalSteps: 0,
      progress: 0,
      isRunning: false,
      errors: [],
      warnings: [],
    };
    this.results = {
      stringDecryptor: null,
      controlFlow: null,
      framework: null,
      patterns: null,
      renamer: null,
      beautifier: null,
      validator: null,
    };
    this.statistics = {
      totalAgents: 0,
      successfulAgents: 0,
      failedAgents: 0,
      totalTime: 0,
      retries: 0,
    };
  }

  initializeOptions(options) {
    return {
      maxRetries: options.maxRetries || 2,
      timeout: options.timeout || 120000,
      parallel: options.parallel !== false,
      validateEachStep: options.validateEachStep !== false,
      continueOnError: options.continueOnError !== false,
      verboseLogging: options.verboseLogging || false,
      enableCache: options.enableCache !== false,
      maxParallelAgents: options.maxParallelAgents || 3,
      ...options,
    };
  }

  initializeAgents() {
    try {
      const StringDecryptorAgent = require("../string-decryptor/index.js");
      const ControlFlowAnalyzerAgent = require("../control-flow-analyzer/index.js");
      const FrameworkDetectorAgent = require("../framework-detector/index.js");
      const PatternRecognizerAgent = require("../pattern-recognizer/index.js");
      const RenamerAgent = require("../renamer/index.js");
      const BeautifierAgent = require("../beautifier/index.js");
      const ValidatorAgent = require("../validator/index.js");

      this.agents.set("string-decryptor", {
        instance: new StringDecryptorAgent(),
        priority: 1,
        enabled: true,
        required: true,
      });
      this.agents.set("control-flow-analyzer", {
        instance: new ControlFlowAnalyzerAgent(),
        priority: 2,
        enabled: true,
        required: false,
      });
      this.agents.set("framework-detector", {
        instance: new FrameworkDetectorAgent(),
        priority: 3,
        enabled: true,
        required: false,
      });
      this.agents.set("pattern-recognizer", {
        instance: new PatternRecognizerAgent(),
        priority: 4,
        enabled: true,
        required: false,
      });
      this.agents.set("renamer", {
        instance: new RenamerAgent(),
        priority: 5,
        enabled: true,
        required: false,
      });
      this.agents.set("beautifier", {
        instance: new BeautifierAgent(),
        priority: 6,
        enabled: true,
        required: false,
      });
      this.agents.set("validator", {
        instance: new ValidatorAgent(),
        priority: 7,
        enabled: true,
        required: false,
      });

      this.statistics.totalAgents = this.agents.size;
    } catch (error) {
      if (this.options.verboseLogging) {
        console.error(
          "[OrchestratorAgent] Error initializing agents:",
          error.message
        );
      }
    }
  }

  initializeWorkflow() {
    return {
      steps: [
        {
          name: "initial-analysis",
          agents: ["framework-detector", "pattern-recognizer"],
          parallel: true,
          required: true,
        },
        {
          name: "string-decryption",
          agents: ["string-decryptor"],
          parallel: false,
          required: true,
        },
        {
          name: "control-flow-analysis",
          agents: ["control-flow-analyzer"],
          parallel: false,
          required: false,
        },
        {
          name: "variable-renaming",
          agents: ["renamer"],
          parallel: false,
          required: false,
        },
        {
          name: "beautification",
          agents: ["beautifier"],
          parallel: false,
          required: false,
        },
        {
          name: "validation",
          agents: ["validator"],
          parallel: false,
          required: true,
        },
      ],
      currentIndex: 0,
    };
  }

  analyze(code, context = {}) {
    const startTime = Date.now();
    const result = {
      agent: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      originalCode: code,
      deobfuscatedCode: code,
      results: {},
      workflow: {
        steps: [],
        currentStep: 0,
        totalSteps: this.workflow.steps.length,
      },
      statistics: {},
      errors: [],
      warnings: [],
      analysisTime: 0,
      success: false,
    };

    try {
      this.state.isRunning = true;
      this.state.errors = [];
      this.state.warnings = [];
      this.results = {};

      this.emit("start", { codeLength: code.length, context });

      result.results.framework = this.runAgent(
        "framework-detector",
        code,
        context
      );
      result.workflow.steps.push({
        name: "framework-detection",
        success: true,
      });

      result.results.patterns = this.runAgent(
        "pattern-recognizer",
        code,
        context
      );
      result.workflow.steps.push({
        name: "pattern-recognition",
        success: true,
      });

      let currentCode = code;

      if (this.shouldRunAgent("string-decryptor", result.results.patterns)) {
        const stringResult = this.runAgent(
          "string-decryptor",
          currentCode,
          context
        );
        result.results.stringDecryptor = stringResult;
        if (stringResult.decryptedCode) {
          currentCode = stringResult.decryptedCode;
        }
        result.workflow.steps.push({
          name: "string-decryption",
          success: true,
        });
      }

      if (
        this.shouldRunAgent("control-flow-analyzer", result.results.framework)
      ) {
        result.results.controlFlow = this.runAgent(
          "control-flow-analyzer",
          currentCode,
          context
        );
        result.workflow.steps.push({
          name: "control-flow-analysis",
          success: true,
        });
      }

      if (this.shouldRunAgent("renamer", result.results.controlFlow)) {
        result.results.renamer = this.runAgent("renamer", currentCode, context);
        if (result.results.renamer && result.results.renamer.renamedCode) {
          currentCode = result.results.renamer.renamedCode;
        }
        result.workflow.steps.push({
          name: "variable-renaming",
          success: true,
        });
      }

      result.results.beautifier = this.runAgent(
        "beautifier",
        currentCode,
        context
      );
      result.deobfuscatedCode =
        result.results.beautifier.formatted || currentCode;
      result.workflow.steps.push({ name: "beautification", success: true });

      result.results.validator = this.runAgent(
        "validator",
        result.deobfuscatedCode,
        context
      );
      result.workflow.steps.push({
        name: "validation",
        success: !result.results.validator.errors?.length,
      });

      result.statistics = this.getStatistics();
      result.analysisTime = Date.now() - startTime;
      result.success = result.results.validator.errors?.length === 0;

      this.emit("complete", result);
    } catch (error) {
      result.errors.push({
        type: "orchestration-error",
        message: error.message,
        stack: error.stack,
      });
      result.analysisTime = Date.now() - startTime;
    }

    this.state.isRunning = false;
    return result;
  }

  async analyzeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      try {
        const result = this.analyze(code, context);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  runAgent(agentName, code, context) {
    const agentConfig = this.agents.get(agentName);
    if (!agentConfig || !agentConfig.enabled) {
      return null;
    }

    try {
      this.emit("agent:start", { agent: agentName, codeLength: code.length });

      const result = agentConfig.instance.analyze(code, {
        ...context,
        previousResults: this.results,
      });

      this.statistics.successfulAgents++;
      this.emit("agent:complete", { agent: agentName, success: true });

      return result;
    } catch (error) {
      this.statistics.failedAgents++;
      this.state.errors.push({
        agent: agentName,
        message: error.message,
      });
      this.emit("agent:error", { agent: agentName, error: error.message });

      if (this.options.continueOnError) {
        return null;
      }
      throw error;
    }
  }

  shouldRunAgent(agentName, previousResult) {
    const agentConfig = this.agents.get(agentName);
    if (!agentConfig || !agentConfig.enabled) {
      return false;
    }
    if (!agentConfig.required) {
      return previousResult && Object.keys(previousResult).length > 0;
    }
    return true;
  }

  runAgentsParallel(agents, code, context) {
    return agents
      .filter((agentName) => this.shouldRunAgent(agentName, null))
      .map((agentName) => ({
        name: agentName,
        result: this.runAgent(agentName, code, context),
      }));
  }

  getAgent(agentName) {
    const agentConfig = this.agents.get(agentName);
    return agentConfig ? agentConfig.instance : null;
  }

  enableAgent(agentName) {
    const agentConfig = this.agents.get(agentName);
    if (agentConfig) {
      agentConfig.enabled = true;
    }
  }

  disableAgent(agentName) {
    const agentConfig = this.agents.get(agentName);
    if (agentConfig) {
      agentConfig.enabled = false;
    }
  }

  configure(options) {
    this.options = { ...this.options, ...options };
  }

  getStatistics() {
    return {
      ...this.statistics,
      agents: Array.from(this.agents.entries()).map(([name, config]) => ({
        name,
        enabled: config.enabled,
        priority: config.priority,
        required: config.required,
      })),
      workflow: this.workflow.steps.map((step, index) => ({
        name: step.name,
        parallel: step.parallel,
        required: step.required,
      })),
    };
  }

  getState() {
    return {
      ...this.state,
      agentsEnabled: Array.from(this.agents.entries())
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name),
    };
  }

  reset() {
    this.state = {
      currentStep: 0,
      totalSteps: 0,
      progress: 0,
      isRunning: false,
      errors: [],
      warnings: [],
    };
    this.results = {
      stringDecryptor: null,
      controlFlow: null,
      framework: null,
      patterns: null,
      renamer: null,
      beautifier: null,
      validator: null,
    };
    this.statistics = {
      totalAgents: this.agents.size,
      successfulAgents: 0,
      failedAgents: 0,
      totalTime: 0,
      retries: 0,
    };
  }

  dispose() {
    for (const [name, agentConfig] of this.agents) {
      if (
        agentConfig.instance &&
        typeof agentConfig.instance.dispose === "function"
      ) {
        agentConfig.instance.dispose();
      }
    }
    this.agents.clear();
  }
}

module.exports = OrchestratorAgent;
