/**
 * Skills Index
 * Main export point for all skill modules
 * Version: 3.0.0
 */

// Export all skills
const StringDecryptionSkill = require("./string-decryption/index.js");

/**
 * Skills Registry
 */
const skillsRegistry = {
  "string-decryption": StringDecryptionSkill,
};

/**
 * Get skill by name
 */
function getSkill(name) {
  return skillsRegistry[name.toLowerCase()] || null;
}

/**
 * Get all skill names
 */
function getSkillNames() {
  return Object.keys(skillsRegistry);
}

/**
 * Create skill instance
 */
function createSkill(name, options = {}) {
  const SkillClass = getSkill(name);
  if (!SkillClass) {
    return null;
  }
  return new SkillClass(options);
}

/**
 * Execute skill on code
 */
function executeSkill(name, code, options = {}) {
  const skill = createSkill(name, options);
  if (!skill) {
    throw new Error(`Skill '${name}' not found`);
  }
  return skill.execute(code, options);
}

/**
 * Execute multiple skills
 */
function executeSkills(code, skillNames = [], options = {}) {
  const results = {};

  for (const name of skillNames) {
    try {
      results[name] = executeSkill(name, code, options);
    } catch (error) {
      results[name] = { error: error.message };
    }
  }

  return results;
}

/**
 * Skill metadata
 */
const skillMetadata = {
  "string-decryption": {
    name: "String Decryption Skill",
    description: "Advanced string decryption with multiple encoding schemes",
    capabilities: [
      "base64",
      "hex",
      "rot13",
      "rot47",
      "xor",
      "unicode",
      "url-encoding",
      "html-entity",
      "multi-layer",
    ],
    priority: 1,
  },
  "control-flow": {
    name: "Control Flow Skill",
    description: "Control flow analysis and reconstruction",
    capabilities: [
      "branch-analysis",
      "loop-analysis",
      "switch-reconstruction",
      "dead-code-elimination",
    ],
    priority: 2,
  },
  renaming: {
    name: "Renaming Skill",
    description: "Semantic-aware variable and function renaming",
    capabilities: [
      "variable-renaming",
      "function-renaming",
      "scope-analysis",
      "conflict-resolution",
    ],
    priority: 3,
  },
  "anti-debug": {
    name: "Anti-Debug Skill",
    description: "Detection of anti-debugging techniques",
    capabilities: [
      "debugger-detection",
      "timing-attack-prevention",
      "breakpoint-detection",
    ],
    priority: 4,
  },
  "malware-analysis": {
    name: "Malware Analysis Skill",
    description: "Security-focused code analysis",
    capabilities: [
      "code-injection-detection",
      "network-exfiltration",
      "crypto-analysis",
      "risk-scoring",
    ],
    priority: 5,
  },
};

/**
 * Get skill metadata
 */
function getSkillMetadata(name) {
  return skillMetadata[name.toLowerCase()] || null;
}

module.exports = {
  // Skill classes
  StringDecryptionSkill,

  // Registry functions
  skillsRegistry,
  getSkill,
  getSkillNames,
  createSkill,

  // Execute functions
  executeSkill,
  executeSkills,

  // Metadata
  skillMetadata,
  getSkillMetadata,

  // Version
  VERSION: "1.0.0",
};
