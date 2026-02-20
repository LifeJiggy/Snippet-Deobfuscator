# Orchestrator Agent

Production-grade main orchestrator agent that coordinates all other agents for comprehensive JavaScript deobfuscation. Manages the entire deobfuscation pipeline from framework detection to final validation, orchestrating string decryption, control flow analysis, variable renaming, beautification, and validation in optimal order.

## Quick Start

```javascript
const { Orchestrator } = require('./agents/orchestrator');

// Basic orchestration
const orchestrator = new Orchestrator();
const result = orchestrator.orchestrate(`
  var _0x1a2b=_0x3c4d['0x0'];function _0x5e6f(){return _0x1a2b;}
`);

console.log(result.deobfuscatedCode);
console.log(result.success);
```

## Installation

```bash
npm install @snippet-deobfuscator/orchestrator
```

Or include directly:

```javascript
const { Orchestrator, orchestrate } = require('./agents/orchestrator');
```

## Features

### Agent Coordination
- **Framework Detection**: Identifies the framework (React, Vue, Angular, etc.)
- **Pattern Recognition**: Detects obfuscation patterns
- **String Decryption**: Decrypts encoded strings
- **Control Flow Analysis**: Analyzes and reconstructs control flow
- **Variable Renaming**: Renames obfuscated variables to meaningful names
- **Beautification**: Formats and beautifies the code
- **Validation**: Validates the deobfuscated code

### Workflow Management
- Parallel processing of independent agents
- Sequential execution when dependencies exist
- Custom workflow definition
- Configurable agent order

### Error Handling
- Automatic retry on agent failures
- Fallback strategies
- Graceful degradation
- Detailed error reporting

### Progress Tracking
- Real-time progress events
- Per-agent timing statistics
- Overall orchestration metrics

## API Reference

### Constructor

```javascript
const orchestrator = new Orchestrator(options);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetries` | number | 2 | Maximum retry attempts for failed agents |
| `timeout` | number | 120000 | Overall timeout in milliseconds |
| `parallel` | boolean | true | Enable parallel agent execution |
| `validateEachStep` | boolean | true | Validate after each step |
| `continueOnError` | boolean | true | Continue on agent failure |
| `verboseLogging` | boolean | false | Enable debug logging |
| `enableCache` | boolean | true | Enable result caching |
| `maxParallelAgents` | number | 3 | Maximum parallel agents |
| `enableProgressTracking` | boolean | true | Enable progress tracking |
| `aggregateResults` | boolean | true | Aggregate results from all agents |
| `generateReport` | boolean | true | Generate comprehensive report |
| `strictMode` | boolean | false | Enable strict validation mode |

### Methods

#### orchestrate(code, context)

Synchronous orchestration of deobfuscation.

```javascript
const result = orchestrator.orchestrate(code, { source: 'bundle.js' });
```

**Returns:** Object containing:
- `deobfuscatedCode`: Final deobfuscated code
- `originalCode`: Original obfuscated code
- `results`: Results from each agent
- `statistics`: Orchestration statistics
- `success`: Overall success status
- `errors`: Any errors encountered
- `warnings`: Warnings during orchestration

#### orchestrateAsync(code, context)

Asynchronous orchestration with timeout support.

```javascript
const result = await orchestrator.orchestrateAsync(code);
```

#### orchestrateWithWorkflow(code, workflow)

Orchestrate with custom workflow.

```javascript
const customWorkflow = [
  'frameworkDetector',
  'patternRecognizer',
  { agent: 'stringDecryptor', options: { aggressive: true } },
  'beautifier'
];
const result = await orchestrator.orchestrateWithWorkflow(code, customWorkflow);
```

#### orchestrateWithProgress(code)

Orchestrate with streaming progress updates.

```javascript
const result = await orchestrator.orchestrateWithProgress(code);
```

#### registerAgent(name, agent)

Register a custom agent.

```javascript
orchestrator.registerAgent('customAgent', new CustomAgent());
```

#### getAvailableAgents()

Get list of available agents.

```javascript
const agents = orchestrator.getAvailableAgents();
```

#### on(event, callback)

Subscribe to orchestration events.

```javascript
orchestrator.on('orchestrationStart', ({ codeLength, context }) => {
  console.log('Starting deobfuscation of', codeLength, 'bytes');
});

orchestrator.on('agent:start', ({ agent, codeLength }) => {
  console.log(`Starting agent: ${agent}`);
});

orchestrator.on('agent:complete', ({ agent, success, duration }) => {
  console.log(`Completed ${agent} in ${duration}ms`);
});

orchestrator.on('progress', ({ phase, progress }) => {
  console.log(`${phase}: ${(progress * 100).toFixed(0)}%`);
});

orchestrator.on('orchestrationComplete', ({ orchestrationTime, success }) => {
  console.log(`Completed in ${orchestrationTime}ms`);
});
```

**Events:**
- `orchestrationStart` - Orchestration started
- `agent:start` - Agent started
- `agent:complete` - Agent completed
- `agent:error` - Agent error
- `progress` - Progress update
- `orchestrationComplete` - Orchestration completed
- `orchestrationError` - Orchestration failed
- `cacheHit` - Result served from cache

### Utility Functions

#### orchestrate(code, options)

Convenience function for one-time orchestration.

```javascript
const { orchestrate } = require('./agents/orchestrator');
const result = orchestrate(code, { parallel: true });
```

#### orchestrateAsync(code, options)

Async convenience function.

```javascript
const { orchestrateAsync } = require('./agents/orchestrator');
const result = await orchestrateAsync(code);
```

#### orchestrateWithWorkflow(code, workflow, options)

Custom workflow orchestration.

```javascript
const { orchestrateWithWorkflow } = require('./agents/orchestrator');
const result = await orchestrateWithWorkflow(code, customWorkflow);
```

#### getSupportedWorkflows()

Get list of supported workflows.

```javascript
const { getSupportedWorkflows } = require('./agents/orchestrator');
console.log(getSupportedWorkflows());
```

#### getConfigSchema()

Get JSON schema for configuration.

```javascript
const { getConfigSchema } = require('./agents/orchestrator');
// Returns JSON Schema for validation
```

## Examples

### Basic Deobfuscation

```javascript
const { Orchestrator } = require('./agents/orchestrator');

const orchestrator = new Orchestrator();
const obfuscatedCode = `
  var _0x1a2b=_0x3c4d['0x0'];function _0x5e6f(){return _0x1a2b;}
  console.log(_0x5e6f());
`;

const result = orchestrator.orchestrate(obfuscatedCode);
console.log('Success:', result.success);
console.log('Deobfuscated:', result.deobfuscatedCode);
```

### Full Options

```javascript
const orchestrator = new Orchestrator({
  maxRetries: 3,
  timeout: 180000,
  parallel: true,
  validateEachStep: true,
  continueOnError: true,
  verboseLogging: true,
  enableCache: true,
  maxParallelAgents: 4
});

const result = await orchestrator.orchestrateAsync(code);
console.log(result.statistics);
```

### Custom Workflow

```javascript
const orchestrator = new Orchestrator();

const result = await orchestrator.orchestrateWithWorkflow(code, [
  'frameworkDetector',
  'patternRecognizer',
  { 
    agent: 'stringDecryptor', 
    options: { 
      aggressive: true,
      maxDepth: 10
    } 
  },
  'beautifier'
]);
```

### Event Handling

```javascript
const orchestrator = new Orchestrator({ verboseLogging: true });

orchestrator.on('orchestrationStart', ({ codeLength }) => {
  console.log(`Processing ${codeLength} bytes...`);
});

orchestrator.on('agent:start', ({ agent }) => {
  console.log(`→ Starting ${agent}`);
});

orchestrator.on('agent:complete', ({ agent, success, duration }) => {
  console.log(`✓ Completed ${agent} (${success ? 'success' : 'failed'}) in ${duration}ms`);
});

orchestrator.on('progress', ({ phase, progress }) => {
  process.stdout.write(`\r${phase}: ${(progress * 100).toFixed(0)}%`);
});

const result = await orchestrator.orchestrateAsync(code);
console.log('\nDone!');
```

### Using with Express

```javascript
const express = require('express');
const { Orchestrator } = require('./agents/orchestrator');

const app = express();
const orchestrator = new Orchestrator();

app.post('/deobfuscate', (req, res) => {
  const { code } = req.body;
  
  orchestrator.orchestrateAsync(code)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});
```

### Batch Processing

```javascript
const { orchestrateBatch } = require('./agents/orchestrator');

const codes = [
  'var a=_0x1234;',
  'function _0xabcd(){return 1;}',
  'console.log(_0xdead);'
];

const results = await orchestrateBatch(codes, {
  parallel: true,
  onProgress: ({ completed, total }) => {
    console.log(`Progress: ${completed}/${total}`);
  }
});

const successCount = results.filter(r => r.success).length;
console.log(`Success: ${successCount}/${results.length}`);
```

## Default Workflow

The orchestrator executes agents in this default order:

1. **Framework Detection** (parallel) - Identify the framework
2. **Pattern Recognition** (parallel) - Detect obfuscation patterns
3. **String Decryption** - Decode encrypted strings
4. **Control Flow Analysis** - Analyze control flow structures
5. **Variable Renaming** - Rename obfuscated variables
6. **Beautification** - Format and beautify code
7. **Validation** - Validate the final result

## Output Structure

```javascript
{
  agent: "orchestrator",
  version: "3.0.0",
  timestamp: "2024-01-15T10:30:00.000Z",
  success: true,
  
  originalCode: "var _0x1a2b='hello';",
  deobfuscatedCode: "var message = 'hello';",
  
  results: {
    framework: { ... },
    patterns: { ... },
    stringDecryptor: { ... },
    controlFlow: { ... },
    renamer: { ... },
    beautifier: { ... },
    validator: { ... }
  },
  
  statistics: {
    totalTime: 1500,
    agentsRun: 7,
    agentTimings: {
      frameworkDetection: 45,
      patternRecognition: 120,
      stringDecryption: 300,
      controlFlowAnalysis: 250,
      variableRenaming: 400,
      beautification: 280,
      validation: 105
    }
  },
  
  warnings: [],
  errors: [],
  
  analysisTime: 1500
}
```

## Configuration Examples

### Minimal Configuration

```javascript
const orchestrator = new Orchestrator();
// Uses all defaults
```

### Performance-Optimized

```javascript
const orchestrator = new Orchestrator({
  parallel: true,
  maxParallelAgents: 4,
  enableCache: true,
  timeout: 180000
});
```

### Strict Mode

```javascript
const orchestrator = new Orchestrator({
  strictMode: true,
  validateEachStep: true,
  continueOnError: false,
  maxRetries: 1
});
```

### Quick Analysis

```javascript
const orchestrator = new Orchestrator({
  parallel: false,
  enableCache: true,
  generateReport: false
});
```

## Troubleshooting

### Orchestration Timeout

If orchestration times out on large codebases:

```javascript
const orchestrator = new Orchestrator({
  timeout: 300000, // Increase to 5 minutes
  maxParallelAgents: 2 // Reduce parallel agents
});
```

### Memory Issues

For very large files:

```javascript
const orchestrator = new Orchestrator({
  enableCache: false,
  parallel: false,
  generateReport: false
});
```

### Catching Errors

```javascript
try {
  const result = await orchestrator.orchestrateAsync(code);
  if (!result.success) {
    console.warn('Orchestration failed:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
} catch (error) {
  console.error('Fatal error:', error);
}
```

### Custom Agent Issues

If a custom agent fails:

```javascript
orchestrator.on('agent:error', ({ agent, error }) => {
  console.error(`Agent ${agent} failed:`, error.message);
});
```

## Related Documentation

- [Detailed Agent Documentation](agent.md) - Comprehensive technical guide
- [Main Agents Documentation](../../agents.md) - All agents overview
- [Skills System](../../skills.md) - Specialized skills
- [Tools System](../../tools.md) - Utility tools
- [Main README](../../README.md) - Project overview
- [Contributing](../../CONTRIBUTING.md) - Contribution guidelines

## Version

3.0.0

## License

MIT
