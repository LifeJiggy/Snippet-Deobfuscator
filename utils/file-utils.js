const fs = require("fs");
const path = require("path");

class FileUtils {
  constructor(options = {}) {
    this.name = "FileUtils";
    this.version = "3.0.0";
    this.options = {
      encoding: options.encoding || "utf8",
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      backupDir: options.backupDir || "./backups",
      tempDir: options.tempDir || "./temp",
    };
    this.statistics = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      totalCopies: 0,
      totalMoves: 0,
      errors: 0,
      bytesProcessed: 0,
    };
  }

  readFile(filePath, options = {}) {
    this.statistics.totalReads++;
    const absolutePath = this._resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      this.statistics.errors++;
      throw new Error(`File not found: ${absolutePath}`);
    }
    const stats = fs.statSync(absolutePath);
    if (stats.size > this.options.maxFileSize) {
      this.statistics.errors++;
      throw new Error(`File too large: ${stats.size} bytes`);
    }
    try {
      const encoding = options.encoding || this.options.encoding;
      const content = fs.readFileSync(absolutePath, encoding);
      this.statistics.bytesProcessed += stats.size;
      return content;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Read error: ${error.message}`);
    }
  }

  writeFile(filePath, content, options = {}) {
    this.statistics.totalWrites++;
    const absolutePath = this._resolvePath(filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      this._ensureDir(dir);
    }
    if (options.backup && fs.existsSync(absolutePath)) {
      this._createBackup(absolutePath);
    }
    try {
      const encoding = options.encoding || this.options.encoding;
      fs.writeFileSync(absolutePath, content, encoding);
      this.statistics.bytesProcessed += Buffer.byteLength(content, encoding);
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Write error: ${error.message}`);
    }
  }

  appendFile(filePath, content, options = {}) {
    this.statistics.totalWrites++;
    const absolutePath = this._resolvePath(filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      this._ensureDir(dir);
    }
    try {
      const encoding = options.encoding || this.options.encoding;
      fs.appendFileSync(absolutePath, content, encoding);
      this.statistics.bytesProcessed += Buffer.byteLength(content, encoding);
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Append error: ${error.message}`);
    }
  }

  deleteFile(filePath) {
    this.statistics.totalDeletes++;
    const absolutePath = this._resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      return false;
    }
    try {
      fs.unlinkSync(absolutePath);
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Delete error: ${error.message}`);
    }
  }

  copyFile(source, destination, options = {}) {
    this.statistics.totalCopies++;
    const sourcePath = this._resolvePath(source);
    const destPath = this._resolvePath(destination);
    if (!fs.existsSync(sourcePath)) {
      this.statistics.errors++;
      throw new Error(`Source file not found: ${sourcePath}`);
    }
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      this._ensureDir(destDir);
    }
    if (options.backup && fs.existsSync(destPath)) {
      this._createBackup(destPath);
    }
    try {
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(sourcePath);
      this.statistics.bytesProcessed += stats.size * 2;
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Copy error: ${error.message}`);
    }
  }

  moveFile(source, destination, options = {}) {
    this.statistics.totalMoves++;
    const sourcePath = this._resolvePath(source);
    const destPath = this._resolvePath(destination);
    if (!fs.existsSync(sourcePath)) {
      this.statistics.errors++;
      throw new Error(`Source file not found: ${sourcePath}`);
    }
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      this._ensureDir(destDir);
    }
    if (options.backup && fs.existsSync(destPath)) {
      this._createBackup(destPath);
    }
    try {
      fs.renameSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      this.statistics.bytesProcessed += stats.size;
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Move error: ${error.message}`);
    }
  }

  exists(filePath) {
    const absolutePath = this._resolvePath(filePath);
    return fs.existsSync(absolutePath);
  }

  isFile(filePath) {
    const absolutePath = this._resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) return false;
    const stats = fs.statSync(absolutePath);
    return stats.isFile();
  }

  isDirectory(dirPath) {
    const absolutePath = this._resolvePath(dirPath);
    if (!fs.existsSync(absolutePath)) return false;
    const stats = fs.statSync(absolutePath);
    return stats.isDirectory();
  }

  getStats(filePath) {
    const absolutePath = this._resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    const stats = fs.statSync(absolutePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      permissions: stats.mode,
    };
  }

  getSize(filePath) {
    const stats = this.getStats(filePath);
    return stats ? stats.size : 0;
  }

  getExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  getBasename(filePath) {
    return path.basename(filePath);
  }

  getDirname(filePath) {
    return path.dirname(filePath);
  }

  joinPath(...segments) {
    return path.join(...segments);
  }

  resolvePath(filePath) {
    return this._resolvePath(filePath);
  }

  _resolvePath(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  }

  listFiles(dirPath, options = {}) {
    const absolutePath = this._resolvePath(dirPath);
    if (!fs.existsSync(absolutePath)) {
      return [];
    }
    try {
      let files = fs.readdirSync(absolutePath, { withFileTypes: true });
      if (options.filesOnly) {
        files = files.filter((f) => f.isFile());
      }
      if (options.directoriesOnly) {
        files = files.filter((f) => f.isDirectory());
      }
      if (options.extension) {
        const ext = options.extension.startsWith(".")
          ? options.extension
          : `.${options.extension}`;
        files = files.filter((f) => f.isFile() && path.extname(f.name) === ext);
      }
      if (options.pattern) {
        const regex = new RegExp(options.pattern);
        files = files.filter((f) => regex.test(f.name));
      }
      if (options.recursive) {
        const allFiles = [];
        for (const file of files) {
          const fullPath = path.join(absolutePath, file.name);
          if (file.isDirectory()) {
            const subFiles = this.listFiles(fullPath, options);
            allFiles.push(...subFiles.map((f) => path.join(file.name, f)));
          } else {
            allFiles.push(file.name);
          }
        }
        return allFiles;
      }
      return files.map((f) => f.name);
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`List error: ${error.message}`);
    }
  }

  createDirectory(dirPath, options = {}) {
    const absolutePath = this._resolvePath(dirPath);
    if (fs.existsSync(absolutePath)) {
      return false;
    }
    try {
      if (options.recursive !== false) {
        fs.mkdirSync(absolutePath, { recursive: true });
      } else {
        fs.mkdirSync(absolutePath);
      }
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Create directory error: ${error.message}`);
    }
  }

  deleteDirectory(dirPath, options = {}) {
    const absolutePath = this._resolvePath(dirPath);
    if (!fs.existsSync(absolutePath)) {
      return false;
    }
    try {
      if (options.recursive) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
      } else {
        fs.rmdirSync(absolutePath);
      }
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Delete directory error: ${error.message}`);
    }
  }

  emptyDirectory(dirPath) {
    const absolutePath = this._resolvePath(dirPath);
    if (!fs.existsSync(absolutePath)) {
      return false;
    }
    try {
      const files = fs.readdirSync(absolutePath);
      for (const file of files) {
        const filePath = path.join(absolutePath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          this.deleteDirectory(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      return true;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Empty directory error: ${error.message}`);
    }
  }

  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  _createBackup(filePath) {
    const backupDir = this._resolvePath(this.options.backupDir);
    this._ensureDir(backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const basename = path.basename(filePath);
    const backupName = `${basename}.${timestamp}.bak`;
    const backupPath = path.join(backupDir, backupName);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  readJSON(filePath, options = {}) {
    const content = this.readFile(filePath, options);
    try {
      return JSON.parse(content);
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`JSON parse error: ${error.message}`);
    }
  }

  writeJSON(filePath, data, options = {}) {
    try {
      const indent = options.indent || 2;
      const content = JSON.stringify(data, null, indent);
      return this.writeFile(filePath, content, options);
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`JSON stringify error: ${error.message}`);
    }
  }

  readLines(filePath, options = {}) {
    const content = this.readFile(filePath, options);
    return content.split(/\r?\n/);
  }

  writeLines(filePath, lines, options = {}) {
    const content = lines.join("\n");
    return this.writeFile(filePath, content, options);
  }

  findFiles(dirPath, pattern, options = {}) {
    const files = this.listFiles(dirPath, { recursive: true, ...options });
    const regex = new RegExp(pattern);
    return files.filter((f) => regex.test(f));
  }

  findInFiles(dirPath, searchPattern, options = {}) {
    const files = this.listFiles(dirPath, {
      recursive: true,
      filesOnly: true,
      ...options,
    });
    const results = [];
    const regex = new RegExp(searchPattern, options.flags || "g");
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const content = this.readFile(filePath);
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          results.push({
            file,
            matches: matches.length,
            lines: this._findMatchingLines(content, regex),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    return results;
  }

  _findMatchingLines(content, regex) {
    const lines = content.split("\n");
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ line: i + 1, content: lines[i].trim() });
      }
      regex.lastIndex = 0;
    }
    return matches;
  }

  replaceInFile(filePath, searchPattern, replacement, options = {}) {
    const content = this.readFile(filePath, options);
    const regex = new RegExp(searchPattern, options.flags || "g");
    const newContent = content.replace(regex, replacement);
    if (content !== newContent) {
      this.writeFile(filePath, newContent, options);
      return true;
    }
    return false;
  }

  watchFile(filePath, callback, options = {}) {
    const absolutePath = this._resolvePath(filePath);
    return fs.watch(absolutePath, options, (eventType, filename) => {
      callback({
        event: eventType,
        file: filename,
        path: absolutePath,
      });
    });
  }

  watchDirectory(dirPath, callback, options = {}) {
    const absolutePath = this._resolvePath(dirPath);
    return fs.watch(absolutePath, options, (eventType, filename) => {
      callback({
        event: eventType,
        file: filename,
        path: absolutePath,
      });
    });
  }

  createTempFile(content, options = {}) {
    const tempDir = this._resolvePath(this.options.tempDir);
    this._ensureDir(tempDir);
    const prefix = options.prefix || "temp_";
    const suffix = options.suffix || "";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${prefix}${timestamp}_${random}${suffix}`;
    const filePath = path.join(tempDir, fileName);
    this.writeFile(filePath, content, options);
    return filePath;
  }

  createTempDirectory(options = {}) {
    const tempDir = this._resolvePath(this.options.tempDir);
    this._ensureDir(tempDir);
    const prefix = options.prefix || "temp_dir_";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const dirName = `${prefix}${timestamp}_${random}`;
    const dirPath = path.join(tempDir, dirName);
    this.createDirectory(dirPath);
    return dirPath;
  }

  cleanTempFiles(options = {}) {
    const tempDir = this._resolvePath(this.options.tempDir);
    if (!fs.existsSync(tempDir)) {
      return 0;
    }
    const maxAge = options.maxAge || 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        try {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          cleaned++;
        } catch (error) {
          // Skip files that can't be deleted
        }
      }
    }
    return cleaned;
  }

  getChecksum(filePath, algorithm = "md5") {
    const crypto = require("crypto");
    const content = this.readFile(filePath);
    return crypto.createHash(algorithm).update(content).digest("hex");
  }

  compareFiles(file1, file2) {
    const checksum1 = this.getChecksum(file1);
    const checksum2 = this.getChecksum(file2);
    return {
      identical: checksum1 === checksum2,
      checksum1,
      checksum2,
    };
  }

  setPermissions(filePath, mode) {
    const absolutePath = this._resolvePath(filePath);
    fs.chmodSync(absolutePath, mode);
    return true;
  }

  getPermissions(filePath) {
    const stats = this.getStats(filePath);
    return stats ? (stats.permissions & 0o777).toString(8) : null;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.statistics = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      totalCopies: 0,
      totalMoves: 0,
      errors: 0,
      bytesProcessed: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = FileUtils;
