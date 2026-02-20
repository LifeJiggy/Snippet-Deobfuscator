/**
 * Generator Utilities
 * Production-grade code generation utilities
 * Version: 3.0.0
 */
const { default: generate } = require("@babel/generator");
const { parse } = require("@babel/parser");
const t = require("@babel/types");

class Generator {
  constructor(options = {}) {
    this.name = "generator";
    this.version = "3.0.0";
    this.options = {
      compact: options.compact || false,
      minified: options.minified || false,
      comments: options.comments !== false,
      retainLines: options.retainLines || false,
      concise: options.concise || false,
      jsonCompatible: options.jsonCompatible || false,
      sourceMaps: options.sourceMaps || false,
    };
    this.stats = {
      generated: 0,
      failed: 0,
      characters: 0,
      lines: 0,
      sourceMaps: 0,
      modules: 0,
    };
  }

  generate(ast, options = {}) {
    try {
      const opts = {
        comments: options.comments !== false && this.options.comments,
        compact: options.compact ?? this.options.compact,
        minified: options.minified ?? this.options.minified,
        retainLines: options.retainLines ?? this.options.retainLines,
        concise: options.concise ?? this.options.concise,
        jsonCompatible: options.jsonCompatible ?? this.options.jsonCompatible,
        sourceMaps: options.sourceMaps ?? this.options.sourceMaps,
      };

      const result = generate(ast, opts);

      const code = result.code;
      this.stats.generated++;
      this.stats.characters += code.length;
      this.stats.lines += code.split("\n").length;

      if (result.map) {
        this.stats.sourceMaps++;
      }

      return {
        success: true,
        code,
        map: result.map,
        raw: result,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateCompact(ast) {
    return this.generate(ast, {
      compact: true,
      minified: true,
      comments: false,
      concise: true,
    });
  }

  generatePretty(ast) {
    return this.generate(ast, {
      compact: false,
      minified: false,
      comments: true,
      retainLines: false,
    });
  }

  generateWithMap(ast, options = {}) {
    try {
      const result = generate(ast, {
        sourceMaps: true,
        sourceFileName: options.sourceFileName || "source.js",
        sourceRoot: options.sourceRoot || "",
        ...options,
      });

      this.stats.generated++;
      this.stats.sourceMaps++;
      this.stats.characters += result.code.length;

      return {
        success: true,
        code: result.code,
        map: result.map,
        raw: result,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateModule(ast, type = "esm") {
    try {
      let modifiedAst = ast;

      if (type === "cjs") {
        modifiedAst = this._convertToCommonJS(ast);
      } else if (type === "umd") {
        modifiedAst = this._convertToUMD(ast);
      } else if (type === "iife") {
        modifiedAst = this._convertToIIFE(ast);
      }

      const result = this.generate(modifiedAst, {
        comments: true,
      });

      this.stats.modules++;

      return {
        success: true,
        code: result.code,
        type,
        map: result.map,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _convertToCommonJS(ast) {
    const body = [];

    if (ast.type === "File") {
      ast.program.body.forEach((node) => {
        if (node.type === "ImportDeclaration") {
          const requireStmt = t.variableDeclaration("const", [
            t.variableDeclarator(
              t.objectPattern(
                node.specifiers.map((s) =>
                  t.objectProperty(
                    t.identifier(s.imported.name),
                    t.identifier(s.local.name)
                  )
                )
              ),
              t.callExpression(t.identifier("require"), [
                t.stringLiteral(node.source.value),
              ])
            ),
          ]);
          body.push(requireStmt);
        } else if (node.type === "ExportDefaultDeclaration") {
          body.push(
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("module"),
                  t.identifier("exports")
                ),
                node.declaration
              )
            )
          );
        } else if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            body.push(node.declaration);
            if (node.declaration.id) {
              body.push(
                t.expressionStatement(
                  t.assignmentExpression(
                    "=",
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier("module"),
                        t.identifier("exports")
                      ),
                      t.identifier(node.declaration.id.name)
                    ),
                    t.identifier(node.declaration.id.name)
                  )
                )
              );
            }
          }
        } else {
          body.push(node);
        }
      });

      return t.file(t.program(body));
    }

    return ast;
  }

  _convertToUMD(ast) {
    const esmResult = this.generate(ast);
    const code = esmResult.success ? esmResult.code : "";

    const umdCode = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Module = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  ${code}
  return exports;
}));`;

    return {
      success: true,
      code: umdCode,
      type: "umd",
    };
  }

  _convertToIIFE(ast) {
    const esmResult = this.generate(ast);
    const code = esmResult.success ? esmResult.code : "";

    const iifeCode = `(function() {
'use strict';
${code}
})();`;

    return {
      success: true,
      code: iifeCode,
      type: "iife",
    };
  }

  generateFromCode(code, options = {}) {
    try {
      const ast = parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });

      return this.generate(ast, options);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateStatements(statements) {
    try {
      const program = t.program(statements);
      const file = t.file(program);

      return this.generate(file);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateExpression(expression) {
    try {
      const program = t.program([t.expressionStatement(expression)]);
      const file = t.file(program);

      const result = this.generate(file);

      if (result.success) {
        const code = result.code.trim();
        if (code.endsWith(";")) {
          result.code = code.slice(0, -1);
        }
      }

      return result;
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateFunction(name, params, body, options = {}) {
    try {
      const fn = t.functionDeclaration(
        t.identifier(name),
        params.map((p) => t.identifier(p)),
        t.blockStatement(body),
        options.async || false,
        options.generator || false
      );

      const program = t.program([fn]);
      const file = t.file(program);

      return this.generate(file, options);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateArrowFunction(params, body, options = {}) {
    try {
      const fn = t.arrowFunctionExpression(
        params.map((p) => t.identifier(p)),
        t.isBlockStatement(body)
          ? body
          : t.blockStatement([t.returnStatement(body)]),
        options.async || false
      );

      return this.generateExpression(fn);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateClass(name, methods, options = {}) {
    try {
      const classBody = t.classBody(
        methods.map((m) =>
          t.classMethod(
            m.kind || "method",
            t.identifier(m.name),
            (m.params || []).map((p) => t.identifier(p)),
            t.blockStatement(m.body || []),
            m.computed || false,
            m.static || false,
            false,
            m.async || false
          )
        )
      );

      const classDecl = t.classDeclaration(
        t.identifier(name),
        options.superClass ? t.identifier(options.superClass) : null,
        classBody
      );

      const program = t.program([classDecl]);
      const file = t.file(program);

      return this.generate(file, options);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateObject(properties) {
    try {
      const props = properties.map((p) =>
        t.objectProperty(
          t.identifier(p.key),
          typeof p.value === "object" && p.value.type
            ? p.value
            : t.identifier(p.value)
        )
      );

      const obj = t.objectExpression(props);
      return this.generateExpression(obj);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateArray(elements) {
    try {
      const arr = t.arrayExpression(
        elements.map((e) =>
          typeof e === "object" && e.type ? e : t.identifier(e)
        )
      );

      return this.generateExpression(arr);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateImport(specifiers, source) {
    try {
      const importDecl = t.importDeclaration(
        specifiers.map((s) =>
          t.importSpecifier(
            t.identifier(s.local || s.imported),
            t.identifier(s.imported)
          )
        ),
        t.stringLiteral(source)
      );

      const program = t.program([importDecl]);
      const file = t.file(program);

      return this.generate(file);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateExport(name, value) {
    try {
      let exportDecl;

      if (value) {
        exportDecl = t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier(name), value),
          ])
        );
      } else {
        exportDecl = t.exportNamedDeclaration(null, [
          t.exportSpecifier(t.identifier(name), t.identifier(name)),
        ]);
      }

      const program = t.program([exportDecl]);
      const file = t.file(program);

      return this.generate(file);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateDefaultExport(value) {
    try {
      const exportDecl = t.exportDefaultDeclaration(
        typeof value === "string" ? t.identifier(value) : value
      );

      const program = t.program([exportDecl]);
      const file = t.file(program);

      return this.generate(file);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  generateRequire(modulePath, varName) {
    try {
      const requireStmt = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(varName),
          t.callExpression(t.identifier("require"), [
            t.stringLiteral(modulePath),
          ])
        ),
      ]);

      const program = t.program([requireStmt]);
      const file = t.file(program);

      return this.generate(file);
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  minify(ast) {
    return this.generateCompact(ast);
  }

  beautify(ast) {
    return this.generatePretty(ast);
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      generated: 0,
      failed: 0,
      characters: 0,
      lines: 0,
      sourceMaps: 0,
      modules: 0,
    };
  }

  dispose() {
    this.reset();
  }
}

module.exports = Generator;
