# Renamer Agent

Production-grade specialized agent for intelligent variable and function renaming with context awareness. Provides semantic naming suggestions based on code patterns, scope analysis, and framework-specific conventions.

## Version

**3.0.0** - World-class renaming with semantic analysis and framework support

## Quick Start

```javascript
const { Renamer } = require('./agents/renamer');

// Basic usage
const agent = new Renamer();
const result = agent.analyze(obfuscatedCode);

console.log('Renames:', result.renames);
console.log('Suggestions:', result.suggestions);
```

## Overview

The Renamer Agent is a critical component in the JavaScript deobfuscation system, specializing in intelligent variable and function renaming with context awareness. It transforms obfuscated single-letter variable names into meaningful semantic names based on usage patterns, scope analysis, and framework conventions.

This agent supports multiple frameworks including React, Vue, Angular, Svelte, and Node.js, with framework-specific naming conventions and best practices.

For comprehensive documentation including advanced features, troubleshooting, API reference, and examples, see the detailed [agent.md](agent.md) file.

## Features

### Variable Renaming

- **Single-letter Variables**: Rename a, b, c, i, j, k to meaningful names
- **Obfuscated Names**: Handle _0x1234, $abc, O0O patterns
- **Preserve Prefixes**: Keep _ and $ prefixes when desired
- **Scope Awareness**: Consider variable scope for safe renaming

### Function Renaming

- **Anonymous Functions**: Name anonymous functions based on context
- **Callback Functions**: Infer names from callback patterns
- **Event Handlers**: Detect and name event handlers
- **API Functions**: Recognize and name fetch/load/save patterns

### Semantic Analysis

- **Usage Analysis**: Analyze how variables are used to infer meaning
- **Type Inference**: Infer types from operations and comparisons
- **Context Awareness**: Use surrounding code for better names
- **Dictionary Lookup**: Built-in dictionary for common patterns

### Framework Support

- **React**: Components (PascalCase), hooks (use prefix), props
- **Vue**: Components, methods, props, events
- **Angular**: Components, services, pipes
- **Svelte**: Components, reactive statements
- **Node.js**: Modules, classes, functions

## Configuration

```javascript
const agent = new Renamer({
  // Target framework
  framework: 'react',
  
  // Name length limits
  maxNameLength: 20,
  minNameLength: 2,
  
  // Caching
  cacheEnabled: true,
  cacheTTL: 300000,
  cacheSize: 500,
  
  // Prefix/suffix preservation
  preservePrefixes: ['_', '$'],
  preserveSuffixes: [],
  
  // Analysis options
  semanticNaming: true,
  contextAware: true,
  generateSuggestions: true,
  
  // Naming convention
  namingConvention: 'camelCase',
  
  // Timeout
  timeout: 40000,
  verboseLogging: false
});
```

## Output Structure

```javascript
{
  agent: 'renamer',
  version: '3.0.0',
  renames: [
    {
      type: 'variable',
      original: 'a',
      suggested: 'item',
      scope: 'local',
      confidence: 0.95,
      reason: 'Used in array iteration'
    }
  ],
  suggestions: [
    {
      original: 'x',
      suggestions: ['index', 'iterator', 'position'],
      category: 'loop',
      confidence: 0.88
    }
  ],
  conflicts: [],
  scopeMap: {
    global: ['console', 'window', 'document'],
    module: ['exports', 'require', 'module'],
    function: ['a', 'b', 'result']
  },
  statistics: {
    variablesAnalyzed: 50,
    renamesSuggested: 25,
    conflicts: 0,
    analysisTime: 150
  },
  warnings: [],
  errors: []
}
```

## Naming Patterns

### Variable Categories

| Category | Single Letter | Meaningful Names |
|----------|--------------|-----------------|
| Loops | i, j, k | iterator, index, item, element, key, value |
| Counters | n, c | count, total, sum, position, num |
| Strings | s, str | text, string, name, label, title, message |
| Numbers | n, num | value, amount, quantity, number, id |
| Booleans | f, b | isValid, isEnabled, hasValue, canEdit |
| Arrays | arr | items, list, collection, elements, data |
| Objects | obj | config, options, settings, object, data |

### Function Categories

| Category | Obfuscated | Meaningful |
|----------|-----------|------------|
| Events | _0x1234 | handleEvent, onClick, handleClick |
| API | fn_1 | fetchData, getData, loadData, saveData |
| Validation | _0xabc | validate, check, verify, isValid |
| Transform | F_1 | transform, convert, parse, format |
| Init | init | initialize, init, setup, configure |

## Advanced Usage

### Async Analysis with Events

```javascript
const agent = new Renamer();

agent.on('analysis-start', (data) => {
  console.log(`Starting analysis of ${data.codeLength} chars`);
});

agent.on('rename-detected', (data) => {
  console.log(`Rename: ${data.original} -> ${data.suggested}`);
});

agent.on('analysis-complete', (data) => {
  console.log(`Complete: ${data.renamesCount} renames suggested`);
});

const result = await agent.analyzeAsync(code);
```

### Batch Processing

```javascript
const agent = new Renamer({ cacheEnabled: true });

const codes = [code1, code2, code3, code4];
const results = agent.analyzeBatch(codes, { 
  semanticNaming: true 
});

results.forEach((r, i) => {
  console.log(`File ${i}: ${r.result.renames.length} renames`);
});

// Check cache performance
console.log('Cache stats:', agent.getCacheStats());
```

### Framework-Specific Renaming

```javascript
// React naming conventions
const reactAgent = new Renamer({ 
  framework: 'react',
  namingConvention: 'camelCase'
});
const reactResult = reactAgent.analyze(reactCode);

// Angular naming conventions
const angularAgent = new Renamer({ 
  framework: 'angular',
  namingConvention: 'camelCase'
});
const angularResult = angularAgent.analyze(angularCode);
```

### Apply Renames to Code

```javascript
const agent = new Renamer();
const result = agent.analyze(code);

// Apply suggested renames
const renamedCode = agent.applyRenames(code, result.renames);
console.log(renamedCode);
```

### Custom Dictionary Extension

```javascript
const agent = new Renamer();

// Extend dictionary with custom names
agent.extendDictionary('api', ['fetchUser', 'saveUser', 'deleteUser']);
agent.extendDictionary('custom', ['myFunction', 'myHandler']);

const result = agent.analyze(code);
```

## Framework Conventions

### React

```javascript
// Components: PascalCase
function MyComponent() { }

// Hooks: camelCase with 'use' prefix
const useCustomHook = () => { };

// Props: camelCase
const { userName, onClick } = props;

// Events: camelCase with 'on' prefix
<button onClick={handleClick}>
```

### Vue

```javascript
// Components: PascalCase
Vue.component('MyComponent', { });

// Methods: camelCase
methods: {
  handleClick() { }
}

// Props: kebab-case (template) / camelCase (script)
```

### Angular

```javascript
// Components: PascalCase
@Component({ })
class MyComponent { }

// Methods: camelCase
handleClick() { }

// Properties: camelCase
userName: string;
```

### Node.js

```javascript
// Modules: kebab-case or camelCase
const myModule = require('./my-module');

// Classes: PascalCase
class MyClass { }

// Functions: camelCase or PascalCase
function handleRequest() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
```

## Integration

### With Pattern Recognizer

```javascript
const { Renamer } = require('./agents/renamer');
const { PatternRecognizer } = require('./agents/pattern-recognizer');

const patternAgent = new PatternRecognizer();
const renamer = new Renamer();

// First detect patterns
const patterns = patternAgent.analyze(code);

// Then rename variables
const renameResult = renamer.analyze(code);
console.log('Renames:', renameResult.renames);
```

### With Beautifier

```javascript
const { Renamer } = require('./agents/renamer');
const { Beautifier } = require('./agents/beautifier');

const renamer = new Renamer();
const beautifier = new Beautifier();

// Rename first
const renamed = renamer.analyze(code);
const renamedCode = renamer.applyRenames(code, renamed.renames);

// Then beautify
const beautified = beautifier.analyze(renamedCode);
```

## Performance

- **Caching**: TTL-based cache with configurable size
- **Batch Processing**: Process multiple files efficiently
- **Scope Analysis**: Efficient scope tracking
- **Dictionary Lookup**: Fast semantic matching
- **Timeout Protection**: Configurable timeout

## Troubleshooting

### No Renames Suggested

1. Code may not have obfuscated names
2. Check if framework option matches code
3. Enable `verboseLogging` for debug info

### Poor Name Suggestions

1. Adjust `maxNameLength` and `minNameLength`
2. Use `semanticNaming: true`
3. Extend dictionary with `extendDictionary()`

### Name Conflicts

1. Check `result.conflicts` for issues
2. Use `preservePrefixes` to avoid conflicts
3. Enable `contextAware` for better resolution

## Related Documentation

- [Detailed Agent Documentation](agent.md) - Comprehensive technical guide
- [Pattern Recognizer Agent](../pattern-recognizer/README.md) - Obfuscation pattern detection
- [String Decryptor Agent](../string-decryptor/README.md) - String decryption
- [Beautifier Agent](../beautifier/README.md) - Code beautification
- [Main README](../../README.md) - Project overview
- [Contributing](../../CONTRIBUTING.md) - Contribution guidelines

## License

MIT License - See [LICENSE](../../LICENSE) for details

## Support

- Report bugs via [GitHub Issues](https://github.com/snippet-deobfuscator/snippet-deobfuscator/issues)
- Join discussions at [Discord](https://discord.gg/deobfuscator)
- Follow updates at [Twitter](https://twitter.com/deobfuscator)
