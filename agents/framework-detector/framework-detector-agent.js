/**
 * Framework Detector Agent
 * Specialized in detecting JavaScript frameworks and libraries
 */
const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");

class FrameworkDetectorAgent {
  constructor() {
    this.name = "framework-detector";
    this.version = "3.0.0";

    // Framework patterns
    this.patterns = {
      react: {
        keywords: [
          "React",
          "useState",
          "useEffect",
          "useContext",
          "useReducer",
          "jsx",
          "_jsx",
        ],
        imports: ["react", "react-dom", "react-dom/client"],
        patterns: [/use[A-Z]\w+/, /React\.\w+/, /_\jsx/, /_jsxs/],
      },
      vue: {
        keywords: ["Vue", "createApp", "ref", "reactive", "computed", "watch"],
        imports: ["vue", "vue-router", "vuex"],
        patterns: [/Vue\.\w+/, /createApp\(/],
      },
      angular: {
        keywords: ["@Component", "@Injectable", "ngOnInit", "NgModule"],
        imports: ["@angular/core", "@angular/common"],
        patterns: [/@\w+\(/, /ng[A-Z]\w+/],
      },
      svelte: {
        keywords: ["svelte", "$$", "$state", "$derived"],
        imports: ["svelte"],
        patterns: [/\$\w+/, /\$\{.*\}/],
      },
      nextjs: {
        keywords: ["getStaticProps", "getServerSideProps", "useRouter", "Link"],
        imports: ["next", "next/router", "next/link"],
        patterns: [/get\w+Props/, /useRouter/],
      },
      express: {
        keywords: ["app.use", "app.get", "app.post", "router"],
        imports: ["express"],
        patterns: [/app\.\w+\(/, /router\.\w+\(/],
      },
      webpack: {
        keywords: ["__webpack_require__", "__WEBPACK_DEFAULT_EXPORT__"],
        imports: [],
        patterns: [/__webpack/, /_\w+\.\w+\(/],
      },
    };
  }

  /**
   * Main analysis entry point
   */
  analyze(code, context = {}) {
    const result = {
      agent: this.name,
      version: this.version,
      frameworks: [],
      libraries: [],
      buildTools: [],
      version: null,
      confidence: {},
      details: {},
      warnings: [],
    };

    try {
      // Detect frameworks
      for (const [name, pattern] of Object.entries(this.patterns)) {
        const detection = this.detectFramework(code, pattern);
        if (detection.detected) {
          result.frameworks.push(name);
          result.confidence[name] = detection.confidence;
          result.details[name] = detection.details;
        }
      }

      // Detect build tools
      result.buildTools = this.detectBuildTools(code);

      // Extract version info
      result.version = this.extractVersion(code);
    } catch (error) {
      result.warnings.push(`Detection error: ${error.message}`);
    }

    return result;
  }

  /**
   * Detect specific framework
   */
  detectFramework(code, pattern) {
    let score = 0;
    const details = { keywords: [], imports: [], patterns: [] };

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (code.includes(keyword)) {
        score += 1;
        details.keywords.push(keyword);
      }
    }

    // Check imports
    for (const imp of pattern.imports) {
      const importPattern = new RegExp(
        `require\\(['"]${imp}['"]\\)|from\\s+['"]${imp}['"]`
      );
      if (importPattern.test(code)) {
        score += 2;
        details.imports.push(imp);
      }
    }

    // Check patterns
    for (const pat of pattern.patterns) {
      if (pat.test(code)) {
        score += 2;
        details.patterns.push(pat.toString());
      }
    }

    const confidence = score >= 3 ? "high" : score >= 1 ? "medium" : "low";

    return {
      detected: score > 0,
      score,
      confidence,
      details,
    };
  }

  /**
   * Detect build tools
   */
  detectBuildTools(code) {
    const tools = [];

    if (code.includes("__webpack_require__")) tools.push("webpack");
    if (code.includes("_interopRequireDefault")) tools.push("babel");
    if (code.includes("__vite_ssr_import__")) tools.push("vite");
    if (code.includes("_rollupPluginBabelHelpers")) tools.push("rollup");
    if (code.includes("esbuild")) tools.push("esbuild");
    if (code.includes("parcelRequire")) tools.push("parcel");

    return tools;
  }

  /**
   * Extract version information
   */
  extractVersion(code) {
    const versionPatterns = [
      /react[@@]?v?([0-9.]+)/,
      /vue[@@]?v?([0-9.]+)/,
      /angular[@@]?v?([0-9.]+)/,
      /webpack[@@]?v?([0-9.]+)/,
      /express[@@]?v?([0-9.]+)/,
    ];

    for (const pattern of versionPatterns) {
      const match = code.match(pattern);
      if (match) {
        return { name: match[0].split("@")[0], version: match[1] };
      }
    }

    return null;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    // Cleanup if needed
  }
}

module.exports = FrameworkDetectorAgent;
