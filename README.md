# Snippet Deobfuscator

<p align="center">
  <img src="https://img.shields.io/npm/v/snippet-deobfuscator" alt="npm version">
  <img src="https://img.shields.io/npm/dm/snippet-deobfuscator" alt="npm downloads">
  <img src="https://img.shields.io/github/license/LifeJiggy/Snippet-Deobfuscator" alt="license">
  <img src="https://img.shields.io/github/stars/LifeJiggy/Snippet-Deobfuscator" alt="stars">
</p>

> Deobfuscate JavaScript snippets like a human expert - An AI-powered JavaScript deobfuscation toolkit

## Features

- **String Decryption**: Decode base64, hex, ROT13, XOR, Unicode, and more
- **Control Flow Analysis**: Analyze and reconstruct control flow structures
- **Pattern Recognition**: Detect 50+ obfuscation patterns
- **Variable Renaming**: Semantic renaming with context awareness
- **Code Beautification**: Format and prettify deobfuscated code
- **Framework Detection**: Identify React, Vue, Angular, Svelte, Node.js
- **Security Analysis**: Detect vulnerabilities and suspicious patterns

## Installation

### Global Installation (CLI)

```bash
npm install -g snippet-deobfuscator
```

### Local Installation (Library)

```bash
npm install snippet-deobfuscator
```

## Quick Start

### CLI Usage

```bash
# Deobfuscate from file
deobfuscate input.js -o output.js

# Deobfuscate from stdin
echo "obfuscated code" | deobfuscate

# Use specific agents
deobfuscate input.js --agents=string-decryptor,pattern-recognizer
```

### Programmatic Usage

```javascript
const deobfuscator = require('snippet-deobfuscator');

// Basic deobfuscation
const result = deobfuscator.deobfuscate(obfuscatedCode);
console.log(result.code);

// Using specific agents
const result = deobfuscator.analyze(obfuscatedCode, {
  agents: ['string-decryptor', 'control-flow-analyzer']
});
```

## Agents

The deobfuscator uses a modular agent system:

| Agent | Description |
|-------|-------------|
| [String Decryptor](agents/string-decryptor/README.md) | Decodes obfuscated strings |
| [Pattern Recognizer](agents/pattern-recognizer/README.md) | Detects obfuscation patterns |
| [Control Flow Analyzer](agents/control-flow-analyzer/README.md) | Analyzes control flow |
| [Renamer](agents/renamer/README.md) | Semantic variable naming |
| [Beautifier](agents/beautifier/README.md) | Code formatting |
| [Framework Detector](agents/framework-detector/README.md) | Identifies frameworks |
| [Validator](agents/validator/README.md) | Validates deobfuscated code |
| [Orchestrator](agents/orchestrator/README.md) | Coordinates all agents |

## Configuration

### CLI Options

```bash
deobfuscate [input] [options]

Options:
  -o, --output <file>     Output file
  -a, --agents <agents>   Comma-separated agent list
  -c, --config <file>    Config file
  -v, --verbose           Verbose output
  --no-color              Disable colors
  -h, --help              Show help
```

### Programmatic Options

```javascript
const result = deobfuscator.deobfuscate(code, {
  // Agent selection
  agents: ['string-decryptor', 'pattern-recognizer', 'renamer'],
  
  // Analysis options
  maxDepth: 5,
  cacheEnabled: true,
  
  // Output options
  verbose: false,
  generateMap: false
});
```

## Architecture

```
snippet-deobfuscator/
├── agents/                 # Agent implementations
│   ├── string-decryptor/  # String decryption
│   ├── pattern-recognizer/ # Pattern detection
│   ├── control-flow-analyzer/ # Control flow
│   ├── renamer/           # Variable renaming
│   ├── beautifier/        # Code formatting
│   ├── framework-detector/# Framework detection
│   ├── validator/         # Code validation
│   └── orchestrator/      # Agent coordination
├── skills/                # Specialized skills
├── tools/                 # Utility tools
├── rules/                 # Deobfuscation rules
├── cli.js                 # CLI entry point
└── index.js               # Library entry point
```

## Examples

### Deobfuscate Minified Code

```javascript
const { deobfuscate } = require('snippet-deobfuscator');

const minified = `function a(b){return b.map(c=>c*2);}`;
const result = deobfuscate(minified);

console.log(result.code);
// Output: function a(b) { return b.map(function(c) { return c * 2; }); }
```

### Analyze Obfuscated Code

```javascript
const { analyze } = require('snippet-deobfuscator');

const code = `eval(atob('YWxlcnQoJ2hlbGxvJyk='))`;
const analysis = analyze(code);

console.log(analysis.patterns);
// Output: [{ type: 'eval', severity: 'critical' }, { type: 'base64', severity: 'high' }]
```

### Custom Agent Pipeline

```javascript
const { createPipeline } = require('snippet-deobfuscator');

const pipeline = createPipeline([
  'string-decryptor',
  'pattern-recognizer',
  'control-flow-analyzer',
  'renamer',
  'beautifier'
]);

const result = pipeline(obfuscatedCode);
```

## Development

### Setup

```bash
git clone https://github.com/LifeJiggy/Snippet-Deobfuscator.git
cd Snippet-Deobfuscator
npm install
```

### Testing

```bash
npm test
```

### Build

```bash
# Build CLI
npm run build
```

## Documentation

- [CLI Usage](usage.md)
- [Programmatic API](programmatic-usage.md)
- [Agent Documentation](agents/)
- [Tools](tools/)
- [Skills](skills/)

## License

MIT License - see [LICENSE](LICENSE) for details

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md).

## Support

- [Report Issues](https://github.com/LifeJiggy/Snippet-Deobfuscator/issues)
- [Discussions](https://github.com/LifeJiggy/Snippet-Deobfuscator/discussions)

## Related

- [JavaScript Deobfuscator](https://github.com/LifeJiggy) - Related projects
- [ Babel](https://babel.dev/) - AST manipulation
- [Prettier](https://prettier.io/) - Code formatting
