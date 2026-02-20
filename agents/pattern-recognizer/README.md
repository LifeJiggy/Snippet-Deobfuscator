# Pattern Recognizer Agent

Production-grade specialized agent for recognizing and classifying 50+ obfuscation patterns in JavaScript code. Uses both regex-based surface scanning and deep AST analysis for comprehensive pattern detection.

## Version

**3.0.0** - World-class pattern recognition with advanced detection capabilities

## Quick Start

```javascript
const { PatternRecognizer } = require('./agents/pattern-recognizer');

// Basic usage
const agent = new PatternRecognizer();
const result = agent.analyze(obfuscatedCode);

console.log('Total patterns:', result.statistics.totalPatterns);
console.log('Risk score:', result.riskScore);
console.log('Critical:', result.severityCounts.critical);
```

## Overview

The Pattern Recognizer Agent is a critical component in the JavaScript deobfuscation system, specializing in detecting and classifying obfuscation patterns across multiple categories. It provides both rapid regex-based scanning and deep AST-based analysis for accurate pattern identification.

For comprehensive documentation including advanced features, troubleshooting, API reference, and examples, see the detailed [agent.md](agent.md) file.

## Features

### String Obfuscation Detection

- **Array Access Obfuscation**: Nested array property access patterns
- **CharCode Obfuscation**: String.fromCharCode usage
- **Split String**: Arrays joined to form strings
- **Base64 Encoding**: atob usage and encoded strings
- **Hex Encoding**: Hexadecimal value obfuscation
- **Unicode Escape**: Unicode escape sequences
- **HTML Entity Encoding**: HTML entity encoding
- **Reverse Strings**: Reversed string patterns

### Function Obfuscation Detection

- **Eval Usage**: Dynamic code execution via eval
- **Function Constructor**: new Function() usage
- **setTimeout Eval**: setTimeout with string code
- **IIFE**: Immediately Invoked Function Expressions
- **Dynamic Function Calls**: Bracket notation function calls
- **Proxy Functions**: Proxy-based function calls

### Control Flow Obfuscation Detection

- **Control Flow Flattening**: Switch-based state machines
- **Opaque Predicates**: Always true/false conditions
- **Dead Code Injection**: Unreachable code blocks
- **Try-Catch Obfuscation**: Control flow via try-catch
- **Bogus Control Flow**: Redundant control flow
- **Indirect Jumps**: Computed goto patterns

### Variable Obfuscation Detection

- **Variable Mangling**: Shortened variable names
- **Global Variable Hiding**: Variables hidden in global objects
- **Variable Reassignment**: Multiple variable reassignments
- **Unused Variables**: Dead store detection

### Security Pattern Detection

- **Prototype Pollution**: `__proto__` or prototype manipulation
- **Anti-Debugging**: debugger statements, infinite loops
- **Code Injection**: eval with dynamic content
- **Network Exfiltration**: Data sending patterns
- **Cryptographic Operations**: Crypto API usage
- **DOM Manipulation**: Dangerous DOM operations

### Framework Pattern Detection

- **jQuery**: jQuery selector obfuscation
- **React**: React JSX obfuscation (_jsx)
- **Vue**: Vue template directive obfuscation
- **Angular**: Angular-specific patterns
- **Webpack**: Webpack module patterns
- **Node.js**: Node.js specific patterns

## Configuration

```javascript
const agent = new PatternRecognizer({
  // Maximum samples to store per pattern
  maxPatternSamples: 5,
  
  // Enable deep AST analysis
  enableASTAnalysis: true,
  
  // Enable regex-based scanning
  enableRegexAnalysis: true,
  
  // Minimum confidence threshold (0-1)
  minConfidence: 0.5,
  
  // Cache parsed ASTs
  cacheAST: true,
  
  // Enable parallel processing
  parallelProcessing: false,
  
  // Enable experimental patterns
  detectNewPatterns: false,
  
  // Timeout in milliseconds
  timeout: 45000,
  
  // Verbose logging
  verboseLogging: false
});
```

## Output Structure

```javascript
{
  agent: 'pattern-recognizer',
  version: '3.0.0',
  patterns: [
    {
      id: 'eval-usage',
      name: 'Eval Usage',
      severity: 'critical',
      category: 'function',
      description: 'Dynamic code execution via eval',
      count: 5,
      samples: ['eval(code)', 'eval(x)'],
      method: 'ast',
      confidence: 0.95,
      location: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } }
    }
  ],
  severityCounts: {
    critical: 2,
    high: 5,
    medium: 10,
    low: 33
  },
  categoryCounts: {
    string: 3,
    function: 8,
    control: 5,
    variable: 4,
    security: 10,
    framework: 2
  },
  statistics: {
    totalPatterns: 50,
    detectedPatterns: 12,
    critical: 2,
    high: 5,
    medium: 10,
    low: 33,
    analysisTime: 150
  },
  riskScore: 78,
  recommendations: [
    { priority: 'critical', message: 'Remove all eval() usage - code injection risk' },
    { priority: 'high', message: 'Consider decrypting base64 encoded strings' }
  ]
}
```

## Severity Levels

### Critical 🔴

Security vulnerabilities requiring immediate attention:

- eval with user input
- Code injection vectors
- Remote code execution
- Prototype pollution attacks

**Response Time**: Immediate

### High 🟠

Significant obfuscation that obscures code logic:

- Control flow flattening
- Heavy base64 encoding
- String decryption routines
- Dynamic code generation

**Response Time**: Soon

### Medium 🟡

Moderate obfuscation affecting code readability:

- charCode obfuscation
- Variable mangling
- IIFE wrapping
- String concatenation

**Response Time**: Planned

### Low 🟢

Minor obfuscation with minimal impact:

- Template literals
- Optional chaining
- Minor encoding
- Framework patterns

**Response Time**: When convenient

## Detection Methods

### Regex-Based Detection

Fast pattern matching using regular expressions:

```javascript
// Fast initial scan
const patterns = agent.detectWithRegex(code);
```

**Performance**: Fast (milliseconds)
**Best For**: String patterns, simple detections, initial scan

### AST-Based Detection

Deep analysis using Abstract Syntax Tree:

```javascript
// Deep contextual analysis
const patterns = agent.detectWithAST(code);
```

**Performance**: Slower but accurate
**Best For**: Complex patterns, contextual analysis, accurate detection

### Hybrid Detection

Combined regex and AST analysis:

```javascript
// Comprehensive detection
const patterns = agent.detect(code);
// Uses both methods with validation
```

**Performance**: Balanced
**Best For**: Comprehensive detection, validation, sample extraction

## Advanced Usage

### Async Analysis with Progress

```javascript
const agent = new PatternRecognizer();

agent.on('progress', (progress) => {
  console.log(`Analysis: ${progress.percent}% - ${progress.stage}`);
});

agent.on('pattern-detected', (pattern) => {
  console.log(`Found: ${pattern.name} (${pattern.severity})`);
});

const result = await agent.analyzeAsync(code);
console.log('Risk score:', result.riskScore);
```

### Batch Analysis

```javascript
const agent = new PatternRecognizer({ cacheAST: true });
const codes = [code1, code2, code3, code4];

const results = await agent.analyzeBatch(codes, {
  parallel: true,
  stopOnError: false
});

results.forEach((result, index) => {
  console.log(`File ${index + 1}: Risk ${result.riskScore}`);
});
```

### Pattern Filtering

```javascript
const result = agent.analyze(code);

// Filter by severity
const critical = result.patterns.filter(p => p.severity === 'critical');

// Filter by category
const securityPatterns = result.patterns.filter(p => p.category === 'security');

// Filter by confidence
const highConfidence = result.patterns.filter(p => p.confidence >= 0.8);

// Get only high-risk items
const highRiskItems = result.patterns.filter(p => 
  ['critical', 'high'].includes(p.severity)
);
```

### Custom Pattern Registration

```javascript
agent.registerPattern({
  id: 'custom-pattern',
  name: 'Custom Pattern',
  category: 'custom',
  severity: 'medium',
  detect: (code, ast) => {
    // Custom detection logic
    return { found: true, count: 5 };
  }
});
```

## Integration

### With Orchestrator

```javascript
const { Orchestrator } = require('./agents/orchestrator');
const orchestrator = new Orchestrator();

// Pattern recognition runs as stage 2
const result = await orchestrator.execute(code);
console.log(result.patternAnalysis);
```

### With Control Flow Analyzer

```javascript
const { PatternRecognizer } = require('./agents/pattern-recognizer');
const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');

const patternAgent = new PatternRecognizer();
const flowAgent = new ControlFlowAnalyzer();

const patterns = patternAgent.analyze(code);
const flow = flowAgent.analyze(code);

// Combined analysis
const report = {
  patterns: patterns.patterns,
  complexity: flow.complexity,
  obfuscationLevel: calculateObfuscationLevel(patterns)
};
```

### With String Decryptor

```javascript
const { PatternRecognizer } = require('./agents/pattern-recognizer');
const { StringDecryptor } = require('./agents/string-decryptor');

const patternAgent = new PatternRecognizer();
const result = patternAgent.analyze(code);

// Find encrypted strings
const encryptedPatterns = result.patterns.filter(p => 
  ['base64', 'hex', 'charCode'].includes(p.id)
);

const decryptor = new StringDecryptor();
const decrypted = decryptor.decrypt(code, encryptedPatterns);
```

## Performance

- **Caches parsed ASTs** for repeated analysis
- **Uses both regex and AST** for comprehensive coverage
- **Configurable timeout** (default 45s)
- **Parallel processing** option for batch analysis
- **Memory-efficient** streaming for large files

## Risk Assessment

The agent calculates an overall risk score (0-100) based on:

1. **Severity Weight**: Critical (40), High (25), Medium (15), Low (5)
2. **Pattern Count**: Number of detected patterns
3. **Category Diversity**: Spread across categories
4. **Detection Confidence**: Average confidence score
5. **Obfuscation Complexity**: Combined complexity of techniques

### Risk Score Interpretation

| Score | Level | Action |
|-------|-------|--------|
| 0-25 | Low | Monitor, cosmetic fixes |
| 26-50 | Medium | Plan remediation |
| 51-75 | High | Priority remediation |
| 76-100 | Critical | Immediate action required |

## Troubleshooting

### No Patterns Detected

1. Check if code is actually obfuscated
2. Verify AST parsing succeeded
3. Try lowering `minConfidence` threshold
4. Enable `verboseLogging` for debug info

### High False Positives

1. Increase `minConfidence` to 0.7+
2. Disable specific pattern categories
3. Filter results by category

### Performance Issues

1. Disable AST analysis for large files
2. Enable `cacheAST` for repeated analysis
3. Use batch processing with `parallel: true`

## Related Documentation

- [Detailed Agent Documentation](agent.md) - Comprehensive technical guide
- [Control Flow Analyzer](../control-flow-analyzer/README.md) - Control flow analysis
- [String Decryptor](../string-decryptor/README.md) - String decryption
- [Validator Agent](../validator/README.md) - Code validation
- [Main README](../../README.md) - Project overview
- [Contributing](../../CONTRIBUTING.md) - Contribution guidelines

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Support

- Report bugs via [GitHub Issues](https://github.com/snippet-deobfuscator/snippet-deobfuscator/issues)
- Join discussions at [Discord](https://discord.gg/deobfuscator)
- Follow updates at [Twitter](https://twitter.com/deobfuscator)
