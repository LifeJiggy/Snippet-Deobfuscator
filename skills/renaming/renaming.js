/**
 * Renaming Skill
 * Production-grade variable and function renaming for JavaScript deobfuscation
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class RenamingSkill {
  constructor() {
    this.name = "renaming";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      variables: 0,
      functions: 0,
      properties: 0,
      total: 0,
    };
    this.nameMappings = new Map();
    this.scopeBindings = new Map();
    this.namingDatabase = this.initializeNamingDatabase();
    this.contextPatterns = this.initializeContextPatterns();
  }

  execute(code, options = {}) {
    return this.analyze(code, options);
  }

  initializeNamingDatabase() {
    return {
      singleLetter: {
        a: ["array", "accumulator", "argument"],
        b: ["buffer", "boolean", "base"],
        c: ["count", "config", "context", "char"],
        d: ["data", "date", "delta"],
        e: ["error", "event", "element"],
        f: ["file", "flag", "format"],
        g: ["global", "group", "graph"],
        h: ["handler", "hash", "height"],
        i: ["index", "iterator", "item"],
        j: ["index", "json", "job"],
        k: ["key", "counter"],
        l: ["length", "list", "line"],
        m: ["map", "match", "message", "mode"],
        n: ["name", "number", "node", "count"],
        o: ["object", "option", "offset", "output"],
        p: ["param", "position", "pointer", "page"],
        q: ["query", "queue", "quote"],
        r: ["result", "row", "request", "response"],
        s: ["string", "state", "size", "source"],
        t: ["temp", "type", "time", "target"],
        u: ["url", "user", "unit"],
        v: ["value", "variable", "view", "version"],
        w: ["width", "window", "weight"],
        x: ["xCoord", "index", "unknown"],
        y: ["yCoord", "index", "year"],
        z: ["zero", "zone", "zip"],
      },
      prefixes: {
        str: ["string", "text", "value"],
        arr: ["array", "list", "items"],
        obj: ["object", "config", "options"],
        num: ["number", "count", "value"],
        fn: ["function", "handler", "callback"],
        cb: ["callback", "handler", "listener"],
        is: ["boolean", "flag"],
        has: ["boolean", "flag"],
        get: ["getter", "fetcher"],
        set: ["setter", "mutator"],
        on: ["handler", "listener"],
        handle: ["handler", "processor"],
      },
      common: {
        loop: ["index", "i", "j", "k", "item", "element"],
        array: ["items", "list", "array", "data", "elements"],
        object: ["obj", "data", "config", "options", "settings"],
        string: ["str", "text", "value", "content", "message"],
        number: ["num", "value", "count", "index"],
        boolean: ["flag", "isTrue", "isValid", "enabled"],
        function: ["handler", "callback", "func", "fn"],
      },
    };
  }

  initializeContextPatterns() {
    return {
      loop: {
        patterns: [/for\s*\(/, /while\s*\(/, /\.forEach\s*\(/, /\.map\s*\(/],
        suggestions: ["index", "item", "element", "current"],
      },
      array: {
        patterns: [/\[/, /Array/, /\.push\s*\(/, /\.pop\s*\(/, /\.map\s*\(/],
        suggestions: ["items", "list", "array", "data"],
      },
      object: {
        patterns: [/\{/, /Object/, /Object\.keys/, /Object\.values/],
        suggestions: ["obj", "data", "config", "options"],
      },
      string: {
        patterns: [
          /'/,
          /"/,
          /`/,
          /concat/,
          /split/,
          /join/,
          /substring/,
          /slice/,
        ],
        suggestions: ["str", "text", "value", "content"],
      },
      number: {
        patterns: [/\d+/, /Math\./, /parseInt/, /parseFloat/],
        suggestions: ["num", "value", "count", "index"],
      },
      boolean: {
        patterns: [/true/, /false/, /!/, /&&/, /\|\|/],
        suggestions: ["flag", "isValid", "enabled", "active"],
      },
      function: {
        patterns: [/=>/, /function\s*\(/, /return\s+/],
        suggestions: ["handler", "callback", "func", "processor"],
      },
      dom: {
        patterns: [/document/, /window/, /element/, /querySelector/],
        suggestions: ["element", "node", "container", "wrapper"],
      },
      network: {
        patterns: [/fetch/, /XMLHttpRequest/, /response/, /request/],
        suggestions: ["response", "data", "result", "payload"],
      },
      event: {
        patterns: [/addEventListener/, /onClick/, /on[A-Z]/],
        suggestions: ["handler", "listener", "callback", "event"],
      },
      react: {
        patterns: [/useState/, /useEffect/, /useCallback/, /React/],
        suggestions: ["state", "setState", "handler", "effect"],
      },
    };
  }

  analyze(code, options = {}) {
    this.stats = { variables: 0, functions: 0, properties: 0, total: 0 };
    this.nameMappings = new Map();
    this.scopeBindings = new Map();

    const result = {
      renamedCode: code,
      mappings: {},
      statistics: {},
      suggestions: [],
      warnings: [],
      errors: [],
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        result.warnings.push("Failed to parse code into AST");
        return result;
      }

      this.collectBindings(ast);
      this.generateNames(ast);
      this.applyRenaming(ast);

      result.renamedCode = generate(ast, { comments: true }).code;
      result.mappings = Object.fromEntries(this.nameMappings);
      result.statistics = this.getStatistics();
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
    } catch (e) {
      return null;
    }
  }

  collectBindings(ast) {
    const self = this;
    traverse(ast, {
      Program(path) {
        const bindings = path.scope.getAllBindings();
        for (const [name, binding] of Object.entries(bindings)) {
          self.scopeBindings.set(name, {
            type: binding.path.node.type,
            context: self.inferContext(binding.path),
            usages: self.countUsages(binding),
          });
        }
      },
      FunctionDeclaration(path) {
        self.scopeBindings.set(path.node.id.name, {
          type: "function",
          context: self.inferFunctionContext(path),
          usages: 1,
        });
      },
      VariableDeclarator(path) {
        if (path.node.id.type === "Identifier") {
          self.scopeBindings.set(path.node.id.name, {
            type: "variable",
            context: self.inferVariableContext(path),
            usages: 1,
          });
        }
      },
    });
  }

  inferContext(path) {
    const code = generate(path.node).code;
    for (const [name, config] of Object.entries(this.contextPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(code)) {
          return { type: name, suggestions: config.suggestions };
        }
      }
    }
    return { type: "unknown", suggestions: ["value", "data"] };
  }

  inferFunctionContext(path) {
    const name = path.node.id?.name || "";
    if (name.startsWith("on") || name.startsWith("handle")) {
      return { type: "event", suggestions: ["handler", "callback"] };
    }
    if (name.startsWith("get")) {
      return { type: "getter", suggestions: ["getter", "fetcher"] };
    }
    if (name.startsWith("set")) {
      return { type: "setter", suggestions: ["setter", "mutator"] };
    }
    if (path.node.async) {
      return { type: "async", suggestions: ["fetcher", "loader", "handler"] };
    }
    return { type: "function", suggestions: ["func", "handler", "processor"] };
  }

  inferVariableContext(path) {
    const init = path.node.init;
    if (!init) {
      return { type: "uninitialized", suggestions: ["value", "temp"] };
    }
    if (init.type === "ArrayExpression") {
      return { type: "array", suggestions: this.namingDatabase.common.array };
    }
    if (init.type === "ObjectExpression") {
      return { type: "object", suggestions: this.namingDatabase.common.object };
    }
    if (init.type === "StringLiteral") {
      return { type: "string", suggestions: this.namingDatabase.common.string };
    }
    if (init.type === "NumericLiteral") {
      return { type: "number", suggestions: this.namingDatabase.common.number };
    }
    if (init.type === "BooleanLiteral") {
      return {
        type: "boolean",
        suggestions: this.namingDatabase.common.boolean,
      };
    }
    if (
      init.type === "ArrowFunctionExpression" ||
      init.type === "FunctionExpression"
    ) {
      return {
        type: "function",
        suggestions: this.namingDatabase.common.function,
      };
    }
    return { type: "unknown", suggestions: ["value", "data"] };
  }

  countUsages(binding) {
    let count = 0;
    const paths = binding.referencePaths || [];
    count += paths.length;
    return count + 1;
  }

  generateNames(ast) {
    for (const [name, info] of this.scopeBindings) {
      if (this.shouldRename(name)) {
        const newName = this.generateName(name, info);
        this.nameMappings.set(name, newName);
      }
    }
  }

  shouldRename(name) {
    if (/^[A-Z_]+$/.test(name)) return false;
    if (name.startsWith("_") && name.length > 2) return false;
    if (name.length <= 2) return true;
    if (/^_0x[0-9a-fA-F]+$/.test(name)) return true;
    if (/^_0X[0-9a-fA-F]+$/.test(name)) return true;
    return false;
  }

  generateName(originalName, info) {
    if (
      originalName.length === 1 &&
      this.namingDatabase.singleLetter[originalName]
    ) {
      const suggestions = this.namingDatabase.singleLetter[originalName];
      const contextSuggestions = info.context?.suggestions || [];
      const merged = [...new Set([...contextSuggestions, ...suggestions])];
      return merged[0] || "value";
    }

    if (
      /^_0x[0-9a-fA-F]+$/.test(originalName) ||
      /^_0X[0-9a-fA-F]+$/.test(originalName)
    ) {
      const suggestions = info.context?.suggestions || ["value"];
      return suggestions[0];
    }

    if (originalName.startsWith("_") && originalName.length === 2) {
      const letter = originalName[1];
      if (this.namingDatabase.singleLetter[letter]) {
        return this.namingDatabase.singleLetter[letter][0];
      }
    }

    const suggestions = info.context?.suggestions || ["value"];
    return suggestions[0];
  }

  applyRenaming(ast) {
    const self = this;

    traverse(ast, {
      Identifier(path) {
        const oldName = path.node.name;
        if (self.nameMappings.has(oldName)) {
          const newName = self.nameMappings.get(oldName);
          if (path.isBindingIdentifier()) {
            path.node.name = newName;
            self.stats.variables++;
            self.stats.total++;
          } else if (path.isReferencedIdentifier()) {
            path.node.name = newName;
          }
        }
      },
      FunctionDeclaration(path) {
        const oldName = path.node.id?.name;
        if (oldName && self.nameMappings.has(oldName)) {
          path.node.id.name = self.nameMappings.get(oldName);
          self.stats.functions++;
          self.stats.total++;
        }
      },
    });
  }

  getStatistics() {
    return {
      ...this.stats,
      mappingsCount: this.nameMappings.size,
      averageNameLength: this.calculateAverageNameLength(),
    };
  }

  calculateAverageNameLength() {
    let total = 0;
    for (const [, newName] of this.nameMappings) {
      total += newName.length;
    }
    return this.nameMappings.size > 0
      ? (total / this.nameMappings.size).toFixed(2)
      : 0;
  }

  clearCache() {
    this.cache.clear();
    this.nameMappings.clear();
    this.scopeBindings.clear();
  }

  dispose() {
    this.cache.clear();
    this.nameMappings.clear();
    this.scopeBindings.clear();
    this.namingDatabase = {};
    this.contextPatterns = {};
  }
}

module.exports = RenamingSkill;
