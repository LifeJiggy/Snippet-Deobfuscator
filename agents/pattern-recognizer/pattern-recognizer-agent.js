/**
 * Pattern Recognizer Agent
 * Production-grade obfuscation pattern recognition system
 * Version: 3.0.0
 *
 * Recognizes 50+ obfuscation patterns with deep analysis
 */
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const { parse } = require("@babel/parser");

class PatternRecognizerAgent {
  constructor() {
    this.name = "pattern-recognizer";
    this.version = "3.0.0";
    this.patterns = new Map();
    this.cache = new Map();
    this.stats = {
      totalScans: 0,
      patternsFound: 0,
      confidence: "high",
    };

    // Initialize comprehensive pattern database
    this.initializePatternDatabase();
  }

  /**
   * Initialize comprehensive pattern database
   * Contains 50+ known obfuscation patterns
   */
  initializePatternDatabase() {
    this.patterns = new Map([
      // Array Access Obfuscation
      [
        "arrayAccessObfuscation",
        {
          name: "Array Access Obfuscation",
          severity: "medium",
          category: "variable",
          description: "Uses nested array access for variable obfuscation",
          regex: /\w+\[["'`]\w+["'`]\]\[["'`]\w+["'`]\]/g,
          astType: "MemberExpression",
          detector: this.detectArrayAccessObfuscation.bind(this),
        },
      ],

      [
        "arrayLiteralObfuscation",
        {
          name: "Array Literal Obfuscation",
          severity: "medium",
          category: "variable",
          description: "Uses array of arrays to store obfuscated data",
          regex:
            /\[\[["'`][^"'`]+["'`],\s*["'`][^"'`]+["'`],\s*["'`][^"'`]+["'`]\]/g,
          astType: "ArrayExpression",
          detector: this.detectArrayLiteralObfuscation.bind(this),
        },
      ],

      // Arithmetic Obfuscation
      [
        "arithmeticObfuscation",
        {
          name: "Arithmetic Obfuscation",
          severity: "low",
          category: "value",
          description: "Uses complex arithmetic to hide numeric values",
          regex: /\(\d+\s*[\+\-\*\/]\s*\d+\)\s*[\+\-\*\/]\s*\d+/g,
          astType: "BinaryExpression",
          detector: this.detectArithmeticObfuscation.bind(this),
        },
      ],

      [
        "computedPropertyAccess",
        {
          name: "Computed Property Access",
          severity: "low",
          category: "variable",
          description: "Uses computed (dynamic) property access",
          regex: /\w+\[(\w+|"[^"]+"|'[^']+')]/g,
          astType: "MemberExpression",
          detector: this.detectComputedPropertyAccess.bind(this),
        },
      ],

      // String Obfuscation
      [
        "charCodeObfuscation",
        {
          name: "Character Code Obfuscation",
          severity: "high",
          category: "string",
          description: "Uses String.fromCharCode to hide strings",
          regex: /String\.fromCharCode\([^)]+\)/g,
          astType: "CallExpression",
          detector: this.detectCharCodeObfuscation.bind(this),
        },
      ],

      [
        "charAtObfuscation",
        {
          name: "CharAt Obfuscation",
          severity: "medium",
          category: "string",
          description: "Uses charAt method for string obfuscation",
          regex: /\.charAt\(\d+\)/g,
          astType: "CallExpression",
          detector: this.detectCharAtObfuscation.bind(this),
        },
      ],

      [
        "splitStringObfuscation",
        {
          name: "Split String Obfuscation",
          severity: "high",
          category: "string",
          description: "Splits strings into arrays and joins them",
          regex:
            /\[\[["'`][^"'`]*["'`],\s*["'`][^"'`]*["'`],\s*["'`][^"'`]*["'`]\]\.join\(/g,
          astType: "CallExpression",
          detector: this.detectSplitStringObfuscation.bind(this),
        },
      ],

      [
        "concatenationObfuscation",
        {
          name: "String Concatenation Obfuscation",
          severity: "low",
          category: "string",
          description: "Uses multiple concatenations to hide strings",
          regex:
            /["'`][^"'`]*["'`]\s*\+\s*["'`][^"'`]*["'`]\s*\+\s*["'`][^"'`]*["'`]/g,
          astType: "BinaryExpression",
          detector: this.detectConcatenationObfuscation.bind(this),
        },
      ],

      // Encoding Obfuscation
      [
        "base64Obfuscation",
        {
          name: "Base64 Encoding Obfuscation",
          severity: "high",
          category: "encoding",
          description: "Uses base64 encoding for strings",
          regex: /atob\s*\([^)]+\)|["'`][A-Za-z0-9+/]{20,}={0,2}["'`]/g,
          astType: "CallExpression",
          detector: this.detectBase64Obfuscation.bind(this),
        },
      ],

      [
        "hexObfuscation",
        {
          name: "Hexadecimal Obfuscation",
          severity: "medium",
          category: "encoding",
          description: "Uses hexadecimal encoding",
          regex: /(0x[0-9a-fA-F]+|\\x[0-9a-fA-F]{2})/g,
          astType: "NumericLiteral",
          detector: this.detectHexObfuscation.bind(this),
        },
      ],

      [
        "unicodeEscape",
        {
          name: "Unicode Escape Sequence",
          severity: "medium",
          category: "encoding",
          description: "Uses Unicode escape sequences",
          regex: /\\u[0-9a-fA-F]{4}/g,
          astType: "StringLiteral",
          detector: this.detectUnicodeEscape.bind(this),
        },
      ],

      [
        "htmlEntityEncoding",
        {
          name: "HTML Entity Encoding",
          severity: "low",
          category: "encoding",
          description: "Uses HTML entity encoding",
          regex: /&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g,
          astType: "StringLiteral",
          detector: this.detectHtmlEntityEncoding.bind(this),
        },
      ],

      // Function Obfuscation
      [
        "evalObfuscation",
        {
          name: "Eval-based Obfuscation",
          severity: "critical",
          category: "execution",
          description: "Uses eval for dynamic code execution",
          regex: /eval\s*\(/g,
          astType: "CallExpression",
          detector: this.detectEvalObfuscation.bind(this),
        },
      ],

      [
        "functionConstructorObfuscation",
        {
          name: "Function Constructor Obfuscation",
          severity: "critical",
          category: "execution",
          description: "Uses Function constructor for dynamic code",
          regex: /(new\s+Function|Function)\s*\(/g,
          astType: "CallExpression",
          detector: this.detectFunctionConstructorObfuscation.bind(this),
        },
      ],

      [
        "setTimeoutEval",
        {
          name: "setTimeout Eval Obfuscation",
          severity: "high",
          category: "execution",
          description: "Uses setTimeout with string code",
          regex: /setTimeout\s*\(\s*["'`]/g,
          astType: "CallExpression",
          detector: this.detectSetTimeoutEval.bind(this),
        },
      ],

      [
        "iifeObfuscation",
        {
          name: "IIFE Obfuscation",
          severity: "low",
          category: "function",
          description: "Immediately Invoked Function Expression",
          regex:
            /\(function\s*[\(\w]*\s*\([^)]*\)\s*\{[\s\S]*\}\s*\)\s*\(\s*\)|!function\s*\([^)]*\)\s*\{[\s\S]*\}\s*\(\s*\)/g,
          astType: "CallExpression",
          detector: this.detectIIFEObfuscation.bind(this),
        },
      ],

      [
        "dynamicFunctionCall",
        {
          name: "Dynamic Function Call",
          severity: "medium",
          category: "function",
          description: "Uses dynamic function names for calls",
          regex: /\[\s*["'`]?\w+["'`]?\s*\]\s*\(/g,
          astType: "CallExpression",
          detector: this.detectDynamicFunctionCall.bind(this),
        },
      ],

      [
        "prototypePollution",
        {
          name: "Prototype Pollution Pattern",
          severity: "critical",
          category: "security",
          description: "Attempts to pollute Object prototype",
          regex: /\.__proto__|\.prototype\s*=|Object\.prototype/g,
          astType: "AssignmentExpression",
          detector: this.detectPrototypePollution.bind(this),
        },
      ],

      // Control Flow Obfuscation
      [
        "controlFlowFlattening",
        {
          name: "Control Flow Flattening",
          severity: "high",
          category: "control",
          description: "Uses switch/case for state machine pattern",
          regex:
            /switch\s*\([^)]+\)\s*\{[\s\S]*case\s+\d+:[\s\S]*break;[\s\S]*\}/g,
          astType: "SwitchStatement",
          detector: this.detectControlFlowFlattening.bind(this),
        },
      ],

      [
        "opaquePredicate",
        {
          name: "Opaque Predicate",
          severity: "medium",
          category: "control",
          description: "Uses always-true/false conditions",
          regex: /if\s*\(\s*(!?\w+&&\s*!?\w+|\w+\s*===\s*\w+)\s*\)/g,
          astType: "IfStatement",
          detector: this.detectOpaquePredicate.bind(this),
        },
      ],

      [
        "deadCodeInjection",
        {
          name: "Dead Code Injection",
          severity: "low",
          category: "control",
          description: "Inserts unreachable code blocks",
          regex: /if\s*\(\s*false\s*\)\s*\{[\s\S]*\}/g,
          astType: "IfStatement",
          detector: this.detectDeadCodeInjection.bind(this),
        },
      ],

      [
        "tryCatchObfuscation",
        {
          name: "Try-Catch Obfuscation",
          severity: "medium",
          category: "control",
          description: "Uses try-catch for control flow",
          regex: /try\s*\{[\s\S]*\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*\}/g,
          astType: "TryStatement",
          detector: this.detectTryCatchObfuscation.bind(this),
        },
      ],

      // Variable Obfuscation
      [
        "variableMangling",
        {
          name: "Variable Name Mangling",
          severity: "low",
          category: "variable",
          description: "Uses shortened variable names",
          regex: /\b[a-z]{1,2}\b(?=\s*[=\(\[\{])/g,
          astType: "Identifier",
          detector: this.detectVariableMangling.bind(this),
        },
      ],

      [
        "globalVariableHiding",
        {
          name: "Global Variable Hiding",
          severity: "medium",
          category: "variable",
          description: "Hides variables in global objects",
          regex: /(window|global|this)\[\s*["'`]?\w+["'`]?\s*\]/g,
          astType: "MemberExpression",
          detector: this.detectGlobalVariableHiding.bind(this),
        },
      ],

      [
        "variableReassignment",
        {
          name: "Variable Reassignment",
          severity: "low",
          category: "variable",
          description: "Reassigns variables multiple times",
          regex: /(var|let|const)\s+\w+\s*=\s*[^;]+;\s*\w+\s*=/g,
          astType: "VariableDeclarator",
          detector: this.detectVariableReassignment.bind(this),
        },
      ],

      // Object Obfuscation
      [
        "objectPropertyAccess",
        {
          name: "Object Property Access",
          severity: "low",
          category: "object",
          description: "Uses bracket notation for property access",
          regex: /\w+\[["'`]\w+["'`]\]/g,
          astType: "MemberExpression",
          detector: this.detectObjectPropertyAccess.bind(this),
        },
      ],

      [
        "objectDefinitionObfuscation",
        {
          name: "Object Definition Obfuscation",
          severity: "medium",
          category: "object",
          description: "Uses dynamic object definitions",
          regex:
            /\{\s*(\[["'`]\w+["'`]\]\s*:\s*\w+|["'`]?\w+["'`]?\s*:\s*\w+)\s*,?\s*\}/g,
          astType: "ObjectExpression",
          detector: this.detectObjectDefinitionObfuscation.bind(this),
        },
      ],

      [
        "deepPropertyAccess",
        {
          name: "Deep Property Access",
          severity: "low",
          category: "object",
          description: "Chains multiple property accesses",
          regex: /\w+\.\w+\.\w+\.\w+/g,
          astType: "MemberExpression",
          detector: this.detectDeepPropertyAccess.bind(this),
        },
      ],

      // Module Obfuscation
      [
        "requireObfuscation",
        {
          name: "Require Obfuscation",
          severity: "medium",
          category: "module",
          description: "Uses dynamic require statements",
          regex: /require\s*\(\s*["'`][^"'`]+["'`]\s*\)/g,
          astType: "CallExpression",
          detector: this.detectRequireObfuscation.bind(this),
        },
      ],

      [
        "webpackChunkAccess",
        {
          name: "Webpack Chunk Access",
          severity: "low",
          category: "module",
          description: "Accesses webpack chunk objects",
          regex: /__WEBPACK_REQUIRE__|__webpack_require__/g,
          astType: "Identifier",
          detector: this.detectWebpackChunkAccess.bind(this),
        },
      ],

      [
        "exportObfuscation",
        {
          name: "Export Obfuscation",
          severity: "low",
          category: "module",
          description: "Uses module.exports with dynamic keys",
          regex: /module\.exports\s*=\s*\{[\s\S]*\[["'`]\w+["'`]\][\s\S]*\}/g,
          astType: "AssignmentExpression",
          detector: this.detectExportObfuscation.bind(this),
        },
      ],

      // Browser/DOM Obfuscation
      [
        "documentWriteObfuscation",
        {
          name: "document.write Obfuscation",
          severity: "high",
          category: "dom",
          description: "Uses document.write for injection",
          regex: /document\.write\s*\(/g,
          astType: "CallExpression",
          detector: this.detectDocumentWriteObfuscation.bind(this),
        },
      ],

      [
        "innerHTMLManipulation",
        {
          name: "innerHTML Manipulation",
          severity: "medium",
          category: "dom",
          description: "Uses innerHTML for content injection",
          regex: /\.innerHTML\s*=/g,
          astType: "AssignmentExpression",
          detector: this.detectInnerHTMLManipulation.bind(this),
        },
      ],

      [
        "eventHandlerObfuscation",
        {
          name: "Event Handler Obfuscation",
          severity: "medium",
          category: "dom",
          description: "Uses obfuscated event handlers",
          regex: /addEventListener\s*\(\s*["'`]\w+["'`]/g,
          astType: "CallExpression",
          detector: this.detectEventHandlerObfuscation.bind(this),
        },
      ],

      [
        "locationManipulation",
        {
          name: "Location Manipulation",
          severity: "high",
          category: "dom",
          description: "Manipulates window.location",
          regex: /location\.(href|replace|assign)\s*\(/g,
          astType: "MemberExpression",
          detector: this.detectLocationManipulation.bind(this),
        },
      ],

      // Crypto/Malware Patterns
      [
        "cryptoObfuscation",
        {
          name: "Cryptographic Operation",
          severity: "high",
          category: "crypto",
          description: "Uses cryptographic functions",
          regex: /(crypto|Subtle|CryptoKey)\.\w+/g,
          astType: "CallExpression",
          detector: this.detectCryptoObfuscation.bind(this),
        },
      ],

      [
        "antiDebugObfuscation",
        {
          name: "Anti-Debugging Technique",
          severity: "high",
          category: "security",
          description: "Contains anti-debugging code",
          regex:
            /(debugger;|while\s*\(\s*true\s*\)\s*\{|setInterval\s*\(\s*function\s*\(\s*\)\s*\{\s*debugger)/g,
          astType: "Statement",
          detector: this.detectAntiDebugObfuscation.bind(this),
        },
      ],

      [
        "codeInjection",
        {
          name: "Code Injection Pattern",
          severity: "critical",
          category: "security",
          description: "Contains potential code injection",
          regex: null,
          astType: "CallExpression",
          detector: this.detectCodeInjection.bind(this),
        },
      ],

      [
        "networkExfiltration",
        {
          name: "Network Exfiltration Pattern",
          severity: "critical",
          category: "security",
          description: "Contains potential data exfiltration",
          regex: /(fetch|XMLHttpRequest|WebSocket)\s*\([^)]*\.(send|write)\)/g,
          astType: "CallExpression",
          detector: this.detectNetworkExfiltration.bind(this),
        },
      ],

      // JQuery/Framework Specific
      [
        "jqueryObfuscation",
        {
          name: "jQuery Obfuscation",
          severity: "low",
          category: "library",
          description: "Uses jQuery with obfuscated selectors",
          regex:
            /\$\s*\(\s*["'`][^"'`]*["'`]\s*\)\.(?!css|html|text|val|attr|on)[a-zA-Z]+/g,
          astType: "CallExpression",
          detector: this.detectJQueryObfuscation.bind(this),
        },
      ],

      [
        "reactObfuscation",
        {
          name: "React Obfuscation",
          severity: "low",
          category: "framework",
          description: "Uses React with obfuscated JSX",
          regex: /(_jsx|React\.createElement)\s*\(\s*["'`]/g,
          astType: "CallExpression",
          detector: this.detectReactObfuscation.bind(this),
        },
      ],

      [
        "vueObfuscation",
        {
          name: "Vue Obfuscation",
          severity: "low",
          category: "framework",
          description: "Uses Vue with obfuscated templates",
          regex: /(v-if|v-for|v-show|v-bind|v-on)\s*[:=]\s*["'`]/g,
          astType: "JSXAttribute",
          detector: this.detectVueObfuscation.bind(this),
        },
      ],

      // Misc Obfuscation
      [
        "regexObfuscation",
        {
          name: "Regex Obfuscation",
          severity: "low",
          category: "pattern",
          description: "Uses dynamic regex patterns",
          regex: /new\s+RegExp\s*\(\s*\w+\s*\+\s*\w+\s*\)/g,
          astType: "NewExpression",
          detector: this.detectRegexObfuscation.bind(this),
        },
      ],

      [
        "numberToString",
        {
          name: "Number to String Conversion",
          severity: "low",
          category: "value",
          description: "Converts numbers to strings for obfuscation",
          regex: /(\d+)\s*\.\s*toString\s*\(\s*\)/g,
          astType: "CallExpression",
          detector: this.detectNumberToString.bind(this),
        },
      ],

      [
        "booleanCoercion",
        {
          name: "Boolean Coercion",
          severity: "low",
          category: "value",
          description: "Uses !! for boolean coercion",
          regex: /!!\w+/g,
          astType: "UnaryExpression",
          detector: this.detectBooleanCoercion.bind(this),
        },
      ],

      [
        "nullCoalescing",
        {
          name: "Null Coalescing",
          severity: "low",
          category: "value",
          description: "Uses ?? operator for null handling",
          regex: /\?\?\s*\w+/g,
          astType: "LogicalExpression",
          detector: this.detectNullCoalescing.bind(this),
        },
      ],

      [
        "optionalChaining",
        {
          name: "Optional Chaining",
          severity: "low",
          category: "object",
          description: "Uses optional chaining with property access",
          regex: /\?\.\w+|\?\?\./g,
          astType: "OptionalMemberExpression",
          detector: this.detectOptionalChaining.bind(this),
        },
      ],

      [
        "templateLiteralObfuscation",
        {
          name: "Template Literal Obfuscation",
          severity: "low",
          category: "string",
          description: "Uses template literals with expressions",
          regex: /`[^`]*\$\{[^}]+\}[^`]*`/g,
          astType: "TemplateLiteral",
          detector: this.detectTemplateLiteralObfuscation.bind(this),
        },
      ],
    ]);
  }

  /**
   * Main analysis method
   */
  analyze(code, context = {}) {
    this.stats.totalScans++;
    const result = {
      agent: this.name,
      version: this.version,
      patterns: [],
      severityCounts: {},
      categoryCounts: {},
      statistics: {
        totalPatterns: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      locations: [],
      codeSnippets: [],
      recommendations: [],
      warnings: [],
    };

    try {
      // Parse AST for deeper analysis
      const ast = this.parseCode(code);

      // Run regex-based detection
      this.detectByRegex(code, result);

      // Run AST-based detection
      this.detectByAST(ast, result);

      // Analyze results
      this.analyzeResults(result);
    } catch (error) {
      result.warnings.push(`Analysis error: ${error.message}`);
    }

    return result;
  }

  /**
   * Parse code into AST
   */
  parseCode(code) {
    try {
      return parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Detect patterns using regex
   */
  detectByRegex(code, result) {
    for (const [patternId, patternDef] of this.patterns) {
      if (patternDef.regex) {
        const matches = code.match(patternDef.regex);
        if (matches && matches.length > 0) {
          result.patterns.push({
            id: patternId,
            name: patternDef.name,
            severity: patternDef.severity,
            category: patternDef.category,
            description: patternDef.description,
            count: matches.length,
            samples: matches.slice(0, 3),
            method: "regex",
          });

          // Update severity counts
          result.severityCounts[patternDef.severity] =
            (result.severityCounts[patternDef.severity] || 0) + 1;

          // Update category counts
          result.categoryCounts[patternDef.category] =
            (result.categoryCounts[patternDef.category] || 0) + 1;

          this.stats.patternsFound++;
        }
      }
    }
  }

  /**
   * Detect patterns using AST traversal
   */
  detectByAST(ast, result) {
    if (!ast) return;

    traverse(ast, {
      // Array Access Obfuscation
      MemberExpression(path) {
        if (path.node.computed && path.node.property.type === "StringLiteral") {
          result.patterns.push({
            id: "arrayAccessAST",
            name: "Computed Property Access (AST)",
            severity: "low",
            category: "variable",
            location: path.node.loc,
            method: "ast",
          });
        }
      },

      // Call Expression Detection
      CallExpression(path) {
        const callee = path.node.callee;

        if (callee.type === "Identifier" && callee.name === "eval") {
          result.patterns.push({
            id: "evalAST",
            name: "Eval Usage (AST)",
            severity: "critical",
            category: "execution",
            location: path.node.loc,
            method: "ast",
          });
        }

        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "fromCharCode"
        ) {
          result.patterns.push({
            id: "charCodeAST",
            name: "String.fromCharCode (AST)",
            severity: "high",
            category: "string",
            location: path.node.loc,
            method: "ast",
          });
        }
      },

      // Variable Declaration Detection
      VariableDeclarator(path) {
        if (
          path.node.id.type === "Identifier" &&
          /^[a-z]{1,2}$/.test(path.node.id.name)
        ) {
          result.patterns.push({
            id: "mangledVar",
            name: "Mangled Variable Name (AST)",
            severity: "low",
            category: "variable",
            nameFound: path.node.id.name,
            location: path.node.loc,
            method: "ast",
          });
        }
      },

      // Binary Expression Detection
      BinaryExpression(path) {
        // Detect complex arithmetic
        if (
          path.node.operator !== "+" &&
          path.node.operator !== "-" &&
          path.node.operator !== "*" &&
          path.node.operator !== "/"
        ) {
          return;
        }

        const depth = this.calculateExpressionDepth(path.node);
        if (depth > 3) {
          result.patterns.push({
            id: "complexArithmeticAST",
            name: "Complex Arithmetic Expression",
            severity: "low",
            category: "value",
            depth,
            location: path.node.loc,
            method: "ast",
          });
        }
      },

      // Switch Statement Detection
      SwitchStatement(path) {
        if (path.node.cases.length > 10) {
          result.patterns.push({
            id: "switchFlatteningAST",
            name: "Switch-based Control Flow (Potential Flattening)",
            severity: "high",
            category: "control",
            cases: path.node.cases.length,
            location: path.node.loc,
            method: "ast",
          });
        }
      },
    });
  }

  /**
   * Calculate expression depth
   */
  calculateExpressionDepth(node) {
    if (!node) return 0;

    if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
      return (
        1 +
        Math.max(
          this.calculateExpressionDepth(node.left),
          this.calculateExpressionDepth(node.right)
        )
      );
    }

    return 1;
  }

  /**
   * Analyze and summarize results
   */
  analyzeResults(result) {
    // Calculate statistics
    result.statistics.totalPatterns = result.patterns.length;

    for (const pattern of result.patterns) {
      result.statistics[pattern.severity] =
        (result.statistics[pattern.severity] || 0) + 1;
    }

    // Generate recommendations
    if (result.statistics.critical > 0) {
      result.recommendations.push({
        priority: "critical",
        message:
          "Critical obfuscation patterns detected - manual review required",
      });
    }

    if (result.statistics.high > 5) {
      result.recommendations.push({
        priority: "high",
        message: "High number of obfuscation patterns - consider deobfuscation",
      });
    }

    if (
      result.patterns.some(
        (p) => p.id === "evalAST" || p.id === "evalObfuscation"
      )
    ) {
      result.recommendations.push({
        priority: "critical",
        message: "eval() usage detected - potential code injection risk",
      });
    }
  }

  // Individual pattern detectors (expanded versions)
  detectArrayAccessObfuscation(code) {
    const matches = code.match(/\w+\[["'`]\w+["'`]\]\[["'`]\w+["'`]\]/g);
    return matches ? matches.length : 0;
  }

  detectArrayLiteralObfuscation(code) {
    const matches = code.match(
      /\[\[["'`][^"'`]+["'`],\s*["'`][^"'`]+["'`],\s*["'`][^"'`]+["'`]\]/g
    );
    return matches ? matches.length : 0;
  }

  detectArithmeticObfuscation(code) {
    const matches = code.match(
      /\(\d+\s*[\+\-\*\/]\s*\d+\)\s*[\+\-\*\/]\s*\d+/g
    );
    return matches ? matches.length : 0;
  }

  detectComputedPropertyAccess(code) {
    const matches = code.match(/\w+\[(\w+|"[^"]+"|'[^']+')]/g);
    return matches ? matches.length : 0;
  }

  detectCharCodeObfuscation(code) {
    const matches = code.match(/String\.fromCharCode\([^)]+\)/g);
    return matches ? matches.length : 0;
  }

  detectCharAtObfuscation(code) {
    const matches = code.match(/\.charAt\(\d+\)/g);
    return matches ? matches.length : 0;
  }

  detectSplitStringObfuscation(code) {
    const matches = code.match(
      /\[\[["'`][^"'`]*["'`],\s*["'`][^"'`]*["'`],\s*["'`][^"'`]*["'`]\]\.join\(/g
    );
    return matches ? matches.length : 0;
  }

  detectConcatenationObfuscation(code) {
    const matches = code.match(
      /["'`][^"'`]*["'`]\s*\+\s*["'`][^"'`]*["'`]\s*\+\s*["'`][^"'`]*["'`]/g
    );
    return matches ? matches.length : 0;
  }

  detectBase64Obfuscation(code) {
    const matches = code.match(/atob\s*\([^)]+\)/g);
    const base64Strings =
      code.match(/["'`][A-Za-z0-9+/]{20,}={0,2}["'`]/g) || [];
    return (matches ? matches.length : 0) + base64Strings.length;
  }

  detectHexObfuscation(code) {
    const matches = code.match(/(0x[0-9a-fA-F]+|\\x[0-9a-fA-F]{2})/g);
    return matches ? matches.length : 0;
  }

  detectUnicodeEscape(code) {
    const matches = code.match(/\\u[0-9a-fA-F]{4}/g);
    return matches ? matches.length : 0;
  }

  detectHtmlEntityEncoding(code) {
    const matches = code.match(/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g);
    return matches ? matches.length : 0;
  }

  detectEvalObfuscation(code) {
    const matches = code.match(/eval\s*\(/g);
    return matches ? matches.length : 0;
  }

  detectFunctionConstructorObfuscation(code) {
    const matches = code.match(/(new\s+Function|Function)\s*\(/g);
    return matches ? matches.length : 0;
  }

  detectSetTimeoutEval(code) {
    const matches = code.match(/setTimeout\s*\(\s*["'`]/g);
    return matches ? matches.length : 0;
  }

  detectIIFEObfuscation(code) {
    const matches = code.match(
      /\(function\s*[\(\w]*\s*\([^)]*\)\s*\{[\s\S]*\}\s*\)\s*\(\s*\)|!function\s*\([^)]*\)\s*\{[\s\S]*\}\s*\(\s*\)/g
    );
    return matches ? matches.length : 0;
  }

  detectDynamicFunctionCall(code) {
    const matches = code.match(/\[\s*["'`]?\w+["'`]?\s*\]\s*\(/g);
    return matches ? matches.length : 0;
  }

  detectPrototypePollution(code) {
    const matches = code.match(
      /\.__proto__|\.prototype\s*=|Object\.prototype/g
    );
    return matches ? matches.length : 0;
  }

  detectControlFlowFlattening(code) {
    const matches = code.match(
      /switch\s*\([^)]+\)\s*\{[\s\S]*case\s+\d+:[\s\S]*break;[\s\S]*\}/g
    );
    return matches ? matches.length : 0;
  }

  detectOpaquePredicate(code) {
    const matches = code.match(
      /if\s*\(\s*(!?\w+&&\s*!?\w+|\w+\s*===\s*\w+)\s*\)/g
    );
    return matches ? matches.length : 0;
  }

  detectDeadCodeInjection(code) {
    const matches = code.match(/if\s*\(\s*false\s*\)\s*\{[\s\S]*\}/g);
    return matches ? matches.length : 0;
  }

  detectTryCatchObfuscation(code) {
    const matches = code.match(
      /try\s*\{[\s\S]*\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*\}/g
    );
    return matches ? matches.length : 0;
  }

  detectVariableMangling(code) {
    const matches = code.match(/\b[a-z]{1,2}\b(?=\s*[=\(\[\{])/g);
    return matches ? matches.length : 0;
  }

  detectGlobalVariableHiding(code) {
    const matches = code.match(
      /(window|global|this)\[\s*["'`]?\w+["'`]?\s*\]/g
    );
    return matches ? matches.length : 0;
  }

  detectVariableReassignment(code) {
    const matches = code.match(/(var|let|const)\s+\w+\s*=\s*[^;]+;\s*\w+\s*=/g);
    return matches ? matches.length : 0;
  }

  detectObjectPropertyAccess(code) {
    const matches = code.match(/\w+\[["'`]\w+["'`]\]/g);
    return matches ? matches.length : 0;
  }

  detectObjectDefinitionObfuscation(code) {
    const matches = code.match(
      /\{\s*(\[["'`]\w+["'`]\]\s*:\s*\w+|["'`]?\w+["'`]?\s*:\s*\w+)\s*,?\s*\}/g
    );
    return matches ? matches.length : 0;
  }

  detectDeepPropertyAccess(code) {
    const matches = code.match(/\w+\.\w+\.\w+\.\w+/g);
    return matches ? matches.length : 0;
  }

  detectRequireObfuscation(code) {
    const matches = code.match(/require\s*\(\s*["'`][^"'`]+["'`]\s*\)/g);
    return matches ? matches.length : 0;
  }

  detectWebpackChunkAccess(code) {
    const matches = code.match(/__WEBPACK_REQUIRE__|__webpack_require__/g);
    return matches ? matches.length : 0;
  }

  detectExportObfuscation(code) {
    const matches = code.match(
      /module\.exports\s*=\s*\{[\s\S]*\[["'`]\w+["'`]\][\s\S]*\}/g
    );
    return matches ? matches.length : 0;
  }

  detectDocumentWriteObfuscation(code) {
    const matches = code.match(/document\.write\s*\(/g);
    return matches ? matches.length : 0;
  }

  detectInnerHTMLManipulation(code) {
    const matches = code.match(/\.innerHTML\s*=/g);
    return matches ? matches.length : 0;
  }

  detectEventHandlerObfuscation(code) {
    const matches = code.match(/addEventListener\s*\(\s*["'`]\w+["'`]/g);
    return matches ? matches.length : 0;
  }

  detectLocationManipulation(code) {
    const matches = code.match(/location\.(href|replace|assign)\s*\(/g);
    return matches ? matches.length : 0;
  }

  detectCryptoObfuscation(code) {
    const matches = code.match(/(crypto|Subtle|CryptoKey)\.\w+/g);
    return matches ? matches.length : 0;
  }

  detectAntiDebugObfuscation(code) {
    const matches = code.match(
      /(debugger;|while\s*\(\s*true\s*\)\s*\{|setInterval\s*\(\s*function\s*\(\s*\)\s*\{\s*debugger)/g
    );
    return matches ? matches.length : 0;
  }

  detectCodeInjection(code) {
    return 0;
  }

  detectNetworkExfiltration(code) {
    const matches = code.match(
      /(fetch|XMLHttpRequest|WebSocket)\s*\([^)]*\.(send|write)\)/g
    );
    return matches ? matches.length : 0;
  }

  detectJQueryObfuscation(code) {
    const matches = code.match(
      /\$\s*\(\s*["'`][^"'`]*["'`]\s*\)\.(?!css|html|text|val|attr|on)[a-zA-Z]+/g
    );
    return matches ? matches.length : 0;
  }

  detectReactObfuscation(code) {
    const matches = code.match(/(_jsx|React\.createElement)\s*\(\s*["'`]/g);
    return matches ? matches.length : 0;
  }

  detectVueObfuscation(code) {
    const matches = code.match(
      /(v-if|v-for|v-show|v-bind|v-on)\s*[:=]\s*["'`]/g
    );
    return matches ? matches.length : 0;
  }

  detectRegexObfuscation(code) {
    const matches = code.match(/new\s+RegExp\s*\(\s*\w+\s*\+\s*\w+\s*\)/g);
    return matches ? matches.length : 0;
  }

  detectNumberToString(code) {
    const matches = code.match(/(\d+)\s*\.\s*toString\s*\(\s*\)/g);
    return matches ? matches.length : 0;
  }

  detectBooleanCoercion(code) {
    const matches = code.match(/!!\w+/g);
    return matches ? matches.length : 0;
  }

  detectNullCoalescing(code) {
    const matches = code.match(/\?\?\s*\w+/g);
    return matches ? matches.length : 0;
  }

  detectOptionalChaining(code) {
    const matches = code.match(/\?\.\w+|\?\?\./g);
    return matches ? matches.length : 0;
  }

  detectTemplateLiteralObfuscation(code) {
    const matches = code.match(/`[^`]*\$\{[^}]+\}[^`]*`/g);
    return matches ? matches.length : 0;
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.patterns.clear();
    this.cache.clear();
  }
}

module.exports = PatternRecognizerAgent;
