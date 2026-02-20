#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { deobfuscateSnippet } = require("./index.js");

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

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
      interactive: false,
      quiet: false,
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
          // Skip invalid configs
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

      if (arg === "--" || arg === "-" || !arg.startsWith("-")) {
        parsed.positional.push(arg);
        i++;
        continue;
      }

      const nextArg = args[i + 1];

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
        case "-q":
        case "--quiet":
          parsed.quiet = true;
          parsed.verbose = false;
          i++;
          break;
        case "-y":
        case "--yes":
          parsed.interactive = false;
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
          this.log(`Unknown option: ${arg}`, "error");
          this.showHelp();
          process.exit(1);
      }
    }

    this.options = { ...this.options, ...parsed };
    return this.options;
  }

  showBanner() {
    if (this.options.quiet) return;

    const banner = `
${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗
║${COLORS.reset}   ${COLORS.bold}JS Snippet Deobfuscator${COLORS.reset} ${COLORS.gray}v3.0.0${COLORS.reset}                            ${COLORS.cyan}║
║${COLORS.reset}   Transform obfuscated code into readable JavaScript        ${COLORS.cyan}║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}
`;
    console.log(banner);
  }

  showHelp() {
    const help = `
${COLORS.bold}Usage:${COLORS.reset}
  ${COLORS.green}node cli.js${COLORS.reset} <input> [output] [options]
  ${COLORS.green}node cli.js${COLORS.reset} [options]

${COLORS.bold}Input:${COLORS.reset}
  ${COLORS.cyan}input.js${COLORS.reset}              Input JavaScript file
  ${COLORS.cyan}-${COLORS.reset}                      Read from stdin (pipe)

${COLORS.bold}Options:${COLORS.reset}
  ${COLORS.yellow}-i, --input <file>${COLORS.reset}   Input file path
  ${COLORS.yellow}-o, --output <file>${COLORS.reset} Output file path
  ${COLORS.yellow}-f, --format${COLORS.reset}        Format output code (default: true)
  ${COLORS.yellow}--no-format${COLORS.reset}         Don't format output code
  ${COLORS.yellow}-v, --verbose${COLORS.reset}        Verbose output with details
  ${COLORS.yellow}-q, --quiet${COLORS.reset}          Quiet mode (minimal output)
  ${COLORS.yellow}-s, --stats${COLORS.reset}          Show processing statistics
  ${COLORS.yellow}-j, --json${COLORS.reset}           Output result as JSON
  ${COLORS.yellow}-w, --watch${COLORS.reset}          Watch input file for changes
  ${COLORS.yellow}--no-color${COLORS.reset}          Disable colored output
  ${COLORS.yellow}-h, --help${COLORS.reset}          Show this help message
  ${COLORS.yellow}-V, --version${COLORS.reset}        Show version

${COLORS.bold}Examples:${COLORS.reset}
  ${COLORS.gray}# Process a file${COLORS.reset}
  ${COLORS.green}node cli.js${COLORS.reset} input.js output.js

  ${COLORS.gray}# Process with verbose output${COLORS.reset}
  ${COLORS.green}node cli.js${COLORS.reset} -v input.js

  ${COLORS.gray}# Pipe input${COLORS.reset}
  ${COLORS.green}echo${COLORS.reset} "const x = 1+2;" | ${COLORS.green}node cli.js${COLORS.reset} -

  ${COLORS.gray}# Watch for changes${COLORS.reset}
  ${COLORS.green}node cli.js${COLORS.reset} -w input.js output.js

${COLORS.bold}Quick Start:${COLORS.reset}
  ${COLORS.green}node cli.js${COLORS.reset} ${COLORS.cyan}<file>${COLORS.reset}           → Auto-generate output filename
  ${COLORS.green}node cli.js${COLORS.reset} ${COLORS.cyan}<file> -${COLORS.reset}       → Output to stdout
  ${COLORS.green}node cli.js${COLORS.reset} ${COLORS.cyan}-${COLORS.reset}             → Read from pipe
`;
    console.log(help);
  }

  showVersion() {
    console.log(`${COLORS.green}JS Snippet Deobfuscator v3.0.0${COLORS.reset}`);
    console.log(
      `${COLORS.gray}Deobfuscate JavaScript like a human expert${COLORS.reset}`
    );
  }

  log(message, level = "info") {
    if (this.options.quiet && level !== "error") return;
    if (!this.options.verbose && level === "debug") return;

    const prefix = {
      info: "[INFO]",
      warn: "[WARN]",
      error: "[ERROR]",
      debug: "[DEBUG]",
      success: "[OK]",
      result: "[RESULT]",
    };

    const color =
      level === "error"
        ? COLORS.red
        : level === "warn"
        ? COLORS.yellow
        : level === "success"
        ? COLORS.green
        : level === "debug"
        ? COLORS.gray
        : level === "result"
        ? COLORS.cyan
        : COLORS.reset;

    const prefixColor =
      level === "error"
        ? COLORS.red
        : level === "warn"
        ? COLORS.yellow
        : level === "success"
        ? COLORS.green
        : COLORS.blue;

    const output = this.options.noColor
      ? `${prefix[level] || "[INFO]"} ${message}`
      : `${prefixColor}${prefix[level] || "[INFO]"}${
          COLORS.reset
        } ${color}${message}${COLORS.reset}`;

    if (level === "error") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  printProgressBar(percent, message = "") {
    const width = 30;
    const filled = Math.round((width * percent) / 100);
    const bar = "█".repeat(filled) + "░".repeat(width - filled);
    const color =
      percent < 30 ? COLORS.red : percent < 70 ? COLORS.yellow : COLORS.green;
    process.stdout.write(
      `\r${COLORS.cyan}[${color}${bar}${COLORS.reset}] ${message}`
    );
    if (percent >= 100) process.stdout.write("\n");
  }

  processFile(inputPath, outputPath) {
    const startTime = Date.now();

    try {
      let code;
      const isStdin = inputPath === "-";

      if (isStdin) {
        code = fs.readFileSync(0, "utf-8");
      } else {
        if (!fs.existsSync(inputPath)) {
          this.log(`File not found: ${inputPath}`, "error");
          return null;
        }
        code = fs.readFileSync(inputPath, "utf-8");
      }

      if (!this.options.quiet) {
        const fileInfo = isStdin ? "stdin" : path.basename(inputPath);
        this.log(
          `Processing ${fileInfo} (${this.formatBytes(code.length)})...`
        );
      }

      if (this.options.verbose) {
        this.printProgressBar(20, "Parsing code...");
      }

      const result = deobfuscateSnippet(code);

      if (result.error) {
        this.log(`Deobfuscation failed: ${result.error}`, "error");
        if (this.options.verbose && result.stack) {
          console.error(result.stack);
        }
        return null;
      }

      const outputCode = result.code;
      const processingTime = Date.now() - startTime;

      if (outputPath) {
        fs.writeFileSync(outputPath, outputCode, "utf-8");
        this.log(`Saved to ${outputPath}`, "success");
      } else if (!isStdin) {
        const autoOutput = inputPath.replace(/\.js$/, ".deobfuscated.js");
        fs.writeFileSync(autoOutput, outputCode, "utf-8");
        this.log(`Saved to ${autoOutput}`, "success");
      } else {
        console.log("\n" + outputCode);
      }

      if (!this.options.quiet) {
        this.printSummary(
          result,
          processingTime,
          code.length,
          outputCode.length
        );
      }

      if (this.options.stats) {
        this.printStats(result, processingTime, code.length, outputCode.length);
      }

      if (this.options.verbose) {
        this.printVerboseOutput(result);
      }

      if (this.options.json) {
        console.log(JSON.stringify(result, null, 2));
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

  printSummary(result, time, inputSize, outputSize) {
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    console.log(`
${COLORS.green}┌─────────────────────────────────────┐${COLORS.reset}
${COLORS.green}│${COLORS.reset}  ${COLORS.bold}Deobfuscation Complete${
      COLORS.reset
    }           ${COLORS.green}│${COLORS.reset}
${COLORS.green}├─────────────────────────────────────┤${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Time:      ${COLORS.cyan}${time}ms${
      COLORS.reset
    }                  ${COLORS.green}│${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Input:     ${COLORS.cyan}${this.formatBytes(
      inputSize
    )}${COLORS.reset}                  ${COLORS.green}│${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Output:    ${COLORS.cyan}${this.formatBytes(
      outputSize
    )}${COLORS.reset}                  ${COLORS.green}│${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Savings:   ${
      savings > 0
        ? COLORS.green + savings + "%"
        : COLORS.red + "+" + Math.abs(savings) + "%"
    }                  ${COLORS.green}│${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Patterns:  ${COLORS.yellow}${
      result.patterns?.length || 0
    }${COLORS.reset}                       ${COLORS.green}│${COLORS.reset}
${COLORS.green}│${COLORS.reset}  Renames:   ${COLORS.yellow}${
      result.allRenames?.length || 0
    }${COLORS.reset}                       ${COLORS.green}│${COLORS.reset}
${COLORS.green}└─────────────────────────────────────┘${COLORS.reset}
`);

    if (result.detectedFrameworks?.length > 0) {
      console.log(
        `${COLORS.cyan}Detected: ${
          COLORS.green
        }${result.detectedFrameworks.join(", ")}${COLORS.reset}`
      );
    }
  }

  printStats(result, processingTime, inputSize, outputSize) {
    console.log(`
=== Statistics ===
  Processing Time:  ${processingTime}ms
  Input Size:       ${inputSize} bytes
  Output Size:      ${outputSize} bytes
  Size Reduction:   ${((1 - outputSize / inputSize) * 100).toFixed(1)}%
  Patterns Found:    ${result.patterns?.length || 0}
  Functionality:    ${result.functionality?.length || 0}
  Name Changes:      ${result.allRenames?.length || 0}
  Frameworks:       ${result.detectedFrameworks?.join(", ") || "None"}
`);
  }

  printVerboseOutput(result) {
    if (result.patterns?.length > 0) {
      console.log("\n=== Detected Patterns ===");
      result.patterns
        .slice(0, 10)
        .forEach((p) =>
          console.log(
            `  ${COLORS.cyan}•${COLORS.reset} ${COLORS.yellow}${p.name}${COLORS.reset}: ${p.description}`
          )
        );
      if (result.patterns.length > 10) {
        console.log(
          `  ${COLORS.gray}... and ${result.patterns.length - 10} more${
            COLORS.reset
          }`
        );
      }
    }

    if (result.detectedFrameworks?.length > 0) {
      console.log("\n=== Detected Frameworks ===");
      result.detectedFrameworks.forEach((f) =>
        console.log(`  ${COLORS.green}✓${COLORS.reset} ${f}`)
      );
    }

    if (result.allRenames?.length > 0) {
      console.log("\n=== Name Changes ===");
      const maxDisplay = Math.min(result.allRenames.length, 15);
      result.allRenames
        .slice(0, maxDisplay)
        .forEach((r) => console.log(`  ${COLORS.cyan}→${COLORS.reset} ${r}`));
      if (result.allRenames.length > maxDisplay) {
        console.log(
          `  ${COLORS.gray}... and ${
            result.allRenames.length - maxDisplay
          } more${COLORS.reset}`
        );
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
          this.log(`File changed, re-processing...`);
          this.processFile(inputPath, outputPath);
        }
      } catch (e) {
        // File might be temporarily unavailable
      }
    };

    this.log(`Watching ${inputPath} for changes...`);
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

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.clear();
    this.showBanner();

    console.log(`${COLORS.yellow}Interactive Mode${COLORS.reset}\n`);

    let inputPath = await question(
      `${COLORS.cyan}Input file (or - for pipe): ${COLORS.reset}`
    );
    inputPath = inputPath.trim() || inputPath;

    if (inputPath === "-") {
      console.log(
        `${COLORS.yellow}Paste your code (Ctrl+D when done):${COLORS.reset}`
      );
      let code = "";
      rl.on("line", (line) => {
        code += line + "\n";
      });

      setTimeout(async () => {
        rl.close();
        const result = deobfuscateSnippet(code);
        console.log("\n" + result.code);
      }, 100);
      return;
    }

    if (!fs.existsSync(inputPath)) {
      this.log(`File not found: ${inputPath}`, "error");
      process.exit(1);
    }

    let outputPath = await question(
      `${COLORS.cyan}Output file (Enter for auto): ${COLORS.reset}`
    );
    outputPath =
      outputPath.trim() || inputPath.replace(/\.js$/, ".deobfuscated.js");

    this.processFile(inputPath, outputPath);
  }

  run(args = process.argv.slice(2)) {
    if (args.length === 0) {
      this.showBanner();
      this.showHelp();
      process.exit(0);
    }

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
