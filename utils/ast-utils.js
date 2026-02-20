const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const t = require("@babel/types");

class ASTUtils {
  constructor(options = {}) {
    this.name = "ASTUtils";
    this.version = "1.0.0";
    this.options = {
      parseOptions: {
        sourceType: options.sourceType || "module",
        plugins: options.plugins || ["jsx", "typescript"],
      },
      generatorOptions: {
        comments: options.comments !== false,
        compact: options.compact || false,
      },
    };
    this.statistics = {
      totalParsed: 0,
      totalGenerated: 0,
      totalTraversals: 0,
      totalNodesFound: 0,
      totalNodesReplaced: 0,
      errors: 0,
    };
  }

  parse(code, options = {}) {
    this.statistics.totalParsed++;
    if (!code || typeof code !== "string") {
      throw new Error("Code must be a non-empty string");
    }
    const parseOptions = { ...this.options.parseOptions, ...options };
    try {
      return parser.parse(code, parseOptions);
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  generate(ast, options = {}) {
    this.statistics.totalGenerated++;
    if (!ast || typeof ast !== "object") {
      throw new Error("AST must be a valid object");
    }
    const generatorOptions = { ...this.options.generatorOptions, ...options };
    try {
      return generator(ast, generatorOptions);
    } catch (error) {
      this.statistics.errors++;
      throw new Error(`Generate error: ${error.message}`);
    }
  }

  traverseAST(ast, visitors, state = {}) {
    this.statistics.totalTraversals++;
    if (!ast || typeof ast !== "object") {
      throw new Error("AST must be a valid object");
    }
    traverse(ast, visitors, undefined, state);
    return ast;
  }

  findNodes(ast, type, options = {}) {
    this.statistics.totalNodesFound++;
    const nodes = [];
    traverse(ast, {
      [type](path) {
        nodes.push({
          node: path.node,
          path,
          loc: path.node.loc,
        });
      },
    });
    if (options.filter) {
      return nodes.filter((n) => options.filter(n.node));
    }
    return nodes;
  }

  findNodesByPredicate(ast, predicate) {
    this.statistics.totalNodesFound++;
    const nodes = [];
    traverse(ast, {
      enter(path) {
        if (predicate(path.node, path)) {
          nodes.push({ node: path.node, path });
        }
      },
    });
    return nodes;
  }

  findFirstNode(ast, type) {
    let result = null;
    traverse(ast, {
      [type](path) {
        result = path.node;
        path.stop();
      },
    });
    return result;
  }

  findLastNode(ast, type) {
    let result = null;
    traverse(ast, {
      [type](path) {
        result = path.node;
      },
    });
    return result;
  }

  findAllPaths(ast, type) {
    const paths = [];
    traverse(ast, {
      [type](path) {
        paths.push(path);
      },
    });
    return paths;
  }

  replaceNodes(ast, type, replacer) {
    this.statistics.totalNodesReplaced++;
    traverse(ast, {
      [type](path) {
        const replacement = replacer(path.node, path);
        if (replacement) {
          path.replaceWith(replacement);
        }
      },
    });
    return ast;
  }

  replaceNodesWithMultiple(ast, type, replacer) {
    this.statistics.totalNodesReplaced++;
    traverse(ast, {
      [type](path) {
        const replacements = replacer(path.node, path);
        if (Array.isArray(replacements)) {
          path.replaceWithMultiple(replacements);
        }
      },
    });
    return ast;
  }

  removeNodes(ast, type, predicate = () => true) {
    traverse(ast, {
      [type](path) {
        if (predicate(path.node, path)) {
          path.remove();
        }
      },
    });
    return ast;
  }

  insertBefore(ast, type, inserter) {
    traverse(ast, {
      [type](path) {
        const nodes = inserter(path.node, path);
        if (nodes) {
          const arr = Array.isArray(nodes) ? nodes : [nodes];
          path.insertBefore(arr);
        }
      },
    });
    return ast;
  }

  insertAfter(ast, type, inserter) {
    traverse(ast, {
      [type](path) {
        const nodes = inserter(path.node, path);
        if (nodes) {
          const arr = Array.isArray(nodes) ? nodes : [nodes];
          path.insertAfter(arr);
        }
      },
    });
    return ast;
  }

  isNodeType(node, type) {
    if (!node || typeof node !== "object") return false;
    return node.type === type;
  }

  isIdentifier(node, name) {
    if (!this.isNodeType(node, "Identifier")) return false;
    if (name) return node.name === name;
    return true;
  }

  isLiteral(node) {
    const literalTypes = [
      "StringLiteral",
      "NumericLiteral",
      "BooleanLiteral",
      "NullLiteral",
      "RegExpLiteral",
      "BigIntLiteral",
    ];
    return literalTypes.includes(node?.type);
  }

  isStringLiteral(node, value) {
    if (!this.isNodeType(node, "StringLiteral")) return false;
    if (value !== undefined) return node.value === value;
    return true;
  }

  isNumericLiteral(node, value) {
    if (!this.isNodeType(node, "NumericLiteral")) return false;
    if (value !== undefined) return node.value === value;
    return true;
  }

  isBooleanLiteral(node, value) {
    if (!this.isNodeType(node, "BooleanLiteral")) return false;
    if (value !== undefined) return node.value === value;
    return true;
  }

  isFunction(node) {
    const functionTypes = [
      "FunctionDeclaration",
      "FunctionExpression",
      "ArrowFunctionExpression",
      "ClassMethod",
      "ObjectMethod",
    ];
    return functionTypes.includes(node?.type);
  }

  isStatement(node) {
    const statementTypes = [
      "ExpressionStatement",
      "BlockStatement",
      "EmptyStatement",
      "DebuggerStatement",
      "WithStatement",
      "ReturnStatement",
      "LabeledStatement",
      "BreakStatement",
      "ContinueStatement",
      "IfStatement",
      "SwitchStatement",
      "ThrowStatement",
      "TryStatement",
      "WhileStatement",
      "DoWhileStatement",
      "ForStatement",
      "ForInStatement",
      "ForOfStatement",
      "VariableDeclaration",
      "FunctionDeclaration",
      "ClassDeclaration",
    ];
    return statementTypes.includes(node?.type);
  }

  isExpression(node) {
    const expressionTypes = [
      "Identifier",
      "StringLiteral",
      "NumericLiteral",
      "BooleanLiteral",
      "NullLiteral",
      "RegExpLiteral",
      "BigIntLiteral",
      "ArrayExpression",
      "ObjectExpression",
      "FunctionExpression",
      "ArrowFunctionExpression",
      "CallExpression",
      "MemberExpression",
      "NewExpression",
      "ConditionalExpression",
      "BinaryExpression",
      "UnaryExpression",
      "LogicalExpression",
      "AssignmentExpression",
      "UpdateExpression",
    ];
    return expressionTypes.includes(node?.type);
  }

  isDeclaration(node) {
    const declarationTypes = [
      "FunctionDeclaration",
      "VariableDeclaration",
      "ClassDeclaration",
      "ImportDeclaration",
      "ExportNamedDeclaration",
      "ExportDefaultDeclaration",
      "ExportAllDeclaration",
    ];
    return declarationTypes.includes(node?.type);
  }

  isLoop(node) {
    const loopTypes = [
      "ForStatement",
      "ForInStatement",
      "ForOfStatement",
      "WhileStatement",
      "DoWhileStatement",
    ];
    return loopTypes.includes(node?.type);
  }

  isConditional(node) {
    return (
      node?.type === "IfStatement" || node?.type === "ConditionalExpression"
    );
  }

  isBinaryExpression(node, operator) {
    if (!this.isNodeType(node, "BinaryExpression")) return false;
    if (operator) return node.operator === operator;
    return true;
  }

  isLogicalExpression(node, operator) {
    if (!this.isNodeType(node, "LogicalExpression")) return false;
    if (operator) return node.operator === operator;
    return true;
  }

  isCallExpression(node, calleeName) {
    if (!this.isNodeType(node, "CallExpression")) return false;
    if (calleeName) {
      return this._getCalleeName(node.callee) === calleeName;
    }
    return true;
  }

  isMemberExpression(node, objectName, propertyName) {
    if (!this.isNodeType(node, "MemberExpression")) return false;
    if (objectName && node.object.type === "Identifier") {
      if (node.object.name !== objectName) return false;
    }
    if (propertyName && node.property.type === "Identifier") {
      if (node.property.name !== propertyName) return false;
    }
    return true;
  }

  _getCalleeName(node) {
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
      return `${this._getCalleeName(node.object)}.${node.property?.name}`;
    }
    return null;
  }

  getPathInfo(path) {
    return {
      type: path.node?.type,
      parentType: path.parent?.type,
      parentPathType: path.parentPath?.node?.type,
      containerType: path.container?.type,
      key: path.key,
      scope: this._getScopeInfo(path.scope),
    };
  }

  _getScopeInfo(scope) {
    if (!scope) return null;
    return {
      type: scope.block?.type,
      bindings: Object.keys(scope.bindings || {}),
      parent: this._getScopeInfo(scope.parent),
    };
  }

  getAncestors(path) {
    const ancestors = [];
    let current = path.parentPath;
    while (current) {
      ancestors.push(current.node);
      current = current.parentPath;
    }
    return ancestors;
  }

  getDepth(path) {
    let depth = 0;
    let current = path.parentPath;
    while (current) {
      depth++;
      current = current.parentPath;
    }
    return depth;
  }

  getChildren(node) {
    const children = [];
    for (const key in node) {
      if (["loc", "start", "end", "range", "type"].includes(key)) continue;
      const value = node[key];
      if (value && typeof value === "object") {
        if (value.type) {
          children.push({ key, node: value });
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && item.type) {
              children.push({ key, node: item });
            }
          }
        }
      }
    }
    return children;
  }

  countNodes(ast, type) {
    let count = 0;
    traverse(ast, {
      [type]() {
        count++;
      },
    });
    return count;
  }

  countAllNodes(ast) {
    let count = 0;
    traverse(ast, {
      enter() {
        count++;
      },
    });
    return count;
  }

  getNodeTypes(ast) {
    const types = {};
    traverse(ast, {
      enter(path) {
        const type = path.node.type;
        types[type] = (types[type] || 0) + 1;
      },
    });
    return types;
  }

  getScopeBindings(ast) {
    let scopeInfo = null;
    traverse(ast, {
      Program(path) {
        scopeInfo = {
          globals: Object.keys(path.scope.globals || {}),
          bindings: {},
        };
        for (const [name, binding] of Object.entries(path.scope.bindings)) {
          scopeInfo.bindings[name] = {
            kind: binding.kind,
            references: binding.references,
            constant: binding.constant,
            path: binding.path.node?.type,
          };
        }
      },
    });
    return scopeInfo;
  }

  getReferences(ast, identifierName) {
    const references = [];
    traverse(ast, {
      Identifier(path) {
        if (
          path.node.name === identifierName &&
          path.isReferencedIdentifier()
        ) {
          references.push({
            node: path.node,
            loc: path.node.loc,
            binding: path.scope.getBinding(identifierName)?.path?.node?.type,
          });
        }
      },
    });
    return references;
  }

  getAssignments(ast, identifierName) {
    const assignments = [];
    traverse(ast, {
      AssignmentExpression(path) {
        if (
          path.node.left.type === "Identifier" &&
          path.node.left.name === identifierName
        ) {
          assignments.push({
            node: path.node,
            loc: path.node.loc,
          });
        }
      },
    });
    return assignments;
  }

  cloneNode(node, deep = true) {
    if (!node) return null;
    if (deep) {
      return JSON.parse(JSON.stringify(node));
    }
    const clone = { ...node };
    delete clone.loc;
    delete clone.start;
    delete clone.end;
    return clone;
  }

  createIdentifier(name) {
    return t.identifier(name);
  }

  createStringLiteral(value) {
    return t.stringLiteral(value);
  }

  createNumericLiteral(value) {
    return t.numericLiteral(value);
  }

  createBooleanLiteral(value) {
    return t.booleanLiteral(value);
  }

  createNullLiteral() {
    return t.nullLiteral();
  }

  createArrayExpression(elements) {
    return t.arrayExpression(elements);
  }

  createObjectExpression(properties) {
    return t.objectExpression(properties);
  }

  createObjectProperty(key, value) {
    return t.objectProperty(
      typeof key === "string" ? t.identifier(key) : key,
      value
    );
  }

  createCallExpression(callee, args) {
    return t.callExpression(
      typeof callee === "string" ? t.identifier(callee) : callee,
      args
    );
  }

  createMemberExpression(object, property) {
    return t.memberExpression(
      typeof object === "string" ? t.identifier(object) : object,
      typeof property === "string" ? t.identifier(property) : property
    );
  }

  createFunctionDeclaration(name, params, body) {
    return t.functionDeclaration(
      typeof name === "string" ? t.identifier(name) : name,
      params.map((p) => (typeof p === "string" ? t.identifier(p) : p)),
      t.blockStatement(Array.isArray(body) ? body : [body])
    );
  }

  createArrowFunction(params, body) {
    return t.arrowFunctionExpression(
      params.map((p) => (typeof p === "string" ? t.identifier(p) : p)),
      Array.isArray(body) ? t.blockStatement(body) : body
    );
  }

  createVariableDeclaration(kind, declarations) {
    return t.variableDeclaration(kind, declarations);
  }

  createVariableDeclarator(id, init) {
    return t.variableDeclarator(
      typeof id === "string" ? t.identifier(id) : id,
      init
    );
  }

  createIfStatement(test, consequent, alternate) {
    return t.ifStatement(
      test,
      Array.isArray(consequent) ? t.blockStatement(consequent) : consequent,
      alternate
        ? Array.isArray(alternate)
          ? t.blockStatement(alternate)
          : alternate
        : null
    );
  }

  createReturnStatement(argument) {
    return t.returnStatement(argument);
  }

  createBlockStatement(body) {
    return t.blockStatement(body);
  }

  createExpressionStatement(expression) {
    return t.expressionStatement(expression);
  }

  createBinaryExpression(operator, left, right) {
    return t.binaryExpression(operator, left, right);
  }

  createLogicalExpression(operator, left, right) {
    return t.logicalExpression(operator, left, right);
  }

  createAssignmentExpression(operator, left, right) {
    return t.assignmentExpression(
      operator,
      typeof left === "string" ? t.identifier(left) : left,
      right
    );
  }

  validateAST(ast) {
    if (!ast || typeof ast !== "object") {
      return { valid: false, error: "AST must be an object" };
    }
    if (!ast.type) {
      return { valid: false, error: "AST must have a type property" };
    }
    try {
      this.generate(ast);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
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
      totalParsed: 0,
      totalGenerated: 0,
      totalTraversals: 0,
      totalNodesFound: 0,
      totalNodesReplaced: 0,
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

module.exports = ASTUtils;
