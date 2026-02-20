# String Decryptor Agent

Production-grade specialized agent for decrypting and analyzing obfuscated strings in JavaScript code. Supports 15+ encoding schemes with advanced caching, multi-layer decryption, and confidence scoring.

## Version

**3.0.0** - World-class string decryption with advanced caching and analysis

## Quick Start

```javascript
const { StringDecryptor } = require('./agents/string-decryptor');

// Basic usage
const agent = new StringDecryptor();
const result = agent.analyze(obfuscatedCode);

console.log('Decrypted strings:', result.decryptedStrings);
console.log('Encrypted patterns:', result.encryptedPatterns);
```

## Overview

The String Decryptor Agent is a critical component in the JavaScript deobfuscation system, specializing in identifying, analyzing, and decrypting various types of obfuscated strings commonly found in minified or malicious JavaScript code.

This agent supports multiple decryption methods including base64, hexadecimal, ROT13, ROT47, XOR, Unicode escape sequences, URL encoding, HTML entities, character code decoding, and more advanced techniques.

For comprehensive documentation including advanced features, troubleshooting, API reference, and examples, see the detailed [agent.md](agent.md) file.

## Features

### String Decryption

- **Base64 Decoding**: Standard base64 encoding commonly found in minified code
- **Hexadecimal Decoding**: Hex values with 0x prefix and \x escape sequences
- **ROT13 Decoding**: Caesar cipher rotation by 13 positions
- **ROT47 Decoding**: Extended rotation for ASCII characters 33-126
- **XOR Decoding**: XOR-based obfuscation with automatic key detection
- **Unicode Decoding**: Unicode escape sequences in various formats
- **URL Decoding**: Percent-encoding for web addresses
- **HTML Entity Decoding**: Named and numeric HTML entities
- **CharCode Decoding**: String.fromCharCode patterns
- **Reverse Decoding**: Reversed string patterns
- **Atbash Decoding**: Mirror alphabet cipher
- **Binary/Octal Decoding**: Binary and octal number systems

### Advanced Features

- **Multi-layer Decryption**: Handle nested/recursive encoding patterns
- **Confidence Scoring**: Calculate reliability scores for decoded results
- **Eval Analysis**: Analyze eval() calls for encrypted payloads
- **Suspicious Pattern Detection**: Identify malware indicators
- **Caching System**: TTL-based cache for improved performance
- **Batch Processing**: Analyze multiple code snippets efficiently

## Configuration

```javascript
const agent = new StringDecryptor({
  // Maximum decryption recursion depth
  maxDepth: 5,
  
  // Enable caching
  cacheEnabled: true,
  cacheTTL: 300000,      // 5 minutes
  cacheSize: 1000,
  
  // Minimum confidence threshold (0-1)
  confidenceThreshold: 0.5,
  
  // Enable multi-layer decryption
  tryMultiLayer: true,
  
  // Detect suspicious patterns
  detectSuspiciousPatterns: true,
  
  // Maximum string length
  maxStringLength: 10000,
  
  // Timeout in milliseconds
  timeout: 30000,
  
  // Verbose logging
  verboseLogging: false
});
```

## Output Structure

```javascript
{
  agent: 'string-decryptor',
  version: '3.0.0',
  decryptedStrings: [
    {
      original: 'SGVsbG8gV29ybGQ=',
      decrypted: 'Hello World',
      method: 'base64',
      confidence: 0.95,
      position: { start: 10, end: 30 }
    }
  ],
  encryptedPatterns: [
    {
      type: 'base64',
      count: 15,
      samples: ['SGVsbG8=', 'V29ybGQ='],
      severity: 'high'
    }
  ],
  evalCalls: [
    {
      position: { line: 5, column: 10 },
      argument: 'decoded_string',
      type: 'dynamic'
    }
  ],
  multiLayerStrings: [
    {
      original: 'base64_encoded',
      layers: ['base64', 'xor', 'reverse'],
      finalResult: 'decrypted_value'
    }
  ],
  suspiciousPatterns: [
    {
      type: 'encoded-url',
      description: 'Encoded URL detected',
      severity: 'medium'
    }
  ],
  statistics: {
    totalAttempts: 100,
    successful: 85,
    failed: 15,
    cacheHits: 42,
    analysisTime: 150
  },
  warnings: [],
  errors: []
}
```

## Supported Encodings

| Encoding | Difficulty | Description |
|----------|------------|-------------|
| Base64 | Easy | Standard Base64 encoding |
| Hex | Easy | Hexadecimal values |
| ROT13 | Easy | Caesar cipher rotation |
| ROT47 | Medium | Extended ASCII rotation |
| XOR | Hard | XOR-based obfuscation |
| Unicode | Easy | Unicode escape sequences |
| URL | Easy | Percent-encoding |
| HTML Entity | Easy | Named/numeric entities |
| CharCode | Medium | String.fromCharCode |
| Reverse | Easy | Reversed strings |
| Atbash | Medium | Mirror alphabet cipher |

## Advanced Usage

### Async Analysis with Events

```javascript
const agent = new StringDecryptor();

agent.on('analysis-start', (data) => {
  console.log(`Starting analysis of ${data.codeLength} chars`);
});

agent.on('decryption', (data) => {
  console.log(`Decoded using ${data.method}: ${data.result}`);
});

agent.on('analysis-complete', (data) => {
  console.log(`Complete: ${data.decryptedCount} strings decrypted`);
});

const result = await agent.analyzeAsync(code);
```

### Batch Processing

```javascript
const agent = new StringDecryptor({ cacheEnabled: true });

const codes = [
  code1,
  code2,
  code3,
  code4
];

const results = agent.analyzeBatch(codes, { 
  parallel: false 
});

// Check cache performance
console.log('Cache stats:', agent.getCacheStats());
```

### Caching

```javascript
const agent = new StringDecryptor({ 
  cacheEnabled: true,
  cacheTTL: 600000  // 10 minutes
});

// First analysis - miss
const result1 = agent.analyze(code);

// Second analysis - hit from cache
const result2 = agent.analyze(code);

// Check cache stats
console.log(agent.getCacheStats());
// { size: 1, hits: 1, misses: 1, hitRate: '50.00%' }

// Clear cache if needed
agent.clearCache();
```

### Multi-layer Decryption

```javascript
const agent = new StringDecryptor({
  maxDepth: 10,
  tryMultiLayer: true
});

const result = agent.analyze(code);

// View multi-layer strings
result.multiLayerStrings.forEach(item => {
  console.log(`Original: ${item.original}`);
  console.log(`Layers: ${item.layers.join(' -> ')}`);
  console.log(`Result: ${item.finalResult}`);
});
```

### Security Analysis

```javascript
const agent = new StringDecryptor({
  detectSuspiciousPatterns: true,
  confidenceThreshold: 0.7
});

const result = agent.analyze(suspiciousCode);

// Check for critical indicators
if (result.evalCalls.length > 0) {
  console.warn('Dangerous eval() calls detected!');
}

// View suspicious patterns
result.suspiciousPatterns.forEach(pattern => {
  console.log(`[${pattern.severity}] ${pattern.type}: ${pattern.description}`);
});
```

## Integration

### With Pattern Recognizer

```javascript
const { StringDecryptor } = require('./agents/string-decryptor');
const { PatternRecognizer } = require('./agents/pattern-recognizer');

const patternAgent = new PatternRecognizer();
const stringAgent = new StringDecryptor();

// First detect patterns
const patterns = patternAgent.analyze(code);

// Then decrypt strings from detected patterns
const encryptedPatterns = patterns.patterns.filter(p => 
  ['base64', 'hex', 'charCode'].includes(p.id)
);

encryptedPatterns.forEach(pattern => {
  const result = stringAgent.analyze(code);
  console.log('Decrypted:', result.decryptedStrings);
});
```

### With Control Flow Analyzer

```javascript
const { StringDecryptor } = require('./agents/string-decryptor');
const { ControlFlowAnalyzer } = require('./agents/control-flow-analyzer');

const decryptor = new StringDecryptor();
const flowAnalyzer = new ControlFlowAnalyzer();

// Decrypt first to reveal actual code
const decrypted = decryptor.analyze(code);

// Then analyze control flow
const flowResult = flowAnalyzer.analyze(decrypted.code || code);
console.log('Complexity:', flowResult.complexity);
```

## Severity Indicators

### Critical 🔴

- eval with dynamic content
- document.cookie access
- XMLHttpRequest send
- Function constructor usage

**Action**: Immediate investigation required

### High 🟠

- Base64 encoded large strings
- Multi-layer encoding
- Obfuscated URLs
- Dynamic code generation

**Action**: Priority analysis needed

### Medium 🟡

- CharCode patterns
- Hex encoding
- URL encoding

**Action**: Standard analysis

### Low 🟢

- Simple reverses
- Minor encoding
- Template literals

**Action**: Cosmetic concerns only

## Performance

- **Caching**: TTL-based cache with configurable size
- **Batch Processing**: Process multiple files efficiently
- **Timeout Protection**: Configurable timeout prevents hangs
- **Memory Efficient**: Streaming for large files
- **Parallel Option**: Optional parallel processing

## Troubleshooting

### No Strings Decrypted

1. Verify code contains obfuscated strings
2. Check if encoding is supported
3. Lower `confidenceThreshold`
4. Enable `verboseLogging`

### Slow Performance

1. Enable `cacheEnabled` for repeated analysis
2. Reduce `maxDepth` for simpler code
3. Use batch processing with `parallel: true`

### High Memory Usage

1. Reduce `cacheSize`
2. Lower `maxStringLength`
3. Clear cache periodically

## Related Documentation

- [Detailed Agent Documentation](agent.md) - Comprehensive technical guide
- [Pattern Recognizer Agent](../pattern-recognizer/README.md) - Obfuscation pattern detection
- [Control Flow Analyzer](../control-flow-analyzer/README.md) - Control flow analysis
- [Validator Agent](../validator/README.md) - Code validation
- [Main README](../../README.md) - Project overview
- [Contributing](../../CONTRIBUTING.md) - Contribution guidelines

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Support

- Report bugs via [GitHub Issues](https://github.com/snippet-deobfuscator/snippet-deobfuscator/issues)
- Join discussions at [Discord](https://discord.gg/deobfuscator)
- Follow updates at [Twitter](https://twitter.com/deobfuscator)
