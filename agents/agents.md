# Agent System

Production-grade multi-agent system for comprehensive JavaScript deobfuscation.

## Overview

The Agent System is a sophisticated framework of specialized AI agents that work together to analyze, deconstruct, and deobfuscate JavaScript code. Each agent specializes in a specific aspect of deobfuscation, and the orchestrator coordinates their efforts for optimal results.

## Architecture

```
agents/
├── index.js                      # Agent registry and loader
├── string-decryptor/            # String decryption agent
│   ├── index.js                # ~200 lines
│   ├── README.md
│   └── agent.json
├── control-flow-analyzer/       # Control flow analysis
│   ├── index.js                # ~250 lines
│   ├── README.md
│   └── agent.json
├── framework-detector/          # Framework detection
│   ├── index.js                # ~200 lines
│   ├── README.md
│   └── agent.json
├── pattern-recognizer/         # Pattern recognition (50+ patterns)
│   ├── index.js                # ~800 lines
│   ├── README.md
│   └── agent.json
├── renamer/                    # Variable/function renaming
│   ├── index.js                # ~700 lines
│   ├── README.md
│   └── agent.json
├── beautifier/                 # Code beautification
│   ├── index.js                # ~500 lines
│   ├── README.md
│   └── agent.json
├── validator/                   # Code validation
│   ├── index.js                # ~600 lines
│   ├── README.md
│   └── agent.json
└── orchestrator/               # Main orchestrator
    ├── index.js                # ~400 lines
    ├── README.md
    └── agent.json
```

## Available Agents

### 1. String Decryptor Agent

**Purpose:** Decrypts obfuscated strings using various encoding schemes

**Capabilities:**

- Base64 decoding
- Hexadecimal decoding
- ROT13/ROT47 decoding
- XOR decoding with common keys
- Unicode escape sequence handling
- Custom cipher detection
- Eval-based obfuscation analysis

**Class:** `StringDecryptorAgent`
**Priority:** 1
**Timeout:** 30s

### 2. Control Flow Analyzer Agent

**Purpose:** Analyzes and reconstructs control flow structures

**Capabilities:**

- Branch analysis (if/else)
- Loop analysis (for, while, do-while)
- Switch statement reconstruction
- Control flow flattening detection
- Opaque predicate identification
- Dead code detection
- Cyclomatic complexity calculation

**Class:** `ControlFlowAnalyzerAgent`
**Priority:** 2
**Timeout:** 45s

### 3. Framework Detector Agent

**Purpose:** Identifies JavaScript frameworks and libraries

**Capabilities:**

- React detection (including Hooks)
- Vue.js detection (2 & 3)
- Angular detection (with RxJS)
- Svelte detection
- Node.js backend detection (Express, Koa)
- Webpack bundle detection
- Version extraction

**Class:** `FrameworkDetectorAgent`
**Priority:** 3
**Timeout:** 15s

### 4. Pattern Recognizer Agent

**Purpose:** Recognizes 50+ obfuscation patterns

**Capabilities:**

- Array access obfuscation
- Arithmetic obfuscation
- String split/join patterns
- IIFE detection
- Function constructor usage
- Prototype pollution detection
- Anti-debugging techniques
- Security vulnerability scanning

**Class:** `PatternRecognizerAgent`
**Priority:** 4
**Timeout:** 45s

### 5. Renamer Agent

**Purpose:** Intelligent variable and function renaming

**Capabilities:**

- Single-letter variable mapping
- Two-letter combination mapping
- Framework-specific naming (React, Vue, Angular)
- Semantic name inference
- Scope analysis
- Context-aware suggestions
- 200+ name mappings

**Class:** `RenamerAgent`
**Priority:** 5
**Timeout:** 40s

### 6. Beautifier Agent

**Purpose:** Code formatting and beautification

**Capabilities:**

- Prettier integration
- Syntax correction
- Indentation normalization
- Quote style normalization
- Semicolon handling
- Custom formatting rules
- Line width enforcement

**Class:** `BeautifierAgent`
**Priority:** 6
**Timeout:** 60s

### 7. Validator Agent

**Purpose:** Validates deobfuscated code correctness

**Capabilities:**

- Syntax validation
- Semantic analysis
- Security scanning
- Code quality checks
- Test suggestion generation
- Error detection
- Undefined variable detection

**Class:** `ValidatorAgent`
**Priority:** 7
**Timeout:** 45s

### 8. Orchestrator Agent

**Purpose:** Coordinates all agents for comprehensive deobfuscation

**Capabilities:**

- Workflow management
- Agent coordination
- Result aggregation
- Error handling with fallbacks
- Progress tracking
- Report generation
- Event emission

**Class:** `OrchestratorAgent`
**Priority:** 8
**Timeout:** 120s

## Usage

### Basic Usage

```javascript
const { OrchestratorAgent } = require("./agents");

const orchestrator = new OrchestratorAgent();
const result = await orchestrator.analyze(obfuscatedCode);

console.log(result.deobfuscatedCode);
console.log(result.results);
```

### Custom Pipeline

```javascript
const { runAgentsParallel, getAgent } = require("./agents");

// Run specific agents in parallel
const result = await runAgentsParallel(code, [
  "string-decryptor",
  "pattern-recognizer",
  "framework-detector",
]);
```

### Individual Agent Usage

```javascript
const { getAgent } = require("./agents");

const validator = getAgent("validator");
const result = validator.analyze(code);

console.log(result.valid);
console.log(result.errors);
```

## Workflow

The orchestrator executes agents in this order:

1. **Initial Analysis** (parallel)

   - Framework Detector
   - Pattern Recognizer

2. **String Decryption**

   - String Decryptor

3. **Control Flow Analysis**

   - Control Flow Analyzer

4. **Variable Renaming**

   - Renamer

5. **Beautification**

   - Beautifier

6. **Validation**
   - Validator

## Events

The orchestrator emits events for progress tracking:

```javascript
orchestrator.on("start", ({ codeLength, context }) => {
  console.log("Started deobfuscation");
});

orchestrator.on("step:start", ({ step, progress }) => {
  console.log(`Processing: ${step} (${progress.toFixed(1)}%)`);
});

orchestrator.on("step:complete", ({ step, success }) => {
  console.log(`Completed: ${step} - ${success ? "OK" : "FAILED"}`);
});

orchestrator.on("complete", (result) => {
  console.log("Deobfuscation complete");
});
```

## Configuration

```javascript
orchestrator.configure({
  maxRetries: 3,
  timeout: 120000,
  parallel: true,
  validateEachStep: true,
  continueOnError: true,
});
```

## Statistics

Each agent tracks statistics:

```javascript
const stats = agent.getStatistics();
console.log(stats);
```

## Agent Metadata

```javascript
const { agentMetadata, getAgentMetadata } = require("./agents");

console.log(agentMetadata);
// Or get specific agent info
console.log(getAgentMetadata("pattern-recognizer"));
```

## Performance

The agent system is optimized for performance:

- Parallel agent execution where possible
- Result caching between steps
- Timeout protection
- Error recovery with retries
- Lazy loading

## Integration

Integrates with:

- [Skills System](../skills.md) - Specialized skills
- [CLI](../cli.js) - Command-line interface
- [TUI](../tui.js) - Terminal interface

## Extending

Create custom agents by implementing the agent interface:

```javascript
class CustomAgent {
  constructor() {
    this.name = "custom";
    this.version = "3.0.0";
  }

  analyze(code, context = {}) {
    // Implementation
    return { agent: this.name, results: [] };
  }

  getStatistics() {
    return {};
  }

  dispose() {
    // Cleanup
  }
}
```

## Related Documentation

- [Skills System](../skills.md) - Specialized deobfuscation skills
- [Main README](../README.md) - Project overview
- [CLI Guide](../cli.js) - Command-line usage
- [TUI Guide](../tui.js) - Terminal interface
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines
