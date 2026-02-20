# JavaScript Snippet Deobfuscator

A production-grade JavaScript deobfuscation tool that transforms obfuscated, minified, and packed JavaScript code into human-readable, well-structured source code. Built with 20 years of distributed systems and type-safe engineering expertise.

## Features

### Core Deobfuscation Capabilities

- **String Decryption**: Decrypts base64, hex, ROT13, XOR-encoded, and custom obfuscated strings
- **Control Flow Analysis**: Analyzes and reconstructs obfuscated control flow patterns
- **Pattern Recognition**: Detects and handles 50+ obfuscation patterns including:
  - Array access obfuscation (`arr["key"]["subkey"]`)
  - Arithmetic obfuscation (`(1+2)*(3+4)`)
  - Character code obfuscation (`String.fromCharCode`)
  - Encoded eval statements
  - Split string patterns
- **Framework Detection**: Automatically detects and handles:
  - React (including Hooks, Context, Redux)
  - Angular (with RxJS patterns)
  - Vue.js (2 & 3, Composition API)
  - Svelte
  - Next.js, Gatsby, Nuxt.js
  - Express/Koa backend patterns

### Advanced Features

- **Webpack Bundle Analysis**: Decodes numeric module IDs, chunk names
- **React-Specific Renaming**: Context-aware variable naming for React code
- **Node.js Module Recognition**: Identifies 100+ Node.js built-in modules
- **Unicode Fixup**: Repairs corrupted Unicode characters from obfuscation
- **Beautification**: Formats minified code with proper indentation
- **Functionality Detection**: Identifies 30+ code functionality patterns:
  - Event handlers, API calls, authentication
  - Storage operations, analytics tracking
  - State management, DOM manipulation

### AI-Powered Enhancements

- **AI Agent System**: Autonomous agents for complex deobfuscation tasks
- **Smart Rename Suggestions**: Context-aware variable/function naming
- **Pattern Learning**: Learns from processed code for better results

### User Interfaces

- **CLI**: Full-featured command-line interface with multiple modes
- **TUI**: Interactive terminal user interface
- **Programmatic API**: Use as a Node.js module
- **Pipe Support**: Process code via stdin/stdout

## Installation

```bash
npm install
```

## Usage

### CLI

```bash
# Process a file
node index.js input.js output.js

# Process via pipe
echo "obfuscated code" | node index.js -

# Use the deobfuscate command
node index.js snippet.js
```

### Programmatic Usage

```javascript
const { deobfuscateSnippet } = require("./index.js");

const result = deobfuscateSnippet(`
  function _0x12ab(x) {
    return String.fromCharCode(x);
  }
`);

console.log(result.code);
console.log(result.detectedFrameworks);
console.log(result.allRenames);
```

### TUI Mode

```bash
node tui.js
```

### CLI with Options

```bash
node cli.js --input input.js --output output.js --format --verbose
```

## API Reference

### deobfuscateSnippet(code)

**Parameters:**

- `code` (string): The obfuscated JavaScript code to deobfuscate

**Returns:**

```javascript
{
  code: string,                    // Deobfuscated code
  patterns: Array,                // Detected obfuscation patterns
  functionality: Array,           // Detected code functionality
  branches: Array,                // Control flow branches
  flow: Array,                    // Reconstructed control flow
  detectedFrameworks: Array,      // Detected frameworks
  allRenames: Array,             // All name changes applied
  nameSuggestions: Array,         // Name suggestions mapping
  error?: string,                 // Error message if failed
  stack?: string                  // Stack trace if failed
}
```

## Configuration

### Environment Variables

- `LINE_LIMIT`: Maximum lines to process (default: 700,000)
- `LARGE_FILE_THRESHOLD`: Size in bytes to skip heavy transformations (default: 2,000,000)

## Supported Obfuscation Types

| Type                    | Status | Description                   |
| ----------------------- | ------ | ----------------------------- |
| Base64                  | ✅     | Standard base64 encoding      |
| Hex                     | ✅     | Hexadecimal encoding          |
| ROT13                   | ✅     | Caesar cipher rotation        |
| XOR                     | ✅     | XOR encoding with common keys |
| Unicode                 | ✅     | Unicode escape sequences      |
| Array Access            | ✅     | Nested array property access  |
| Control Flow Flattening | ✅     | Switch-based flattening       |
| Webpack Bundles         | ✅     | Module ID mapping             |
| React Hooks             | ✅     | useState/useEffect detection  |

## Architecture

```
snippet-deobfuscator/
├── index.js              # Main entry point
├── cli.js               # CLI interface
├── tui.js               # TUI interface
├── patterns.js          # Pattern detection & framework analysis
├── detector.js          # Functionality detection
├── renamer.js           # Variable/function renaming
├── post_processing.js   # Post-processing fixes
├── module_analyzer.js   # Webpack module analysis
├── agents.md            # Agent system documentation
├── skills.md            # Skills system documentation
├── tools.md            # Tools system documentation
├── agents/              # AI agent system (8 agents)
│   ├── index.js
│   ├── string-decryptor/
│   ├── control-flow-analyzer/
│   ├── framework-detector/
│   ├── pattern-recognizer/
│   ├── renamer/
│   ├── beautifier/
│   ├── validator/
│   └── orchestrator/
├── skills/              # Deobfuscation skills
│   ├── index.js
│   └── string-decryption/
└── tools/              # Utility tools
    ├── index.js
    ├── config.js
    ├── logger.js
    ├── cache.js
    ├── parser.js
    ├── metrics.js
    └── validators.js
```

## Documentation

- [agents.md](agents.md) - AI Agent System (8 specialized agents)
- [skills.md](skills.md) - Specialized deobfuscation skills
- [tools.md](tools.md) - Configuration, logging, caching utilities

## Contributing

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT

## Credits

Built with:

- Babel (Parser, Traverse, Generator)
- Prettier (Code formatting)

## Roadmap

- [ ] Add more obfuscation detection patterns
- [ ] Implement AI-powered pattern learning
- [ ] Add GUI interface
- [ ] Support for TypeScript deobfuscation
- [ ] Add plugin system for custom obfuscators
