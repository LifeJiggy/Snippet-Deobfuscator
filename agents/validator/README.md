# Validator Agent

Production-grade code validation and integrity checking system for JavaScript, TypeScript, JSX, and TSX codebases. Performs comprehensive validation including syntax checking, semantic analysis, security vulnerability scanning, code quality assessment, and test suggestion generation.

## Quick Start

```javascript
const { Validator } = require('./agents/validator');

// Basic validation
const validator = new Validator();
const result = validator.validate(`
  function calculate(x, y) {
    return x + y;
  }
`);

console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Security Issues:', result.securityIssues);
```

## Installation

```bash
npm install @snippet-deobfuscator/validator
```

Or include directly:

```javascript
const { Validator, validate } = require('./agents/validator');
```

## Features

### Syntax Validation
- JavaScript syntax checking
- TypeScript type validation
- JSX/TSX syntax verification
- Common syntax error detection
- Bracket matching validation
- Error recovery support

### Semantic Analysis
- Undefined variable detection
- Type mismatch identification
- Unused variable finding
- Dead code detection
- Unreachable code analysis
- Assignment in condition detection
- Loose comparison warnings

### Security Scanning
- Code injection vulnerability detection (eval, Function constructor)
- XSS vulnerability identification (innerHTML, document.write)
- Prototype pollution detection
- Hardcoded secret detection
- Insecure random usage
- Command injection detection
- Path traversal vulnerabilities
- CORS misconfiguration detection

### Code Quality Checks
- Function complexity assessment
- Deep nesting detection
- Long function warnings
- Naming convention validation
- Best practice enforcement
- Console statement detection
- TODO comment detection
- Magic number detection

### Test Generation
- Function test suggestions
- Async operation test hints
- Export validation testing
- Integration test recommendations

## API Reference

### Constructor

```javascript
const validator = new Validator(options);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkSyntax` | boolean | true | Enable syntax validation |
| `checkSecurity` | boolean | true | Enable security scanning |
| `checkQuality` | boolean | true | Enable quality checks |
| `checkSemantics` | boolean | true | Enable semantic analysis |
| `strictMode` | boolean | false | Enable strict validation |
| `verboseLogging` | boolean | false | Enable debug logging |
| `timeout` | number | 45000 | Validation timeout (ms) |
| `enableCache` | boolean | true | Enable result caching |
| `maxErrors` | number | 100 | Maximum errors to collect |
| `maxWarnings` | number | 50 | Maximum warnings to collect |
| `failOnCritical` | boolean | true | Fail on critical issues |
| `generateSuggestions` | boolean | true | Generate test suggestions |
| `includeAST` | boolean | false | Include AST in results |

### Methods

#### validate(code, context)

Synchronous validation of JavaScript code.

```javascript
const result = validator.validate(code, { source: 'user-input' });
```

**Returns:** Object containing:
- `valid`: Boolean indicating overall validity
- `errors`: Array of syntax/semantic errors
- `warnings`: Code quality warnings
- `securityIssues`: Security vulnerabilities found
- `qualityIssues`: Code quality concerns
- `testSuggestions`: Generated test suggestions
- `recommendations`: Improvement recommendations
- `statistics`: Validation metrics

#### validateAsync(code, context)

Asynchronous validation with timeout support.

```javascript
const result = await validator.validateAsync(code);
```

#### validateBatch(codes, options)

Batch validation of multiple code snippets.

```javascript
const results = await validator.validateBatch([
  code1,
  code2,
  code3
], {
  batchSize: 5,
  onProgress: ({ completed, total }) => console.log(`${completed}/${total}`)
});
```

#### validateFile(filePath, options)

Validate code from a file.

```javascript
const result = await validator.validateFile('./src/app.js');
```

#### validateLine(code, lineNumber)

Validate a specific line.

```javascript
const result = validator.validateLine(code, 42);
```

#### checkPattern(code, pattern)

Check for specific patterns.

```javascript
const result = validator.checkPattern(code, /TODO/);
```

#### on(event, callback)

Subscribe to validation events.

```javascript
validator.on('progress', (data) => {
  console.log(`Phase: ${data.phase}, Progress: ${data.progress * 100}%`);
});

validator.on('validationComplete', (data) => {
  console.log(`Validation completed in ${data.validationTime}ms`);
});

validator.on('error', (error) => {
  console.error('Validation error:', error);
});
```

**Events:**
- `validationStart` - Validation started
- `progress` - Progress update during validation
- `validationComplete` - Validation completed successfully
- `validationError` - Validation failed
- `cacheHit` - Result served from cache

### Utility Functions

#### validate(code, options)

Convenience function for one-time validation.

```javascript
const { validate } = require('./agents/validator');
const result = validate(code, { checkSecurity: true });
```

#### validateAsync(code, options)

Async convenience function.

```javascript
const { validateAsync } = require('./agents/validator');
const result = await validateAsync(code);
```

#### getSupportedValidations()

Get list of supported validation types.

```javascript
const { getSupportedValidations } = require('./agents/validator');
console.log(getSupportedValidations());
```

#### getConfigSchema()

Get JSON schema for configuration.

```javascript
const { getConfigSchema } = require('./agents/validator');
// Returns JSON Schema for validation
```

## Examples

### Basic Validation

```javascript
const { Validator } = require('./agents/validator');

const validator = new Validator();
const code = `
  function add(a, b) {
    return a + b;
  }
`;

const result = validator.validate(code);
console.log('Valid:', result.valid);
console.log('Errors:', result.errors.length);
console.log('Warnings:', result.warnings.length);
```

### Security Scanning

```javascript
const validator = new Validator({
  checkSecurity: true,
  checkQuality: false
});

const insecureCode = `
  function login(user, pass) {
    eval(user); // Code injection!
    document.getElementById('x').innerHTML = pass; // XSS!
  }
`;

const result = validator.validate(insecureCode);

if (result.securityIssues.length > 0) {
  console.warn('Security issues found:');
  result.securityIssues.forEach(issue => {
    console.log(\`  [\${issue.severity.toUpperCase()}] \${issue.type}\`);
    console.log(\`    \${issue.message}\`);
  });
}
```

### Full Validation with All Checks

```javascript
const validator = new Validator({
  checkSyntax: true,
  checkSecurity: true,
  checkQuality: true,
  checkSemantics: true,
  strictMode: true,
  verboseLogging: true
});

result = validator.validate(code);

console.log('Valid:', result.valid);
console.log('Errors:', result.errors.length);
console.log('Warnings:', result.warnings.length);
console.log('Security Issues:', result.securityIssues.length);
console.log('Quality Issues:', result.qualityIssues.length);
console.log('Test Suggestions:', result.testSuggestions.length);
console.log('Recommendations:', result.recommendations);
```

### Batch Processing

```javascript
const { validateBatch } = require('./agents/validator');

const files = [
  './src/utils.js',
  './src/helpers.js',
  './src/components/*.js'
];

const results = await validateBatch(files, {
  batchSize: 10,
  checkSecurity: true,
  onProgress: ({ completed, total, percentage }) => {
    console.log(\`Progress: \${percentage.toFixed(1)}% (\${completed}/\${total})\`);
  }
});

// Aggregate results
const allValid = results.every(r => r.valid);
const totalIssues = results.reduce((sum, r) => 
  sum + r.securityIssues.length + r.qualityIssues.length, 0);
console.log('All valid:', allValid);
console.log('Total issues:', totalIssues);
```

### Progress Tracking

```javascript
const validator = new Validator();

validator.on('progress', (data) => {
  console.log(\`[\${data.phase}] \${(data.progress * 100).toFixed(0)}%\`);
});

validator.on('validationComplete', (data) => {
  console.log(\`Validation completed in \${data.validationTime}ms\`);
});

const result = validator.validate(largeCodebase);
```

### Using with Express

```javascript
const express = require('express');
const { Validator } = require('./agents/validator');

const app = express();
const validator = new Validator({ checkSecurity: true });

app.post('/validate', (req, res) => {
  const { code } = req.body;
  
  validator.validateAsync(code)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});
```

## Output Structure

```javascript
{
  agent: "validator",
  version: "3.0.0",
  valid: true,
  
  // Errors
  errors: [
    {
      type: "syntax-error",
      message: "Unexpected token",
      line: 10,
      column: 5,
      pos: 150,
      formatted: "Unexpected token (10:5)"
    }
  ],
  
  // Warnings
  warnings: [
    {
      type: "semantic-warning",
      message: "Variable 'foo' may not be defined",
      line: 5,
      severity: "low"
    }
  ],
  
  // Security Issues
  securityIssues: [
    {
      type: "code-injection",
      severity: "critical",
      message: "Dangerous eval() usage",
      code: "eval(userInput)",
      rule: "evalUsage"
    }
  ],
  
  // Quality Issues
  qualityIssues: [
    {
      type: "long-function",
      severity: "low",
      message: "Function 'processData' has 120 lines",
      line: 15
    }
  ],
  
  // Test Suggestions
  testSuggestions: [
    {
      type: "function-test",
      function: "add",
      suggestion: "describe('add', () => { it('should add two numbers', () => { expect(add(2, 3)).toBe(5); }); });"
    }
  ],
  
  // Recommendations
  recommendations: [
    {
      priority: "high",
      message: "Address critical security issues immediately"
    }
  ],
  
  // Statistics
  statistics: {
    totalErrors: 1,
    totalWarnings: 5,
    totalSecurityIssues: 3,
    criticalSecurityIssues: 1,
    highSecurityIssues: 2,
    qualityIssues: 2,
    valid: true,
    testSuggestions: 3
  },
  
  validatedAt: "2024-01-15T10:30:00.000Z"
}
```

## Configuration Examples

### Minimal Configuration

```javascript
const validator = new Validator();
// Uses all defaults
```

### Security-Focused

```javascript
const validator = new Validator({
  checkSecurity: true,
  checkQuality: false,
  failOnCritical: true,
  verboseLogging: true
});
```

### Strict Mode

```javascript
const validator = new Validator({
  strictMode: true,
  checkQuality: true,
  maxErrors: 50,
  maxWarnings: 20
});
```

### Performance-Optimized

```javascript
const validator = new Validator({
  enableCache: true,
  timeout: 30000,
  generateSuggestions: false,
  includeAST: false
});
```

## Troubleshooting

### Validation Timeout

If validation times out on large codebases:

```javascript
const validator = new Validator({
  timeout: 120000, // Increase to 2 minutes
});
```

### Memory Issues

For very large files:

```javascript
const validator = new Validator({
  enableCache: false,
  generateSuggestions: false,
  maxErrors: 50,
  maxWarnings: 25
});
```

### Catching Errors

```javascript
try {
  const result = validator.validate(code);
  if (!result.valid) {
    console.warn('Validation failed:', result.errors);
  }
  if (result.securityIssues.length > 0) {
    console.warn('Security issues:', result.securityIssues);
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
