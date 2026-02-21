const StringDecryptionSkill = require("./string-decryption/string-decryption");
const AntiDebugSkill = require("./anti-debug/anti-debug");
const ControlFlowSkill = require("./control-flow/control-flow");
const MalwareAnalysisSkill = require("./malware-analysis/malware-analysis");
const RenamingSkill = require("./renaming/renaming");
const DeadCodeEliminationSkill = require("./dead-code-elimination/dead-code-elimination");
const ConstantFoldingSkill = require("./constant-folding/constant-folding");
const StringArraySkill = require("./string-array/string-array");
const ProxyFunctionSkill = require("./proxy-function/proxy-function");
const AstSimplificationSkill = require("./ast-simplification/ast-simplification");

const skillsRegistry = {
  "string-decryption": StringDecryptionSkill,
  "anti-debug": AntiDebugSkill,
  "control-flow": ControlFlowSkill,
  "malware-analysis": MalwareAnalysisSkill,
  renaming: RenamingSkill,
  "dead-code-elimination": DeadCodeEliminationSkill,
  "constant-folding": ConstantFoldingSkill,
  "string-array": StringArraySkill,
  "proxy-function": ProxyFunctionSkill,
  "ast-simplification": AstSimplificationSkill,
};

function getSkill(name) {
  return skillsRegistry[name.toLowerCase()] || null;
}

function getSkillNames() {
  return Object.keys(skillsRegistry);
}

function createSkill(name, options = {}) {
  const SkillClass = getSkill(name);
  if (!SkillClass) {
    return null;
  }
  return new SkillClass(options);
}

function executeSkill(name, code, options = {}) {
  const skill = createSkill(name, options);
  if (!skill) {
    throw new Error(`Skill '${name}' not found`);
  }
  return skill.execute(code, options);
}

async function executeSkillAsync(name, code, options = {}) {
  const skill = createSkill(name, options);
  if (!skill) {
    throw new Error(`Skill '${name}' not found`);
  }
  if (skill.executeAsync) {
    return await skill.executeAsync(code, options);
  }
  return skill.execute(code, options);
}

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

async function executeSkillsAsync(code, skillNames = [], options = {}) {
  const results = {};
  for (const name of skillNames) {
    try {
      results[name] = await executeSkillAsync(name, code, options);
    } catch (error) {
      results[name] = { error: error.message };
    }
  }
  return results;
}

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
  "dead-code-elimination": {
    name: "Dead Code Elimination Skill",
    description: "Remove unreachable and unused code",
    capabilities: [
      "unreachable-code",
      "unused-variables",
      "unused-functions",
      "dead-branches",
    ],
    priority: 6,
  },
  "constant-folding": {
    name: "Constant Folding Skill",
    description: "Evaluate constant expressions at deobfuscation time",
    capabilities: [
      "arithmetic-evaluation",
      "string-concatenation",
      "boolean-simplification",
      "type-inference",
    ],
    priority: 7,
  },
  "string-array": {
    name: "String Array Skill",
    description: "Deobfuscate string array patterns",
    capabilities: [
      "array-extraction",
      "rotation-decoding",
      "shift-decoding",
      "inline-replacement",
    ],
    priority: 8,
  },
  "proxy-function": {
    name: "Proxy Function Skill",
    description: "Remove proxy and wrapper functions",
    capabilities: [
      "wrapper-removal",
      "call-inline",
      "argument-resolution",
      "return-simplification",
    ],
    priority: 9,
  },
  "ast-simplification": {
    name: "AST Simplification Skill",
    description: "Simplify AST nodes and expressions",
    capabilities: [
      "expression-simplification",
      "condition-reduction",
      "type-coercion",
      "operator-simplification",
    ],
    priority: 10,
  },
};

function getSkillMetadata(name) {
  return skillMetadata[name.toLowerCase()] || null;
}

function getAllMetadata() {
  return { ...skillMetadata };
}

module.exports = {
  StringDecryptionSkill,
  AntiDebugSkill,
  ControlFlowSkill,
  MalwareAnalysisSkill,
  RenamingSkill,
  DeadCodeEliminationSkill,
  ConstantFoldingSkill,
  StringArraySkill,
  ProxyFunctionSkill,
  AstSimplificationSkill,
  skillsRegistry,
  getSkill,
  getSkillNames,
  createSkill,
  executeSkill,
  executeSkillAsync,
  executeSkills,
  executeSkillsAsync,
  skillMetadata,
  getSkillMetadata,
  getAllMetadata,
  VERSION: "3.0.0",
};
