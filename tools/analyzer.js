/**
 * Analyzer Utilities
 * Production-grade code analysis utilities
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class Analyzer {
  constructor(options = {}) {
    this.name = "analyzer";
    this.version = "3.0.0";
    this.options = {
      plugins: options.plugins || [
        "jsx",
        "typescript",
        "classProperties",
        "decorators-legacy",
        "objectRestSpread",
        "dynamicImport",
      ],
      sourceType: options.sourceType || "unambiguous",
      detectPatterns: options.detectPatterns !== false,
      complexityThreshold: options.complexityThreshold || 10,
    };
    this.stats = {
      analyzed: 0,
      failed: 0,
      structures: 0,
      dependencies: 0,
      exports: 0,
      patterns: 0,
    };
  }

  analyzeStructure(code) {
    try {
      const ast = parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });

      const structure = {
        type: "Program",
        body: [],
        comments: ast.comments || [],
        tokens: ast.tokens || [],
      };

      traverse(ast, {
        Program(path) {
          structure.body = path.node.body.map((node) => ({
            type: node.type,
            loc: node.loc,
          }));
        },

        FunctionDeclaration(path) {
          structure.body.push({
            type: "FunctionDeclaration",
            name: path.node.id?.name,
            async: path.node.async,
            generator: path.node.generator,
            params: path.node.params.length,
            loc: path.node.loc,
          });
        },

        ClassDeclaration(path) {
          structure.body.push({
            type: "ClassDeclaration",
            name: path.node.id?.name,
            superClass: path.node.superClass?.name,
            methods: path.node.body.body
              .filter((n) => n.type === "ClassMethod")
              .map((m) => ({
                name: m.key?.name,
                kind: m.kind,
                static: m.static,
              })),
            loc: path.node.loc,
          });
        },

        VariableDeclaration(path) {
          path.node.declarations.forEach((decl) => {
            structure.body.push({
              type: "VariableDeclaration",
              name: decl.id?.name,
              kind: path.node.kind,
              loc: path.node.loc,
            });
          });
        },

        ImportDeclaration(path) {
          structure.body.push({
            type: "ImportDeclaration",
            source: path.node.source.value,
            specifiers: path.node.specifiers.length,
            loc: path.node.loc,
          });
        },

        ExportNamedDeclaration(path) {
          structure.body.push({
            type: "ExportNamedDeclaration",
            loc: path.node.loc,
          });
        },

        ExportDefaultDeclaration(path) {
          structure.body.push({
            type: "ExportDefaultDeclaration",
            loc: path.node.loc,
          });
        },
      });

      this.stats.analyzed++;
      this.stats.structures++;

      return { success: true, structure };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  analyzeDependencies(code) {
    try {
      const ast = parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });

      const dependencies = {
        imports: [],
        requires: [],
        dynamicImports: [],
        exports: [],
        external: [],
      };

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          dependencies.imports.push({
            source,
            specifiers: path.node.specifiers.map((s) => ({
              type: s.type,
              imported: s.imported?.name || s.imported?.value,
              local: s.local?.name,
            })),
            loc: path.node.loc,
          });

          if (!source.startsWith(".") && !source.startsWith("/")) {
            dependencies.external.push(source);
          }
        },

        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          if (callee.name === "require" && args[0]?.type === "StringLiteral") {
            const source = args[0].value;
            dependencies.requires.push({
              source,
              loc: path.node.loc,
            });

            if (!source.startsWith(".") && !source.startsWith("/")) {
              dependencies.external.push(source);
            }
          }

          if (callee.type === "Import" && args[0]?.type === "StringLiteral") {
            const source = args[0].value;
            dependencies.dynamicImports.push({
              source,
              loc: path.node.loc,
            });

            if (!source.startsWith(".") && !source.startsWith("/")) {
              dependencies.external.push(source);
            }
          }
        },

        ExportNamedDeclaration(path) {
          if (path.node.source) {
            dependencies.exports.push({
              type: "reexport",
              source: path.node.source.value,
              loc: path.node.loc,
            });
          }
        },

        ExportAllDeclaration(path) {
          dependencies.exports.push({
            type: "exportAll",
            source: path.node.source.value,
            loc: path.node.loc,
          });
        },
      });

      dependencies.external = [...new Set(dependencies.external)];

      this.stats.analyzed++;
      this.stats.dependencies +=
        dependencies.imports.length + dependencies.requires.length;

      return { success: true, dependencies };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  analyzeExports(code) {
    try {
      const ast = parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });

      const exports = {
        named: [],
        default: null,
        reexports: [],
        commonjs: [],
      };

      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            const decl = path.node.declaration;
            if (decl.type === "FunctionDeclaration" && decl.id) {
              exports.named.push({
                name: decl.id.name,
                type: "function",
                loc: path.node.loc,
              });
            } else if (decl.type === "ClassDeclaration" && decl.id) {
              exports.named.push({
                name: decl.id.name,
                type: "class",
                loc: path.node.loc,
              });
            } else if (decl.type === "VariableDeclaration") {
              decl.declarations.forEach((d) => {
                if (d.id?.name) {
                  exports.named.push({
                    name: d.id.name,
                    type: "variable",
                    loc: path.node.loc,
                  });
                }
              });
            }
          } else if (path.node.source) {
            exports.reexports.push({
              source: path.node.source.value,
              specifiers: path.node.specifiers.map((s) => ({
                imported: s.imported?.name,
                local: s.local?.name,
              })),
              loc: path.node.loc,
            });
          } else if (path.node.specifiers) {
            path.node.specifiers.forEach((s) => {
              exports.named.push({
                name: s.local?.name,
                exported: s.exported?.name,
                type: "specifier",
                loc: path.node.loc,
              });
            });
          }
        },

        ExportDefaultDeclaration(path) {
          exports.default = {
            type: path.node.declaration.type,
            name: path.node.declaration.name || path.node.declaration.id?.name,
            loc: path.node.loc,
          };
        },

        ExportAllDeclaration(path) {
          exports.reexports.push({
            source: path.node.source.value,
            type: "all",
            loc: path.node.loc,
          });
        },

        AssignmentExpression(path) {
          const left = path.node.left;
          if (
            left.type === "MemberExpression" &&
            left.object?.name === "exports"
          ) {
            exports.commonjs.push({
              name: left.property?.name || left.property?.value,
              loc: path.node.loc,
            });
          }

          if (
            left.type === "MemberExpression" &&
            left.object?.name === "module" &&
            left.property?.name === "exports"
          ) {
            exports.default = {
              type: "commonjs",
              loc: path.node.loc,
            };
          }
        },
      });

      this.stats.analyzed++;
      this.stats.exports += exports.named.length + (exports.default ? 1 : 0);

      return { success: true, exports };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  analyzeComplexity(code) {
    try {
      const ast = parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });

      const complexity = {
        cyclomatic: 1,
        cognitive: 0,
        lines: code.split("\n").length,
        functions: 0,
        classes: 0,
        maxNesting: 0,
        halstead: {
          operators: {},
          operands: {},
          totalOperators: 0,
          totalOperands: 0,
          vocabulary: 0,
          length: 0,
          volume: 0,
          difficulty: 0,
          effort: 0,
        },
      };

      const nestingStack = [];

      traverse(ast, {
        enter(path) {
          if (
            path.node.type === "FunctionDeclaration" ||
            path.node.type === "FunctionExpression" ||
            path.node.type === "ArrowFunctionExpression"
          ) {
            complexity.functions++;
            complexity.cognitive += path.node.params.length;
          }

          if (
            path.node.type === "ClassDeclaration" ||
            path.node.type === "ClassExpression"
          ) {
            complexity.classes++;
          }

          if (
            path.node.type === "IfStatement" ||
            path.node.type === "ConditionalExpression"
          ) {
            complexity.cyclomatic++;
            complexity.cognitive++;
          }

          if (
            path.node.type === "ForStatement" ||
            path.node.type === "ForInStatement" ||
            path.node.type === "ForOfStatement" ||
            path.node.type === "WhileStatement" ||
            path.node.type === "DoWhileStatement"
          ) {
            complexity.cyclomatic++;
            complexity.cognitive += 2;
          }

          if (path.node.type === "SwitchStatement") {
            complexity.cyclomatic += path.node.cases.length;
          }

          if (
            path.node.type === "LogicalExpression" &&
            (path.node.operator === "&&" || path.node.operator === "||")
          ) {
            complexity.cyclomatic++;
          }

          if (path.node.type === "CatchClause") {
            complexity.cyclomatic++;
          }

          if (
            path.node.type === "FunctionDeclaration" ||
            path.node.type === "FunctionExpression" ||
            path.node.type === "ArrowFunctionExpression" ||
            path.node.type === "IfStatement" ||
            path.node.type === "ForStatement" ||
            path.node.type === "WhileStatement" ||
            path.node.type === "SwitchStatement"
          ) {
            nestingStack.push(path.node);
            complexity.maxNesting = Math.max(
              complexity.maxNesting,
              nestingStack.length
            );
          }

          if (
            path.node.type === "BinaryExpression" ||
            path.node.type === "AssignmentExpression"
          ) {
            const op = path.node.operator;
            complexity.halstead.operators[op] =
              (complexity.halstead.operators[op] || 0) + 1;
            complexity.halstead.totalOperators++;
          }

          if (
            path.node.type === "Identifier" &&
            !path.parentPath?.isBindingIdentifier?.()
          ) {
            const name = path.node.name;
            complexity.halstead.operands[name] =
              (complexity.halstead.operands[name] || 0) + 1;
            complexity.halstead.totalOperands++;
          }
        },

        exit(path) {
          if (
            path.node.type === "FunctionDeclaration" ||
            path.node.type === "FunctionExpression" ||
            path.node.type === "ArrowFunctionExpression" ||
            path.node.type === "IfStatement" ||
            path.node.type === "ForStatement" ||
            path.node.type === "WhileStatement" ||
            path.node.type === "SwitchStatement"
          ) {
            nestingStack.pop();
          }
        },
      });

      const uniqueOperators = Object.keys(complexity.halstead.operators).length;
      const uniqueOperands = Object.keys(complexity.halstead.operands).length;
      complexity.halstead.vocabulary = uniqueOperators + uniqueOperands;
      complexity.halstead.length =
        complexity.halstead.totalOperators + complexity.halstead.totalOperands;
      complexity.halstead.volume =
        complexity.halstead.length *
        Math.log2(complexity.halstead.vocabulary || 1);
      complexity.halstead.difficulty =
        (uniqueOperators / 2) *
        (complexity.halstead.totalOperands / (uniqueOperands || 1));
      complexity.halstead.effort =
        complexity.halstead.difficulty * complexity.halstead.volume;

      complexity.maintainability = Math.max(
        0,
        171 -
          5.2 * Math.log(complexity.halstead.volume || 1) -
          0.23 * complexity.cyclomatic -
          16.2 * Math.log(complexity.lines || 1)
      );

      this.stats.analyzed++;

      return { success: true, complexity };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  analyzePatterns(code) {
    try {
      const ast = parse(code, {
        sourceType: this.options.sourceType,
        plugins: this.options.plugins,
      });

      const patterns = {
        obfuscation: [],
        designPatterns: [],
        antiPatterns: [],
        codeSmells: [],
        securityIssues: [],
      };

      traverse(ast, {
        CallExpression(path) {
          const callee = path.node.callee;
          const args = path.node.arguments;

          if (callee.name === "eval") {
            patterns.securityIssues.push({
              type: "eval",
              severity: "high",
              message: "Use of eval() detected",
              loc: path.node.loc,
            });
          }

          if (
            callee.type === "MemberExpression" &&
            callee.property?.name === "innerHTML"
          ) {
            patterns.securityIssues.push({
              type: "xss",
              severity: "medium",
              message: "Potential XSS via innerHTML",
              loc: path.node.loc,
            });
          }

          if (
            args.length > 3 &&
            args.every((a) => a.type === "StringLiteral")
          ) {
            patterns.obfuscation.push({
              type: "string-array",
              message: "Large string literal array (potential obfuscation)",
              loc: path.node.loc,
            });
          }

          if (
            callee.type === "MemberExpression" &&
            callee.object?.name === "String" &&
            callee.property?.name === "fromCharCode"
          ) {
            patterns.obfuscation.push({
              type: "char-code",
              message: "String.fromCharCode usage (potential obfuscation)",
              loc: path.node.loc,
            });
          }

          if (
            callee.type === "FunctionExpression" ||
            callee.type === "ArrowFunctionExpression"
          ) {
            patterns.designPatterns.push({
              type: "iife",
              message: "Immediately Invoked Function Expression",
              loc: path.node.loc,
            });
          }
        },

        VariableDeclaration(path) {
          if (path.node.declarations.length > 5) {
            patterns.codeSmells.push({
              type: "multiple-declarations",
              message: "Too many variable declarations in one statement",
              loc: path.node.loc,
            });
          }
        },

        BinaryExpression(path) {
          if (
            path.node.operator === "+" &&
            path.node.left.type === "BinaryExpression" &&
            path.node.right.type === "StringLiteral"
          ) {
            patterns.antiPatterns.push({
              type: "string-concat",
              message: "String concatenation (consider template literals)",
              loc: path.node.loc,
            });
          }
        },

        ForStatement(path) {
          const body = path.node.body;
          if (body.type === "BlockStatement" && body.body.length > 20) {
            patterns.codeSmells.push({
              type: "long-loop",
              message: "Loop body too long",
              loc: path.node.loc,
            });
          }
        },

        FunctionDeclaration(path) {
          const body = path.node.body;
          if (body.type === "BlockStatement" && body.body.length > 50) {
            patterns.codeSmells.push({
              type: "long-function",
              message: "Function too long",
              loc: path.node.loc,
            });
          }

          if (path.node.params.length > 4) {
            patterns.codeSmells.push({
              type: "too-many-params",
              message: "Too many function parameters",
              loc: path.node.loc,
            });
          }
        },

        Identifier(path) {
          const name = path.node.name;
          if (name.length === 1 || name.length === 2) {
            if (
              path.parent.type !== "CallExpression" &&
              path.parent.type !== "MemberExpression" &&
              path.parentPath?.isBindingIdentifier?.()
            ) {
              patterns.obfuscation.push({
                type: "short-variable",
                message: `Very short variable name: ${name}`,
                loc: path.node.loc,
              });
            }
          }
        },

        NewExpression(path) {
          if (path.node.callee.name === "RegExp") {
            patterns.designPatterns.push({
              type: "regex",
              message: "RegExp instantiation",
              loc: path.node.loc,
            });
          }
        },

        TryStatement(path) {
          patterns.designPatterns.push({
            type: "error-handling",
            message: "Try-catch error handling",
            loc: path.node.loc,
          });
        },

        WithStatement(path) {
          patterns.antiPatterns.push({
            type: "with-statement",
            message: "with statement is deprecated and can cause issues",
            loc: path.node.loc,
          });
        },
      });

      this.stats.analyzed++;
      this.stats.patterns +=
        patterns.obfuscation.length +
        patterns.designPatterns.length +
        patterns.antiPatterns.length;

      return { success: true, patterns };
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
      analyzed: 0,
      failed: 0,
      structures: 0,
      dependencies: 0,
      exports: 0,
      patterns: 0,
    };
  }

  dispose() {
    this.reset();
  }
}

module.exports = Analyzer;
