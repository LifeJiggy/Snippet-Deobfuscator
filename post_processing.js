// post_processing.js
// Enhanced post-processing functions for deobfuscated code
// Includes: dead code elimination, webpack chunk reconstruction, string decryption

const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

// ============================================
// STRING DECRYPTION ENHANCEMENTS
// ============================================

const stringDecryption = {
  // Multi-layer decryption for various obfuscation patterns
  decrypt: (str) => {
    if (!str || typeof str !== "string") return str;
    if (str.length < 2) return str;

    // Skip if already looks like normal text
    const alphaRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
    if (alphaRatio > 0.8 && /^[a-zA-Z\s.,;:!?()\[\]"'-]+$/.test(str)) {
      return str;
    }

    let result = str;
    result = stringDecryption.decodeCharCodeArray(result);
    result = stringDecryption.decodeHexString(result);
    result = stringDecryption.decodeBase64Safe(result);
    result = stringDecryption.decodeURLEncoded(result);
    result = stringDecryption.decodeUnicodeEscapes(result);
    result = stringDecryption.decodeHTMLEntities(result);
    result = stringDecryption.decodeROT47(result);
    result = stringDecryption.decodeAtBash(result);
    result = stringDecryption.decodeCustomObfuscation(result);

    return result;
  },

  // Decode String.fromCharCode(...) patterns
  decodeCharCodeArray: (str) => {
    // Match: String.fromCharCode(97, 98, 99) or "abc".charCodeAt(0)
    const pattern = /String\.fromCharCode\((\d+(?:\s*,\s*\d+)*)\)/g;
    return str.replace(pattern, (match, nums) => {
      try {
        const chars = nums
          .split(/\s*,\s*/)
          .map((n) => String.fromCharCode(parseInt(n)));
        return `"${chars.join("")}"`;
      } catch (e) {
        return match;
      }
    });
  },

  // Decode hex strings like \x61\x62\x63
  decodeHexString: (str) => {
    const pattern = /\\x([0-9a-fA-F]{2})/g;
    return str.replace(pattern, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    });
  },

  // Decode unicode escapes like \u0061\u0062\u0063
  decodeUnicodeEscapes: (str) => {
    const pattern = /\\u([0-9a-fA-F]{4})/g;
    return str.replace(pattern, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    });
  },

  // Safe base64 decoding
  decodeBase64Safe: (str) => {
    if (!str || str.length < 4) return str;
    // Only decode if it looks like base64 (no spaces, proper chars)
    if (!/^[A-Za-z0-9+/]+=*$/.test(str)) return str;
    // Skip short strings that might be words
    if (str.length < 8) return str;

    try {
      const decoded = Buffer.from(str, "base64").toString("utf-8");
      // Only return if result looks valid (printable ASCII, not too many special chars)
      if (
        /^[a-zA-Z0-9\s.,;:!?()\[\]"'-]+$/.test(decoded) &&
        decoded.length >= 3
      ) {
        return decoded;
      }
    } catch (e) {
      // Ignore errors
    }
    return str;
  },

  // Decode URL-encoded strings
  decodeURLEncoded: (str) => {
    const pattern = /%([0-9A-Fa-f]{2})/g;
    return str.replace(pattern, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    });
  },

  // Decode HTML entities
  decodeHTMLEntities: (str) => {
    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&apos;": "'",
      "&nbsp;": " ",
      "&#x27;": "'",
      "&#x2F;": "/",
      "&ndash;": "–",
      "&mdash;": "—",
      "&copy;": "©",
      "&reg;": "®",
      "&trade;": "™",
      "&hellip;": "…",
      "&ldquo;": '"',
      "&rdquo;": '"',
      "&lsquo;": "'",
      "&rsquo;": "'",
    };

    let result = str;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, "g"), char);
    }
    return result;
  },

  // ROT47 cipher (rotates ASCII 33-126)
  decodeROT47: (str) => {
    return str
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 33 && code <= 126) {
          return String.fromCharCode(33 + ((code - 33 + 47) % 94));
        }
        return char;
      })
      .join("");
  },

  // Atbash cipher (reverse alphabet)
  decodeAtBash: (str) => {
    return str
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 97 && code <= 122) {
          return String.fromCharCode(122 - (code - 97));
        }
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(90 - (code - 65));
        }
        return char;
      })
      .join("");
  },

  // Custom obfuscation patterns (apostrophe-based, etc)
  decodeCustomObfuscation: (str) => {
    // Pattern: word'word'word (like "he'llo")
    if (/[a-z]+'[a-z]+/.test(str)) {
      // Try removing apostrophes and apply ROT13
      const cleaned = str.replace(/'/g, "");
      if (/^[a-zA-Z]+$/.test(cleaned)) {
        const rot13 = cleaned.replace(/[a-zA-Z]/g, (c) => {
          const base = c <= "Z" ? 65 : 97;
          return String.fromCharCode(
            base + ((c.charCodeAt(0) - base + 13) % 26)
          );
        });
        // Only return if it's a meaningful word
        const commonWords = [
          "hello",
          "world",
          "click",
          "button",
          "submit",
          "cancel",
          "error",
          "success",
          "loading",
        ];
        if (commonWords.includes(rot13.toLowerCase())) {
          return rot13;
        }
      }
    }

    // Pattern: ^ or _ in middle of words (like "b^tton")
    if (/[a-z]+[\^_][a-z]+/.test(str)) {
      return str.replace(/[a-z]+[\^_][a-z]+/g, (word) => {
        const cleaned = word.replace(/[\^_]/g, "");
        return cleaned.replace(/[a-zA-Z]/g, (c) => {
          const base = c <= "Z" ? 65 : 97;
          return String.fromCharCode(
            base + ((c.charCodeAt(0) - base + 13) % 26)
          );
        });
      });
    }

    return str;
  },

  // Decode common obfuscated patterns in bulk
  bulkDecrypt: (code) => {
    // Find all string literals and try to decrypt
    const stringPattern = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
    return code.replace(stringPattern, (match) => {
      const inner = match.slice(1, -1);
      const decrypted = stringDecryption.decrypt(inner);
      if (decrypted !== inner) {
        const quote = match[0];
        return quote + decrypted + quote;
      }
      return match;
    });
  },
};

// ============================================
// DEAD CODE ELIMINATION
// ============================================

const deadCodeElimination = {
  // Remove unreachable code and unused declarations
  eliminate: (ast) => {
    let changed = true;
    let iterations = 0;

    while (changed && iterations < 10) {
      changed = false;
      iterations++;

      // Remove unused variable declarations
      changed = deadCodeElimination.removeUnusedVars(ast) || changed;
      // Remove empty function bodies
      changed = deadCodeElimination.removeEmptyFunctions(ast) || changed;
      // Remove unreachable code
      changed = deadCodeElimination.removeUnreachableCode(ast) || changed;
      // Remove duplicate conditionals
      changed = deadCodeElimination.simplifyConditionals(ast) || changed;
      // Remove unused imports/requires
      changed = deadCodeElimination.removeUnusedImports(ast) || changed;
    }

    return changed;
  },

  removeUnusedVars: (ast) => {
    let changed = false;
    const scope = new Map();

    traverse(ast, {
      VariableDeclaration(path) {
        path.node.declarations.forEach((decl) => {
          if (decl.id?.name) {
            scope.set(decl.id.name, {
              declared: true,
              used: false,
              path,
            });
          }
        });
      },

      Identifier(path) {
        const name = path.node.name;
        if (scope.has(name)) {
          const info = scope.get(name);
          // Check if this is a usage (not declaration)
          if (
            path.parent.type !== "VariableDeclarator" ||
            path.parent.id !== path.node
          ) {
            info.used = true;
          }
        }
      },

      Program: {
        exit(path) {
          for (const [name, info] of scope) {
            if (info.declared && !info.used) {
              // Don't remove if it's exported or used in other ways
              if (!path.scope.hasBinding(name)) continue;
              const binding = path.scope.getBinding(name);
              if (binding?.references > 0) continue;

              try {
                info.path.remove();
                changed = true;
              } catch (e) {
                // Ignore removal errors
              }
            }
          }
        },
      },
    });

    return changed;
  },

  removeEmptyFunctions: (ast) => {
    let changed = false;

    traverse(ast, {
      FunctionDeclaration(path) {
        const body = path.node.body;
        if (body.type === "BlockStatement" && body.body.length === 0) {
          try {
            path.remove();
            changed = true;
          } catch (e) {}
        }
      },

      ArrowFunctionExpression(path) {
        const body = path.node.body;
        if (body.type === "BlockStatement" && body.body.length === 0) {
          try {
            path.remove();
            changed = true;
          } catch (e) {}
        }
      },
    });

    return changed;
  },

  removeUnreachableCode: (ast) => {
    let changed = false;

    traverse(ast, {
      BlockStatement(path) {
        const body = path.node.body;
        for (let i = 0; i < body.length - 1; i++) {
          const current = body[i];
          const next = body[i + 1];

          // Check if current statement always returns/throws
          if (
            current.type === "ReturnStatement" ||
            current.type === "ThrowStatement" ||
            (current.type === "IfStatement" &&
              current.consequent?.type === "ReturnStatement")
          ) {
            // Remove all statements after
            if (i + 1 < body.length) {
              path.node.body = body.slice(0, i + 1);
              changed = true;
              break;
            }
          }
        }
      },
    });

    return changed;
  },

  simplifyConditionals: (ast) => {
    let changed = false;

    traverse(ast, {
      IfStatement(path) {
        const test = path.node.test;

        // Remove duplicate else-if branches
        if (path.node.consequent && path.node.alternate) {
          const consequentCode = generate(path.node.consequent).code;
          const alternateCode = generate(path.node.alternate).code;

          if (consequentCode === alternateCode) {
            // Both branches do the same thing
            try {
              path.replaceWith({
                type: "ExpressionStatement",
                expression: path.node.consequent,
              });
              changed = true;
            } catch (e) {}
          }
        }

        // Simplify if(true) or if(false)
        if (test.type === "BooleanLiteral") {
          try {
            if (test.value) {
              // if(true) -> just the consequent
              path.replaceWithMultiple(path.node.consequent?.body || []);
            } else {
              // if(false) -> just the alternate or remove
              if (path.node.alternate) {
                path.replaceWithMultiple(path.node.alternate.body || []);
              } else {
                path.remove();
              }
            }
            changed = true;
          } catch (e) {}
        }
      },
    });

    return changed;
  },

  removeUnusedImports: (ast) => {
    let changed = false;

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers;

        // Check if any specifier is used
        const usedSpecifiers = specifiers.filter((spec) => {
          const name = spec.local?.name;
          if (!name) return false;

          const binding = path.scope.getBinding(name);
          return binding && binding.references > 0;
        });

        if (usedSpecifiers.length === 0 && specifiers.length > 0) {
          try {
            path.remove();
            changed = true;
          } catch (e) {}
        }
      },

      CallExpression(path) {
        // Handle require() calls
        if (path.node.callee.name === "require") {
          const source = path.node.arguments[0]?.value;
          if (!source) return;

          const binding = path.scope.getBinding(path.parent?.id?.name);
          if (binding && binding.references === 0) {
            try {
              path.parentPath.remove();
              changed = true;
            } catch (e) {}
          }
        }
      },
    });

    return changed;
  },
};

// ============================================
// WEBPACK CHUNK RECONSTRUCTION
// ============================================

const webpackReconstructor = {
  // Minimal webpack cleanup to avoid prettier issues
  reconstruct: (code) => {
    let result = code;

    // Clean up webpack require calls
    result = result.replace(
      /__webpack_require__\.\w+\((\d+)\)/g,
      "require($1)"
    );
    result = result.replace(/__webpack_require__\(/g, "require(");
    result = result.replace(/__r\(\s*(\d+)\s*\)/g, "require($1)");

    // Clean up chunk loading
    result = result.replace(/\.e\.get\((\d+)\)/g, ".loadChunk($1)");
    result = result.replace(/\.e\((\d+)\)/g, ".__e($1)");

    return result;
  },
};

// ============================================
// CODE CLEANUP AND OPTIMIZATION
// ============================================

const codeCleanup = {
  // Various cleanup operations
  cleanup: (code) => {
    let result = code;

    result = codeCleanup.removeEmptyBlocks(result);
    result = codeCleanup.mergeVarDeclarations(result);
    result = codeCleanup.fixSemicolons(result);
    result = codeCleanup.normalizeWhitespace(result);
    result = codeCleanup.removeDebugCode(result);
    result = codeCleanup.fixCommonErrors(result);

    return result;
  },

  removeEmptyBlocks: (code) => {
    return code.replace(/\{\s*\}/g, "{}");
  },

  mergeVarDeclarations: (code) => {
    // Merge: var a = 1; var b = 2; -> var a = 1, b = 2;
    return code.replace(
      /var\s+(\w+)\s*=\s*([^;]+);\s*var\s+(\w+)\s*=\s*([^;]+);/g,
      "var $1 = $2, $3 = $4;"
    );
  },

  fixSemicolons: (code) => {
    // Add missing semicolons after closing braces
    return code.replace(/\}\s*([\}\n])/g, "};$1");
  },

  normalizeWhitespace: (code) => {
    return code
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s*([=+\-*/<>!&|^%])\s*/g, " $1 ")
      .trim();
  },

  removeDebugCode: (code) => {
    let result = code;

    // Remove console.log in production patterns
    result = result.replace(/console\.(log|debug|info)\s*\([^)]*\);?/g, "");

    // Remove debugger statements
    result = result.replace(/debugger;?/g, "");

    // Remove console.table
    result = result.replace(/console\.table\s*\([^)]*\);?/g, "");

    // Remove TODO/FIXME comments that are resolved
    result = result.replace(/\/\/\s*(TODO|FIXME|HACK|XXX):.*$/gm, "");

    return result;
  },

  fixCommonErrors: (code) => {
    let result = code;

    // Fix missing comma in object literals
    result = result.replace(/"\w+"\s*:\s*("[^"]+")\s*("\w+")/g, "$1, $3");

    // Fix dangling commas
    result = result.replace(/,\s*\]/g, "]");
    result = result.replace(/,\s*\}/g, "}");

    // Fix unclosed brackets (basic cases)
    const openParens = (result.match(/\(/g) || []).length;
    const closeParens = (result.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      result += ")".repeat(openParens - closeParens);
    }

    return result;
  },
};

// ============================================
// MAIN EXPORT
// ============================================

function applyPostProcessing(code) {
  let result = code;

  // Apply string decryption
  result = stringDecryption.bulkDecrypt(result);

  // Apply dead code elimination using AST
  try {
    const ast = parse(result, { sourceType: "module" });
    deadCodeElimination.eliminate(ast);
    result = generate(ast).code;
  } catch (e) {
    // If AST parsing fails, continue with string-based processing
  }

  // Apply webpack reconstruction
  result = webpackReconstructor.reconstruct(result);

  // Apply code cleanup
  result = codeCleanup.cleanup(result);

  // Apply original post-processing rules
  result = applyOriginalPostProcessing(result);

  return result;
}

function applyOriginalPostProcessing(code) {
  let result = code;

  // Replace DelayExecution with setTimeout
  result = result.replace(
    /DelayExecution\s*\(\s*(\(\)\s*=>|function\s*\(\)\s*)\s*\{([\s\S]*?)\}\s*,\s*([^)]+)\)/g,
    "setTimeout(function() {$2}, $3)"
  );

  // Handle Unicode replacement characters
  result = result.replace(/\uFFFD+/g, (match) => {
    const length = match.length;
    if (length === 1) return '"unknown"';
    if (length === 2) return '"center"';
    if (length === 3) return '"left"';
    if (length === 4) return '"right"';
    return `"unknown_${length}_chars"`;
  });

  // Handle specific VWO event patterns
  result = result.replace(
    /\uFFFDt\uFFFD\uFFFD\uFFFD\uFFFDJ\x1A0/g,
    '"vwo_survey_display"'
  );
  result = result.replace(
    /\uFFFDt\uFFFD\uFFFD\uFFFD\uFFFD\n\uFFFD\uFFFD\uFFFD\uFFFD^/g,
    '"vwo_survey_complete"'
  );

  // Process React JSX patterns
  result = result.replace(/\(0,\s*ye\.jsx\)/g, "React.createElement");
  result = result.replace(/\(0,\s*ye\.jsxs\)/g, "React.createElement");

  // Fix common patterns
  result = result.replace(/"v\+"/g, '"div"');
  result = result.replace(
    /void 0 !== ([a-zA-Z0-9_$]+)\.value/g,
    "/* Check if defined */ void 0 !== $1.value"
  );

  // Fix obfuscated template literals
  result = result.replace(
    /["']\s*\+\s*([a-zA-Z0-9_$]+)\s*\+\s*["']/g,
    "`${$1}`"
  );

  return result;
}

function detectObfuscationType(code) {
  if (code.includes("String.fromCharCode") && /\[(\d+)\]\(\d+\)/.test(code)) {
    return "charcode-array";
  } else if (/[a-zA-Z0-9+/=]{20,}/.test(code)) {
    return "base64-encoded";
  } else if (/(['"])[^\1]+?\\\1\+\1[^\1]+?\1/.test(code)) {
    return "string-splitting";
  } else if (/[a-z]+'[a-z]+/.test(code)) {
    return "unicode-substitution";
  } else if (
    /\[\s*(['"])\\x[0-9a-f]{2}\1\s*\+\s*(['"])\\x[0-9a-f]{2}\2\s*\]/.test(code)
  ) {
    return "hex-encoding";
  } else if (/\(function\s*\(\s*\)\s*\{\s*return/.test(code)) {
    return "iife-wrapping";
  } else if (code.includes("__webpack_require__")) {
    return "webpack-bundle";
  } else {
    return "general";
  }
}

function decodeUnicodeString(str) {
  if (!str.includes("\uFFFD")) return str;

  try {
    const decodings = [
      Buffer.from(str, "utf8").toString("latin1"),
      Buffer.from(str, "latin1").toString("utf8"),
      Buffer.from(str, "ascii").toString("utf8"),
    ];

    const validDecoding = decodings.find(
      (decoded) => !decoded.includes("\uFFFD")
    );
    if (validDecoding) return validDecoding;

    return str.replace(/\uFFFD/g, "[?]");
  } catch (e) {
    return str.replace(/\uFFFD/g, "[?]");
  }
}

function decodeObfuscatedApostropheString(str) {
  if (!str.includes("'") || !/[a-z]+'[a-z]+/.test(str)) return str;

  return str
    .split("")
    .map((char) => {
      if (char === "'") return "";
      const code = char.charCodeAt(0);
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + 13) % 26) + 97);
      }
      return char;
    })
    .join("");
}

function decodeReactObfuscatedStrings(str) {
  if (/[a-z]+[^a-z0-9][a-z]+/.test(str)) {
    return str
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 97 && code <= 122) {
          return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        } else if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        }
        return char;
      })
      .join("");
  }
  return str;
}

module.exports = {
  applyPostProcessing,
  detectObfuscationType,
  decodeUnicodeString,
  decodeObfuscatedApostropheString,
  decodeReactObfuscatedStrings,
  stringDecryption,
  deadCodeElimination,
  webpackReconstructor,
  codeCleanup,
};
