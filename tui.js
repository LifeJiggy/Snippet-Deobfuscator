#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs");
const path = require("path");
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
  dim: "\x1b[2m",
};

class TUI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.currentFile = null;
    this.lastResult = null;
    this.history = [];
    this.commandHistory = [];
    this.historyIndex = -1;
    this.viewMode = "code";
  }

  clearScreen() {
    console.clear();
  }

  printBanner() {
    const banner = `
${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗
║${COLORS.reset}   ${COLORS.bold}JS Snippet Deobfuscator - Interactive Mode${COLORS.reset}        ${COLORS.cyan}║
║${COLORS.reset}   Transform obfuscated code into readable JavaScript          ${COLORS.cyan}║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}
`;
    console.log(banner);
  }

  printHelp() {
    console.log(`
${COLORS.bold}Commands:${COLORS.reset}
  ${COLORS.green}open <file>${COLORS.reset}     Open and deobfuscate a JavaScript file
  ${COLORS.green}pipe${COLORS.reset}            Read code from stdin/pipe
  ${COLORS.green}paste${COLORS.reset}           Paste code directly (multi-line)
  ${COLORS.green}show${COLORS.reset}            Show deobfuscated code
  ${COLORS.green}p${COLORS.reset}              Show patterns detected
  ${COLORS.green}f${COLORS.reset}              Show detected frameworks
  ${COLORS.green}r${COLORS.reset}              Show name changes/renames
  ${COLORS.green}s${COLORS.reset}              Show statistics
  ${COLORS.green}code${COLORS.reset}           Switch to code view
  ${COLORS.green}raw${COLORS.reset}            Show raw output (JSON)
  ${COLORS.green}save <file>${COLORS.reset}    Save output to file
  ${COLORS.green}view <name>${COLORS.reset}    Switch view: code|patterns|frames|renames|stats
  ${COLORS.green}clear${COLORS.reset}          Clear screen
  ${COLORS.green}h${COLORS.reset}              Show this help
  ${COLORS.green}history${COLORS.reset}        Show command history
  ${COLORS.green}quit/exit${COLORS.reset}      Exit the program

${COLORS.bold}Keyboard Shortcuts:${COLORS.reset}
  ${COLORS.gray}Ctrl+C${COLORS.reset}          Exit
  ${COLORS.gray}Tab${COLORS.reset}             Auto-complete commands
`);
  }

  printStatus() {
    const fileStatus = this.currentFile
      ? `${COLORS.green}✓${COLORS.reset} ${COLORS.cyan}${path.basename(
          this.currentFile
        )}${COLORS.reset}`
      : `${COLORS.yellow}○${COLORS.reset} No file loaded`;

    const viewStatus = this.lastResult
      ? `${COLORS.blue}View:${COLORS.reset} ${this.viewMode}`
      : "";

    console.log(
      `\n${COLORS.dim}────────────────────────────────────────────────────────────${COLORS.reset}`
    );
    console.log(`  ${fileStatus}  ${viewStatus}`);
    console.log(
      `${COLORS.dim}────────────────────────────────────────────────────────────${COLORS.reset}\n`
    );
  }

  async openFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(
          `\n${COLORS.red}✗ File not found: ${filePath}${COLORS.reset}`
        );
        return false;
      }

      console.log(
        `${COLORS.cyan}▸ Loading ${path.basename(filePath)}...${COLORS.reset}`
      );

      const code = fs.readFileSync(filePath, "utf-8");
      const stats = fs.statSync(filePath);

      console.log(
        `${COLORS.cyan}▸ Input: ${(stats.size / 1024).toFixed(1)} KB${
          COLORS.reset
        }`
      );
      console.log(`${COLORS.cyan}▸ Deobfuscating...${COLORS.reset}`);

      const result = deobfuscateSnippet(code);

      if (result.error) {
        console.log(`\n${COLORS.red}✗ Error: ${result.error}${COLORS.reset}`);
        if (result.stack) {
          console.log(`${COLORS.dim}${result.stack}${COLORS.reset}`);
        }
        return false;
      }

      this.lastResult = result;
      this.currentFile = filePath;
      this.viewMode = "code";

      const outputSize = (result.code.length / 1024).toFixed(1);
      const savings = ((1 - result.code.length / code.length) * 100).toFixed(1);

      console.log(`
${COLORS.green}✓ Deobfuscation Complete!${COLORS.reset}
${COLORS.dim}─${COLORS.reset} Output: ${outputSize} KB (${
        savings > 0 ? "+" : ""
      }${savings}%)
${COLORS.dim}─${COLORS.reset} Patterns: ${
        result.patterns?.length || 0
      }  |  Renames: ${result.allRenames?.length || 0}
${COLORS.dim}─${COLORS.reset} Frameworks: ${
        result.detectedFrameworks?.join(", ") || "none"
      }
`);

      return true;
    } catch (error) {
      console.log(`\n${COLORS.red}✗ Failed: ${error.message}${COLORS.reset}`);
      return false;
    }
  }

  async processFromPipe() {
    return new Promise((resolve) => {
      let code = "";
      this.rl.on("line", (line) => {
        code += line + "\n";
      });
      this.rl.once("close", () => resolve(code));
      setTimeout(() => resolve(""), 2000);
    });
  }

  async pasteCode() {
    console.log(
      `\n${COLORS.yellow}Paste your code (Ctrl+Z then Enter on Windows / Ctrl+D on Linux/Mac):${COLORS.reset}`
    );

    const code = await new Promise((resolve) => {
      let input = "";
      const listener = (line) => {
        input += line + "\n";
      };
      this.rl.on("line", listener);

      setTimeout(() => {
        this.rl.removeListener("line", listener);
        resolve(input);
      }, 3000);
    });

    if (code.trim()) {
      console.log(`${COLORS.cyan}▸ Processing...${COLORS.reset}`);
      const result = deobfuscateSnippet(code);

      if (result.error) {
        console.log(`\n${COLORS.red}✗ Error: ${result.error}${COLORS.reset}`);
        return;
      }

      this.lastResult = result;
      this.currentFile = "(pasted)";
      this.viewMode = "code";

      console.log(
        `${COLORS.green}✓ Done! Output: ${result.code.length} chars${COLORS.reset}`
      );
      this.showCode();
    } else {
      console.log(`${COLORS.yellow}No input received${COLORS.reset}`);
    }
  }

  showCode() {
    if (!this.lastResult) {
      console.log(
        `\n${COLORS.yellow}○ No code to display. Open a file first.${COLORS.reset}`
      );
      return;
    }

    console.log(`\n${COLORS.cyan}═══ Deobfuscated Code ═══${COLORS.reset}\n`);
    console.log(this.lastResult.code);
    console.log(`\n${COLORS.dim}═══ End of Code ═══${COLORS.reset}\n`);
  }

  showPatterns() {
    if (!this.lastResult?.patterns?.length) {
      console.log(`\n${COLORS.yellow}○ No patterns detected${COLORS.reset}`);
      return;
    }

    console.log(`\n${COLORS.cyan}═══ Detected Patterns ═══${COLORS.reset}\n`);
    this.lastResult.patterns.forEach((p, i) => {
      console.log(
        `  ${COLORS.green}•${COLORS.reset} ${COLORS.yellow}${p.name}${COLORS.reset}`
      );
      console.log(
        `    ${COLORS.dim}${p.description || "No description"}${COLORS.reset}`
      );
    });
    console.log("");
  }

  showFrameworks() {
    if (!this.lastResult?.detectedFrameworks?.length) {
      console.log(`\n${COLORS.yellow}○ No frameworks detected${COLORS.reset}`);
      return;
    }

    console.log(`\n${COLORS.cyan}═══ Detected Frameworks ═══${COLORS.reset}\n`);
    this.lastResult.detectedFrameworks.forEach((f) => {
      console.log(
        `  ${COLORS.green}✓${COLORS.reset} ${COLORS.bold}${f}${COLORS.reset}`
      );
    });
    console.log("");
  }

  showRenames() {
    if (!this.lastResult?.allRenames?.length) {
      console.log(`\n${COLORS.yellow}○ No name changes${COLORS.reset}`);
      return;
    }

    console.log(`\n${COLORS.cyan}═══ Name Changes ═══${COLORS.reset}\n`);
    this.lastResult.allRenames.slice(0, 30).forEach((r) => {
      console.log(`  ${COLORS.cyan}→${COLORS.reset} ${r}`);
    });
    if (this.lastResult.allRenames.length > 30) {
      console.log(
        `  ${COLORS.dim}... and ${this.lastResult.allRenames.length - 30} more${
          COLORS.reset
        }`
      );
    }
    console.log("");
  }

  showStats() {
    if (!this.lastResult) {
      console.log(`\n${COLORS.yellow}○ No statistics available${COLORS.reset}`);
      return;
    }

    const r = this.lastResult;
    console.log(`
${COLORS.cyan}═══ Statistics ═══${COLORS.reset}

  ${COLORS.yellow}Code Stats:${COLORS.reset}
    Output Length:     ${r.code?.length || 0} chars
    Patterns Found:   ${r.patterns?.length || 0}
    Functionality:    ${r.functionality?.length || 0}
    Name Changes:     ${r.allRenames?.length || 0}
    
  ${COLORS.yellow}Frameworks:${COLORS.reset}
    ${r.detectedFrameworks?.join(", ") || "None detected"}
    
  ${COLORS.yellow}Control Flow:${COLORS.reset}
    Branches:        ${r.branches?.length || 0}
`);
  }

  async saveFile(filePath) {
    if (!this.lastResult?.code) {
      console.log(`\n${COLORS.red}✗ No code to save${COLORS.reset}`);
      return;
    }

    try {
      fs.writeFileSync(filePath, this.lastResult.code, "utf-8");
      console.log(`\n${COLORS.green}✓ Saved to ${filePath}${COLORS.reset}`);
    } catch (error) {
      console.log(
        `\n${COLORS.red}✗ Save failed: ${error.message}${COLORS.reset}`
      );
    }
  }

  showHistory() {
    if (this.commandHistory.length === 0) {
      console.log(`\n${COLORS.yellow}○ No command history${COLORS.reset}`);
      return;
    }

    console.log(`\n${COLORS.cyan}═══ Command History ═══${COLORS.reset}\n`);
    this.commandHistory.forEach((cmd, i) => {
      console.log(
        `  ${COLORS.dim}${String(i + 1).padStart(2)}${COLORS.reset}  ${cmd}`
      );
    });
    console.log("");
  }

  async processCommand(input) {
    const cmd = input.trim();
    if (!cmd) return;

    this.commandHistory.push(cmd);
    if (this.commandHistory.length > 50) {
      this.commandHistory.shift();
    }
    this.historyIndex = this.commandHistory.length;

    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    switch (command) {
      case "open":
        if (!args) {
          console.log(`\n${COLORS.red}Usage: open <file>${COLORS.reset}`);
        } else {
          await this.openFile(args);
        }
        break;

      case "pipe":
        console.log(
          `${COLORS.yellow}Waiting for piped input...${COLORS.reset}`
        );
        const code = await this.processFromPipe();
        if (code) {
          const result = deobfuscateSnippet(code);
          this.lastResult = result;
          this.currentFile = "(pipe)";
          this.viewMode = "code";
          console.log(`${COLORS.green}✓ Processed!${COLORS.reset}`);
          this.showCode();
        }
        break;

      case "paste":
        await this.pasteCode();
        break;

      case "show":
      case "code":
        this.viewMode = "code";
        this.showCode();
        break;

      case "p":
      case "patterns":
        this.viewMode = "patterns";
        this.showPatterns();
        break;

      case "f":
      case "frameworks":
        this.viewMode = "frameworks";
        this.showFrameworks();
        break;

      case "r":
      case "renames":
      case "names":
        this.viewMode = "renames";
        this.showRenames();
        break;

      case "s":
      case "stats":
      case "statistics":
        this.viewMode = "stats";
        this.showStats();
        break;

      case "raw":
        console.log(JSON.stringify(this.lastResult, null, 2));
        break;

      case "view":
        const view = args.toLowerCase();
        if (["code", "patterns", "frames", "renames", "stats"].includes(view)) {
          this.viewMode = view === "frames" ? "frameworks" : view;
          console.log(
            `\n${COLORS.green}Switched to ${view} view${COLORS.reset}\n`
          );
          this[
            `show${
              this.viewMode.charAt(0).toUpperCase() + this.viewMode.slice(1)
            }`
          ]();
        } else {
          console.log(
            `\n${COLORS.red}Invalid view. Use: code|patterns|frames|renames|stats${COLORS.reset}`
          );
        }
        break;

      case "save":
        if (!args) {
          console.log(`\n${COLORS.red}Usage: save <file>${COLORS.reset}`);
        } else {
          await this.saveFile(args);
        }
        break;

      case "clear":
        this.clearScreen();
        this.printBanner();
        break;

      case "h":
      case "help":
        this.printHelp();
        break;

      case "history":
        this.showHistory();
        break;

      case "quit":
      case "exit":
        console.log(`\n${COLORS.cyan}Goodbye! 👋${COLORS.reset}\n`);
        process.exit(0);

      default:
        console.log(
          `\n${COLORS.red}Unknown command: ${command}${COLORS.reset}`
        );
        console.log(
          `Type ${COLORS.green}help${COLORS.reset} for available commands`
        );
    }
  }

  setupAutocomplete() {
    const commands = [
      "open",
      "pipe",
      "paste",
      "show",
      "patterns",
      "frameworks",
      "renames",
      "stats",
      "save",
      "view",
      "clear",
      "help",
      "history",
      "quit",
      "exit",
    ];

    this.rl.on("line", (line) => {
      const input = line.trim().toLowerCase();
      if (input) {
        const matches = commands.filter((c) => c.startsWith(input));
        if (matches.length === 1 && matches[0] !== input) {
          this.rl.write(matches[0].slice(input.length));
        }
      }
    });
  }

  async start() {
    this.clearScreen();
    this.printBanner();
    this.printHelp();
    this.printStatus();

    const ask = () => {
      this.rl.question(`${COLORS.green}▶${COLORS.reset} `, async (input) => {
        await this.processCommand(input);
        this.printStatus();
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
