#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { deobfuscateSnippet } = require("./index.js");

class CLI {
  constructor() {
    this.options = {
      input: null,
      output: null,
      verbose: false,
      format: true,
      watch: false,
      stats: false,
      json: false,
      noColor: false,
      config: null,
    };
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPaths = [
      path.join(process.cwd(), ".deobfuscatorrc"),
      path.join(process.cwd(), "deobfuscator.config.js"),
      path.join(process.cwd(), "package.json"),
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          if (configPath.endsWith(".json")) {
            const pkg = JSON.parse(fs.readFileSync(configPath, "utf8"));
            return pkg.deobfuscator || {};
          }
          return require(configPath);
        } catch (e) {
          console.warn(`Warning: Failed to load config from ${configPath}`);
        }
      }
    }
    return {};
  }

  parseArgs(args) {
    const parsed = { positional: [] };
    let i = 0;

    while (i < args.length) {
      const arg = args[i];

      if (arg === "--" || !arg.startsWith("-")) {
        parsed.positional.push(arg);
        i++;
        continue;
      }

      const nextArg = args[i + 1];
      const isBoolean = !nextArg || nextArg.startsWith("-");

      switch (arg) {
        case "-i":
        case "--input":
          parsed.input = nextArg;
          i += 2;
          break;
        case "-o":
        case "--output":
          parsed.output = nextArg;
          i += 2;
          break;
        case "-f":
        case "--format":
          parsed.format = true;
          i++;
          break;
        case "--no-format":
          parsed.format = false;
          i++;
          break;
        case "-v":
        case "--verbose":
          parsed.verbose = true;
          i++;
          break;
        case "-w":
        case "--watch":
          parsed.watch = true;
          i++;
          break;
        case "-s":
        case "--stats":
          parsed.stats = true;
          i++;
          break;
        case "-j":
        case "--json":
          parsed.json = true;
          i++;
          break;
        case "--no-color":
          parsed.noColor = true;
          i++;
          break;
        case "-c":
        case "--config":
          parsed.config = nextArg;
          i += 2;
          break;
        case "-h":
        case "--help":
          this.showHelp();
          process.exit(0);
        case "-V":
        case "--version":
          this.showVersion();
          process.exit(0);
        default:
          console.error(`Unknown option: ${arg}`);
          this.showHelp();
          process.exit(1);
      }
    }

    this.options = { ...this.options, ...parsed };
    return this.options;
  }

  showHelp() {
    console.log(`
JavaScript Snippet Deobfuscator CLI

Usage: node cli.js [options] [input] [output]

Options:
  -i, --input <file>      Input file path
  -o, --output <file>    Output file path
  -f, --format           Format output code (default: true)
  --no-format            Don't format output code
  -v, --verbose          Verbose output
  -w, --watch            Watch input file for changes
  -s, --stats            Show statistics
  -j, --json             Output as JSON
  --no-color             Disable colored output
  -c, --config <file>    Custom config file
  -h, --help             Show this help message
  -V, --version          Show version

Examples:
  node cli.js input.js output.js
  node cli.js -i input.js -o output.js -v
  cat input.js | node cli.js -
  node cli.js --watch -v input.js output.js

Exit Codes:
  0   Success
  1   Error
`);
  }

  showVersion() {
    console.log("JS Snippet Deobfuscator v1.0.0");
  }

  log(message, level = "info") {
    if (!this.options.verbose && level === "debug") return;

    const colors = {
      reset: "\x1b[0m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
    };

    const prefix = {
      info: "[INFO]",
      warn: "[WARN]",
      error: "[ERROR]",
      debug: "[DEBUG]",
      success: "[OK]",
    };

    const color =
      level === "error"
        ? colors.red
        : level === "warn"
        ? colors.yellow
        : level === "success"
        ? colors.green
        : level === "debug"
        ? colors.cyan
        : colors.reset;

    const prefixColor =
      level === "error"
        ? colors.red
        : level === "warn"
        ? colors.yellow
        : level === "success"
        ? colors.green
        : colors.blue;

    const output = this.options.noColor
      ? `${prefix[level]} ${message}`
      : `${prefixColor}${prefix[level]}${colors.reset} ${color}${message}${colors.reset}`;

    if (level === "error") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  processFile(inputPath, outputPath) {
    const startTime = Date.now();

    try {
      const code =
        inputPath === "-"
          ? fs.readFileSync(0, "utf-8")
          : fs.readFileSync(inputPath, "utf-8");

      if (this.options.verbose) {
        this.log(
          `Processing ${inputPath === "-" ? "stdin" : inputPath}...`,
          "info"
        );
        this.log(`Input size: ${code.length} bytes`, "debug");
      }

      const result = deobfuscateSnippet(code);

      if (result.error) {
        this.log(result.error, "error");
        if (result.stack && this.options.verbose) {
          console.error(result.stack);
        }
        return null;
      }

      const outputCode = result.code;
      const processingTime = Date.now() - startTime;

      if (outputPath) {
        fs.writeFileSync(outputPath, outputCode, "utf-8");
        this.log(`Output written to ${outputPath}`, "success");
      } else {
        console.log(outputCode);
      }

      if (this.options.stats) {
        this.printStats(result, processingTime, code.length, outputCode.length);
      }

      if (this.options.verbose) {
        this.printVerboseOutput(result);
      }

      return result;
    } catch (error) {
      this.log(`Processing failed: ${error.message}`, "error");
      if (this.options.verbose) {
        console.error(error.stack);
      }
      return null;
    }
  }

  printStats(result, processingTime, inputSize, outputSize) {
    const stats = {
      "Processing Time": `${processingTime}ms`,
      "Input Size": `${inputSize} bytes`,
      "Output Size": `${outputSize} bytes`,
      Reduction: `${((1 - outputSize / inputSize) * 100).toFixed(1)}%`,
      "Patterns Found": result.patterns?.length || 0,
      Functionality: result.functionality?.length || 0,
      Renames: result.allRenames?.length || 0,
      Frameworks: result.detectedFrameworks?.join(", ") || "None",
    };

    console.log("\n=== Statistics ===");
    for (const [key, value] of Object.entries(stats)) {
      console.log(`${key}: ${value}`);
    }
  }

  printVerboseOutput(result) {
    if (result.patterns?.length > 0) {
      console.log("\n=== Detected Patterns ===");
      result.patterns.forEach((p) =>
        console.log(`  - ${p.name}: ${p.description}`)
      );
    }

    if (result.detectedFrameworks?.length > 0) {
      console.log("\n=== Detected Frameworks ===");
      result.detectedFrameworks.forEach((f) => console.log(`  - ${f}`));
    }

    if (result.allRenames?.length > 0) {
      console.log("\n=== Name Changes ===");
      const maxDisplay = Math.min(result.allRenames.length, 20);
      result.allRenames
        .slice(0, maxDisplay)
        .forEach((r) => console.log(`  - ${r}`));
      if (result.allRenames.length > maxDisplay) {
        console.log(`  ... and ${result.allRenames.length - maxDisplay} more`);
      }
    }
  }

  watchFile(inputPath, outputPath) {
    let lastHash = null;

    const checkAndProcess = () => {
      try {
        const code = fs.readFileSync(inputPath, "utf-8");
        const hash = this.hashCode(code);

        if (hash !== lastHash) {
          lastHash = hash;
          this.log(`File changed, re-processing...`, "info");
          this.processFile(inputPath, outputPath);
        }
      } catch (e) {
        // File might be temporarily unavailable
      }
    };

    this.log(`Watching ${inputPath} for changes...`, "info");
    setInterval(checkAndProcess, 1000);
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  run(args = process.argv.slice(2)) {
    this.parseArgs(args);

    const inputPath = this.options.input || this.options.positional[0];
    const outputPath = this.options.output || this.options.positional[1];

    if (!inputPath && inputPath !== "-") {
      this.log("No input specified", "error");
      this.showHelp();
      process.exit(1);
    }

    if (this.options.watch && inputPath !== "-") {
      this.watchFile(inputPath, outputPath);
    } else {
      const result = this.processFile(inputPath, outputPath);
      process.exit(result ? 0 : 1);
    }
  }
}

if (require.main === module) {
  const cli = new CLI();
  cli.run();
}

module.exports = CLI;
