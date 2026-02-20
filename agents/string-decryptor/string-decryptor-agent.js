/**
 * String Decryptor Agent - Core Implementation
 * World-class string decryption and encoding analysis for JavaScript deobfuscation
 * 
 * This module provides comprehensive string analysis including:
 * - Encrypted string detection and decryption
 * - Encoding format analysis (Base64, Hex, URL, etc.)
 * - String pattern recognition
 * - Character encoding detection
 * - Obfuscated string reconstruction
 */
const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");

class StringDecryptorAgent {
  constructor(options = {}) {
    this.name = "string-decryptor";
    this.version = "3.0.0";
    this.options = this.initializeOptions(options);
    this.stats = {
      encryptedStrings: 0,
      base64Strings: 0,
      hexStrings: 0,
      urlEncodedStrings: 0,
      unicodeStrings: 0,
      concatenatedStrings: 0,
      arrayStrings: 0,
      functionCalls: 0,
      decryptions: 0
    };
    
    this.encodingPatterns = this.initializeEncodingPatterns();
    this.decryptionFunctions = this.initializeDecryptionFunctions();
  }

  initializeOptions(options) {
    return {
      detectBase64: options.detectBase64 !== false,
      detectHex: options.detectHex !== false,
      detectURL: options.detectURL !== false,
      detectUnicode: options.detectUnicode !== false,
      detectConcatenation: options.detectConcatenation !== false,
      detectArrayEncoding: options.detectArrayEncoding !== false,
      attemptDecryption: options.attemptDecryption !== false,
      maxStringLength: options.maxStringLength || 10000,
      verboseLogging: options.verboseLogging || false,
      timeout: options.timeout || 45000,
      ...options
    };
  }

  initializeEncodingPatterns() {
    return {
      base64: {
        pattern: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
        detect: (str) => {
          if (str.length < 4) return false;
          return /^[A-Za-z0-9+/]+=*$/.test(str) && str.length % 4 === 0;
        },
        decode: (str) => {
          try {
            return Buffer.from(str, 'base64').toString('utf8');
          } catch { return null; }
        }
      },
      hex: {
        pattern: /^[0-9a-fA-F]+$/,
        detect: (str) => {
          if (str.length < 4 || str.length % 2 !== 0) return false;
          return /^[0-9a-fA-F]+$/.test(str);
        },
        decode: (str) => {
          try {
            const result = [];
            for (let i = 0; i < str.length; i += 2) {
              result.push(parseInt(str.substr(i, 2), 16));
            }
            return String.fromCharCode(...result);
          } catch { return null; }
        }
      },
      urlEncoded: {
        pattern: /%[0-9A-Fa-f]{2}/,
        detect: (str) => /%[0-9A-Fa-f]{2}/.test(str),
        decode: (str) => {
          try {
            return decodeURIComponent(str);
          } catch { return null; }
        }
      },
      unicode: {
        pattern: /\\u[0-9a-fA-F]{4}/,
        detect: (str) => /\\u[0-9a-fA-F]{4}/.test(str),
        decode: (str) => {
          try {
            return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
              String.fromCharCode(parseInt(code, 16))
            );
          } catch { return null; }
        }
      },
      htmlEntity: {
        pattern: /&[a-zA-Z]+;|&#\d+;|&#x[a-fA-F\d]+;/,
        detect: (str) => /&[a-zA-Z]+;|&#\d+;|&#x[a-fA-F\d]+;/.test(str),
        decode: (str) => {
          const entities = {
            '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
            '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™'
          };
          let result = str;
          for (const [entity, char] of Object.entries(entities)) {
            result = result.replace(new RegExp(entity, 'g'), char);
          }
          return result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
                       .replace(/&#x([a-fA-F\d]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
        }
      },
      rot13: {
        pattern: /^[a-zA-Z]+$/,
        detect: (str) => /^[a-zA-Z]+$/.test(str) && str.length > 3,
        decode: (str) => {
          return str.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode((char.charCodeAt(0) - base + 13) % 26 + base);
          });
        }
      },
      reverse: {
        pattern: /^.+$/,
        detect: (str) => str === str.split('').reverse().join(''),
        decode: (str) => str.split('').reverse().join('')
      }
    };
  }

  initializeDecryptionFunctions() {
    return {
      atob: { type: 'base64', decode: (s) => { try { return atob(s); } catch { return null; } } },
      Buffer_from: { type: 'base64', decode: (s) => { try { return Buffer.from(s, 'base64').toString(); } catch { return null; } } },
      decodeURIComponent: { type: 'url', decode: (s) => { try { return decodeURIComponent(s); } catch { return null; } } },
      unescape: { type: 'url', decode: (s) => { try { return unescape(s); } catch { return null; } } },
      fromCharCode: { type: 'charcode', decode: (s) => { 
        try { 
          const nums = s.match(/\d+/g);
          return nums ? String.fromCharCode(...nums.map(Number)) : null;
        } catch { return null; } 
      } },
      hex2str: { type: 'hex', decode: null },
      base64_decode: { type: 'base64', decode: null },
      _0x: { type: 'array', decode: null },
      window: { type: 'eval', decode: null }
    };
  }

  analyze(code, context = {}) {
    const startTime = Date.now();
    const result = {
      agent: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      encryptedStrings: [],
      base64Strings: [],
      hexStrings: [],
      urlEncodedStrings: [],
      unicodeStrings: [],
      concatenatedStrings: [],
      arrayStrings: [],
      decryptionFunctions: [],
      reconstructedStrings: [],
      characterEncodings: [],
      statistics: {},
      warnings: [],
      errors: [],
      analysisTime: 0
    };

    try {
      if (this.options.verboseLogging) {
        console.log('[StringDecryptor] Starting analysis...');
      }

      const ast = this.parseCode(code);
      if (!ast) {
        throw new Error('Failed to parse code into AST');
      }

      this.stats = { encryptedStrings: 0, base64Strings: 0, hexStrings: 0, urlEncodedStrings: 0, unicodeStrings: 0, concatenatedStrings: 0, arrayStrings: 0, functionCalls: 0, decryptions: 0 };

      this.detectEncryptedStrings(ast, result);
      this.detectConcatenatedStrings(ast, result);
      this.detectArrayStrings(ast, result);
      this.detectDecryptionFunctions(ast, result);
      this.detectStringEncoding(code, result);

      if (this.options.attemptDecryption) {
        this.attemptDecryption(result);
      }

      result.statistics = this.getStatistics();
      result.analysisTime = Date.now() - startTime;

      if (this.options.verboseLogging) {
        console.log(`[StringDecryptor] Analysis complete in ${result.analysisTime}ms`);
      }

    } catch (error) {
      result.errors.push({
        type: 'analysis-error',
        message: error.message,
        stack: error.stack
      });
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'dynamicImport']
      });
    } catch (error) {
      return null;
    }
  }

  detectEncryptedStrings(ast, result) {
    traverse(ast, {
      StringLiteral: {
        enter: (path) => {
          const value = path.node.value;
          if (!value || value.length < 2) return;

          for (const [encoding, config] of Object.entries(this.encodingPatterns)) {
            if (config.detect(value)) {
              const encrypted = {
                encoding,
                original: value,
                decoded: config.decode ? config.decode(value) : null,
                location: this.extractLocation(path.node.loc),
                length: value.length,
                confidence: this.calculateConfidence(value, encoding)
              };
              
              result.encryptedStrings.push(encrypted);
              result[`${encoding}Strings`].push(encrypted);
              this.stats.encryptedStrings++;
              this.stats[`${encoding}Strings`]++;
              break;
            }
          }
        }
      }
    });
  }

  detectConcatenatedStrings(ast, result) {
    traverse(ast, {
      BinaryExpression: {
        enter: (path) => {
          if (path.node.operator !== '+') return;
          
          const left = this.extractStringValue(path.node.left);
          const right = this.extractStringValue(path.node.right);
          
          if (left && right) {
            const concatenated = {
              type: 'concatenation',
              parts: [left, right],
              combined: left + right,
              location: this.extractLocation(path.node.loc),
              complexity: this.calculateConcatenationComplexity(path.node)
            };
            
            result.concatenatedStrings.push(concatenated);
            this.stats.concatenatedStrings++;
          }
        }
      }
    });
  }

  detectArrayStrings(ast, result) {
    traverse(ast, {
      ArrayExpression: {
        enter: (path) => {
          const elements = path.node.elements;
          if (!elements || elements.length < 3) return;

          const stringElements = elements.filter(e => e && (e.type === 'StringLiteral' || e.type === 'NumericLiteral'));
          if (stringElements.length >= elements.length * 0.8) {
            const values = stringElements.map(e => e.type === 'StringLiteral' ? e.value : String(e.value));
            
            const arrayString = {
              type: 'array-encoded',
              elements: values,
              reconstructed: this.reconstructArrayString(values),
              location: this.extractLocation(path.node.loc),
              elementCount: values.length,
              likelyEncoded: this.isLikelyEncodedArray(values)
            };
            
            if (arrayString.likelyEncoded) {
              result.arrayStrings.push(arrayString);
              this.stats.arrayStrings++;
            }
          }
        }
      }
    });
  }

  detectDecryptionFunctions(ast, result) {
    traverse(ast, {
      CallExpression: {
        enter: (path) => {
          const callee = path.node.callee;
          let funcName = null;

          if (callee.type === 'Identifier') {
            funcName = callee.name;
          } else if (callee.type === 'MemberExpression' && callee.property) {
            funcName = callee.property.name;
          }

          if (funcName && this.decryptionFunctions[funcName.toLowerCase()]) {
            const func = {
              name: funcName,
              type: this.decryptionFunctions[funcName.toLowerCase()].type,
              location: this.extractLocation(path.node.loc),
              arguments: path.node.arguments.map(a => this.generateCode(a)),
              argumentCount: path.node.arguments.length
            };
            
            result.decryptionFunctions.push(func);
            this.stats.functionCalls++;
          }
        }
      }
    });
  }

  detectStringEncoding(code, result) {
    const patterns = [
      { name: 'base64', regex: /atob\s*\(|Buffer\.from\s*\([^,]*['"`]/ },
      { name: 'hex', regex: /\\x[0-9a-fA-F]{2}|0x[0-9a-fA-F]/ },
      { name: 'unicode', regex: /\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/ },
      { name: 'url', regex: /encodeURIComponent\s*\(|encodeURI\s*\(/ }
    ];

    for (const pattern of patterns) {
      const matches = code.match(new RegExp(pattern.regex.source, 'g'));
      if (matches) {
        result.characterEncodings.push({
          encoding: pattern.name,
          occurrences: matches.length,
          samples: matches.slice(0, 5)
        });
      }
    }
  }

  attemptDecryption(result) {
    for (const str of result.encryptedStrings) {
      if (str.decoded && str.decoded !== str.original) {
        str.wasDecrypted = true;
        this.stats.decryptions++;
      }
    }
  }

  extractStringValue(node) {
    if (!node) return null;
    if (node.type === 'StringLiteral') return node.value;
    if (node.type === 'NumericLiteral') return String(node.value);
    if (node.type === 'Identifier') return node.name;
    return null;
  }

  reconstructArrayString(values) {
    if (values.every(v => /^[a-zA-Z0-9]$/.test(v))) {
      return values.join('');
    }
    if (values.every(v => /^\\x[0-9a-fA-F]{2}$/.test(v))) {
      return values.map(v => String.fromCharCode(parseInt(v.slice(2), 16))).join('');
    }
    return values.join('');
  }

  isLikelyEncodedArray(values) {
    if (values.length < 3) return false;
    const printable = values.filter(v => /^[a-zA-Z0-9_-]+$/.test(v));
    return printable.length > values.length * 0.7;
  }

  calculateConfidence(str, encoding) {
    const baseConfidences = {
      base64: 0.7,
      hex: 0.8,
      urlEncoded: 0.9,
      unicode: 0.9,
      htmlEntity: 0.85,
      rot13: 0.5,
      reverse: 0.4
    };
    
    let confidence = baseConfidences[encoding] || 0.5;
    
    if (str.length > 10) confidence += 0.1;
    if (str.length > 50) confidence += 0.1;
    if (/^[A-Za-z0-9+/]+=*$/.test(str)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  calculateConcatenationComplexity(node) {
    let complexity = 1;
    
    const traverse = (n) => {
      if (!n) return;
      if (n.type === 'BinaryExpression' && n.operator === '+') {
        complexity++;
        traverse(n.left);
        traverse(n.right);
      }
    };
    
    traverse(node);
    return complexity;
  }

  extractLocation(loc) {
    if (!loc || !loc.start || !loc.end) return null;
    return {
      start: { line: loc.start.line, column: loc.start.column },
      end: { line: loc.end.line, column: loc.end.column }
    };
  }

  generateCode(node) {
    if (!node) return '';
    try {
      const generate = require("@babel/generator").default;
      return generate(node).code;
    } catch {
      return node.type || '';
    }
  }

  getStatistics() {
    return {
      ...this.stats,
      totalStrings: this.stats.encryptedStrings + this.stats.concatenatedStrings
    };
  }

  resetStats() {
    this.stats = {
      encryptedStrings: 0,
      base64Strings: 0,
      hexStrings: 0,
      urlEncodedStrings: 0,
      unicodeStrings: 0,
      concatenatedStrings: 0,
      arrayStrings: 0,
      functionCalls: 0,
      decryptions: 0
    };
  }

  dispose() {
    this.encodingPatterns = null;
    this.decryptionFunctions = null;
  }
}

module.exports = StringDecryptorAgent;
