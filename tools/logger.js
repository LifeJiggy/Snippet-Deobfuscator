/**
 * Logger
 * Production-grade logging system with multiple output formats
 * Version: 3.0.0
 */
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

class Logger extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = "logger";
    this.version = "3.0.0";

    this.options = {
      level: options.level || "info",
      output: options.output || "console",
      file: options.file || null,
      json: options.json || false,
      colors: options.colors !== false,
      timestamp: options.timestamp !== false,
      prefix: options.prefix || "",
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      maxFiles: options.maxFiles || 5,
    };

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };

    this.currentLevel = this.levels[this.options.level] || 1;
    this.history = [];
    this.maxHistory = options.maxHistory || 1000;

    // Initialize file stream if needed
    if (this.options.file) {
      this.initFileStream();
    }
  }

  /**
   * Initialize file stream
   */
  initFileStream() {
    try {
      const dir = path.dirname(this.options.file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.fileStream = fs.createWriteStream(this.options.file, {
        flags: "a",
        encoding: "utf8",
      });

      // Rotate if file exists and is too large
      if (fs.existsSync(this.options.file)) {
        const stats = fs.statSync(this.options.file);
        if (stats.size > this.options.maxFileSize) {
          this.rotateFile();
        }
      }
    } catch (error) {
      console.error("Failed to initialize file stream:", error);
    }
  }

  /**
   * Rotate log file
   */
  rotateFile() {
    try {
      // Close current stream
      if (this.fileStream) {
        this.fileStream.end();
      }

      // Rotate existing files
      for (let i = this.options.maxFiles - 1; i >= 1; i--) {
        const oldFile = `${this.options.file}.${i}`;
        const newFile = `${this.options.file}.${i + 1}`;

        if (fs.existsSync(oldFile)) {
          if (i === this.options.maxFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current file
      if (fs.existsSync(this.options.file)) {
        fs.renameSync(this.options.file, `${this.options.file}.1`);
      }

      // Reinitialize stream
      this.initFileStream();
    } catch (error) {
      console.error("Failed to rotate log file:", error);
    }
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    this.log("debug", message, ...args);
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    this.log("info", message, ...args);
  }

  /**
   * Log warning
   */
  warn(message, ...args) {
    this.log("warn", message, ...args);
  }

  /**
   * Log error
   */
  error(message, ...args) {
    this.log("error", message, ...args);
  }

  /**
   * Log fatal error
   */
  fatal(message, ...args) {
    this.log("fatal", message, ...args);
  }

  /**
   * Main log method
   */
  log(level, message, ...args) {
    const levelNum = this.levels[level] || 1;

    if (levelNum < this.currentLevel) {
      return;
    }

    const entry = this.createLogEntry(level, message, args);

    // Add to history
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Emit event
    this.emit("log", entry);
    this.emit(level, entry);

    // Output
    this.output(entry);
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, args) {
    const timestamp = new Date().toISOString();
    const formattedMessage =
      args.length > 0
        ? `${message} ${args.map((a) => this.formatArg(a)).join(" ")}`
        : message;

    return {
      timestamp,
      level,
      message: formattedMessage,
      prefix: this.options.prefix,
      args: args.map((a) => this.formatArg(a)),
    };
  }

  /**
   * Format argument for display
   */
  formatArg(arg) {
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    }
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }

  /**
   * Output log entry
   */
  output(entry) {
    const output = this.options.json
      ? JSON.stringify(entry)
      : this.formatForConsole(entry);

    // Console output
    if (this.options.output === "console" || this.options.output === "both") {
      const color = this.getColor(entry.level);
      const logFn =
        entry.level === "error" || entry.level === "fatal"
          ? console.error
          : console.log;

      if (this.options.colors) {
        logFn(color + output + "\x1b[0m");
      } else {
        logFn(output);
      }
    }

    // File output
    if (
      (this.options.output === "file" || this.options.output === "both") &&
      this.fileStream
    ) {
      this.fileStream.write(output + "\n");
    }
  }

  /**
   * Format for console output
   */
  formatForConsole(entry) {
    const parts = [];

    if (this.options.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);

    if (entry.prefix) {
      parts.push(`[${entry.prefix}]`);
    }

    parts.push(entry.message);

    return parts.join(" ");
  }

  /**
   * Get color for level
   */
  getColor(level) {
    const colors = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      fatal: "\x1b[35m", // Magenta
    };
    return colors[level] || "\x1b[0m";
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
    return this;
  }

  /**
   * Get log history
   */
  getHistory(level = null) {
    if (level) {
      return this.history.filter((e) => e.level === level);
    }
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    return this;
  }

  /**
   * Export logs to file
   */
  exportToFile(filePath, options = {}) {
    const logs = options.level
      ? this.history.filter((e) => e.level === options.level)
      : this.history;

    const content = logs
      .map((entry) =>
        this.options.json ? JSON.stringify(entry) : this.formatForConsole(entry)
      )
      .join("\n");

    fs.writeFileSync(filePath, content, "utf8");
    return this;
  }

  /**
   * Create child logger with prefix
   */
  child(prefix) {
    const childLogger = new Logger({
      ...this.options,
      prefix: prefix,
    });

    return childLogger;
  }

  /**
   * Set output file
   */
  setFile(filePath) {
    this.options.file = filePath;
    this.initFileStream();
    return this;
  }

  /**
   * Enable/disable colors
   */
  setColors(enabled) {
    this.options.colors = enabled;
    return this;
  }

  /**
   * Enable/disable timestamp
   */
  setTimestamp(enabled) {
    this.options.timestamp = enabled;
    return this;
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      total: this.history.length,
      byLevel: {},
    };

    for (const entry of this.history) {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
    }

    return stats;
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.fileStream) {
      this.fileStream.end();
    }
    this.history = [];
    this.removeAllListeners();
  }
}

module.exports = Logger;
