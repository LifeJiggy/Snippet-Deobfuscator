/**
 * Parser Utilities
 * Production-grade code parsing utilities
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class Parser {
  constructor(options = {}) {
    this.name = "parser";
    this.version = "3.0.0";
    this.options = {
      plugins: options.plugins || [
        "jsx",
        "typescript",
        "classProperties",
        "decorators-legacy",
      ],
      sourceType: options.sourceType || "unambiguous",
      errorRecovery: options.errorRecovery !== false,
    };
    this.stats = {
      parsed: 0,
      failed: 0,
      nodes: 0,
    };
  }

  /**
   * Parse code to AST
   */
  parse(code, options = {}) {
    const opts = { ...this.options, ...options };

    try {
      const ast = parse(code, {
        sourceType: opts.sourceType,
        plugins: opts.plugins,
        errorRecovery: opts.errorRecovery,
      });

      this.stats.parsed++;
      this.stats.nodes = this.countNodes(ast);

      return { success: true, ast };
    } catch (error) {
      this.stats.failed++;
      return {
        success: false,
        error: error.message,
        loc: error.loc,
        pos: error.pos,
      };
    }
  }

  /**
   * Safe parse with fallback
   */
  parseSafe(code, options = {}) {
    const result = this.parse(code, options);

    if (!result.success) {
      // Try with fewer plugins
      const fallback = this.parse(code, {
        ...options,
        plugins: ["jsx"],
      });

      if (fallback.success) {
        return fallback;
      }

      // Try basic JavaScript
      return this.parse(code, {
        ...options,
        plugins: [],
      });
    }

    return result;
  }

  /**
   * Count AST nodes
   */
  countNodes(ast) {
    let count = 0;

    traverse(ast, {
      enter() {
        count++;
      },
    });

    return count;
  }

  /**
   * Traverse AST
   */
  traverse(ast, visitors) {
    return traverse(ast, visitors);
  }

  /**
   * Generate code from AST
   */
  generate(ast, options = {}) {
    try {
      return {
        success: true,
        code: generate(ast, {
          comments: options.comments !== false,
          compact: options.compact || false,
          concise: options.concise || false,
          retainLines: options.retainLines || false,
          jsescOption: { minimal: true },
        }).code,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract functions
   */
  extractFunctions(ast) {
    const functions = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          type: "FunctionDeclaration",
          name: path.node.id?.name,
          params: path.node.params.length,
          body: path.node.body,
          loc: path.node.loc,
        });
      },

      FunctionExpression(path) {
        const parent = path.parent;
        functions.push({
          type: "FunctionExpression",
          name: parent.id?.name || "anonymous",
          params: path.node.params.length,
          body: path.node.body,
          loc: path.node.loc,
        });
      },

      ArrowFunctionExpression(path) {
        functions.push({
          type: "ArrowFunctionExpression",
          name: "arrow",
          params: path.node.params.length,
          body: path.node.body,
          loc: path.node.loc,
        });
      },
    });

    return functions;
  }

  /**
   * Extract variables
   */
  extractVariables(ast) {
    const variables = [];

    traverse(ast, {
      VariableDeclarator(path) {
        if (path.node.id) {
          variables.push({
            name: path.node.id.name,
            kind: path.parent.kind,
            init: path.node.init,
            loc: path.node.loc,
          });
        }
      },
    });

    return variables;
  }

  /**
   * Extract imports
   */
  extractImports(ast) {
    const imports = [];

    traverse(ast, {
      ImportDeclaration(path) {
        imports.push({
          source: path.node.source.value,
          specifiers: path.node.specifiers.map((s) => ({
            type: s.type,
            name: s.imported?.name || s.local?.name,
            kind: s.type,
          })),
          loc: path.node.loc,
        });
      },

      CallExpression(path) {
        if (path.node.callee.name === "require") {
          const arg = path.node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            imports.push({
              source: arg.value,
              type: "require",
              loc: path.node.loc,
            });
          }
        }
      },
    });

    return imports;
  }

  /**
   * Extract exports
   */
  extractExports(ast) {
    const exports = [];

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          exports.push({
            type: "named",
            name: path.node.declaration.id?.name,
            declaration: path.node.declaration,
            loc: path.node.loc,
          });
        }
      },

      ExportDefaultDeclaration(path) {
        exports.push({
          type: "default",
          declaration: path.node.declaration,
          loc: path.node.loc,
        });
      },

      AssignmentExpression(path) {
        if (
          path.parent.type === "ExportNamedDeclaration" ||
          path.node.left?.object?.name === "module"
        ) {
          exports.push({
            type: "module",
            name: path.node.left?.property?.name,
            loc: path.node.loc,
          });
        }
      },
    });

    return exports;
  }

  /**
   * Find node by location
   */
  findNodeAt(ast, line, column) {
    let found = null;

    traverse(ast, {
      enter(path) {
        if (path.node.loc) {
          const start = path.node.loc.start;
          const end = path.node.loc.end;

          if (start.line <= line && line <= end.line) {
            if (
              (start.line === line && start.column <= column) ||
              start.line < line
            ) {
              if (
                (end.line === line && end.column >= column) ||
                end.line > line
              ) {
                found = path.node;
              }
            }
          }
        }
      },
    });

    return found;
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { parsed: 0, failed: 0, nodes: 0 };
  }

  /**
   * Dispose
   */
  dispose() {
    // Cleanup if needed
  }
}

module.exports = Parser;
