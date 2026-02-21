/**
 * Export Task
 * Handles exporting deobfuscated code and results in multiple formats
 * Version: 3.0.0
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ExportTask {
  constructor(options = {}) {
    this.name = 'ExportTask';
    this.version = '3.0.0';
    this.options = {
      outputDir: options.outputDir || './output',
      format: options.format || 'js',
      includeMetadata: options.includeMetadata !== false,
      prettyPrint: options.prettyPrint !== false,
      compress: options.compress || false,
      encoding: options.encoding || 'utf8',
      addTimestamp: options.addTimestamp !== false,
      addHash: options.addHash || false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      createBackup: options.createBackup || false,
      validateOutput: options.validateOutput !== false
    };
    this.exportedFiles = [];
    this.exportHistory = new Map();
    this.statistics = {
      totalExports: 0,
      totalBytes: 0,
      formatsExported: {},
      errors: 0,
      lastExportTime: 0,
      averageExportTime: 0
    };
    this._exportTimes = [];
  }

  async execute(data, options = {}) {
    const config = { ...this.options, ...options };
    const exportId = `export-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      this._ensureOutputDir(config.outputDir);
      
      const result = await this._exportData(data, config);
      
      const duration = Date.now() - startTime;
      this._recordExport(exportId, duration, result);
      
      this.statistics.totalExports++;
      this.statistics.totalBytes += result.size;
      this.statistics.formatsExported[config.format] = 
        (this.statistics.formatsExported[config.format] || 0) + 1;
      this.statistics.lastExportTime = duration;
      this._updateAverageTime(duration);
      
      return {
        id: exportId,
        success: true,
        files: result.files,
        metadata: {
          format: config.format,
          size: result.size,
          timestamp: Date.now(),
          duration,
          hash: config.addHash ? this._generateHash(result.files) : null
        }
      };
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  _ensureOutputDir(outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async _exportData(data, config) {
    const files = [];
    let totalSize = 0;
    
    if (typeof data === 'string') {
      const filename = this._generateFilename(config.format, config.addTimestamp);
      const filepath = path.join(config.outputDir, filename);
      
      let content = config.prettyPrint && config.format !== 'json' 
        ? this._prettyPrint(data, config.format)
        : data;
      
      if (config.compress && config.format === 'js') {
        content = this._compressCode(content);
      }
      
      if (config.createBackup && fs.existsSync(filepath)) {
        const backupPath = filepath + '.backup';
        fs.copyFileSync(filepath, backupPath);
      }
      
      fs.writeFileSync(filepath, content, config.encoding);
      
      const fileInfo = {
        filename,
        path: filepath,
        size: content.length,
        format: config.format
      };
      
      if (config.validateOutput) {
        fileInfo.validated = this._validateOutput(filepath, config.format);
      }
      
      files.push(fileInfo);
      totalSize = content.length;
    } else if (data.code && data.metadata) {
      const codeFile = this._generateFilename('js', config.addTimestamp);
      const codePath = path.join(config.outputDir, codeFile);
      
      let codeContent = data.code;
      if (config.compress) {
        codeContent = this._compressCode(codeContent);
      }
      
      fs.writeFileSync(codePath, codeContent, config.encoding);
      
      const codeFileInfo = {
        filename: codeFile,
        path: codePath,
        size: codeContent.length,
        format: 'js'
      };
      
      if (config.validateOutput) {
        codeFileInfo.validated = this._validateOutput(codePath, 'js');
      }
      
      files.push(codeFileInfo);
      totalSize += codeContent.length;
      
      if (config.includeMetadata) {
        const metaFile = this._generateFilename('json', config.addTimestamp);
        const metaPath = path.join(config.outputDir, metaFile);
        
        const metadata = {
          ...data.metadata,
          exportTimestamp: Date.now(),
          originalSize: data.code.length,
          exportedSize: codeContent.length,
          compression: config.compress
        };
        
        const metaContent = JSON.stringify(metadata, null, 2);
        fs.writeFileSync(metaPath, metaContent, config.encoding);
        
        files.push({
          filename: metaFile,
          path: metaPath,
          size: metaContent.length,
          format: 'json'
        });
        totalSize += metaContent.length;
      }
    } else if (data.results) {
      const resultsFile = this._generateFilename(config.format, config.addTimestamp);
      const resultsPath = path.join(config.outputDir, resultsFile);
      
      let content;
      if (config.format === 'json') {
        content = JSON.stringify(data.results, null, config.prettyPrint ? 2 : 0);
      } else if (config.format === 'txt') {
        content = this._formatResultsAsText(data.results);
      } else if (config.format === 'csv') {
        content = this._formatResultsAsCSV(data.results);
      } else if (config.format === 'xml') {
        content = this._formatResultsAsXML(data.results);
      } else {
        content = JSON.stringify(data.results);
      }
      
      if (config.compress && config.format === 'json') {
        content = this._compressCode(content);
      }
      
      fs.writeFileSync(resultsPath, content, config.encoding);
      
      const resultFileInfo = {
        filename: resultsFile,
        path: resultsPath,
        size: content.length,
        format: config.format
      };
      
      if (config.validateOutput) {
        resultFileInfo.validated = this._validateOutput(resultsPath, config.format);
      }
      
      files.push(resultFileInfo);
      totalSize = content.length;
    } else if (Array.isArray(data)) {
      for (const item of data) {
        const itemFile = this._generateFilename('json', config.addTimestamp);
        const itemPath = path.join(config.outputDir, itemFile);
        
        const content = JSON.stringify(item, null, config.prettyPrint ? 2 : 0);
        fs.writeFileSync(itemPath, content, config.encoding);
        
        files.push({
          filename: itemFile,
          path: itemPath,
          size: content.length,
          format: 'json'
        });
        totalSize += content.length;
      }
    }
    
    return { files, size: totalSize };
  }

  _generateFilename(format, addTimestamp = true) {
    const timestamp = addTimestamp ? Date.now() : '';
    const random = crypto.randomBytes(4).toString('hex');
    return `export-${timestamp}${timestamp ? '-' : ''}${random}.${format}`;
  }

  _prettyPrint(code, format) {
    if (format === 'js') {
      return code;
    }
    return code;
  }

  _compressCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}();,])\s*/g, '$1')
      .trim();
  }

  _formatResultsAsText(results) {
    if (Array.isArray(results)) {
      return results.map((r, i) => {
        const entries = Object.entries(r || {}).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
        return `[${i + 1}] ${entries.join(', ')}`;
      }).join('\n');
    }
    return JSON.stringify(results, null, 2);
  }

  _formatResultsAsCSV(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return '';
    }
    
    const headers = Object.keys(results[0]);
    const rows = results.map(item => 
      headers.map(h => {
        const val = item[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  _formatResultsAsXML(results) {
    const items = Array.isArray(results) 
      ? results.map(item => {
          const props = Object.entries(item || {}).map(([k, v]) => `    <${k}>${this._escapeXML(v)}</${k}>`).join('\n');
          return `  <item>\n${props}\n  </item>`;
        }).join('\n')
      : '';
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n<results>\n${items}\n</results>`;
  }

  _escapeXML(str) {
    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, ''');
  }

  _validateOutput(filepath, format) {
    try {
      const content = fs.readFileSync(filepath, this.options.encoding);
      
      if (content.length === 0) {
        return { valid: false, error: 'File is empty' };
      }
      
      if (format === 'json') {
        JSON.parse(content);
      }
      
      return { valid: true, size: content.length };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  _generateHash(files) {
    const hashes = files.map(f => {
      const content = fs.readFileSync(f.path);
      return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
    });
    return hashes.join('-');
  }

  _recordExport(id, duration, result) {
    this.exportHistory.set(id, {
      duration,
      result,
      timestamp: Date.now()
    });
    
    if (this.exportHistory.size > 100) {
      const firstKey = this.exportHistory.keys().next().value;
      this.exportHistory.delete(firstKey);
    }
  }

  _updateAverageTime(duration) {
    this._exportTimes.push(duration);
    if (this._exportTimes.length > 100) {
      this._exportTimes = this._exportTimes.slice(-100);
    }
    const sum = this._exportTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageExportTime = sum / this._exportTimes.length;
  }

  exportToString(data, format = 'json') {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'txt') {
      return this._formatResultsAsText(data);
    } else if (format === 'csv') {
      return this._formatResultsAsCSV(data);
    } else if (format === 'xml') {
      return this._formatResultsAsXML(data);
    }
    return String(data);
  }

  exportBatch(items, options = {}) {
    return Promise.all(
      items.map((item, index) => 
        this.execute(item, { ...options, addTimestamp: true })
          .catch(error => ({
            success: false,
            index,
            error: error.message
          }))
      )
    );
  }

  exportAsync(data, options = {}) {
    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          const result = await this.execute(data, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  getExportedFiles() {
    return [...this.exportedFiles];
  }

  getExportHistory() {
    return Array.from(this.exportHistory.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  getExportById(id) {
    return this.exportHistory.get(id);
  }

  getStatistics() {
    return { 
      ...this.statistics,
      exportHistorySize: this.exportHistory.size
    };
  }

  clearExports() {
    this.exportedFiles = [];
  }

  clearHistory() {
    this.exportHistory.clear();
    this._exportTimes = [];
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  getOptions() {
    return { ...this.options };
  }

  mergeOptions(options) {
    this.options = this._deepMerge(this.options, options);
    return this;
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  async exportToBuffer(data, format = 'json') {
    const str = this.exportToString(data, format);
    return Buffer.from(str, this.options.encoding);
  }

  async exportToStream(data, options = {}) {
    const { format, ...streamOptions } = options;
    const { Writable } = require('stream');
    
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        }
      });
      
      stream.on('finish', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', reject);
      
      const dataStr = this.exportToString(data, format || this.options.format);
      stream.write(dataStr, streamOptions.encoding || this.options.encoding);
      stream.end();
    });
  }

  getLastExport() {
    if (this.exportHistory.size === 0) return null;
    const keys = Array.from(this.exportHistory.keys());
    return this.exportHistory.get(keys[keys.length - 1]);
  }

  getExportCount() {
    return this.exportHistory.size;
  }

  hasExports() {
    return this.exportHistory.size > 0;
  }

  reset() {
    this.exportedFiles = [];
    this.exportHistory.clear();
    this._exportTimes = [];
    this.statistics = {
      totalExports: 0,
      totalBytes: 0,
      formatsExported: {},
      errors: 0,
      lastExportTime: 0,
      averageExportTime: 0
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = ExportTask;
