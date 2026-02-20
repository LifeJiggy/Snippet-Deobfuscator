# Beautifier Agent

Production-grade code beautification, formatting, and normalization system for JavaScript, TypeScript, JSX, TSX, JSON, CSS, HTML, and Markdown codebases. Transforms minified or poorly formatted code into clean, readable output using Prettier integration with robust fallback mechanisms.

## Quick Start

```javascript
const { Beautifier } = require('./agents/beautifier');

// Basic formatting
const beautifier = new Beautifier();
const result = beautifier.format(`
function foo(x,y){return x+y}
`);

console.log(result.formatted);
console.log(result.statistics);
```

## Installation

```bash
npm install @snippet-deobfuscator/beautifier
```

Or include directly:

```javascript
const { Beautifier, format } = require('./agents/beautifier');
```

## Features

### Multi-Language Support
- JavaScript (ES5, ES6+)
- TypeScript
- JSX (React)
- TSX (React TypeScript)
- JSON
- CSS, SCSS, Sass, Less
- HTML
- Markdown

### Formatting Options
- Configurable indentation (spaces or tabs)
- Quote style (single or double)
- Semicolon handling
- Trailing commas
- Bracket spacing
- Arrow function parentheses
- Line width control
- End of line handling

### Advanced Features
- Language auto-detection
- Syntax error fixing
- Comment preservation
- Prettier integration with fallbacks
- Custom formatting rules
- Section-based formatting

## API Reference

### Constructor

```javascript
const beautifier = new BeautifierOptions:**

| Option(options);
```

** | Type | Default | Description |
|--------|------|---------|-------------|
| `tabWidth` | number | 2 | Spaces per indentation |
| `useTabs` | boolean | false | Use tabs instead of spaces |
| `semi` | boolean | true | Add semicolons |
| `singleQuote` | boolean | true | Use single quotes |
| `trailingComma` | string | "es5" | Trailing comma style |
| `bracketSpacing` | boolean | true | Space between braces |
| `arrowParens` | string | "always" | Arrow function parens |
| `endOfLine` | string | "lf" | Line ending style |
| `printWidth` | number | 100 | Max line length |
| `verboseLogging` | boolean | false | Enable debug logging |
| `timeout` | number | 60000 | Format timeout (ms) |
| `enableCache` | boolean | true | Enable result caching |
| `detectLanguage` | boolean | true | Auto-detect language |
| `preserveComments` | boolean | true | Keep comments |
| `fixSyntaxErrors` | boolean | true | Fix syntax issues |

### Methods

#### format(code, context)

Synchronous formatting of code.

```javascript
const result = beautifier.format(code, { source: 'user-input' });
```

**Returns:** Object containing:
- `formatted`: Formatted code string
- `originalLength`: Original code length
- `formattedLength`: Formatted code length
- `language`: Detected language
- `statistics`: Formatting statistics
- `changes`: Applied changes
- `warnings`: Warnings during formatting
- `errors`: Errors encountered

#### formatAsync(code, context)

Asynchronous formatting with timeout support.

```javascript
const result = await beautifier.formatAsync(code);
```

#### formatBatch(codes, options)

Batch formatting of multiple code snippets.

```javascript
const results = await beautifier.formatBatch([
  code1,
  code2,
  code3
], {
  batchSize: 5,
  onProgress: ({ completed, total }) => console.log(`${completed}/${total}`)
});
```

#### formatFile(filePath, options)

Format code from a file.

```javascript
const result = await beautifier.formatFile('./src/app.js');
```

#### formatSection(code, startLine, endLine, options)

Format a specific section of code.

```javascript
const result = beautifier.formatSection(code, 10, 20, { tabWidth: 4 });
```

#### formatWithCustomRules(code, rules)

Format with custom rules.

```javascript
const result = beautifier.formatWithCustomRules(code, [
  { type: 'indent', options: { size: 4, useTabs: true } },
  { type: 'quotes', quoteType: 'single' },
  { type: 'line-width', maxWidth: 80 }
]);
```

#### detectLanguage(code)

Detect the language of code.

```javascript
const lang = beautifier.detectLanguage(code);
// Returns: 'javascript', 'typescript', 'jsx', 'tsx', 'json', 'css', 'html', 'markdown'
```

#### on(event, callback)

Subscribe to formatting events.

```javascript
beautifier.on('progress', (data) => {
  console.log(`Phase: ${data.phase}, Progress: ${data.progress * 100}%`);
});

beautifier.on('formatComplete', (data) => {
  console.log(`Format completed in ${data.formatTime}ms`);
});

beautifier.on('error', (error) => {
  console.error('Format error:', error);
});
```

**Events:**
- `formatStart` - Formatting started
- `progress` - Progress update during formatting
- `formatComplete` - Formatting completed successfully
- `formatError` - Formatting failed
- `cacheHit` - Result served from cache

### Utility Functions

#### format(code, options)

Convenience function for one-time formatting.

```javascript
const { format } = require('./agents/beautifier');
const result = format(code, { tabWidth: 4 });
```

#### formatAsync(code, options)

Async convenience function.

```javascript
const { formatAsync } = require('./agents/beautifier');
const result = await formatAsync(code);
```

#### getSupportedLanguages()

Get list of supported languages.

```javascript
const { getSupportedLanguages } = require('./agents/beautifier');
console.log(getSupportedLanguages());
```

#### getConfigSchema()

Get JSON schema for configuration.

```javascript
const { getConfigSchema } = require('./agents/beautifier');
// Returns JSON Schema for validation
```

## Examples

### Basic Formatting

```javascript
const { Beautifier } = require('./agents/beautifier');

const beautifier = new Beautifier();
const code = `function add(a,b){return a+b}`;

const result = beautifier.format(code);
console.log(result.formatted);
// Output:
// function add(a, b) {
//   return a + b;
// }
```

### TypeScript Formatting

```javascript
const beautifier = new Beautifier({
  tabWidth: 2,
  singleQuote: true,
  printWidth: 80
});

const tsCode = `interface User{name:string;age:number}`;
const result = beautifier.format(tsCode);
console.log(result.language); // 'typescript'
```

### React JSX Formatting

```javascript
const beautifier = new Beautifier({
  tabWidth: 2,
  singleQuote: false,
  printWidth: 100
});

const jsxCode = `function App(){return <div><h1>Hello</h1></div>}`;
const result = beautifier.format(jsxCode);
console.log(result.formatted);
```

### Custom Rules

```javascript
const beautifier = new Beautifier();

const result = beautifier.formatWithCustomRules(code, [
  { type: 'indent', options: { size: 4 } },
  { type: 'quotes', quoteType: 'single' },
  { type: 'brace-style', style: '1tbs' },
  { type: 'line-width', maxWidth: 80 }
]);
```

### Batch Processing

```javascript
const { formatBatch } = require('./agents/beautifier');

const files = [
  './src/utils.js',
  './src/helpers.js',
  './src/components/*.js'
];

const results = await formatBatch(files, {
  tabWidth: 2,
  singleQuote: true,
  batchSize: 10,
  onProgress: ({ completed, total, percentage }) => {
    console.log(`Progress: ${percentage.toFixed(1)}% (${completed}/${total})`);
  }
});

// Aggregate results
const totalReduction = results.reduce((sum, r) => 
  sum + (parseFloat(r.statistics?.reduction) || 0), 0);
console.log('Average reduction:', totalReduction / results.length + '%');
```

### Progress Tracking

```javascript
const beautifier = new Beautifier();

beautifier.on('progress', (data) => {
  console.log(`[${data.phase}] ${(data.progress * 100).toFixed(0)}%`);
});

beautifier.on('formatComplete', (data) => {
  console.log(`Format completed in ${data.formatTime}ms`);
});

const result = beautifier.format(largeCodebase);
```

### Using with Express

```javascript
const express = require('express');
const { Beautifier } = require('./agents/beautifier');

const app = express();
const beautifier = new Beautifier({ tabWidth: 2, singleQuote: true });

app.post('/format', (req, res) => {
  const { code } = req.body;
  
  beautifier.formatAsync(code)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});
```

## Output Structure

```javascript
{
  agent: "beautifier",
  version: "3.0.0",
  timestamp: "2024-01-15T10:30:00.000Z",
  
  formatted: "function add(a, b) {\n  return a + b;\n}\n",
  originalLength: 5000,
  formattedLength: 4500,
  language: "javascript",
  
  statistics: {
    originalLength: 5000,
    formattedLength: 4500,
    originalLines: 100,
    formattedLines: 95,
    linesChanged: 5,
    reduction: "10.00%",
    commentsPreserved: 5,
    syntaxFixed: 2,
    formattingPasses: 1
  },
  
  changes: [
    {
      type: "syntax-fix",
      description: "Applied syntax corrections"
    }
  ],
  
  warnings: [],
  errors: [],
  
  analysisTime: 45
}
```

## Configuration Examples

### Minimal Configuration

```javascript
const beautifier = new Beautifier();
// Uses all defaults
```

### React Project

```javascript
const beautifier = new Beautifier({
  tabWidth: 2,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'es5'
});
```

### TypeScript Project

```javascript
const beautifier = new Beautifier({
  tabWidth: 2,
  singleQuote: true,
  printWidth: 80,
  trailingComma: 'all',
  arrowParens: 'always'
});
```

### Compact Output

```javascript
const beautifier = new Beautifier({
  tabWidth: 2,
  printWidth: 80,
  semi: true,
  singleQuote: false
});
```

### Tabs Instead of Spaces

```javascript
const beautifier = new Beautifier({
  useTabs: true,
  tabWidth: 2
});
```

## Troubleshooting

### Format Timeout

If formatting times out on large codebases:

```javascript
const beautifier = new Beautifier({
  timeout: 120000, // Increase to 2 minutes
});
```

### Memory Issues

For very large files:

```javascript
const beautifier = new Beautifier({
  enableCache: false,
  fixSyntaxErrors: false
});
```

### Catching Errors

```javascript
try {
  const result = beautifier.format(code);
  if (result.errors.length > 0) {
    console.warn('Formatting had errors:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
} catch (error) {
  console.error('Fatal error:', error);
}
```

### Language Detection Issues

If language detection fails:

```javascript
// Force specific language by setting parser
const beautifier = new Beautifier();
// Use format with custom rules to force parser
const result = beautifier.formatWithCustomRules(code, [
  { type: 'parser', parser: 'typescript' }
]);
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
