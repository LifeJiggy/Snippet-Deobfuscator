/**
 * AST Simplification Skill
 * Transforms complex AST structures into simpler, more readable forms
 * Version: 3.0.0
 */

class ASTSimplificationSkill {
  constructor() {
    this.name = "ast-simplification";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      nodesProcessed: 0,
      nodesSimplified: 0,
      transformations: 0,
      failures: 0,
    };
    this.transformers = this.initializeTransformers();
  }

  execute(code, options = {}) {
    return this.analyze(code, options);
  }

  initializeTransformers() {
    return {
      sequence: this.simplifySequence.bind(this),
      conditional: this.simplifyConditional.bind(this),
      iife: this.simplifyIIFE.bind(this),
      logical: this.simplifyLogical.bind(this),
      member: this.simplifyMember.bind(this),
      call: this.simplifyCall.bind(this),
      assignment: this.simplifyAssignment.bind(this),
      declaration: this.simplifyDeclaration.bind(this),
    };
  }

  analyze(code, options = {}) {
    const result = {
      simplified: code,
      transformations: [],
      nodes: [],
      warnings: [],
      errors: [],
    };

    try {
      let workingCode = code;

      workingCode = this.unrollCommaExpressions(workingCode);

      workingCode = this.simplifyNestedTernaries(workingCode);

      workingCode = this.extractSequenceReturns(workingCode);

      workingCode = this.simplifyIIFEs(workingCode);

      workingCode = this.normalizeArrowFunctions(workingCode);

      workingCode = this.simplifyLogicalExpressions(workingCode);

      workingCode = this.flattenNestedBlocks(workingCode);

      workingCode = this.simplifyVariableDeclarations(workingCode);

      workingCode = this.removeRedundantParentheses(workingCode);

      result.simplified = workingCode;
    } catch (error) {
      result.errors.push(error.message);
      this.stats.failures++;
    }

    return result;
  }

  unrollCommaExpressions(code) {
    let result = code;

    const assignmentPattern = /(\w+)\s*=\s*\(([^()]+,[^()]+)\)\s*;/g;
    result = result.replace(assignmentPattern, (match, varName, expr) => {
      const expressions = this.splitCommaExpression(expr);
      if (expressions.length > 1) {
        this.stats.transformations++;
        const lastExpr = expressions.pop();
        const statements = expressions.map((e) => `${e};`).join(" ");
        return `${statements} ${varName} = ${lastExpr};`;
      }
      return match;
    });

    const returnPattern = /return\s+\(([^()]+,[^()]+)\)\s*;/g;
    result = result.replace(returnPattern, (match, expr) => {
      const expressions = this.splitCommaExpression(expr);
      if (expressions.length > 1) {
        this.stats.transformations++;
        const lastExpr = expressions.pop();
        const statements = expressions.map((e) => `${e};`).join(" ");
        return `${statements} return ${lastExpr};`;
      }
      return match;
    });

    const standalonePattern = /(?:^|[;\{\}])\s*\(([^()]+,[^()]+)\)\s*;/gm;
    result = result.replace(standalonePattern, (match, expr) => {
      const expressions = this.splitCommaExpression(expr);
      if (expressions.length > 1) {
        this.stats.transformations++;
        return expressions.map((e) => `${e};`).join(" ");
      }
      return match;
    });

    return result;
  }

  splitCommaExpression(expr) {
    const expressions = [];
    let current = "";
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];

      if (inString) {
        current += char;
        if (char === stringChar && expr[i - 1] !== "\\") {
          inString = false;
        }
        continue;
      }

      switch (char) {
        case "(":
          parenDepth++;
          break;
        case ")":
          parenDepth--;
          break;
        case "[":
          bracketDepth++;
          break;
        case "]":
          bracketDepth--;
          break;
        case "{":
          braceDepth++;
          break;
        case "}":
          braceDepth--;
          break;
        case '"':
        case "'":
        case "`":
          inString = true;
          stringChar = char;
          break;
        case ",":
          if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
            expressions.push(current.trim());
            current = "";
            continue;
          }
          break;
      }

      current += char;
    }

    if (current.trim()) {
      expressions.push(current.trim());
    }

    return expressions;
  }

  simplifyNestedTernaries(code) {
    let result = code;
    const maxDepth = 3;

    const ternaryPattern = /(\w+)\s*\?\s*([^:;]+)\s*:\s*([^;?]+);/g;

    for (let depth = 0; depth < maxDepth; depth++) {
      const matches = result.match(ternaryPattern);
      if (!matches) break;

      for (const match of matches) {
        if (this.countTernaries(match) > 1) {
          const converted = this.convertTernaryToIf(match);
          if (converted) {
            result = result.replace(match, converted);
            this.stats.transformations++;
          }
        }
      }
    }

    return result;
  }

  countTernaries(expr) {
    let count = 0;
    let depth = 0;

    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === "(") depth++;
      if (expr[i] === ")") depth--;

      if (depth === 0) {
        if (expr[i] === "?") count++;
      }
    }

    return count;
  }

  convertTernaryToIf(ternary) {
    const match = ternary.match(/(.+?)\s*\?\s*(.+?)\s*:\s*(.+);$/);
    if (!match) return null;

    const condition = match[1].trim();
    const consequent = match[2].trim();
    const alternate = match[3].trim();

    if (
      this.countTernaries(consequent) > 0 ||
      this.countTernaries(alternate) > 0
    ) {
      return null;
    }

    return `if (${condition}) { ${consequent}; } else { ${alternate}; }`;
  }

  extractSequenceReturns(code) {
    let result = code;

    const pattern = /return\s+([^;]+,[^;]+)\s*;/g;
    result = result.replace(pattern, (match, expr) => {
      const expressions = this.splitCommaExpression(expr);
      if (expressions.length > 1) {
        this.stats.transformations++;
        const last = expressions.pop();
        const prefix = expressions.map((e) => `${e};`).join(" ");
        return `${prefix} return ${last};`;
      }
      return match;
    });

    return result;
  }

  simplifyIIFEs(code) {
    let result = code;

    const simpleIIFE = /\(function\s*\(\s*\)\s*\{([^{}]*)\}\)\(\)/g;
    result = result.replace(simpleIIFE, (match, body) => {
      this.stats.transformations++;
      return `{ ${body.trim()} }`;
    });

    const arrowIIFE = /\(\(\s*\(\s*\)\s*=>\s*\{([^{}]*)\}\s*\)\(\)\)/g;
    result = result.replace(arrowIIFE, (match, body) => {
      this.stats.transformations++;
      return `{ ${body.trim()} }`;
    });

    return result;
  }

  normalizeArrowFunctions(code) {
    let result = code;

    const singleParam = /\((\w+)\)\s*=>/g;
    result = result.replace(singleParam, "$1 =>");

    const blockReturn = /\(([^)]*)\)\s*=>\s*\{\s*return\s+([^}]+)\s*;/g;
    result = result.replace(blockReturn, (match, params, expr) => {
      this.stats.transformations++;
      return `(${params}) => ${expr.trim()}`;
    });

    return result;
  }

  simplifyLogicalExpressions(code) {
    let result = code;

    result = result.replace(/\!\!\s*([a-zA-Z_$][\w]*)/g, "Boolean($1)");

    result = result.replace(
      /\!\s*\(([^()]+)\)\s*\&\&\s*\!\s*\(([^()]+)\)/g,
      "!($1 && $2)"
    );

    result = result.replace(
      /\(\s*([a-zA-Z_$][\w]*)\s*\)\s*\?\s*true\s*:\s*false/g,
      "Boolean($1)"
    );

    return result;
  }

  flattenNestedBlocks(code) {
    let result = code;

    for (let i = 0; i < 5; i++) {
      const prev = result;
      result = result.replace(/\{\s*\{([^{}]*)\}\s*\}/g, "{ $1 }");
      if (result === prev) break;
    }

    result = result.replace(/\{\s*\}/g, "");

    return result;
  }

  simplifyVariableDeclarations(code) {
    let result = code;

    const declarations = {};
    const varPattern = /var\s+(\w+)\s*=\s*([^;]+);/g;
    let match;

    while ((match = varPattern.exec(code)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      declarations[name] = value;
    }

    const unusedVars = this.findUnusedVariables(
      result,
      Object.keys(declarations)
    );
    for (const unused of unusedVars) {
      const removePattern = new RegExp(
        `var\\s+${unused}\\s*=\\s*[^;]+;\\s*`,
        "g"
      );
      result = result.replace(removePattern, "");
    }

    return result;
  }

  findUnusedVariables(code, varNames) {
    const unused = [];

    for (const name of varNames) {
      const pattern = new RegExp(`\\b${name}\\b`, "g");
      const matches = code.match(pattern);
      if (matches && matches.length <= 1) {
        unused.push(name);
      }
    }

    return unused;
  }

  removeRedundantParentheses(code) {
    let result = code;

    result = result.replace(/\(\s*(\d+)\s*\)/g, "$1");

    result = result.replace(/\(\s*(['"`][^'"`]*['"`])\s*\)/g, "$1");

    result = result.replace(/\(\s*([a-zA-Z_$][\w]*)\s*\)/g, "$1");

    result = result.replace(/\(\s*(true|false|null|undefined)\s*\)/gi, "$1");

    return result;
  }

  simplifySequence(node) {
    if (node.type !== "SequenceExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyConditional(node) {
    if (node.type !== "ConditionalExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyIIFE(node) {
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyLogical(node) {
    if (node.type !== "LogicalExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyMember(node) {
    if (node.type !== "MemberExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyCall(node) {
    if (node.type !== "CallExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyAssignment(node) {
    if (node.type !== "AssignmentExpression") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  simplifyDeclaration(node) {
    if (node.type !== "VariableDeclaration") return node;
    this.stats.nodesSimplified++;
    return node;
  }

  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.nodesProcessed > 0
          ? (
              (this.stats.nodesSimplified / this.stats.nodesProcessed) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.transformers = {};
  }
}

module.exports = ASTSimplificationSkill;
