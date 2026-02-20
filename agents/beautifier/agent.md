# Beautifier Agent

## Overview

**Class:** `BeautifierAgent`  
**Priority:** 6  
**Timeout:** 60s  
**Version:** 1.0.0

The Beautifier Agent provides production-grade code beautification and formatting for JavaScript deobfuscation workflows.

## Capabilities

- **Multi-language Support**: JavaScript, TypeScript, JSX, TSX, JSON, CSS, HTML, Markdown
- **Syntax Error Detection**: Identifies and fixes common syntax issues
- **Prettier Integration**: Industry-standard formatting with full configuration
- **Fallback Formatting**: Babel-based formatting when Prettier fails
- **Custom Rules**: Configurable indentation, line width, brace style, quotes, and whitespace
- **Statistics Tracking**: Reports formatting changes, reductions, and statistics

## Options

| Option         | Type    | Default  | Description                             |
| -------------- | ------- | -------- | --------------------------------------- |
| tabWidth       | number  | 2        | Number of spaces per indentation level  |
| useTabs        | boolean | false    | Use tabs instead of spaces              |
| semi           | boolean | true     | Add semicolons at the end of statements |
| singleQuote    | boolean | true     | Use single quotes instead of double     |
| trailingComma  | string  | "es5"    | Trailing comma style (es5, all, none)   |
| bracketSpacing | boolean | true     | Add spaces between braces in objects    |
| arrowParens    | string  | "always" | Include parens in arrow functions       |
| endOfLine      | string  | "lf"     | Line ending style (lf, cr, crlf)        |
| printWidth     | number  | 100      | Maximum line length                     |
| verboseLogging | boolean | false    | Enable verbose logging                  |
| timeout        | number  | 60000    | Timeout in milliseconds                 |

## Usage

```javascript
const { BeautifierAgent } = require("./agents/beautifier");

const agent = new BeautifierAgent({ tabWidth: 2, singleQuote: true });
const result = agent.analyze(obfuscatedCode);

console.log(result.formatted);
console.log(result.statistics);
```

## Output

```json
{
  "agent": "beautifier",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "formatted": "const foo = 'bar';",
  "originalLength": 5000,
  "formattedLength": 4500,
  "language": "javascript",
  "statistics": {
    "originalLength": 5000,
    "formattedLength": 4500,
    "originalLines": 100,
    "formattedLines": 95,
    "linesChanged": 5,
    "reduction": "10.00%",
    "commentsPreserved": 0,
    "syntaxFixed": 1,
    "formattingPasses": 1
  },
  "changes": [],
  "warnings": [],
  "errors": [],
  "analysisTime": 150
}
```

## Methods

### analyze(code, context)

Main method to beautify code.

**Parameters:**

- `code` (string): JavaScript code to beautify
- `context` (object): Optional context information

**Returns:** Object containing formatted code and statistics

### formatSection(code, startLine, endLine, options)

Format a specific section of code.

### formatWithCustomRules(code, rules)

Apply custom formatting rules to code.

### setOptions(options)

Update agent configuration options.

### getStatistics()

Get formatting statistics.

## Dependencies

- `prettier`: Code formatting
- `@babel/traverse`: AST traversal
- `@babel/generator`: AST to code generation
- `@babel/parser`: Code parsing

## Related Documentation

- [Main README](../README.md) - Project overview
- [Orchestrator Agent](../orchestrator/README.md) - Agent coordination
- [Control Flow Analyzer Agent](../control-flow-analyzer/README.md) - Control flow analysis
