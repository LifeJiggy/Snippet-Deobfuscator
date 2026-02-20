#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { deobfuscateSnippet } = require("./index.js");

class TUI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.currentFile = null;
    this.results = [];
    this.history = [];
    this.cursor = 0;
    this.selectedIndex = 0;
  }

  clearScreen() {
    console.clear();
  }

  printHeader() {
    const header = `
╔═══════════════════════════════════════════════════════════════╗
║          JS Snippet Deobfuscator - Interactive Mode         ║
║                                                               ║
║  Commands:                                                   ║
║    open <file>    - Open and deobfuscate a file             ║
║    pipe           - Read from stdin                          ║
║    show           - Show deobfuscated code                  ║
║    patterns       - Show detected patterns                  ║
║    frameworks     - Show detected frameworks                ║
║    renames        - Show name changes                       ║
║    stats          - Show statistics                          ║
║    save <file>    - Save output to file                     ║
║    clear          - Clear screen                            ║
║    history        - Show command history                    ║
║    exit/quit      - Exit the program                        ║
║    help           - Show this help                          ║
╚═══════════════════════════════════════════════════════════════╝
`;
    console.log("\x1b[36m%s\x1b[0m", header);
  }

  printStatus() {
    const status = this.currentFile
      ? `\x1b[32mCurrent file:\x1b[0m ${this.currentFile}`
      : "\x1b[33mNo file loaded\x1b[0m";
    console.log(status);
  }

  printMenu() {
    console.log("\n--- Results ---");
    if (this.results.length === 0) {
      console.log("No results to display");
    } else {
      this.results.forEach((result, index) => {
        const prefix = index === this.selectedIndex ? "> " : "  ";
        const color = index === this.selectedIndex ? "\x1b[33m" : "\x1b[0m";
        console.log(`${prefix}${color}${result.name}\x1b[0m`);
      });
    }
    console.log("");
  }

  async openFile(filePath) {
    try {
      console.log(`\x1b[36mLoading ${filePath}...\x1b[0m`);

      const code = fs.readFileSync(filePath, "utf-8");
      console.log(`\x1b[36mDeobfuscating...\x1b[0m`);

      const result = deobfuscateSnippet(code);

      if (result.error) {
        console.log(`\x1b[31mError: ${result.error}\x1b[0m`);
        return null;
      }

      this.currentFile = filePath;
      this.results = [
        { name: "Code", data: result.code },
        { name: "Patterns", data: result.patterns },
        { name: "Frameworks", data: result.detectedFrameworks },
        { name: "Renames", data: result.allRenames },
        { name: "Stats", data: this.buildStats(result) },
      ];
      this.selectedIndex = 0;

      console.log(`\x1b[32m✓ Successfully deobfuscated!\x1b[0m`);
      console.log(
        `  Frameworks: ${result.detectedFrameworks.join(", ") || "None"}`
      );
      console.log(`  Patterns: ${result.patterns.length}`);
      console.log(`  Renames: ${result.allRenames.length}`);

      return result;
    } catch (error) {
      console.log(`\x1b[31mError: ${error.message}\x1b[0m`);
      return null;
    }
  }

  buildStats(result) {
    return {
      inputLength: result.code?.length || 0,
      patternsCount: result.patterns?.length || 0,
      functionalityCount: result.functionality?.length || 0,
      renamesCount: result.allRenames?.length || 0,
      frameworks: result.detectedFrameworks,
    };
  }

  async readFromPipe() {
    return new Promise((resolve) => {
      let code = "";
      this.rl.on("data", (chunk) => {
        code += chunk;
      });
      this.rl.once("close", () => {
        resolve(code);
      });
    });
  }

  showCode() {
    const codeResult = this.results.find((r) => r.name === "Code");
    if (codeResult) {
      console.log("\n--- Deobfuscated Code ---\n");
      console.log(codeResult.data);
    } else {
      console.log("\x1b[31mNo code loaded\x1b[0m");
    }
  }

  showPatterns() {
    const patternResult = this.results.find((r) => r.name === "Patterns");
    if (patternResult && patternResult.data.length > 0) {
      console.log("\n--- Detected Patterns ---\n");
      patternResult.data.forEach((p) => {
        console.log(
          `\x1b[36m•\x1b[0m \x1b[33m${p.name}\x1b[0m: ${p.description}`
        );
      });
    } else {
      console.log("\x1b[33mNo patterns detected\x1b[0m");
    }
  }

  showFrameworks() {
    const frameworkResult = this.results.find((r) => r.name === "Frameworks");
    if (frameworkResult && frameworkResult.data.length > 0) {
      console.log("\n--- Detected Frameworks ---\n");
      frameworkResult.data.forEach((f) => {
        console.log(`\x1b[32m✓\x1b[0m ${f}`);
      });
    } else {
      console.log("\x1b[33mNo frameworks detected\x1b[0m");
    }
  }

  showRenames() {
    const renameResult = this.results.find((r) => r.name === "Renames");
    if (renameResult && renameResult.data.length > 0) {
      console.log("\n--- Name Changes ---\n");
      renameResult.data.slice(0, 30).forEach((r) => {
        console.log(`  ${r}`);
      });
      if (renameResult.data.length > 30) {
        console.log(
          `  \x1b[33m... and ${renameResult.data.length - 30} more\x1b[0m`
        );
      }
    } else {
      console.log("\x1b[33mNo renames\x1b[0m");
    }
  }

  showStats() {
    const statsResult = this.results.find((r) => r.name === "Stats");
    if (statsResult) {
      console.log("\n--- Statistics ---\n");
      const stats = statsResult.data;
      console.log(`  Input Length: ${stats.inputLength} bytes`);
      console.log(`  Patterns: ${stats.patternsCount}`);
      console.log(`  Functionality: ${stats.functionalityCount}`);
      console.log(`  Renames: ${stats.renamesCount}`);
      console.log(`  Frameworks: ${stats.frameworks.join(", ") || "None"}`);
    } else {
      console.log("\x1b[33mNo stats available\x1b[0m");
    }
  }

  async saveFile(filePath) {
    const codeResult = this.results.find((r) => r.name === "Code");
    if (codeResult) {
      try {
        fs.writeFileSync(filePath, codeResult.data, "utf-8");
        console.log(`\x1b[32m✓ Saved to ${filePath}\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[31mError saving: ${error.message}\x1b[0m`);
      }
    } else {
      console.log("\x1b[31mNo code to save\x1b[0m");
    }
  }

  showHistory() {
    console.log("\n--- Command History ---\n");
    if (this.history.length === 0) {
      console.log("No history");
    } else {
      this.history.forEach((cmd, index) => {
        console.log(`  ${index + 1}. ${cmd}`);
      });
    }
  }

  async processCommand(input) {
    const cmd = input.trim();
    if (!cmd) return;

    this.history.push(cmd);
    if (this.history.length > 50) {
      this.history.shift();
    }

    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "open":
        if (args.length === 0) {
          console.log("\x1b[31mUsage: open <file>\x1b[0m");
        } else {
          await this.openFile(args.join(" "));
        }
        break;

      case "pipe":
        console.log("\x1b[36mWaiting for input (Ctrl+D to finish)...\x1b[0m");
        const code = await this.readFromPipe();
        if (code) {
          const result = deobfuscateSnippet(code);
          this.results = [
            { name: "Code", data: result.code },
            { name: "Patterns", data: result.patterns },
            { name: "Frameworks", data: result.detectedFrameworks },
            { name: "Renames", data: result.allRenames },
          ];
          console.log("\x1b[32m✓ Processed from pipe!\x1b[0m");
        }
        break;

      case "show":
        this.showCode();
        break;

      case "patterns":
        this.showPatterns();
        break;

      case "frameworks":
        this.showFrameworks();
        break;

      case "renames":
      case "names":
        this.showRenames();
        break;

      case "stats":
      case "statistics":
        this.showStats();
        break;

      case "save":
        if (args.length === 0) {
          console.log("\x1b[31mUsage: save <file>\x1b[0m");
        } else {
          await this.saveFile(args.join(" "));
        }
        break;

      case "clear":
        this.clearScreen();
        this.printHeader();
        break;

      case "history":
        this.showHistory();
        break;

      case "help":
        this.printHeader();
        break;

      case "exit":
      case "quit":
        console.log("\x1b[36mGoodbye!\x1b[0m");
        process.exit(0);

      default:
        console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
        console.log('Type "help" for available commands');
    }
  }

  async start() {
    this.clearScreen();
    this.printHeader();
    this.printStatus();

    const ask = () => {
      this.rl.question("\n> ", async (input) => {
        await this.processCommand(input);
        ask();
      });
    };

    ask();
  }
}

if (require.main === module) {
  const tui = new TUI();
  tui.start();
}

module.exports = TUI;
