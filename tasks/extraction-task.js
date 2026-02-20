const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

class ExtractionTask {
  constructor(options = {}) {
    this.name = "ExtractionTask";
    this.version = "3.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      extractStrings: options.extractStrings !== false,
      extractFunctions: options.extractFunctions !== false,
      extractVariables: options.extractVariables !== false,
      extractClasses: options.extractClasses !== false,
      extractImports: options.extractImports !== false,
      extractExports: options.extractExports !== false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      stringMinLength: options.stringMinLength || 1,
      excludePatterns: options.excludePatterns || [],
    };
    this.results = new Map();
    this.patterns = new Map();
    this.statistics = {
      totalExtractions: 0,
      totalStrings: 0,
      totalFunctions: 0,
      totalVariables: 0,
      totalClasses: 0,
      totalImports: 0,
      totalExports: 0,
      averageExtractionTime: 0,
    };
    this._extractionTimes = [];
    this._initializePatterns();
  }

  _initializePatterns() {
    this.registerPattern("url", /https?:\/\/[^\s'"]+/g);
    this.registerPattern(
      "email",
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    );
    this.registerPattern("ip", /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
    this.registerPattern("path", /['"](?:\.\/|\/|\\\\|~\/)[^'"]*['"]/g);
    this.registerPattern("hash", /['"][a-fA-F0-9]{32,}['"]/g);
  }

  async extract(code, options = {}) {
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    if (code.length > this.options.maxFileSize) {
      throw new Error(
        `Code exceeds maximum file size of ${this.options.maxFileSize} bytes`
      );
    }
    const startTime = Date.now();
    const extractionId = `extraction-${startTime}`;
    try {
      const ast = this._parseCode(code, options);
      const results = {
        strings: [],
        functions: [],
        variables: [],
        classes: [],
        imports: [],
        exports: [],
        patterns: {},
        comments: [],
        metadata: {},
      };
      if (options.extractStrings !== false && this.options.extractStrings) {
        results.strings = this.extractStrings(ast, options);
      }
      if (options.extractFunctions !== false && this.options.extractFunctions) {
        results.functions = this.extractFunctions(ast, options);
      }
      if (options.extractVariables !== false && this.options.extractVariables) {
        results.variables = this.extractVariables(ast, options);
      }
      if (options.extractClasses !== false && this.options.extractClasses) {
        results.classes = this.extractClasses(ast, options);
      }
      if (options.extractImports !== false && this.options.extractImports) {
        results.imports = this.extractImports(ast, options);
      }
      if (options.extractExports !== false && this.options.extractExports) {
        results.exports = this.extractExports(ast, options);
      }
      results.patterns = this._extractByPatterns(code, options);
      results.comments = this._extractComments(ast, options);
      results.metadata = this._extractMetadata(ast, options);
      const duration = Date.now() - startTime;
      this._recordExtraction(extractionId, duration, results);
      return {
        id: extractionId,
        results,
        duration,
      };
    } catch (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      ...this.options.parseOptions,
      ...options.parseOptions,
    };
    return parser.parse(code, parseOptions);
  }

  extractStrings(ast, options = {}) {
    const strings = [];
    const minLength = options.stringMinLength || this.options.stringMinLength;
    const excludePatterns =
      options.excludePatterns || this.options.excludePatterns;
    traverse(ast, {
      StringLiteral(path) {
        const value = path.node.value;
        if (value.length >= minLength) {
          const excluded = excludePatterns.some((pattern) =>
            pattern.test(value)
          );
          if (!excluded) {
            strings.push({
              value,
              length: value.length,
              loc: path.node.loc,
              type: "string",
              context: this._getStringContext(path),
            });
          }
        }
      },
      TemplateLiteral(path) {
        if (path.node.quasis.length === 1 && path.node.quasis[0].value.cooked) {
          const value = path.node.quasis[0].value.cooked;
          if (value.length >= minLength) {
            strings.push({
              value,
              length: value.length,
              loc: path.node.loc,
              type: "template",
              context: this._getStringContext(path),
            });
          }
        }
      },
    });
    this.statistics.totalStrings += strings.length;
    return this._categorizeStrings(strings);
  }

  _getStringContext(path) {
    const parent = path.parent;
    if (parent.type === "VariableDeclarator") {
      return { type: "variable", name: parent.id?.name };
    }
    if (parent.type === "AssignmentExpression") {
      return { type: "assignment" };
    }
    if (parent.type === "CallExpression") {
      return { type: "argument", callee: this._getCalleeName(parent.callee) };
    }
    if (parent.type === "ObjectProperty") {
      return { type: "property", key: parent.key?.name };
    }
    return { type: "other" };
  }

  _getCalleeName(node) {
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
      return `${this._getCalleeName(node.object)}.${node.property?.name}`;
    }
    return "unknown";
  }

  _categorizeStrings(strings) {
    const categories = {
      urls: [],
      paths: [],
      messages: [],
      identifiers: [],
      other: [],
    };
    for (const str of strings) {
      const value = str.value;
      if (/^https?:\/\//.test(value)) {
        categories.urls.push(str);
      } else if (/^[./\\]/.test(value)) {
        categories.paths.push(str);
      } else if (value.length > 50) {
        categories.messages.push(str);
      } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
        categories.identifiers.push(str);
      } else {
        categories.other.push(str);
      }
    }
    return { all: strings, categories };
  }

  extractFunctions(ast, options = {}) {
    const functions = [];
    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          name: path.node.id?.name || "anonymous",
          type: "declaration",
          async: path.node.async,
          generator: path.node.generator,
          params: path.node.params.length,
          loc: path.node.loc,
          body: this._getFunctionBody(path),
          complexity: this._estimateComplexity(path),
        });
      },
      FunctionExpression(path) {
        functions.push({
          name: path.node.id?.name || "anonymous",
          type: "expression",
          async: path.node.async,
          generator: path.node.generator,
          params: path.node.params.length,
          loc: path.node.loc,
          complexity: this._estimateComplexity(path),
        });
      },
      ArrowFunctionExpression(path) {
        functions.push({
          name: "arrow",
          type: "arrow",
          async: path.node.async,
          params: path.node.params.length,
          loc: path.node.loc,
          expression: path.node.expression,
          complexity: this._estimateComplexity(path),
        });
      },
      ClassMethod(path) {
        functions.push({
          name: path.node.key?.name || "anonymous",
          type: "method",
          kind: path.node.kind,
          static: path.node.static,
          async: path.node.async,
          params: path.node.params.length,
          loc: path.node.loc,
        });
      },
    });
    this.statistics.totalFunctions += functions.length;
    return functions;
  }

  _getFunctionBody(path) {
    if (path.node.body && path.node.body.body) {
      return {
        statements: path.node.body.body.length,
        hasReturn: path.node.body.body.some(
          (n) => n.type === "ReturnStatement"
        ),
      };
    }
    return null;
  }

  _estimateComplexity(path) {
    let complexity = 1;
    path.traverse({
      IfStatement() {
        complexity++;
      },
      ForStatement() {
        complexity++;
      },
      WhileStatement() {
        complexity++;
      },
      SwitchCase() {
        complexity++;
      },
      ConditionalExpression() {
        complexity++;
      },
      LogicalExpression() {
        complexity++;
      },
    });
    return complexity;
  }

  extractVariables(ast, options = {}) {
    const variables = [];
    traverse(ast, {
      VariableDeclarator(path) {
        const name = path.node.id.name;
        const binding = path.scope.getBinding(name);
        variables.push({
          name,
          kind: path.parent.kind,
          initialized: !!path.node.init,
          initType: path.node.init?.type,
          loc: path.node.loc,
          references: binding?.references || 0,
          mutations: binding?.constantViolations?.length || 0,
          used: binding?.referenced || false,
        });
      },
      Identifier(path) {
        if (path.isBindingIdentifier() && !path.isVariableDeclarator()) {
          const name = path.node.name;
          const existing = variables.find((v) => v.name === name);
          if (!existing) {
            variables.push({
              name,
              kind: "parameter",
              loc: path.node.loc,
              used: true,
            });
          }
        }
      },
    });
    this.statistics.totalVariables += variables.length;
    return this._categorizeVariables(variables);
  }

  _categorizeVariables(variables) {
    const categories = {
      constants: [],
      letVariables: [],
      parameters: [],
      unused: [],
      all: variables,
    };
    for (const v of variables) {
      if (v.kind === "const") {
        categories.constants.push(v);
      } else if (v.kind === "let") {
        categories.letVariables.push(v);
      } else if (v.kind === "parameter") {
        categories.parameters.push(v);
      }
      if (!v.used) {
        categories.unused.push(v);
      }
    }
    return categories;
  }

  extractClasses(ast, options = {}) {
    const classes = [];
    traverse(ast, {
      ClassDeclaration(path) {
        const methods = [];
        const properties = [];
        path.node.body.body.forEach((member) => {
          if (member.type === "ClassMethod") {
            methods.push({
              name: member.key?.name,
              kind: member.kind,
              static: member.static,
              async: member.async,
            });
          }
          if (member.type === "ClassProperty") {
            properties.push({
              name: member.key?.name,
              static: member.static,
            });
          }
        });
        classes.push({
          name: path.node.id?.name || "anonymous",
          superClass: path.node.superClass?.name,
          methods,
          properties,
          loc: path.node.loc,
          methodCount: methods.length,
          propertyCount: properties.length,
        });
      },
      ClassExpression(path) {
        classes.push({
          name: path.node.id?.name || "anonymous",
          type: "expression",
          superClass: path.node.superClass?.name,
          loc: path.node.loc,
        });
      },
    });
    this.statistics.totalClasses += classes.length;
    return classes;
  }

  extractImports(ast, options = {}) {
    const imports = [];
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers.map((spec) => {
          if (spec.type === "ImportDefaultSpecifier") {
            return { type: "default", local: spec.local.name };
          }
          if (spec.type === "ImportNamespaceSpecifier") {
            return { type: "namespace", local: spec.local.name };
          }
          return {
            type: "named",
            imported: spec.imported?.name,
            local: spec.local.name,
          };
        });
        imports.push({
          source,
          specifiers,
          specifierCount: specifiers.length,
          loc: path.node.loc,
          isLocal: source.startsWith(".") || source.startsWith("/"),
        });
      },
      CallExpression(path) {
        if (
          path.node.callee.type === "Identifier" &&
          path.node.callee.name === "require"
        ) {
          const arg = path.node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            imports.push({
              type: "require",
              source: arg.value,
              loc: path.node.loc,
            });
          }
        }
      },
    });
    this.statistics.totalImports += imports.length;
    return imports;
  }

  extractExports(ast, options = {}) {
    const exports = [];
    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (path.node.declaration.type === "FunctionDeclaration") {
            exports.push({
              type: "named",
              name: path.node.declaration.id?.name,
              exportType: "function",
              loc: path.node.loc,
            });
          } else if (path.node.declaration.type === "VariableDeclaration") {
            path.node.declaration.declarations.forEach((decl) => {
              exports.push({
                type: "named",
                name: decl.id?.name,
                exportType: "variable",
                loc: path.node.loc,
              });
            });
          }
        } else if (path.node.specifiers) {
          path.node.specifiers.forEach((spec) => {
            exports.push({
              type: "named",
              name: spec.exported?.name,
              localName: spec.local?.name,
              loc: path.node.loc,
            });
          });
        }
      },
      ExportDefaultDeclaration(path) {
        exports.push({
          type: "default",
          name: path.node.declaration?.id?.name || "anonymous",
          declarationType: path.node.declaration?.type,
          loc: path.node.loc,
        });
      },
      ExportAllDeclaration(path) {
        exports.push({
          type: "all",
          source: path.node.source.value,
          loc: path.node.loc,
        });
      },
    });
    this.statistics.totalExports += exports.length;
    return exports;
  }

  _extractByPatterns(code, options = {}) {
    const results = {};
    for (const [name, pattern] of this.patterns) {
      const matches = [];
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(code)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          line: this._getLineNumber(code, match.index),
        });
      }
      results[name] = matches;
    }
    return results;
  }

  _getLineNumber(code, index) {
    const lines = code.substring(0, index).split("\n");
    return lines.length;
  }

  _extractComments(ast, options = {}) {
    const comments = [];
    if (ast.comments) {
      for (const comment of ast.comments) {
        comments.push({
          type: comment.type,
          value: comment.value,
          loc: comment.loc,
        });
      }
    }
    return comments;
  }

  _extractMetadata(ast, options = {}) {
    const metadata = {
      hasUseStrict: false,
      hasShebang: false,
      sourceType: "module",
      topLevelAwait: false,
    };
    if (ast.program && ast.program.body) {
      for (const node of ast.program.body) {
        if (
          node.type === "ExpressionStatement" &&
          node.expression.type === "StringLiteral" &&
          node.expression.value === "use strict"
        ) {
          metadata.hasUseStrict = true;
        }
        if (
          node.type === "ExpressionStatement" &&
          node.expression.type === "AwaitExpression"
        ) {
          metadata.topLevelAwait = true;
        }
      }
    }
    return metadata;
  }

  registerPattern(name, pattern) {
    if (typeof name !== "string" || !pattern) {
      throw new Error("Pattern name and regex are required");
    }
    this.patterns.set(name, pattern);
    return this;
  }

  unregisterPattern(name) {
    this.patterns.delete(name);
    return this;
  }

  getPattern(name) {
    return this.patterns.get(name);
  }

  listPatterns() {
    return Array.from(this.patterns.keys());
  }

  _recordExtraction(id, duration, results) {
    this.results.set(id, {
      results,
      duration,
      timestamp: Date.now(),
    });
    this.statistics.totalExtractions++;
    this._extractionTimes.push(duration);
    this._updateAverageTime();
  }

  _updateAverageTime() {
    if (this._extractionTimes.length > 100) {
      this._extractionTimes = this._extractionTimes.slice(-100);
    }
    const sum = this._extractionTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageExtractionTime = sum / this._extractionTimes.length;
  }

  getResults(id) {
    return this.results.get(id);
  }

  getAllResults() {
    return Array.from(this.results.entries());
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  clearResults() {
    const count = this.results.size;
    this.results.clear();
    return count;
  }

  reset() {
    this.results.clear();
    this._extractionTimes = [];
    this.statistics = {
      totalExtractions: 0,
      totalStrings: 0,
      totalFunctions: 0,
      totalVariables: 0,
      totalClasses: 0,
      totalImports: 0,
      totalExports: 0,
      averageExtractionTime: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.patterns.clear();
    this.options = {};
    return this;
  }
}

module.exports = ExtractionTask;
