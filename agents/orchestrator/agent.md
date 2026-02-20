# Orchestrator Agent

## Overview

**Class:** `OrchestratorAgent`  
**Priority:** 8  
**Timeout:** 120s  
**Version:** 1.0.0

The Orchestrator Agent is the main coordinator that orchestrates all specialized agents for comprehensive JavaScript deobfuscation.

## Capabilities

- **Agent Coordination**: Manages lifecycle of all 7 specialized agents
- **Workflow Management**: Executes agents in optimal order
- **Parallel Processing**: Runs independent agents concurrently
- **Error Handling**: Provides fallback strategies and error recovery
- **Progress Tracking**: Emits events for monitoring progress
- **Result Aggregation**: Combines results from all agents
- **Caching**: Optional result caching between steps

## Options

| Option            | Type    | Default | Description                              |
| ----------------- | ------- | ------- | ---------------------------------------- |
| maxRetries        | number  | 2       | Maximum retry attempts for failed agents |
| timeout           | number  | 120000  | Overall timeout in milliseconds          |
| parallel          | boolean | true    | Enable parallel agent execution          |
| validateEachStep  | boolean | true    | Validate after each step                 |
| continueOnError   | boolean | true    | Continue on agent failure                |
| verboseLogging    | boolean | false   | Enable verbose logging                   |
| enableCache       | boolean | true    | Enable result caching                    |
| maxParallelAgents | number  | 3       | Maximum parallel agents                  |

## Usage

```javascript
const { OrchestratorAgent } = require("./agents/orchestrator");

const orchestrator = new OrchestratorAgent({ verboseLogging: true });
const result = orchestrator.analyze(obfuscatedCode);

console.log(result.deobfuscatedCode);
console.log(result.statistics);
```

## Events

```javascript
orchestrator.on("start", ({ codeLength, context }) => {
  console.log("Started deobfuscation");
});

orchestrator.on("agent:start", ({ agent, codeLength }) => {
  console.log(`Starting agent: ${agent}`);
});

orchestrator.on("agent:complete", ({ agent, success }) => {
  console.log(`Completed agent: ${agent}`);
});

orchestrator.on("complete", (result) => {
  console.log("Deobfuscation complete");
});
```

## Workflow

1. **Initial Analysis** (parallel): Framework Detector, Pattern Recognizer
2. **String Decryption**: String Decryptor
3. **Control Flow Analysis**: Control Flow Analyzer
4. **Variable Renaming**: Renamer
5. **Beautification**: Beautifier
6. **Validation**: Validator

## Output

```json
{
  "agent": "orchestrator",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "originalCode": "...",
  "deobfuscatedCode": "...",
  "results": {
    "framework": { ... },
    "patterns": { ... },
    "stringDecryptor": { ... },
    "controlFlow": { ... },
    "renamer": { ... },
    "beautifier": { ... },
    "validator": { ... }
  },
  "statistics": { ... },
  "errors": [],
  "warnings": [],
  "analysisTime": 1500,
  "success": true
}
```

## Dependencies

- `string-decryptor`: String decryption agent
- `control-flow-analyzer`: Control flow analysis agent
- `framework-detector`: Framework detection agent
- `pattern-recognizer`: Pattern recognition agent
- `renamer`: Variable renaming agent
- `beautifier`: Code beautification agent
- `validator`: Code validation agent

## Related Documentation

- [Main README](../README.md) - Project overview
- [Control Flow Analyzer Agent](../control-flow-analyzer/README.md) - Control flow analysis
- [Beautifier Agent](../beautifier/README.md) - Code beautification
