/**
 * Agents Index
 * Main export point for all agent modules
 * Version: 3.0.0
 */

// Export all agents
const StringDecryptorAgent = require("./string-decryptor/index.js");
const ControlFlowAnalyzerAgent = require("./control-flow-analyzer/index.js");
const FrameworkDetectorAgent = require("./framework-detector/index.js");
const PatternRecognizerAgent = require("./pattern-recognizer/index.js");
const RenamerAgent = require("./renamer/index.js");
const BeautifierAgent = require("./beautifier/index.js");
const ValidatorAgent = require("./validator/index.js");
const OrchestratorAgent = require("./orchestrator/index.js");

/**
 * Agent Registry
 * Maps agent names to their classes
 */
const agentRegistry = {
  "string-decryptor": StringDecryptorAgent,
  "control-flow-analyzer": ControlFlowAnalyzerAgent,
  "framework-detector": FrameworkDetectorAgent,
  "pattern-recognizer": PatternRecognizerAgent,
  renamer: RenamerAgent,
  beautifier: BeautifierAgent,
  validator: ValidatorAgent,
  orchestrator: OrchestratorAgent,
};

/**
 * Get agent by name
 * @param {string} name - Agent name
 * @returns {Agent|null} Agent class or null
 */
function getAgent(name) {
  return agentRegistry[name.toLowerCase()] || null;
}

/**
 * Get all agent names
 * @returns {string[]} Array of agent names
 */
function getAgentNames() {
  return Object.keys(agentRegistry);
}

/**
 * Create agent instance
 * @param {string} name - Agent name
 * @param {Object} options - Agent options
 * @returns {Agent|null} Agent instance or null
 */
function createAgent(name, options = {}) {
  const AgentClass = getAgent(name);
  if (!AgentClass) {
    return null;
  }
  return new AgentClass(options);
}

/**
 * Run all agents on code
 * @param {string} code - JavaScript code
 * @param {Object} context - Context for agents
 * @returns {Object} Results from all agents
 */
async function runAllAgents(code, context = {}) {
  const results = {};

  for (const [name, AgentClass] of Object.entries(agentRegistry)) {
    try {
      const agent = new AgentClass();
      results[name] = agent.analyze(code, context);
    } catch (error) {
      results[name] = { error: error.message };
    }
  }

  return results;
}

/**
 * Run agents in parallel
 * @param {string} code - JavaScript code
 * @param {string[]} agentNames - Agent names to run
 * @param {Object} context - Context for agents
 * @returns {Object} Results from selected agents
 */
async function runAgentsParallel(code, agentNames = [], context = {}) {
  const results = {};
  const promises = agentNames.map(async (name) => {
    const AgentClass = getAgent(name);
    if (!AgentClass) {
      return { error: `Agent '${name}' not found` };
    }
    const agent = new AgentClass();
    return agent.analyze(code, context);
  });

  const agentResults = await Promise.all(promises);

  agentNames.forEach((name, index) => {
    results[name] = agentResults[index];
  });

  return results;
}

/**
 * Agent metadata
 */
const agentMetadata = {
  "string-decryptor": {
    name: "String Decryptor Agent",
    description: "Decrypts obfuscated strings (base64, hex, ROT13, XOR)",
    capabilities: ["string-decryption", "encoding-detection", "eval-analysis"],
    priority: 1,
  },
  "control-flow-analyzer": {
    name: "Control Flow Analyzer Agent",
    description: "Analyzes and reconstructs control flow structures",
    capabilities: ["branch-analysis", "loop-analysis", "switch-reconstruction"],
    priority: 2,
  },
  "framework-detector": {
    name: "Framework Detector Agent",
    description: "Detects JavaScript frameworks and libraries",
    capabilities: ["react-detection", "vue-detection", "angular-detection"],
    priority: 3,
  },
  "pattern-recognizer": {
    name: "Pattern Recognizer Agent",
    description: "Recognizes 50+ obfuscation patterns",
    capabilities: ["array-access-detection", "eval-detection", "security-scan"],
    priority: 4,
  },
  renamer: {
    name: "Renamer Agent",
    description: "Intelligent variable and function renaming",
    capabilities: ["variable-renaming", "function-renaming", "semantic-naming"],
    priority: 5,
  },
  beautifier: {
    name: "Beautifier Agent",
    description: "Code formatting and beautification",
    capabilities: ["code-beautification", "formatting", "syntax-correction"],
    priority: 6,
  },
  validator: {
    name: "Validator Agent",
    description: "Validates deobfuscated code correctness",
    capabilities: ["syntax-validation", "security-scan", "code-quality"],
    priority: 7,
  },
  orchestrator: {
    name: "Orchestrator Agent",
    description: "Coordinates all agents for comprehensive deobfuscation",
    capabilities: [
      "agent-coordination",
      "workflow-management",
      "result-aggregation",
    ],
    priority: 8,
  },
};

/**
 * Get agent metadata
 * @param {string} name - Agent name
 * @returns {Object|null} Agent metadata
 */
function getAgentMetadata(name) {
  return agentMetadata[name.toLowerCase()] || null;
}

module.exports = {
  // Agent classes
  StringDecryptorAgent,
  ControlFlowAnalyzerAgent,
  FrameworkDetectorAgent,
  PatternRecognizerAgent,
  RenamerAgent,
  BeautifierAgent,
  ValidatorAgent,
  OrchestratorAgent,

  // Registry functions
  agentRegistry,
  getAgent,
  getAgentNames,
  createAgent,

  // Run functions
  runAllAgents,
  runAgentsParallel,

  // Metadata
  agentMetadata,
  getAgentMetadata,

  // Version
  VERSION: "1.0.0",
};
