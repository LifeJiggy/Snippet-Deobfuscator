/**
 * Constant Folding Skill
 * Production-grade constant folding and expression evaluation for JavaScript
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

class ConstantFoldingSkill {
  constructor() {
    this.name = "constant-folding";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      arithmetic: 0,
      strings: 0,
      booleans: 0,
      arrays: 0,
      objects: 0,
      total: 0,
    };
    this.folded = [];
    this.maxStringLength = 10000;
    this.maxArrayLength = 1000;
  }

  fold(code, options = {}) {
    this.stats = { arithmetic: 0, strings: 0, booleans: 0, arrays: 0, objects: 0, total: 0 };
    this.folded = [];

    const result = {
      foldedCode: code,
      folded: [],
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

      this.foldConstants(ast);

      result.foldedCode = generate(ast, { comments: true }).code;
      result.folded = this.folded;
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

  foldConstants(ast) {
    const self = this;

    traverse(ast, {
      BinaryExpression(path) {
        self.foldBinaryExpression(path);
      },
      UnaryExpression(path) {
        self.foldUnaryExpression(path);
      },
      LogicalExpression(path) {
        self.foldLogicalExpression(path);
      },
      CallExpression(path) {
        self.foldCallExpression(path);
      },
      MemberExpression(path) {
        self.foldMemberExpression(path);
      },
      ConditionalExpression(path) {
        self.foldConditionalExpression(path);
      },
      TemplateLiteral(path) {
        self.foldTemplateLiteral(path);
      },
    });
  }

  foldBinaryExpression(path) {
    const node = path.node;
    const left = node.left;
    const right = node.right;

    if (!this.isLiteral(left) || !this.isLiteral(right)) {
      return;
    }

    const leftVal = this.getLiteralValue(left);
    const rightVal = this.getLiteralValue(right);

    if (leftVal === null || rightVal === null) {
      return;
    }

    let result;

    switch (node.operator) {
      case "+":
        result = leftVal + rightVal;
        break;
      case "-":
        result = leftVal - rightVal;
        break;
      case "*":
        result = leftVal * rightVal;
        break;
      case "/":
        if (rightVal === 0) return;
        result = leftVal / rightVal;
        break;
      case "%":
        if (rightVal === 0) return;
        result = leftVal % rightVal;
        break;
      case "**":
        result = Math.pow(leftVal, rightVal);
        break;
      case "&":
        result = leftVal & rightVal;
        break;
      case "|":
        result = leftVal | rightVal;
        break;
      case "^":
        result = leftVal ^ rightVal;
        break;
      case "<<":
        result = leftVal << rightVal;
        break;
      case ">>":
        result = leftVal >> rightVal;
        break;
      case ">>>":
        result = leftVal >>> rightVal;
        break;
      case "<":
        result = leftVal < rightVal;
        break;
      case ">":
        result = leftVal > rightVal;
        break;
      case "<=":
        result = leftVal <= rightVal;
        break;
      case ">=":
        result = leftVal >= rightVal;
        break;
      case "==":
        result = leftVal == rightVal;
        break;
      case "===":
        result = leftVal === rightVal;
        break;
      case "!=":
        result = leftVal != rightVal;
        break;
      case "!==":
        result = leftVal !== rightVal;
        break;
      default:
        return;
    }

    this.replaceWithLiteral(path, result);
    this.recordFold("binary", node.operator, leftVal, rightVal, result);
  }

  foldUnaryExpression(path) {
    const node = path.node;
    const argument = node.argument;

    if (!this.isLiteral(argument)) {
      return;
    }

    const value = this.getLiteralValue(argument);
    if (value === null) return;

    let result;

    switch (node.operator) {
      case "+":
        result = +value;
        break;
      case "-":
        result = -value;
        break;
      case "!":
        result = !value;
        break;
      case "~":
        result = ~value;
        break;
      case "typeof":
        result = typeof value;
        break;
      case "void":
        result = undefined;
        break;
      default:
        return;
    }

    this.replaceWithLiteral(path, result);
    this.recordFold("unary", node.operator, value, null, result);
  }

  foldLogicalExpression(path) {
    const node = path.node;
    const left = node.left;
    const right = node.right;

    if (!this.isLiteral(left)) {
      return;
    }

    const leftVal = this.getLiteralValue(left);
    if (leftVal === null) return;

    let result;

    switch (node.operator) {
      case "&&":
        if (!leftVal) {
          result = leftVal;
        } else if (this.isLiteral(right)) {
          result = this.getLiteralValue(right);
        } else {
          return;
        }
        break;
      case "||":
        if (leftVal) {
          result = leftVal;
        } else if (this.isLiteral(right)) {
          result = this.getLiteralValue(right);
        } else {
          return;
        }
        break;
      case "??":
        if (leftVal !== null && leftVal !== undefined) {
          result = leftVal;
        } else if (this.isLiteral(right)) {
          result = this.getLiteralValue(right);
        } else {
          return;
        }
        break;
      default:
        return;
    }

    this.replaceWithLiteral(path, result);
    this.recordFold("logical", node.operator, leftVal, null, result);
  }

  foldCallExpression(path) {
    const node = path.node;
    const callee = node.callee;

    if (callee.type === "MemberExpression") {
      this.foldMemberCall(path);
      return;
    }

    if (callee.type === "Identifier" && callee.name === "String" && 
        node.arguments.length > 0 && callee.property?.name === "fromCharCode") {
      this.foldFromCharCode(path);
    }
  }

  foldMemberCall(path) {
    const callee = path.node.callee;
    const object = callee.object;
    const property = callee.property;
    const args = path.node.arguments;

    if (!this.isLiteral(object)) return;

    const objVal = this.getLiteralValue(object);
    if (objVal === null) return;

    const propName = property.type === "Identifier" ? property.name : null;
    if (!propName) return;

    let result;

    if (typeof objVal === "string") {
      switch (propName) {
        case "charAt":
          if (args.length === 1 && this.isLiteral(args[0])) {
            const idx = this.getLiteralValue(args[0]);
            result = objVal.charAt(idx);
          }
          break;
        case "charCodeAt":
          if (args.length === 1 && this.isLiteral(args[0])) {
            const idx = this.getLiteralValue(args[0]);
            result = objVal.charCodeAt(idx);
          }
          break;
        case "substring":
        case "slice":
          if (args.every((a) => this.isLiteral(a))) {
            const start = this.getLiteralValue(args[0]);
            const end = args[1] ? this.getLiteralValue(args[1]) : undefined;
            result = propName === "substring" ? objVal.substring(start, end) : objVal.slice(start, end);
          }
          break;
        case "toUpperCase":
          if (args.length === 0) {
            result = objVal.toUpperCase();
          }
          break;
        case "toLowerCase":
          if (args.length === 0) {
            result = objVal.toLowerCase();
          }
          bre

  isLiteral(node) {
    const literalTypes = [
      "StringLiteral",
      "NumericLiteral",
      "BooleanLiteral",
      "NullLiteral",
      "UndefinedLiteral",
    ];
    return literalTypes.includes(node.type);
  }

  getLiteralValue(node) {
    switch (node.type) {
      case "StringLiteral":
        return node.value;
      case "NumericLiteral":
        return node.value;
      case "BooleanLiteral":
        return node.value;
      case "NullLiteral":
        return null;
      case "UndefinedLiteral":
        return undefined;
      default:
        return null;
    }
  }

  replaceWithLiteral(path, value) {
    if (typeof value === "string") {
      path.replaceWith({ type: "StringLiteral", value });
      this.stats.strings++;
    } else if (typeof value === "number") {
      path.replaceWith({ type: "NumericLiteral", value });
      this.stats.arithmetic++;
    } else if (typeof value === "boolean") {
      path.replaceWith({ type: "BooleanLiteral", value });
      this.stats.booleans++;
    } else if (value === null) {
      path.replaceWith({ type: "NullLiteral" });
    } else if (value === undefined) {
      path.replaceWith({ type: "Identifier", name: "undefined" });
    }
    this.stats.total++;
  }

  recordFold(type, operator, left, right, result) {
    this.folded.push({
      type,
      operator,
      left: typeof left === "string" && left.length > 50 ? left.substring(0, 50) + "..." : left,
      right,
      result: typeof result === "string" && result.length > 50 ? result.substring(0, 50) + "..." : result,
    });
  }

  getStatistics() {
    return {
      ...this.stats,
      foldCount: this.folded.length,
    };
  }

  clearCache() {
    this.cache.clear();
    this.folded = [];
  }

  dispose() {
    this.cache.clear();
    this.folded = [];
  }
}

module.exports = ConstantFoldingSkill;
