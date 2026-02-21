/**
 * Dead Code Elimination Skill
 * Production-grade dead code detection and elimination for JavaScript
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class DeadCodeEliminationSkill {
  constructor() {
    this.name = "dead-code-elimination";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      unreachableCode: 0,
      falseBranches: 0,
      emptyBlocks: 0,
      unusedDeclarations: 0,
      total: 0,
    };
    this.removed = [];
    this.usedBindings = new Set();
  }

  execute(code, options = {}) {
    return this.eliminate(code, options);
  }

  eliminate(code, options = {}) {
    this.stats = {
      unreachableCode: 0,
      falseBranches: 0,
      emptyBlocks: 0,
      unusedDeclarations: 0,
      total: 0,
    };
    this.removed = [];
    this.usedBindings = new Set();

    const result = {
      optimizedCode: code,
      removed: [],
      statistics: {},
      warnings: [],
      errors: [],
    };

    try {
      const ast = this.parseCode(code);
      if (!ast) {
        result.warnings.push("Failed to parse code into AST");
        return result;
      }

      this.findUsedBindings(ast);
      this.removeUnreachableCode(ast);
      this.removeFalseBranches(ast);
      this.removeEmptyBlocks(ast);
      this.removeUnusedDeclarations(ast);

      result.optimizedCode = generate(ast, { comments: true }).code;
      result.removed = this.removed;
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

  findUsedBindings(ast) {
    traverse(ast, {
      Identifier: (path) => {
        if (path.isReferencedIdentifier()) {
          const binding = path.scope.getBinding(path.node.name);
          if (binding) {
            this.usedBindings.add(binding);
          }
        }
      },
    });
  }

  removeUnreachableCode(ast) {
    const self = this;

    traverse(ast, {
      BlockStatement(path) {
        const body = path.node.body;
        const newBody = [];
        let foundTerminal = false;
        let terminalIndex = -1;

        for (let i = 0; i < body.length; i++) {
          const stmt = body[i];

          if (foundTerminal) {
            self.removed.push({
              type: "unreachable-code",
              reason: "Code after terminal statement",
              line: stmt.loc?.start?.line,
            });
            self.stats.unreachableCode++;
            self.stats.total++;
            continue;
          }

          if (self.isTerminalStatement(stmt)) {
            foundTerminal = true;
            terminalIndex = i;
          }

          newBody.push(stmt);
        }

        if (newBody.length !== body.length) {
          path.node.body = newBody;
        }
      },

      FunctionDeclaration(path) {
        const body = path.node.body.body;
        const newBody = [];
        let foundReturn = false;

        for (const stmt of body) {
          if (foundReturn && !self.isVariableDeclaration(stmt)) {
            self.removed.push({
              type: "unreachable-function-code",
              reason: "Code after return in function",
              line: stmt.loc?.start?.line,
            });
            self.stats.unreachableCode++;
            self.stats.total++;
            continue;
          }

          if (self.isReturnStatement(stmt)) {
            foundReturn = true;
          }

          newBody.push(stmt);
        }

        path.node.body.body = newBody;
      },
    });
  }

  isTerminalStatement(stmt) {
    const terminalTypes = [
      "ReturnStatement",
      "ThrowStatement",
      "BreakStatement",
      "ContinueStatement",
    ];
    return terminalTypes.includes(stmt.type);
  }

  isReturnStatement(stmt) {
    return stmt.type === "ReturnStatement";
  }

  isVariableDeclaration(stmt) {
    return stmt.type === "VariableDeclaration";
  }

  removeFalseBranches(ast) {
    const self = this;

    traverse(ast, {
      IfStatement(path) {
        const test = path.node.test;

        if (test.type === "BooleanLiteral" && test.value === false) {
          if (path.node.alternate) {
            const alternate = path.node.alternate;
            if (alternate.type === "BlockStatement") {
              path.replaceWithMultiple(alternate.body);
            } else {
              path.replaceWith(alternate);
            }
          } else {
            path.remove();
          }

          self.removed.push({
            type: "false-branch",
            reason: "if(false) branch removed",
            line: path.node.loc?.start?.line,
          });
          self.stats.falseBranches++;
          self.stats.total++;
        }

        if (test.type === "BooleanLiteral" && test.value === true) {
          const consequent = path.node.consequent;
          if (consequent.type === "BlockStatement") {
            path.replaceWithMultiple(consequent.body);
          } else {
            path.replaceWith(consequent);
          }

          self.removed.push({
            type: "true-branch-simplified",
            reason: "if(true) simplified",
            line: path.node.loc?.start?.line,
          });
          self.stats.falseBranches++;
          self.stats.total++;
        }
      },

      ConditionalExpression(path) {
        const test = path.node.test;

        if (test.type === "BooleanLiteral") {
          const replacement = test.value
            ? path.node.consequent
            : path.node.alternate;
          path.replaceWith(replacement);

          self.removed.push({
            type: "conditional-simplified",
            reason: "Ternary with constant condition simplified",
            line: path.node.loc?.start?.line,
          });
          self.stats.falseBranches++;
          self.stats.total++;
        }
      },
    });
  }

  removeEmptyBlocks(ast) {
    const self = this;

    traverse(ast, {
      BlockStatement(path) {
        if (path.node.body.length === 0) {
          if (
            path.parent.type === "FunctionDeclaration" ||
            path.parent.type === "FunctionExpression" ||
            path.parent.type === "ArrowFunctionExpression"
          ) {
            return;
          }

          if (
            path.parent.type === "TryStatement" ||
            path.parent.type === "CatchClause"
          ) {
            return;
          }

          path.remove();

          self.removed.push({
            type: "empty-block",
            reason: "Empty block statement removed",
          });
          self.stats.emptyBlocks++;
          self.stats.total++;
        }
      },

      EmptyStatement(path) {
        path.remove();

        self.removed.push({
          type: "empty-statement",
          reason: "Empty statement removed",
        });
        self.stats.emptyBlocks++;
        self.stats.total++;
      },
    });
  }

  removeUnusedDeclarations(ast) {
    const self = this;

    traverse(ast, {
      Program(path) {
        const bindings = path.scope.getAllBindings();

        for (const [name, binding] of Object.entries(bindings)) {
          if (binding.constantViolations.length > 0) continue;

          if (binding.referenced || binding.references > 0) continue;

          if (name.startsWith("_") && name.length === 1) continue;

          if (binding.path.node.type === "FunctionDeclaration") {
            if (self.hasSideEffects(binding.path.node)) continue;

            binding.path.remove();

            self.removed.push({
              type: "unused-function",
              name: name,
              reason: "Function declared but never used",
            });
            self.stats.unusedDeclarations++;
            self.stats.total++;
          }

          if (binding.path.node.type === "VariableDeclarator") {
            const init = binding.path.node.init;
            if (init && self.hasSideEffects(init)) continue;

            if (binding.path.parent.declarations.length === 1) {
              binding.path.parentPath.remove();
            } else {
              binding.path.remove();
            }

            self.removed.push({
              type: "unused-variable",
              name: name,
              reason: "Variable declared but never used",
            });
            self.stats.unusedDeclarations++;
            self.stats.total++;
          }
        }
      },
    });
  }

  hasSideEffects(node) {
    if (!node) return false;

    const sideEffectTypes = [
      "CallExpression",
      "NewExpression",
      "AssignmentExpression",
      "UpdateExpression",
      "DeleteExpression",
      "ThrowStatement",
    ];

    if (sideEffectTypes.includes(node.type)) {
      return true;
    }

    for (const key in node) {
      if (node[key] && typeof node[key] === "object") {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            if (
              child &&
              typeof child === "object" &&
              this.hasSideEffects(child)
            ) {
              return true;
            }
          }
        } else if (this.hasSideEffects(node[key])) {
          return true;
        }
      }
    }

    return false;
  }

  getStatistics() {
    return {
      ...this.stats,
      codeReduction: this.removed.length,
    };
  }

  clearCache() {
    this.cache.clear();
    this.removed = [];
    this.usedBindings.clear();
  }

  dispose() {
    this.cache.clear();
    this.removed = [];
    this.usedBindings.clear();
  }
}

module.exports = DeadCodeEliminationSkill;
