const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const t = require("@babel/types");

class CodeUtils {
  constructor(options = {}) {
    this.name = "CodeUtils";
    this.version = "3.0.0";
    this.options = {
      sourceType: options.sourceType || "module",
      plugins: options.plugins || ["jsx", "typescript"],
      indentSize: options.indentSize || 2,
      maxLineLength: options.maxLineLength || 80,
      semicolons: options.semicolons !== false,
      quotes: options.quotes || "double",
    };
    this.statistics = {
      totalFormatted: 0,
      totalMinified: 0,
      totalAnalyzed: 0,
      totalTransformed: 0,
      errors: 0,
    };
  }

  formatCode(code, options = {}) {
    this.statistics.totalFormatted++;
    if (!code || typeof code !== "string") {
      return "";
    }
    try {
      const ast = this._parseCode(code, options);
      const genOptions = {
        comments: options.comments !== false,
        compact: false,
        retainLines: options.retainLines || false,
        concise: false,
        jsonCompatible: options.jsonCompatible || false,
      };
      const result = generator(ast, genOptions);
      return result.code;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Format error: ${error.message}`);
    }
  }

  minifyCode(code, options = {}) {
    this.statistics.totalMinified++;
    if (!code || typeof code !== "string") {
      return "";
    }
    try {
      const ast = this._parseCode(code, options);
      if (options.removeConsole) {
        this._removeConsole(ast);
      }
      if (options.removeDebugger) {
        this._removeDebugger(ast);
      }
      if (options.removeDeadCode) {
        this._removeDeadCode(ast);
      }
      const genOptions = {
        comments: false,
        compact: true,
        minified: true,
      };
      const result = generator(ast, genOptions);
      return result.code;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Minify error: ${error.message}`);
    }
  }

  beautifyCode(code, options = {}) {
    this.statistics.totalFormatted++;
    if (!code || typeof code !== "string") {
      return "";
    }
    try {
      const ast = this._parseCode(code, options);
      const indentSize = options.indentSize || this.options.indentSize;
      const genOptions = {
        comments: true,
        compact: false,
        retainLines: false,
        concise: false,
      };
      const result = generator(ast, genOptions);
      let formatted = result.code;
      if (options.addNewlines !== false) {
        formatted = this._addNewlines(formatted);
      }
      return formatted;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Beautify error: ${error.message}`);
    }
  }

  _parseCode(code, options = {}) {
    const parseOptions = {
      sourceType: options.sourceType || this.options.sourceType,
      plugins: options.plugins || this.options.plugins,
      allowReturnOutsideFunction: options.allowReturnOutsideFunction || true,
      allowAwaitOutsideFunction: options.allowAwaitOutsideFunction || true,
    };
    return parser.parse(code, parseOptions);
  }

  _removeConsole(ast) {
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "console"
        ) {
          if (path.parentPath.isExpressionStatement()) {
            path.remove();
          } else {
            path.replaceWith(t.identifier("undefined"));
          }
        }
      },
    });
  }

  _removeDebugger(ast) {
    traverse(ast, {
      DebuggerStatement(path) {
        path.remove();
      },
    });
  }

  _removeDeadCode(ast) {
    traverse(ast, {
      IfStatement(path) {
        const test = path.node.test;
        if (t.isBooleanLiteral(test)) {
          if (test.value) {
            path.replaceWith(path.node.consequent);
          } else if (path.node.alternate) {
            path.replaceWith(path.node.alternate);
          } else {
            path.remove();
          }
        }
      },
      ConditionalExpression(path) {
        const test = path.node.test;
        if (t.isBooleanLiteral(test)) {
          path.replaceWith(
            test.value ? path.node.consequent : path.node.alternate
          );
        }
      },
      LogicalExpression(path) {
        const left = path.node.left;
        const right = path.node.right;
        if (
          t.isBooleanLiteral(left) ||
          t.isStringLiteral(left) ||
          t.isNumericLiteral(left)
        ) {
          if (path.node.operator === "&&") {
            path.replaceWith(left.value ? right : left);
          } else if (path.node.operator === "||") {
            path.replaceWith(left.value ? left : right);
          }
        }
      },
    });
  }

  _addNewlines(code) {
    const lines = code.split("\n");
    const result = [];
    let prevType = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      let currentType = this._getLineType(trimmed);
      if (prevType && currentType && prevType !== currentType) {
        if (
          (prevType === "import" && currentType !== "import") ||
          (prevType !== "function" && currentType === "function") ||
          (prevType === "function" && currentType !== "function") ||
          (prevType === "class" && currentType !== "class")
        ) {
          result.push("");
        }
      }
      result.push(line);
      prevType = currentType;
    }
    return result.join("\n");
  }

  _getLineType(line) {
    if (!line) return null;
    if (/^import\s/.test(line) || /^export\s/.test(line)) return "import";
    if (/^(function|class|const|let|var)\s/.test(line)) return "declaration";
    if (/^\/\/|^\/*/.test(line)) return "comment";
    return null;
  }

  analyzeCode(code, options = {}) {
    this.statistics.totalAnalyzed++;
    if (!code || typeof code !== "string") {
      return { error: "Invalid code" };
    }
    try {
      const ast = this._parseCode(code, options);
      const analysis = {
        lines: code.split("\n").length,
        characters: code.length,
        nodes: this._countNodes(ast),
        functions: this._countFunctions(ast),
        classes: this._countClasses(ast),
        imports: this._countImports(ast),
        exports: this._countExports(ast),
        variables: this._countVariables(ast),
        complexity: this._calculateComplexity(ast),
        dependencies: this._extractDependencies(ast),
        identifiers: this._extractIdentifiers(ast),
      };
      return analysis;
    } catch (error) {
      this.statistics.errors++;
      return { error: error.message };
    }
  }

  _countNodes(ast) {
    let count = 0;
    traverse(ast, {
      enter() {
        count++;
      },
    });
    return count;
  }

  _countFunctions(ast) {
    let count = 0;
    traverse(ast, {
      FunctionDeclaration() {
        count++;
      },
      FunctionExpression() {
        count++;
      },
      ArrowFunctionExpression() {
        count++;
      },
      ClassMethod() {
        count++;
      },
      ObjectMethod() {
        count++;
      },
    });
    return count;
  }

  _countClasses(ast) {
    let count = 0;
    traverse(ast, {
      ClassDeclaration() {
        count++;
      },
      ClassExpression() {
        count++;
      },
    });
    return count;
  }

  _countImports(ast) {
    let count = 0;
    traverse(ast, {
      ImportDeclaration() {
        count++;
      },
    });
    return count;
  }

  _countExports(ast) {
    let count = 0;
    traverse(ast, {
      ExportNamedDeclaration() {
        count++;
      },
      ExportDefaultDeclaration() {
        count++;
      },
      ExportAllDeclaration() {
        count++;
      },
    });
    return count;
  }

  _countVariables(ast) {
    let count = 0;
    traverse(ast, {
      VariableDeclarator() {
        count++;
      },
    });
    return count;
  }

  _calculateComplexity(ast) {
    let complexity = 1;
    traverse(ast, {
      IfStatement() {
        complexity++;
      },
      ConditionalExpression() {
        complexity++;
      },
      ForStatement() {
        complexity++;
      },
      ForInStatement() {
        complexity++;
      },
      ForOfStatement() {
        complexity++;
      },
      WhileStatement() {
        complexity++;
      },
      DoWhileStatement() {
        complexity++;
      },
      SwitchCase() {
        complexity++;
      },
      LogicalExpression(path) {
        if (path.node.operator === "&&" || path.node.operator === "||") {
          complexity++;
        }
      },
      CatchClause() {
        complexity++;
      },
    });
    return complexity;
  }

  _extractDependencies(ast) {
    const dependencies = [];
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        dependencies.push({
          type: "import",
          source,
          specifiers: path.node.specifiers.map((s) => ({
            type: s.type,
            local: s.local?.name,
            imported: s.imported?.name || s.local?.name,
          })),
        });
      },
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          dependencies.push({
            type: "export",
            source: path.node.source.value,
          });
        }
      },
      ExportAllDeclaration(path) {
        dependencies.push({
          type: "export-all",
          source: path.node.source.value,
        });
      },
      CallExpression(path) {
        if (
          path.node.callee.type === "Identifier" &&
          path.node.callee.name === "require" &&
          path.node.arguments.length > 0 &&
          t.isStringLiteral(path.node.arguments[0])
        ) {
          dependencies.push({
            type: "require",
            source: path.node.arguments[0].value,
          });
        }
      },
    });
    return dependencies;
  }

  _extractIdentifiers(ast) {
    const identifiers = new Set();
    traverse(ast, {
      Identifier(path) {
        if (path.isReferencedIdentifier()) {
          identifiers.add(path.node.name);
        }
      },
    });
    return Array.from(identifiers);
  }

  transformCode(code, transformations, options = {}) {
    this.statistics.totalTransformed++;
    if (!code || typeof code !== "string") {
      return code;
    }
    try {
      const ast = this._parseCode(code, options);
      for (const transform of transformations) {
        this._applyTransformation(ast, transform);
      }
      const result = generator(ast, { comments: options.comments !== false });
      return result.code;
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Transform error: ${error.message}`);
    }
  }

  _applyTransformation(ast, transform) {
    switch (transform.type) {
      case "rename":
        this._renameIdentifier(ast, transform.from, transform.to);
        break;
      case "remove":
        this._removeNodes(ast, transform.nodeType, transform.predicate);
        break;
      case "replace":
        this._replaceNodes(ast, transform.nodeType, transform.replacer);
        break;
      case "inject":
        this._injectCode(ast, transform.code, transform.position);
        break;
      case "wrap":
        this._wrapFunction(ast, transform.functionName, transform.wrapper);
        break;
      default:
        throw new Error(`Unknown transformation type: ${transform.type}`);
    }
  }

  _renameIdentifier(ast, from, to) {
    traverse(ast, {
      Identifier(path) {
        if (path.node.name === from) {
          path.node.name = to;
        }
      },
    });
  }

  _removeNodes(ast, nodeType, predicate) {
    traverse(ast, {
      [nodeType](path) {
        if (!predicate || predicate(path.node)) {
          path.remove();
        }
      },
    });
  }

  _replaceNodes(ast, nodeType, replacer) {
    traverse(ast, {
      [nodeType](path) {
        const replacement = replacer(path.node);
        if (replacement) {
          path.replaceWith(replacement);
        }
      },
    });
  }

  _injectCode(ast, code, position) {
    const injectedAst = this._parseCode(code);
    const injectedNodes = injectedAst.program.body;
    if (position === "start") {
      ast.program.body.unshift(...injectedNodes);
    } else {
      ast.program.body.push(...injectedNodes);
    }
  }

  _wrapFunction(ast, functionName, wrapper) {
    traverse(ast, {
      CallExpression(path) {
        if (
          path.node.callee.type === "Identifier" &&
          path.node.callee.name === functionName
        ) {
          const wrappedCall = t.callExpression(t.identifier(wrapper), [
            path.node,
          ]);
          path.replaceWith(wrappedCall);
          path.skip();
        }
      },
    });
  }

  extractStrings(code, options = {}) {
    const ast = this._parseCode(code, options);
    const strings = [];
    traverse(ast, {
      StringLiteral(path) {
        strings.push({
          value: path.node.value,
          loc: path.node.loc,
        });
      },
      TemplateLiteral(path) {
        const value = path.node.quasis.map((q) => q.value.raw).join("${...}");
        strings.push({
          value,
          type: "template",
          loc: path.node.loc,
        });
      },
    });
    return strings;
  }

  extractNumbers(code, options = {}) {
    const ast = this._parseCode(code, options);
    const numbers = [];
    traverse(ast, {
      NumericLiteral(path) {
        numbers.push({
          value: path.node.value,
          loc: path.node.loc,
        });
      },
      BigIntLiteral(path) {
        numbers.push({
          value: path.node.value,
          type: "bigint",
          loc: path.node.loc,
        });
      },
    });
    return numbers;
  }

  extractFunctions(code, options = {}) {
    const ast = this._parseCode(code, options);
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
        });
      },
      ArrowFunctionExpression(path) {
        functions.push({
          name: "arrow",
          type: "arrow",
          async: path.node.async,
          params: path.node.params.length,
          loc: path.node.loc,
        });
      },
    });
    return functions;
  }

  extractClasses(code, options = {}) {
    const ast = this._parseCode(code, options);
    const classes = [];
    traverse(ast, {
      ClassDeclaration(path) {
        classes.push({
          name: path.node.id?.name || "anonymous",
          superClass: path.node.superClass?.name || null,
          methods: path.node.body.body.filter((n) => n.type === "ClassMethod")
            .length,
          properties: path.node.body.body.filter(
            (n) => n.type === "ClassProperty"
          ).length,
          loc: path.node.loc,
        });
      },
    });
    return classes;
  }

  validateSyntax(code, options = {}) {
    try {
      this._parseCode(code, options);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
      };
    }
  }

  diffCode(code1, code2, options = {}) {
    const ast1 = this._parseCode(code1, options);
    const ast2 = this._parseCode(code2, options);
    const diff = {
      added: [],
      removed: [],
      modified: [],
    };
    const nodes1 = this._flattenAST(ast1);
    const nodes2 = this._flattenAST(ast2);
    for (const [key, node] of nodes2) {
      if (!nodes1.has(key)) {
        diff.added.push({ type: node.type, loc: node.loc });
      } else if (JSON.stringify(nodes1.get(key)) !== JSON.stringify(node)) {
        diff.modified.push({ type: node.type, loc: node.loc });
      }
    }
    for (const [key, node] of nodes1) {
      if (!nodes2.has(key)) {
        diff.removed.push({ type: node.type, loc: node.loc });
      }
    }
    return diff;
  }

  _flattenAST(ast) {
    const nodes = new Map();
    let counter = 0;
    traverse(ast, {
      enter(path) {
        const key = `${path.node.type}_${counter++}`;
        const simplified = { ...path.node };
        delete simplified.loc;
        delete simplified.start;
        delete simplified.end;
        nodes.set(key, simplified);
      },
    });
    return nodes;
  }

  compareCode(code1, code2, options = {}) {
    const ast1 = this._parseCode(code1, options);
    const ast2 = this._parseCode(code2, options);
    const stats1 = this._getCodeStats(ast1);
    const stats2 = this._getCodeStats(ast2);
    return {
      identical: JSON.stringify(stats1) === JSON.stringify(stats2),
      stats1,
      stats2,
      differences: this._findDifferences(stats1, stats2),
    };
  }

  _getCodeStats(ast) {
    return {
      nodeTypes: this._getNodeTypes(ast),
      functionCount: this._countFunctions(ast),
      classCount: this._countClasses(ast),
      importCount: this._countImports(ast),
      exportCount: this._countExports(ast),
      variableCount: this._countVariables(ast),
      complexity: this._calculateComplexity(ast),
    };
  }

  _getNodeTypes(ast) {
    const types = {};
    traverse(ast, {
      enter(path) {
        types[path.node.type] = (types[path.node.type] || 0) + 1;
      },
    });
    return types;
  }

  _findDifferences(stats1, stats2) {
    const diffs = [];
    const allKeys = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);
    for (const key of allKeys) {
      const val1 = stats1[key];
      const val2 = stats2[key];
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diffs.push({ key, value1: val1, value2: val2 });
      }
    }
    return diffs;
  }

  extractComments(code, options = {}) {
    const ast = this._parseCode(code, { ...options, tokens: true });
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

  removeComments(code, options = {}) {
    const ast = this._parseCode(code, options);
    traverse(ast, {
      enter(path) {
        path.node.leadingComments = null;
        path.node.innerComments = null;
        path.node.trailingComments = null;
      },
    });
    const result = generator(ast, { comments: false });
    return result.code;
  }

  addHeader(code, header, options = {}) {
    const headerComment =
      options.style === "block"
        ? `/*\n${header
            .split("\n")
            .map((l) => ` * ${l}`)
            .join("\n")}\n */`
        : header
            .split("\n")
            .map((l) => `// ${l}`)
            .join("\n");
    return `${headerComment}\n\n${code}`;
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
      totalFormatted: 0,
      totalMinified: 0,
      totalAnalyzed: 0,
      totalTransformed: 0,
      errors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = CodeUtils;
