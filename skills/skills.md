# Skills System

Production-grade specialized skills for advanced JavaScript deobfuscation tasks.

## Overview

The Skills System provides modular, specialized capabilities for handling complex deobfuscation scenarios. Each skill focuses on a specific domain and can be used independently or combined through the agent system.

## Architecture

```
skills/
├── index.js              # Skills registry and loader
├── string-decryption/    # Advanced string decoding
│   ├── index.js
│   ├── README.md
│   └── agent.json
├── control-flow/         # Control flow reconstruction
├── renaming/            # Semantic renaming
├── anti-debug/          # Anti-debug detection
└── malware-analysis/    # Security analysis
```

## Available Skills

### String Decryption Skill

Advanced string decryption with multiple encoding schemes including:

- Base64, Hex, ROT13, ROT47
- XOR, AES, RC4 (cipher-based)
- Unicode, URL encoding, HTML entities
- Multi-layer decryption support
- Confidence scoring for decoded strings

**Usage:**

```javascript
const { StringDecryptionSkill } = require("./skills");

const skill = new StringDecryptionSkill();
const result = skill.execute(obfuscatedCode, { multiLayer: true });
console.log(result.decoded);
```

### Control Flow Skill

Control flow analysis and reconstruction:

- Branch analysis (if/else/ternary)
- Loop detection and analysis
- Switch statement reconstruction
- Dead code elimination
- Opaque predicate detection
- Control flow graph generation

### Renaming Skill

Semantic-aware variable and function renaming:

- Context-aware name suggestions
- Framework-specific naming (React, Vue, Angular)
- Scope analysis
- Conflict resolution
- 200+ name mappings

### Anti-Debug Skill

Detection of anti-debugging techniques:

- Debugger statement detection
- Timing attack prevention
- Breakpoint detection
- Console monitoring detection
- Performance measurement tampering

### Malware Analysis Skill

Security-focused analysis:

- Code injection detection
- Network exfiltration patterns
- Cryptographic operation analysis
- Suspicious API usage
- Behavior pattern matching
- Risk scoring

## Integration

Skills are integrated with the [Agent System](../agents/README.md) through the orchestrator:

```javascript
const { OrchestratorAgent } = require("./agents");

const orchestrator = new OrchestratorAgent();
const result = await orchestrator.analyze(code);
```

## Configuration

Skills can be configured through options:

```javascript
const result = skill.execute(code, {
  multiLayer: true, // Enable multi-layer decryption
  maxDepth: 5, // Maximum decryption depth
  confidenceThreshold: 0.7, // Minimum confidence for results
});
```

## Statistics

Each skill tracks statistics:

- Number of attempts
- Success/failure counts
- Processing time
- Cache hit rates

```javascript
const stats = skill.getStatistics();
console.log(`Success rate: ${(stats.successes / stats.attempts) * 100}%`);
```

## Performance

Skills are designed for performance:

- Lazy loading on demand
- Result caching
- Parallel execution support
- Configurable timeouts

## Extending Skills

Create custom skills by implementing the base skill interface:

```javascript
class CustomSkill {
  constructor() {
    this.name = "custom-skill";
    this.version = "3.0.0";
  }

  execute(code, options = {}) {
    // Implementation
    return { skill: this.name, results: [] };
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

- [Agent System](../agents/README.md) - Multi-agent orchestration
- [Main README](../README.md) - Project overview
- [CLI Guide](../cli.js) - Command-line usage
- [TUI Guide](../tui.js) - Terminal interface
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines
