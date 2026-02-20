# Control Flow Analyzer Agent

Production-grade specialized agent for analyzing and reconstructing control flow structures in JavaScript code. Supports branch analysis, loop detection, switch reconstruction, complexity calculation, obfuscation pattern detection, web framework analysis, security vulnerability scanning, and performance issue identification.

## Quick Start

```javascript
const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');

// Basic analysis
const agent = new ControlFlowAnalyzer();
const result = agent.analyze(`
  function calculate(x, y) {
    if (x > y) {
      return x - y;
    } else if (x === y) {
      return 0;
    } else {
      return y - x;
    }
  }
`);

console.log('Branches:', result.branches.length);
console.log('Complexity:', result.complexity);
```

## Installation

```bash
npm install @snippet-deobfuscator/control-flow-analyzer
```

Or include directly:

```javascript
const { ControlFlowAnalyzer, analyze } = require('./agents/control-flow-analyzer');
```

## Features

### Core Analysis
- **Branch Analysis**: if/else statements, ternary expressions, logical operators
- **Loop Analysis**: for, while, do-while, for-in, for-of loops with nesting detection
- **Switch Analysis**: Switch statements, state machine identification, fall-through detection
- **Function Analysis**: Function declarations, expressions, arrow functions, methods

### Complexity Metrics
- Cyclomatic complexity (McCabe method)
- Cognitive complexity assessment
- Nesting depth analysis
- Maintainability index calculation
- Lines of code counting

### Obfuscation Detection
- Control flow flattening identification
- Opaque predicates (always-true/false conditions)
- Dead code and unreachable code detection
- Bogus control flow patterns
- Indirect jump detection

### Framework Support
- **React**: Hooks detection, state management, lifecycle
- **Vue**: Reactive system, computed properties, watchers
- **Angular**: Decorators, change detection, RxJS
- **Svelte**: Reactive statements, transitions, stores
- **Node.js**: Express routes, middleware, event emitters
- **Next.js**: SSR/SSG data fetching, API routes

### Security Analysis
- Code injection vulnerability detection
- Path traversal detection
- XSS vulnerability scanning
- Hardcoded secrets detection
- Command injection detection

### Performance Analysis
- Large loop detection
- Infinite loop identification
- Large function detection
- Parameter count analysis

## API Reference

### Constructor

```javascript
const agent = new ControlFlowAnalyzer(options);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxNestingDepth` | number | 10 | Maximum nesting depth to analyze |
| `maxSwitchCases` | number | 100 | Maximum switch cases to process |
| `detectInfiniteLoops` | boolean | true | Detect potential infinite loops |
| `detectRecursion` | boolean | true | Detect recursive calls |
| `trackComplexity` | boolean | true | Calculate complexity metrics |
| `generateCallGraph` | boolean | false | Generate function call graph |
| `analyzeDataFlow` | boolean | false | Perform data flow analysis |
| `webFrameworkSupport` | boolean | true | Detect web frameworks |
| `securityAnalysis` | boolean | false | Perform security scanning |
| `performanceAnalysis` | boolean | false | Analyze performance |
| `verboseLogging` | boolean | false | Enable debug logging |
| `timeout` | number | 45000 | Analysis timeout (ms) |
| `enableCache` | boolean | true | Enable result caching |

### Methods

#### analyze(code, context)

Synchronous analysis of JavaScript code.

```javascript
const result = agent.analyze(code, { source: 'user-input' });
```

**Returns:** Object containing:
- `branches`: Array of detected branches
- `loops`: Array of detected loops
- `switches`: Array of switch statements
- `functions`: Array of function declarations
- `complexity`: Complexity metrics object
- `flattening`: Obfuscation patterns found
- `opaquePredicates`: Opaque predicate detection
- `deadCode`: Unreachable code
- `webFramework`: Detected framework info
- `securityIssues`: Security vulnerabilities
- `performanceIssues`: Performance problems

#### analyzeAsync(code, context)

Asynchronous analysis with timeout support.

```javascript
const result = await agent.analyzeAsync(code);
```

#### analyzeBatch(codes, options)

Batch analysis of multiple code snippets.

```javascript
const results = await agent.analyzeBatch([
  code1,
  code2,
  code3
], {
  batchSize: 5,
  onProgress: ({ completed, total }) => console.log(`${completed}/${total}`)
});
```

#### analyzeFile(filePath, options)

Analyze code from a file.

```javascript
const result = await agent.analyzeFile('./src/app.js');
```

#### on(event, callback)

Subscribe to analysis events.

```javascript
agent.on('progress', (data) => {
  console.log(`Phase: ${data.phase}, Progress: ${data.progress * 100}%`);
});

agent.on('analysisComplete', (data) => {
  console.log(`Completed in ${data.analysisTime}ms`);
});

agent.on('error', (error) => {
  console.error('Analysis error:', error);
});
```

**Events:**
- `analysisStart` - Analysis started
- `progress` - Progress update during analysis
- `analysisComplete` - Analysis completed successfully
- `analysisError` - Analysis failed
- `cacheHit` - Result served from cache

### Utility Functions

#### analyze(code, options)

Convenience function for one-time analysis.

```javascript
const { analyze } = require('./agents/control-flow-analyzer');
const result = analyze(code, { trackComplexity: true });
```

#### analyzeAsync(code, options)

Async convenience function.

```javascript
const { analyzeAsync } = require('./agents/control-flow-analyzer');
const result = await analyzeAsync(code);
```

#### getSupportedAnalyses()

Get list of supported analysis types.

```javascript
const { getSupportedAnalyses } = require('./agents/control-flow-analyzer');
console.log(getSupportedAnalyses());
```

#### getConfigSchema()

Get JSON schema for configuration.

```javascript
const { getConfigSchema } = require('./agents/control-flow-analyzer');
// Returns JSON Schema for validation
```

## Examples

### Basic Control Flow Analysis

```javascript
const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');

const agent = new ControlFlowAnalyzer();
const code = `
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
`;

const result = agent.analyze(code);
console.log(result.branches);
console.log(result.loops);
console.log(result.complexity);
```

### Detect Control Flow Obfuscation

```javascript
const agent = new ControlFlowAnalyzer({
  detectFlattening: true,
  detectOpaquePredicates: true,
  detectDeadCode: true
});

const result = agent.analyze(obfuscatedCode);

if (result.flattening.length > 0) {
  console.warn('Control flow flattening detected!');
  result.flattening.forEach(f => {
    console.log(`  - ${f.states} states at line ${f.location?.start?.line}`);
  });
}

if (result.opaquePredicates.length > 0) {
  console.warn('Opaque predicates found:', result.opaquePredicates.length);
}

console.log('Cyclomatic complexity:', result.complexity.cyclomatic);
```

### Full Analysis with Framework Detection

```javascript
const agent = new ControlFlowAnalyzer({
  maxNestingDepth: 15,
  detectInfiniteLoops: true,
  trackComplexity: true,
  generateCallGraph: true,
  analyzeDataFlow: true,
  webFrameworkSupport: true,
  securityAnalysis: true,
  performanceAnalysis: true,
  verboseLogging: true
});

result = agent.analyze(code, { verbose: true });

console.log('Branches:', result.branches.length);
console.log('Loops:', result.loops.length);
console.log('Switches:', result.switches.length);
console.log('Complexity:', result.complexity);
console.log('Framework:', result.webFramework);
console.log('Security Issues:', result.securityIssues);
console.log('Performance:', result.performanceIssues);
```

### React Component Analysis

```javascript
const agent = new ControlFlowAnalyzer({
  webFrameworkSupport: true,
  securityAnalysis: true
});

const reactCode = `
  function MyComponent() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      document.title = \`Count: \${count}\`;
    }, [count]);
    
    return (
      <button onClick={() => setCount(c => c + 1)}>
        Click me
      </button>
    );
  }
`;

const result = agent.analyze(reactCode);

if (result.webFramework?.react) {
  console.log('React hooks detected:', result.webFramework.react.hooks);
  console.log('State management:', result.webFramework.react.stateManagement);
  console.log('Effect dependencies:', result.webFramework.react.effectDependencies);
}
```

### Security Analysis

```javascript
const agent = new ControlFlowAnalyzer({
  securityAnalysis: true
});

const result = agent.analyze(userCode);

if (result.securityIssues.length > 0) {
  console.warn('Security issues found:');
  result.securityIssues.forEach(issue => {
    console.log(\`  [\${issue.severity.toUpperCase()}] \${issue.type}\`);
    console.log(\`    \${issue.description}\`);
    console.log(\`    Found \${issue.count} occurrences\`);
  });
}
```

### Batch Processing

```javascript
const { analyzeBatch } = require('./agents/control-flow-analyzer');

const files = [
  './src/utils.js',
  './src/helpers.js',
  './src/components/*.js'
];

const results = await analyzeBatch(files, {
  batchSize: 10,
  onProgress: ({ completed, total, percentage }) => {
    console.log(\`Progress: \${percentage.toFixed(1)}% (\${completed}/\${total})\`);
  }
});

// Aggregate results
const totalComplexity = results.reduce((sum, r) => sum + r.complexity?.cyclomatic || 0, 0);
console.log('Average complexity:', totalComplexity / results.length);
```

### Progress Tracking

```javascript
const agent = new ControlFlowAnalyzer();

agent.on('progress', (data) => {
  console.log(\`[\${data.phase}] \${(data.progress * 100).toFixed(0)}%\`);
});

agent.on('analysisComplete', (data) => {
  console.log(\`Analysis completed in \${data.analysisTime}ms\`);
});

const result = agent.analyze(largeCodebase);
```

### Using Events with Express

```javascript
const express = require('express');
const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');

const app = express();
const analyzer = new ControlFlowAnalyzer({ securityAnalysis: true });

app.post('/analyze', (req, res) => {
  const { code } = req.body;
  
  analyzer.analyzeAsync(code)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});
```

## Output Structure

```javascript
{
  agent: "control-flow-analyzer",
  version: "3.0.0",
  timestamp: "2024-01-15T10:30:00.000Z",
  
  // Control flow structures
  branches: [
    {
      type: "if",
      condition: "x > y",
      location: { start: { line: 1, column: 4 }, end: { line: 5, column: 5 } },
      hasElse: true,
      hasElseIf: false,
      nestingLevel: 0
    }
  ],
  
  loops: [
    {
      type: "for",
      location: { start: { line: 10, column: 2 }, end: { line: 12, column: 3 } },
      hasInit: true,
      hasTest: true,
      hasUpdate: true,
      nestingLevel: 0,
      isInfinite: false
    }
  ],
  
  switches: [
    {
      type: "switch",
      discriminant: "status",
      cases: 5,
      hasDefault: true,
      hasFallThrough: true,
      complexity: 12
    }
  ],
  
  functions: [
    {
      type: "declaration",
      name: "calculate",
      parameters: 2,
      statementCount: 15,
      isAsync: false
    }
  ],
  
  // Complexity metrics
  complexity: {
    cyclomatic: 5,
    cognitive: 8,
    nestingDepth: 3,
    maintainabilityIndex: 72,
    linesOfCode: 150,
    functionCount: 4,
    cyclomaticRisk: "moderate",
    maintainabilityRisk: "good"
  },
  
  // Obfuscation detection
  flattening: [],
  opaquePredicates: [],
  deadCode: [],
  
  // Framework detection
  webFramework: {
    name: "react",
    score: 15,
    patterns: ["useState", "useEffect", "onClick"]
  },
  
  // Security issues
  securityIssues: [
    {
      type: "hardcodedSecrets",
      severity: "critical",
      description: "Hardcoded sensitive data",
      count: 2
    }
  ],
  
  // Performance issues
  performanceIssues: [],
  
  // Additional data
  asyncFlows: [],
  exceptions: [],
  callGraph: null,
  
  // Metadata
  statistics: {
    branches: 5,
    loops: 3,
    switches: 1,
    deadCode: 0,
    flattening: 0,
    functions: 4
  },
  
  warnings: [],
  errors: [],
  analysisTime: 45
}
```

## Configuration Examples

### Minimal Configuration

```javascript
const agent = new ControlFlowAnalyzer();
// Uses all defaults
```

### Performance-Optimized

```javascript
const agent = new ControlFlowAnalyzer({
  maxNestingDepth: 8,
  trackComplexity: true,
  generateCallGraph: false,
  enableCache: true,
  timeout: 30000
});
```

### Security-Focused

```javascript
const agent = new ControlFlowAnalyzer({
  securityAnalysis: true,
  detectFlattening: true,
  detectOpaquePredicates: true,
  detectDeadCode: true,
  verboseLogging: true
});
```

### Framework Analysis

```javascript
const agent = new ControlFlowAnalyzer({
  webFrameworkSupport: true,
  generateCallGraph: true,
  analyzeDataFlow: true
});
```

## Troubleshooting

### Analysis Timeout

If analysis times out on large codebases:

```javascript
const agent = new ControlFlowAnalyzer({
  timeout: 120000, // Increase to 2 minutes
  maxNestingDepth: 15,
  maxSwitchCases: 200
});
```

### Memory Issues

For very large files:

```javascript
const agent = new ControlFlowAnalyzer({
  generateCallGraph: false,
  analyzeDataFlow: false,
  enableCache: false
});
```

### Catching Errors

```javascript
try {
  const result = agent.analyze(code);
  if (result.errors.length > 0) {
    console.warn('Analysis had errors:', result.errors);
  }
} catch (error) {
  console.error('Fatal error:', error);
}
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
