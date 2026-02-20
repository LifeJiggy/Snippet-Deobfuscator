/**
 * Transformer Utilities
 * Production-grade AST transformation utilities
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const t = require("@babel/types");

class Transformer {
  constructor(options = {}) {
    this.name = "transformer";
    this.version = "3.0.0";
    this.options = {
      plugins: options.plugins || [
        "jsx",
        "typescript",
        "classProperties",
        "decorators-legacy",
      ],
      sourceType: options.sourceType || "unambiguous",
      preserveComments: options.preserveComments !== false,
      compact: options.compact || false,
    };
    this.stats = {
      transformed: 0,
      replaced: 0,
      removed: 0,
      inserted: 0,
      wrapped: 0,
      failed: 0,
    };
    this.transformations = [];
  }

  transform(ast, transforms) {
    try {
      const transformList = Array.isArray(transforms)
        ? transforms
        : [transforms];
      const results = [];

      for (const transform of transformList) {
        const result = this._applyTransform(ast, transform);
        results.push(result);
      }

      this.stats.transformed++;

      return {
        success: true,
        ast,
        results,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _applyTransform(ast, transform) {
    const { type, match, replace, options = {} } = transform;
    let count = 0;

    traverse(ast, {
      enter(path) {
        if (match(path)) {
          const replacement = replace(path);
          if (replacement) {
            if (type === "replace") {
              path.replaceWith(replacement);
            } else if (type === "remove") {
              path.remove();
            } else if (type === "insertBefore") {
              path.insertBefore(replacement);
            } else if (type === "insertAfter") {
              path.insertAfter(replacement);
            } else if (type === "wrap") {
              path.replaceWith(replacement(path.node));
            }
            count++;
          }
        }
      },
    });

    return { type, count };
  }

  replaceNode(path, newNode) {
    try {
      if (typeof path === "string") {
        const parts = path.split(".");
        let current = this.currentAst;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (part.includes("[")) {
            const match = part.match(/(.+)\[(\d+)\]/);
            current = current[match[1]][parseInt(match[2])];
          } else {
            current = current[part];
          }
        }

        const lastPart = parts[parts.length - 1];
        if (lastPart.includes("[")) {
          const match = lastPart.match(/(.+)\[(\d+)\]/);
          current[match[1]][parseInt(match[2])] = newNode;
        } else {
          current[lastPart] = newNode;
        }

        this.stats.replaced++;
        return { success: true };
      }

      if (path && typeof path.replaceWith === "function") {
        path.replaceWith(newNode);
        this.stats.replaced++;
        return { success: true };
      }

      return { success: false, error: "Invalid path provided" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  removeNode(path) {
    try {
      if (typeof path === "string") {
        const parts = path.split(".");
        let current = this.currentAst;
        const parents = [];

        for (let i = 0; i < parts.length - 1; i++) {
          parents.push(current);
          const part = parts[i];
          if (part.includes("[")) {
            const match = part.match(/(.+)\[(\d+)\]/);
            current = current[match[1]][parseInt(match[2])];
          } else {
            current = current[part];
          }
        }

        const lastPart = parts[parts.length - 1];
        const parent = parents[parents.length - 1];

        if (lastPart.includes("[")) {
          const match = lastPart.match(/(.+)\[(\d+)\]/);
          current[match[1]].splice(parseInt(match[2]), 1);
        } else {
          delete current[lastPart];
        }

        this.stats.removed++;
        return { success: true };
      }

      if (path && typeof path.remove === "function") {
        path.remove();
        this.stats.removed++;
        return { success: true };
      }

      return { success: false, error: "Invalid path provided" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  insertBefore(path, node) {
    try {
      if (path && typeof path.insertBefore === "function") {
        path.insertBefore(node);
        this.stats.inserted++;
        return { success: true };
      }

      return { success: false, error: "Invalid path provided" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  insertAfter(path, node) {
    try {
      if (path && typeof path.insertAfter === "function") {
        path.insertAfter(node);
        this.stats.inserted++;
        return { success: true };
      }

      return { success: false, error: "Invalid path provided" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  wrapNode(path, wrapper) {
    try {
      if (path && typeof path.replaceWith === "function") {
        const wrappedNode = wrapper(path.node);
        path.replaceWith(wrappedNode);
        this.stats.wrapped++;
        return { success: true, wrappedNode };
      }

      return { success: false, error: "Invalid path provided" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  wrapInFunction(path, functionName, params = []) {
    const wrapper = (node) =>
      t.callExpression(t.identifier(functionName), [
        t.functionExpression(
          null,
          params.map((p) => t.identifier(p)),
          t.blockStatement([t.returnStatement(node)])
        ),
      ]);

    return this.wrapNode(path, wrapper);
  }

  wrapInTryCatch(path, errorVar = "e") {
    const wrapper = (node) =>
      t.tryStatement(
        t.blockStatement([t.expressionStatement(node)]),
        t.catchClause(t.identifier(errorVar), t.blockStatement([]))
      );

    return this.wrapNode(path, wrapper);
  }

  wrapInConditional(path, condition) {
    const wrapper = (node) =>
      t.ifStatement(
        typeof condition === "string" ? t.identifier(condition) : condition,
        t.blockStatement([t.expressionStatement(node)])
      );

    return this.wrapNode(path, wrapper);
  }

  wrapInIIFE(path, args = []) {
    const wrapper = (node) =>
      t.callExpression(
        t.functionExpression(
          null,
          args.map((a) => t.identifier(a)),
          t.blockStatement([t.returnStatement(node)])
        ),
        []
      );

    return this.wrapNode(path, wrapper);
  }

  renameBinding(path, oldName, newName) {
    try {
      const binding = path.scope.getBinding(oldName);

      if (binding) {
        binding.path.node.name = newName;

        binding.referencePaths.forEach((refPath) => {
          refPath.node.name = newName;
        });

        binding.constantViolations.forEach((violationPath) => {
          if (violationPath.isAssignmentExpression()) {
            if (violationPath.node.left.name === oldName) {
              violationPath.node.left.name = newName;
            }
          }
        });

        this.stats.replaced++;
        return { success: true, references: binding.references };
      }

      return { success: false, error: "Binding not found" };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  inlineVariable(path, varName) {
    try {
      const binding = path.scope.getBinding(varName);

      if (binding && binding.path.isVariableDeclarator()) {
        const init = binding.path.node.init;

        binding.referencePaths.forEach((refPath) => {
          refPath.replaceWith(t.cloneNode(init));
        });

        binding.path.parentPath.remove();

        this.stats.replaced++;
        return { success: true, inlined: binding.references };
      }

      return {
        success: false,
        error: "Variable not found or has no initializer",
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  extractFunction(path, name, statements) {
    try {
      const fn = t.functionDeclaration(
        t.identifier(name),
        [],
        t.blockStatement(statements)
      );

      path.insertBefore(fn);

      this.stats.inserted++;
      return { success: true, function: fn };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  extractVariable(path, name, expression) {
    try {
      const decl = t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(name), expression),
      ]);

      path.insertBefore(decl);

      this.stats.inserted++;
      return { success: true, declaration: decl };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  mergeStatements(path, statements) {
    try {
      const merged = statements.filter((s) => s);
      const block = t.blockStatement(merged);

      this.stats.transformed++;
      return { success: true, block };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  splitStatement(path, statements) {
    try {
      statements.forEach((stmt) => {
        path.insertBefore(stmt);
      });

      path.remove();

      this.stats.transformed++;
      return { success: true, count: statements.length };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  simplifyExpression(path) {
    try {
      const node = path.node;

      if (t.isUnaryExpression(node, { operator: "!" })) {
        if (t.isUnaryExpression(node.argument, { operator: "!" })) {
          path.replaceWith(node.argument.argument);
          this.stats.transformed++;
          return { success: true, simplified: true };
        }
      }

      if (t.isBinaryExpression(node)) {
        if (t.isLiteral(node.left) && t.isLiteral(node.right)) {
          const result = this._evalBinary(node);
          if (result !== null) {
            path.replaceWith(t.numericLiteral(result));
            this.stats.transformed++;
            return { success: true, simplified: true };
          }
        }
      }

      if (t.isLogicalExpression(node)) {
        if (t.isLiteral(node.left)) {
          if (node.operator === "&&") {
            if (node.left.value) {
              path.replaceWith(node.right);
              this.stats.transformed++;
              return { success: true, simplified: true };
            } else {
              path.replaceWith(node.left);
              this.stats.transformed++;
              return { success: true, simplified: true };
            }
          }
          if (node.operator === "||") {
            if (node.left.value) {
              path.replaceWith(node.left);
              this.stats.transformed++;
              return { success: true, simplified: true };
            } else {
              path.replaceWith(node.right);
              this.stats.transformed++;
              return { success: true, simplified: true };
            }
          }
        }
      }

      return { success: true, simplified: false };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _evalBinary(node) {
    const left = node.left.value;
    const right = node.right.value;

    switch (node.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      default:
        return null;
    }
  }

  flattenConditionals(path) {
    try {
      if (!path.isIfStatement()) {
        return { success: false, error: "Not an if statement" };
      }

      const consequent = path.node.consequent;
      const alternate = path.node.alternate;

      if (
        consequent &&
        t.isBlockStatement(consequent) &&
        consequent.body.length === 1 &&
        t.isIfStatement(consequent.body[0])
      ) {
        const inner = consequent.body[0];
        const newTest = t.logicalExpression("&&", path.node.test, inner.test);
        const newIf = t.ifStatement(
          newTest,
          inner.consequent,
          inner.alternate || alternate
        );

        path.replaceWith(newIf);
        this.stats.transformed++;
        return { success: true, flattened: true };
      }

      return { success: true, flattened: false };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  convertToArrowFunction(path) {
    try {
      if (!path.isFunctionDeclaration() && !path.isFunctionExpression()) {
        return { success: false, error: "Not a function" };
      }

      const node = path.node;
      const arrowFn = t.arrowFunctionExpression(
        node.params,
        node.body,
        node.async
      );

      if (path.isFunctionDeclaration()) {
        const decl = t.variableDeclaration("const", [
          t.variableDeclarator(t.identifier(node.id.name), arrowFn),
        ]);
        path.replaceWith(decl);
      } else {
        path.replaceWith(arrowFn);
      }

      this.stats.transformed++;
      return { success: true };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  convertVarToLetConst(path) {
    try {
      if (!path.isVariableDeclaration() || path.node.kind !== "var") {
        return { success: false, error: "Not a var declaration" };
      }

      const bindings = path.node.declarations.map((decl) =>
        path.scope.getBinding(decl.id.name)
      );

      const hasReassignment = bindings.some(
        (binding) => binding && binding.constantViolations.length > 0
      );

      path.node.kind = hasReassignment ? "let" : "const";

      this.stats.transformed++;
      return { success: true, newKind: path.node.kind };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      transformed: 0,
      replaced: 0,
      removed: 0,
      inserted: 0,
      wrapped: 0,
      failed: 0,
    };
    this.transformations = [];
  }

  dispose() {
    this.reset();
  }
}

module.exports = Transformer;
