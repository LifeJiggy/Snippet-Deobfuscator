# Tools System

Production-grade utilities and tools for the JavaScript deobfuscation system.

## Overview

The Tools System provides essential utilities, configuration management, and helper functions that support the agent and skills systems. These tools enable modularity, configurability, and extensibility throughout the project.

## Architecture

```
tools/
├── index.js           # Tools registry and loader
├── config.js          # Configuration management
├── logger.js          # Logging utilities
├── cache.js           # Caching system
├── parser.js          # Code parsing utilities
├── ast.js             # AST helper functions
├── metrics.js        # Performance metrics
└── validators.js     # Input validation
```

## Available Tools

### Configuration Manager

Centralized configuration management with environment support:

**Features:**

- Environment variable support
- Default configurations
- Override capability
- Schema validation
- File-based config loading

**Usage:**

```javascript
const { ConfigManager } = require("./tools");

const config = new ConfigManager();
config.load({
  maxRetries: 3,
  timeout: 120000,
  verbose: true,
});

const value = config.get("maxRetries");
```

### Logger

Structured logging with multiple output formats:

**Features:**

- Multiple log levels (debug, info, warn, error)
- Colored console output
- File logging
- JSON output support
- Custom formatters

**Usage:**

```javascript
const { Logger } = require("./tools");

const logger = new Logger({ level: "debug" });
logger.debug("Starting process");
logger.info("Processing complete");
logger.warn("Potential issue");
logger.error("Operation failed");
```

### Cache

In-memory caching system with TTL support:

**Features:**

- Time-to-live expiration
- LRU eviction
- Size limits
- Statistics tracking

**Usage:**

```javascript
const { Cache } = require("./tools");

const cache = new Cache({ ttl: 60000, maxSize: 100 });
cache.set("key", value);
const cached = cache.get("key");
console.log(cache.getStats());
```

### Parser Utilities

Code parsing helpers:

**Features:**

- Safe code parsing
- Error recovery
- Multiple parser options
- AST generation

**Usage:**

```javascript
const { parseCode, parseSafe } = require("./tools");

const ast = parseCode(code, { plugins: ["jsx"] });
const safe = parseSafe(code);
```

### AST Helpers

AST manipulation utilities:

**Features:**

- Node traversal
- Node transformation
- Node creation
- Tree manipulation

**Usage:**

```javascript
const { traverse, transform, createNode } = require("./tools");

traverse(ast, {
  Identifier(path) {
    console.log(path.node.name);
  },
});
```

### Metrics

Performance and usage metrics:

**Features:**

- Timing measurements
- Counter tracking
- Histogram support
- Export capabilities

**Usage:**

```javascript
const { Metrics } = require("./tools");

const metrics = new Metrics();
metrics.startTimer("operation");
// ... do work
const duration = metrics.endTimer("operation");

metrics.increment("requests");
metrics.gauge("memory", process.memoryUsage().heapUsed);
```

### Validators

Input validation utilities:

**Features:**

- Code validation
- String validation
- Configuration validation
- Schema validation

**Usage:**

```javascript
const { validateCode, validateConfig, isSafeCode } = require("./tools");

const valid = validateCode(code);
const safe = await isSafeCode(code);
```

## Tool Configuration

Tools can be configured globally:

```javascript
const { configureTools } = require("./tools");

configureTools({
  logger: { level: "info", output: "file" },
  cache: { ttl: 300000, maxSize: 500 },
  metrics: { enabled: true },
});
```

## Performance

Tools are designed for efficiency:

- Lazy initialization
- Minimal memory footprint
- Efficient algorithms
- Cleanup on disposal

## Extending

Create custom tools:

```javascript
class CustomTool {
  constructor(options = {}) {
    this.options = options;
  }

  execute(input) {
    // Implementation
    return output;
  }

  dispose() {
    // Cleanup
  }
}
```

## Integration

Tools are used throughout the system:

- **Agents**: Use logger, cache, metrics
- **Skills**: Use parser, AST helpers
- **Orchestrator**: Use config, logger
- **CLI/TUI**: Use logger, metrics

## Best Practices

1. **Dispose Resources**: Always call dispose() when done
2. **Configure Early**: Set up tools before use
3. **Use Caching**: Cache expensive operations
4. **Log Appropriately**: Use appropriate log levels
5. **Track Metrics**: Monitor performance

## Related Documentation

- [Agent System](../agents.md) - Multi-agent orchestration
- [Skills System](../skills.md) - Specialized deobfuscation skills
- [Main README](../README.md) - Project overview
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines
