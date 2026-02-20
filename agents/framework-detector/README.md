# Framework Detector Agent

Production-grade specialized agent for detecting JavaScript frameworks, libraries, and build tools in obfuscated or minified code. Uses pattern matching, AST analysis, and signature detection to identify React, Vue, Angular, Svelte, Node.js, and 50+ libraries with version estimation and confidence scoring.

## Quick Start

```javascript
const { FrameworkDetector } = require('./agents/framework-detector');

// Basic detection
const detector = new FrameworkDetector();
const result = detector.detect(`
  function App() {
    const [count, setCount] = useState(0);
    useEffect(() => { document.title = count; }, [count]);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  }
`);

console.log(result.frameworks);
console.log(result.libraries);
```

## Installation

```bash
npm install @snippet-deobfuscator/framework-detector
```

Or include directly:

```javascript
const { FrameworkDetector, detect } = require('./agents/framework-detector');
```

## Features

### Framework Detection
- **React**: Hooks, Class components, Redux, React Router, Next.js, React Native
- **Vue**: Options API, Composition API, Vue Router, Vuex, Pinia, Nuxt
- **Angular**: Decorators, RxJS, Dependency Injection, Ivy, Standalone components
- **Svelte**: Reactive statements, Stores, Transitions, SvelteKit
- **Node.js**: Express, Koa, Fastify, NestJS, Hapi, Meteor, Sails

### Additional Detection
- **Libraries**: 50+ libraries (Lodash, Axios, Moment, Socket.io, Mongoose, etc.)
- **Build Tools**: Webpack, Vite, Rollup, Parcel, Babel, TypeScript
- **Server Frameworks**: Next.js, Nuxt, SvelteKit

### Advanced Features
- Version estimation
- Confidence scoring
- Security pattern analysis
- Obfuscation-resistant detection
- Batch processing

## API Reference

### Constructor

```javascript
const detector = new FrameworkDetector(options);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `detectReact` | boolean | true | Enable React detection |
| `detectVue` | boolean | true | Enable Vue.js detection |
| `detectAngular` | boolean | true | Enable Angular detection |
| `detectSvelte` | boolean | true | Enable Svelte detection |
| `detectNodejs` | boolean | true | Enable Node.js detection |
| `detectNextjs` | boolean | true | Enable Next.js detection |
| `detectLibraries` | boolean | true | Enable library detection |
| `detectBuildTools` | boolean | true | Enable build tool detection |
| `detectSecurity` | boolean | true | Enable security detection |
| `estimateVersions` | boolean | true | Estimate versions |
| `confidenceThreshold` | number | 0.5 | Min confidence (0-1) |
| `verboseLogging` | boolean | false | Enable debug logging |
| `timeout` | number | 15000 | Detection timeout (ms) |
| `enableCache` | boolean | true | Enable caching |

### Methods

#### detect(code, context)

Synchronous framework detection.

```javascript
const result = detector.detect(code, { source: 'bundle.js' });
```

**Returns:** Object containing:
- `frameworks`: Detected frameworks with confidence scores
- `libraries`: Detected libraries with match counts
- `buildTools`: Detected build tools
- `security`: Security patterns found
- `estimatedVersions`: Version estimates
- `confidence`: Confidence scores
- `statistics`: Detection statistics

#### detectAsync(code, context)

Asynchronous detection with timeout support.

```javascript
const result = await detector.detectAsync(code);
```

#### detectBatch(codes, options)

Batch detection of multiple code snippets.

```javascript
const results = await detector.detectBatch([
  code1,
  code2,
  code3
], {
  batchSize: 5,
  onProgress: ({ completed, total }) => console.log(`${completed}/${total}`)
});
```

#### detectFramework(code, framework)

Detect specific framework only.

```javascript
const result = detector.detectFramework(code, 'react');
```

#### on(event, callback)

Subscribe to detection events.

```javascript
detector.on('progress', (data) => {
  console.log(`Phase: ${data.phase}, Progress: ${data.progress * 100}%`);
});

detector.on('detectionComplete', (data) => {
  console.log(`Detected in ${data.detectionTime}ms`);
});
```

**Events:**
- `detectionStart` - Detection started
- `progress` - Progress update
- `detectionComplete` - Detection completed
- `detectionError` - Detection failed
- `cacheHit` - Result from cache

### Utility Functions

#### detect(code, options)

Convenience function for one-time detection.

```javascript
const { detect } = require('./agents/framework-detector');
const result = detect(code, { detectReact: true });
```

#### detectAsync(code, options)

Async convenience function.

```javascript
const { detectAsync } = require('./agents/framework-detector');
const result = await detectAsync(code);
```

#### getSupportedFrameworks()

Get list of supported frameworks.

```javascript
const { getSupportedFrameworks } = require('./agents/framework-detector');
console.log(getSupportedFrameworks());
```

#### getSupportedLibraries()

Get list of supported libraries.

```javascript
const { getSupportedLibraries } = require('./agents/framework-detector');
console.log(getSupportedLibraries());
```

#### getConfigSchema()

Get JSON schema for configuration.

```javascript
const { getConfigSchema } = require('./agents/framework-detector');
// Returns JSON Schema for validation
```

## Examples

### Basic Detection

```javascript
const { FrameworkDetector } = require('./agents/framework-detector');

const detector = new FrameworkDetector();
const code = `
  import React, { useState, useEffect } from 'react';
  function App() {
    const [count, setCount] = useState(0);
    return <div>{count}</div>;
  }
`;

const result = detector.detect(code);
console.log('Frameworks:', result.frameworks);
console.log('Confidence:', result.confidence);
```

### React Detection with Version

```javascript
const detector = new FrameworkDetector({
  estimateVersions: true,
  confidenceThreshold: 0.7
});

const result = detector.detect(reactCode);

const react = result.frameworks.find(f => f.name === 'react');
if (react) {
  console.log('React detected!');
  console.log('Version:', result.estimatedVersions.react);
  console.log('Confidence:', react.confidence);
  console.log('Matched patterns:', react.matchedPatterns);
}
```

### Full Detection with Security

```javascript
const detector = new FrameworkDetector({
  detectLibraries: true,
  detectBuildTools: true,
  detectSecurity: true,
  detectNextjs: true
});

const result = detector.detect(code);

console.log('Frameworks:', result.frameworks.map(f => f.name));
console.log('Libraries:', result.libraries.map(l => l.name));
console.log('Build Tools:', result.buildTools);
console.log('Security Issues:', result.security);
```

### Batch Processing

```javascript
const { detectBatch } = require('./agents/framework-detector');

const files = [
  './src/app.js',
  './src/utils.js',
  './src/components/*.js'
];

const results = await detectBatch(files, {
  batchSize: 10,
  onProgress: ({ completed, total, percentage }) => {
    console.log(`Progress: ${percentage.toFixed(1)}%`);
  }
});

// Aggregate results
const frameworks = new Set();
results.forEach(r => r.frameworks?.forEach(f => frameworks.add(f.name)));
console.log('All frameworks:', Array.from(frameworks));
```

### Progress Tracking

```javascript
const detector = new FrameworkDetector();

detector.on('progress', (data) => {
  process.stdout.write(`\r${data.phase}: ${(data.progress * 100).toFixed(0)}%`);
});

detector.on('detectionComplete', (data) => {
  console.log(`\nDetection complete in ${data.detectionTime}ms`);
});

const result = await detector.detectAsync(largeCodebase);
```

## Output Structure

```javascript
{
  agent: "framework-detector",
  version: "3.0.0",
  timestamp: "2024-01-15T10:30:00.000Z",
  
  frameworks: [
    {
      name: "react",
      confidence: 0.95,
      version: "18.x",
      matchedPatterns: ["useState", "useEffect", "JSX"],
      indicators: ["useState hook", "useEffect hook", "React.Component"]
    }
  ],
  
  libraries: [
    {
      name: "lodash",
      matchCount: 15,
      patterns: ["_.map", "_.filter", "_.debounce"]
    }
  ],
  
  buildTools: [
    {
      name: "webpack",
      indicators: ["__webpack_require__"]
    }
  ],
  
  security: [
    {
      type: "auth",
      pattern: "jwt",
      severity: "info"
    }
  ],
  
  estimatedVersions: {
    react: "18.x",
    lodash: "4.x"
  },
  
  confidence: {
    framework: 0.95,
    library: 0.8,
    buildTool: 0.6
  },
  
  statistics: {
    totalPatterns: 500,
    matchedPatterns: 45
  },
  
  warnings: [],
  errors: [],
  analysisTime: 45
}
```

## Configuration Examples

### Minimal Configuration

```javascript
const detector = new FrameworkDetector();
// Uses all defaults
```

### React-Focused

```javascript
const detector = new FrameworkDetector({
  detectReact: true,
  detectNextjs: true,
  detectRedux: true,
  estimateVersions: true,
  confidenceThreshold: 0.7
});
```

### Security Analysis

```javascript
const detector = new FrameworkDetector({
  detectSecurity: true,
  detectLibraries: true,
  detectBuildTools: true
});
```

### Performance-Optimized

```javascript
const detector = new FrameworkDetector({
  enableCache: true,
  timeout: 10000,
  detectReact: true,
  detectVue: true,
  detectAngular: true
});
```

## Supported Frameworks

| Framework | Indicators | Version Detection |
|-----------|------------|------------------|
| React | useState, useEffect, JSX | Yes |
| Vue | ref(), reactive, v-if | Yes |
| Angular | @Component, ngOnInit | Yes |
| Svelte | $:, onMount | Yes |
| Express | app.get, router.post | No |
| Next.js | getStaticProps, useRouter | Yes |

## Supported Libraries

- DOM: jQuery, Zepto
- Utility: Lodash, Underscore, Ramda
- HTTP: Axios, Fetch, Superagent
- Date: Moment, date-fns, Day.js
- Database: Mongoose, Sequelize, Prisma
- Real-time: Socket.io, WS
- Auth: Passport, JWT, BCrypt
- GraphQL: Apollo, GraphQL.js

## Troubleshooting

### Detection Timeout

If detection times out:

```javascript
const detector = new FrameworkDetector({
  timeout: 30000,
  detectLibraries: false,
  detectBuildTools: false
});
```

### Low Confidence Scores

Adjust threshold:

```javascript
const detector = new FrameworkDetector({
  confidenceThreshold: 0.3
});
```

### Memory Issues

Disable expensive features:

```javascript
const detector = new FrameworkDetector({
  enableCache: false,
  estimateVersions: false
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
