#!/usr/bin/env node
const fs = require("fs");
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const prettier = require("prettier");
const {
  applyPostProcessing,
  detectObfuscationType,
  stringDecryption,
  deadCodeElimination,
  webpackReconstructor,
  codeCleanup,
} = require("./post_processing");

// Lazily compute line count to avoid referencing undefined 'code' at module load
const getLineCount = (src) =>
  typeof src === "string" ? (src.match(/\n/g) || []).length : 0;
const VERY_LARGE_LINE_LIMIT = Number(process.env.LINE_LIMIT || 700_000);
// Set flags safely; recompute inside deobfuscateSnippet when code is known
let isVeryLargeByLines = false;

// Treat files > 2MB as large to avoid heavy transformations
const LARGE_FILE_THRESHOLD = Number(
  process.env.LARGE_FILE_THRESHOLD || 2_000_000
); // bytes (2MB default)

// Safe default; computed later with actual code
let isLarge = false;

// --- Import the enhanced modules ---
// Ensure these paths and exports match your actual files.
const {
  recognizePatterns,
  frameworkDetector,
  minifiedCodeHandler,
  controlFlowAnalyzer,
  constantFolder,
  stringArrayDetector,
  stringDecryptor,
  applyReactEventSystemRenaming,
  applyAdvancedReactRenaming,
  applyReactComponentRenaming,
  applyModuleContextRenaming,
  applyFrameworkRenaming,
  applyWebpackChunkRenaming,
  applyModuleIdCallAnnotation,
  annotateModuleFunctionParams,
} = require("./patterns");
const { suggestNames, suggestNamesV2 } = require("./renamer");
const {
  detectFunctionality,
  detectSecurityPatterns,
  detectReactSpecific,
  detectPerformancePatterns,
} = require("./detector");
const {
  analyzeBundleStructure,
  detectMinificationLevel,
  extractExports,
  extractImports,
} = require("./module_analyzer");

// --- Utility Functions (Defined first for use in deobfuscateSnippet) ---

// Helper function to sanitize string content
function sanitizeString(str) {
  // Normalize common corruptions first
  if (typeof str === "string") {
    // Don't replace Unicode replacement chars with "?" as they might be intentional
    // Instead, leave them as-is for proper handling later
    // str = str.replace(/\uFFFD/g, "?");
  }
  try {
    // Try parsing it as a JS string literal to see if it's valid
    JSON.parse(`"${str}"`);
    // If it parses, return as is (assuming it's okay)
    return str;
  } catch (e) {
    // If it fails, attempt a minimal cleanup of invalid escapes
    console.warn(
      `Warning: Attempting to sanitize potentially problematic string: ${str.substring(
        0,
        30
      )}...`
    );
    return str.replace(/\\([^'"\\bfnrtvux$&0-7])/g, "$1");
  }
}

// Improved preprocessCode function
function preprocessCode(code) {
  try {
    // Basic syntax error checks
    if (!code || typeof code !== "string") {
      console.warn("Warning: Input code is not a valid string.");
      return code || "";
    }

    // --- 1. Fix basic string issues ---
    // This is a simplified approach. Real string fixing is complex.
    // Split code into potential string parts and non-string parts.
    // This regex finds quoted strings (single or double) considering escapes.
    // It's not perfect but might help with some issues.
    // BE CAREFUL: This can break if regex itself is malformed or comments contain quotes.
    let fixedCode = code.replace(
      /(["'])(?:(?=(\\?))\2.)*?\1/g, // Matches quoted strings
      (match) => {
        try {
          // Try to evaluate the matched string as a JS string literal
          // This checks for syntax errors within the string itself.
          eval(match);
          // If it evaluates, it's likely fine.
          return match;
        } catch (evalError) {
          // If evaluation fails, the string likely has bad escapes.
          console.warn(
            `Found potentially problematic string literal: ${match.substring(
              0,
              30
            )}... Attempting fix.`
          );
          // Apply sanitization
          // Remove the outer quotes for processing
          const quoteType = match[0];
          const innerContent = match.slice(1, -1);
          const sanitizedContent = sanitizeString(innerContent);
          return `${quoteType}${sanitizedContent}${quoteType}`;
        }
      }
    );
    code = fixedCode;

    // --- 2. Fix common structural issues (BE VERY CAREFUL WITH THESE) ---
    // These are attempts based on common minification artifacts.
    // Aggressive regex can easily break valid JS.

    // Example: Fix missing commas between object properties in specific, identifiable contexts
    // This is EXTREMELY RISKY and commented out by default.
    // code = code.replace(/}\s*([a-zA-Z_$][\w$]*)\s*:/g, "}, $1:"); // Might fix `}prop:` -> `}, prop:`

    // Example: Fix trailing commas before } or ] (JS usually handles this, but malformed code might not)
    // This one is generally safer.
    // code = code.replace(/,\s*([}\]])/g, "$1");

    // --- Commenting out the most problematic regex fixes from your previous version ---
    // The following regex patterns from your Pasted_Text were highly likely to corrupt the code:
    // 1. `code.replace(/({[^}]*){([^}]*})/g, "$1,$2")` - This tries to fix nested objects but is extremely likely
    //    to match braces incorrectly and insert commas in the wrong places, breaking syntax.
    // 2. `code.replace(/},\s*(\w+)\s*:\s*function/g, "},$1: function")` - This also has a high risk of
    //    incorrect matching and modification.
    // 3. `code.replace(/(\d+):\s*\(e,\s*t,\s*n\)\s*=>/g, "module$1: function(e, t, n)")` - While this one targets
    //    a specific Webpack pattern, regex is not ideal for such structural changes on minified code.
    //
    // It's better to rely on the Babel parser's error recovery or more targeted fixes.
    // If you know specific, exact patterns that are broken, target them *very* precisely.

    // --- Safer Structural Fixes ---
    // Clean up sourcemap comments (this one is generally safe)
    code = code.replace(/\/\/#\s*sourceMappingURL=.*$/gm, "");

    // --- 3. Validation Pass ---
    // Try parsing the preprocessed code to see if our fixes helped.
    try {
      // Use a tolerant parser configuration
      parse(code, {
        sourceType: "unambiguous", // More flexible than "module"
        plugins: [
          "jsx",
          "typescript",
          "classProperties",
          "decorators-legacy",
          "objectRestSpread",
          "dynamicImport",
        ],
        allowReturnOutsideFunction: true,
        allowUndeclaredExports: true,
        allowAwaitOutsideFunction: true,
        // errorRecovery: true, // Enable if your Babel version supports it
        // locations: true,
        // ranges: true,
      });
      console.log(
        "DEBUG (preprocessCode): Code parsed successfully after preprocessing."
      );
    } catch (parseError) {
      console.warn(
        "Warning (preprocessCode): Code still fails to parse after preprocessing:",
        parseError.message
      );
      // DO NOT apply aggressive regex fixes here automatically.
      // They are more likely to break things further.
      // Log the error and proceed, hoping the Babel parser's built-in recovery helps.
    }

    return code;
  } catch (error) {
    console.error("Error in preprocessCode:", error);
    // Even if preprocessing fails, return the original code to attempt parsing
    return code;
  }
}

// Add these debug helpers (from your Pasted_Text)
function debugStringIssues(code) {
  // This is a simplified check. Real-world JS string parsing is complex.
  // This might give false positives/negatives.
  // Split by actual newlines, not characters.
  const lines = code.split("\n");
  const issues = [];
  lines.forEach((line, index) => {
    let singleQuotes = 0;
    let doubleQuotes = 0;
    let lastQuote = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      // Check for unescaped quotes
      if (char === '"' && line[i - 1] !== "\\") {
        doubleQuotes++;
        lastQuote = '"';
      } else if (char === "'" && line[i - 1] !== "\\") {
        singleQuotes++;
        lastQuote = "'";
      }
    }
    // Simple check: odd number of quotes usually means unclosed string
    // This is not foolproof (e.g., `var s = "'";` is valid)
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      issues.push({
        line: index + 1,
        content: line.trim(), // Trim for cleaner output
        // quote: lastQuote, // Not always accurate with mixed quotes
        message: "Potential unclosed string or odd number of quotes",
      });
    }
  });
  return issues;
}

// ROT13 decoding function for apostrophe-based obfuscation
function rot13Decode(str) {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code >= 97 ? 97 : 65; // lowercase or uppercase
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// --- Main Deobfuscation Function ---

function deobfuscateSnippet(code) {
  try {
    console.log("DEBUG: Starting deobfuscation process...");

    // Initialize allRenames early to avoid reference errors
    let allRenames = [];

    // --- Debug string issues before processing ---
    const stringIssues = debugStringIssues(code);
    if (stringIssues.length > 0) {
      console.warn(
        `Warning: Found ${stringIssues.length} potential string issues in input code`
      );
    }

    // --- Apply preprocessing ---
    console.log("DEBUG: Applying preprocessing...");
    code = preprocessCode(code);
    console.log("DEBUG: Preprocessing complete. Code length:", code.length);

    // --- ADD THIS NEW VALIDATION STEP ---
    console.log(
      "DEBUG: Performing final validation parse before main parse..."
    );
    try {
      // Use the exact same options as the main parse step
      parse(code, {
        sourceType: "unambiguous",
        plugins: [
          "jsx",
          "typescript",
          "classProperties",
          "decorators-legacy",
          "objectRestSpread",
          "dynamicImport",
        ],
        allowReturnOutsideFunction: true,
        allowUndeclaredExports: true,
        allowAwaitOutsideFunction: true,
        // Do NOT use errorRecovery here for this validation
      });
      console.log("DEBUG: Final validation parse successful.");
    } catch (validationError) {
      console.error(
        "DEBUG: Final validation parse FAILED. This code will not parse:"
      );
      console.error("DEBUG: Error:", validationError.message);
      // Optionally, dump a snippet of the problematic code around the error location
      const errorPos = validationError.pos || 0;
      const startSnippet = Math.max(0, errorPos - 100);
      const endSnippet = Math.min(code.length, errorPos + 100);
      console.error("DEBUG: Code snippet around error (pos " + errorPos + "):");
      console.error("--- START SNIPPET ---");
      console.error(code.substring(startSnippet, endSnippet));
      console.error("--- END SNIPPET ---");
      // Re-throw or handle appropriately
      throw new Error(
        `Code failed final validation parse: ${validationError.message}`
      );
    }
    // --- END ADDITION ---// --- 1. Detect frameworks first ---
    console.log("DEBUG: Detecting frameworks...");
    const detectedFrameworks = frameworkDetector.detectFramework(code);

    // Check for additional frameworks with more specific patterns
    if (
      code.includes("React.createElement") ||
      code.includes("useState") ||
      code.includes("useEffect") ||
      /render\(\)\s*\{\s*return\s/.test(code) ||
      /_jsx\(|_jsxs\(/.test(code)
    ) {
      if (!detectedFrameworks.includes("react")) {
        detectedFrameworks.push("react");
      }
    }

    // Check for Angular-specific patterns
    if (
      code.includes("@Component") ||
      code.includes("ngOnInit") ||
      code.includes("@Injectable") ||
      code.includes("NgModule") ||
      /template:\s*[`'"]\s*</.test(code)
    ) {
      if (!detectedFrameworks.includes("angular")) {
        detectedFrameworks.push("angular");
      }
    }

    // Check for Vue-specific patterns
    if (
      code.includes("Vue.component") ||
      code.includes("new Vue") ||
      code.includes("createApp") ||
      /data\(\)\s*\{\s*return\s*\{/.test(code) ||
      /methods:\s*\{/.test(code)
    ) {
      if (!detectedFrameworks.includes("vue")) {
        detectedFrameworks.push("vue");
      }
    }
    console.log(
      `DEBUG: Detected frameworks: ${detectedFrameworks.join(", ") || "None"}`
    );

    // --- 2. Handle minification before parsing ---
    console.log("DEBUG: Handling minification...");
    let processedCode = code;
    const isLarge = code.length > LARGE_FILE_THRESHOLD;
    if (isLarge) {
      console.log("DEBUG: Large file detected - skipping beautify/decompress");
    } else {
      processedCode = minifiedCodeHandler.beautifyCode(code);
      processedCode = minifiedCodeHandler.decompressCode(processedCode);
      console.log(
        `DEBUG: Code processed - original: ${code.length}, processed: ${processedCode.length}`
      );
    }

    // --- 3. Parse the beautified/decompressed code ---
    console.log("DEBUG: Parsing processed code...");
    let ast;
    try {
      ast = parse(processedCode, {
        sourceType: "unambiguous",
        plugins: [
          "jsx",
          "typescript",
          "classProperties",
          "decorators-legacy",
          "objectRestSpread",
          "dynamicImport",
        ],
        allowReturnOutsideFunction: true,
        allowUndeclaredExports: true,
        allowAwaitOutsideFunction: true,
        tokens: true,
        locations: true,
        ranges: true,
      });
      console.log("DEBUG: Parsing successful");
    } catch (mainParseErr) {
      console.warn("DEBUG: Main parse failed, trying fallback...");
      // Fallback: try to parse the original preprocessed code (before beautify/decompress)
      ast = parse(code, {
        sourceType: "unambiguous",
        plugins: [
          "jsx",
          "typescript",
          "classProperties",
          "decorators-legacy",
          "objectRestSpread",
          "dynamicImport",
        ],
        allowReturnOutsideFunction: true,
        allowUndeclaredExports: true,
        allowAwaitOutsideFunction: true,
        tokens: true,
        locations: true,
        ranges: true,
      });
      console.log("DEBUG: Fallback parsing successful");
    }

    // --- 4. Constant Folding ---
    if (!isLarge) {
      console.log("DEBUG: Applying constant folding...");
      let folded = true;
      let iterations = 0;
      while (folded && iterations < 5) {
        folded = constantFolder.foldConstants(ast);
        iterations++;
      }
      if (iterations > 1) {
        console.log(
          `DEBUG: Constant folding completed in ${iterations} iterations`
        );
      }
    }

    // --- 5. String Array Detection ---
    if (!isLarge) {
      console.log("DEBUG: Detecting string arrays...");
      const stringArrays = stringArrayDetector.findArrays(ast);
      const stringFuncs = stringArrayDetector.findStringFunctions(ast);
      if (stringArrays.length > 0) {
        console.log(`DEBUG: Found ${stringArrays.length} string arrays`);
      }
      if (stringFuncs.length > 0) {
        console.log(
          `DEBUG: Found ${stringFuncs.length} string decryption functions`
        );
      }
    }

    // --- 7. Analyze control flow ---
    console.log("DEBUG: Analyzing control flow...");
    const branches = controlFlowAnalyzer.analyzeBranches(ast);
    const flow = controlFlowAnalyzer.reconstructControlFlow(ast);
    console.log(
      "DEBUG: Control flow analysis complete. Branches found:",
      branches.length
    );

    // --- 8. Decrypt strings ---
    console.log("DEBUG: Decrypting strings...");
    let stringsDecrypted = 0;
    traverse(ast, {
      StringLiteral(path) {
        try {
          const originalValue = path.node.value;
          const originalRaw = path.node.extra?.raw || `"${originalValue}"`; // Get raw representation if available
          const decrypted = stringDecryptor.decodeString(originalValue);
          if (
            decrypted !== null &&
            decrypted !== undefined &&
            decrypted !== originalValue
          ) {
            // Reduced verbosity - only log when decryption actually changes something significant
            if (decrypted !== originalValue && decrypted.length > 10) {
              console.log(
                `DEBUG (String Decryption): Line ${
                  path.node.loc?.start?.line || "?"
                } - ${originalValue.substring(
                  0,
                  30
                )}... → ${decrypted.substring(0, 30)}...`
              );
            }
            // --- Add a check here ---
            // A very basic check: does the decrypted string contain unbalanced quotes?
            // This is not foolproof but might catch obvious issues.
            // Only warn if the original had quotes (indicating it was a string literal)
            if (originalRaw.startsWith('"') || originalRaw.startsWith("'")) {
              const singleQuotes = (decrypted.match(/'/g) || []).length;
              const doubleQuotes = (decrypted.match(/"/g) || []).length;
              const backticks = (decrypted.match(/`/g) || []).length;
              if (
                singleQuotes % 2 !== 0 ||
                doubleQuotes % 2 !== 0 ||
                backticks % 2 !== 0
              ) {
                console.warn(
                  `  WARNING: Decrypted string might have unbalanced quotes!`
                );
              }
            }
            // --- End check ---
            path.node.value = decrypted;
            stringsDecrypted++;
          }
        } catch (decryptionError) {
          console.warn(
            `Warning: Failed to decrypt string at line ${
              path.node.loc?.start?.line || "unknown"
            }:`,
            decryptionError.message
          );
        }
      },
      // Add NumericLiteral, TemplateLiteral if your decryptor handles them
    });
    console.log(
      `DEBUG: String decryption completed - ${stringsDecrypted} strings processed`
    );
    // Regenerate code after string decryption for subsequent steps
    processedCode = generate(ast).code;

    // --- 9. Recognize patterns ---
    console.log("DEBUG: Recognizing patterns...");
    const patterns = recognizePatterns(ast, processedCode);
    console.log("DEBUG: Patterns recognized:", patterns.length);

    // --- 10. Detect functionality ---
    console.log("DEBUG: Detecting functionality...");
    const functionality = detectFunctionality(ast);
    console.log("DEBUG: Functionality detected:", functionality.length);

    // --- 11. Suggest meaningful names ---
    console.log("DEBUG: Suggesting names...");
    const nameSuggestions = suggestNames(ast, patterns);
    console.log("DEBUG: Name suggestions made:", nameSuggestions.size);

    // --- 12. Apply the general renaming ---
    console.log("DEBUG: Applying general renaming...");
    const renamedAst = applyRenaming(ast, nameSuggestions);
    console.log("DEBUG: General renaming applied.");

    // --- 13. Generate intermediate code ---
    console.log("DEBUG: Generating intermediate code...");
    let result = generate(renamedAst).code;
    console.log("DEBUG: Intermediate code generated, length:", result.length);

    // --- 14. Apply framework-specific transformations ---
    console.log("DEBUG: Applying framework-specific rules...");
    result = frameworkDetector.applyFrameworkSpecificRules(
      result,
      detectedFrameworks
    );

    // --- 11b. Annotate Webpack chunk/module IDs for readability (non-breaking) ---
    const chunkAnno = applyWebpackChunkRenaming(result);
    result = chunkAnno.code;
    allRenames = [
      ...allRenames,
      ...(chunkAnno.renames || []).map((r) => `${r} (chunk annotate)`),
    ];

    // --- 11c. Annotate numeric module resolver calls e.g., removeElement(66208) ---
    const callAnno = applyModuleIdCallAnnotation(result);
    result = callAnno.code;
    allRenames = [
      ...allRenames,
      ...(callAnno.renames || []).map((r) => `${r} (module id annotate)`),
    ];

    // --- 11d. Annotate module function params (module, exports, require) ---
    const paramAnno = annotateModuleFunctionParams(result);
    result = paramAnno.code;
    allRenames = [
      ...allRenames,
      ...(paramAnno.renames || []).map((r) => `${r} (param annotate)`),
    ];
    console.log("DEBUG: Framework and module annotations completed");

    // --- 12. Apply specific renaming passes ---
    console.log("DEBUG: Applying renaming passes...");
    const frameworkRenameResult = applyFrameworkRenaming(result, {
      patterns,
      detectedFrameworks,
    });
    result = frameworkRenameResult.code;
    allRenames = [...allRenames, ...(frameworkRenameResult.renames || [])];
    const reactEventResult = applyReactEventSystemRenaming(result, {
      patterns,
    });
    result = reactEventResult.code;
    allRenames = [...allRenames, ...(reactEventResult.renames || [])];
    const advancedReactResult = applyAdvancedReactRenaming(result, {
      patterns,
    });
    result = advancedReactResult.code;
    allRenames = [...allRenames, ...(advancedReactResult.renames || [])];
    const reactComponentResult = applyReactComponentRenaming(result, {
      patterns,
    });
    result = reactComponentResult.code;
    allRenames = [...allRenames, ...(reactComponentResult.renames || [])];
    const webpackResult = applyModuleContextRenaming(result, { patterns });
    result = webpackResult.code;
    allRenames = [...allRenames, ...(webpackResult.renames || [])];
    console.log("DEBUG: Webpack module renaming applied.");
    // --- 16. Apply post-processing for known patterns ---
    console.log("DEBUG: Applying post-processing for known patterns...");

    // Detect obfuscation type for specialized handling
    const obfuscationType = detectObfuscationType(result);
    console.log(`DEBUG: Detected obfuscation type: ${obfuscationType}`);

    // Fix common unicode escape issues
    result = result.replace(/\\\\u([0-9a-fA-F]{4})/g, "\\u$1");

    // Simplify unnecessarily complex arithmetic (common in obfuscated code)
    result = result.replace(/\b(\d+)\s*\+\s*(\d+)\b/g, (match, a, b) => {
      return (parseInt(a) + parseInt(b)).toString();
    });

    // Improve readability of complex nested function calls
    result = result.replace(/\}\)\(\)\;\}\)\(\)/g, "})();\n})()");

    // Add newlines after statement endings for better readability
    result = result.replace(/;\s*(?=[a-zA-Z_$])/g, ";\n");

    // Add comments for suspicious eval patterns
    result = result.replace(
      /eval\s*\(/g,
      "eval /* CAUTION: Dynamic code execution */ ("
    ); // Apply our enhanced post-processing functions from post_processing.js
    result = applyPostProcessing(result);

    // Replace Unicode replacement characters with appropriate values
    // Handle common obfuscation patterns with Unicode replacement characters
    const unicodeReplacements = {
      // Single character replacements
      "\uFFFD": '"unknown"',

      // Common 2-character patterns
      "\uFFFD\uFFFD": '"center"',

      // Common 3-character patterns
      "\uFFFD\uFFFD\uFFFD": '"left"',

      // Specific patterns that appear in the obfuscated code
      "\uFFFDw\uFFFD": '"function"',
      "\uFFFD\uFFFD\u0736": "typeof",
      "\uFFFD+\uFFFD": '""',
      "\uFFFD\u0725": '"style"',
      "\uFFFD*^": '"type"',
      "\uFFFD\u00A1\uFFFD": '"top"',
      "\uFFFD\uFFFD\u00A2": '"bottom"',
      "\u00A3\uFFFD\uFFFD": '"start"',
      "\uFFFD\uFFFD\uFFFD\u00A4": '"end"',
      "\u00A5\uFFFD\uFFFD": '"baseline"',
      "\uFFFD\uFFFD\u00A6\uFFFD": '"stretch"',
      "\u00A7\uFFFD\uFFFD": '"space-between"',
      "\uFFFD\uFFFD\uFFFD\u00A8": '"space-around"',
      "\u00A9\uFFFD\uFFFD": '"space-evenly"',
      "\uFFFD\uFFFD\u00AA\uFFFD": '"wrap"',
      "\u00AB\uFFFD\uFFFD": '"nowrap"',
      "\uFFFD\uFFFD\uFFFD\u00AC": '"reverse"',
      "\u00AD\uFFFD\uFFFD": '"column"',
      "\uFFFD\uFFFD\u00AE\uFFFD": '"row"',
      "\u00AF\uFFFD\uFFFD": '"solid"',
      "\uFFFD\uFFFD\uFFFD\u00B0": '"dashed"',
      "\u00B1\uFFFD\uFFFD": '"dotted"',
      "\uFFFD\uFFFD\u00B2\uFFFD": '"double"',
      "\u00B3\uFFFD\uFFFD": '"groove"',
      "\uFFFD\uFFFD\uFFFD\u00B4": '"ridge"',
      "\u00B5\uFFFD\uFFFD": '"inset"',
      "\uFFFD\uFFFD\u00B6\uFFFD": '"outset"',
      "\u00B7\uFFFD\uFFFD": '"none"',
      "\uFFFD\uFFFD\uFFFD\u00B8": '"inherit"',
      "\u00B9\uFFFD\uFFFD": '"initial"',
      "\uFFFD\uFFFD\u00BA\uFFFD": '"unset"',
      "\u00BB\uFFFD\uFFFD": '"revert"',
      "\uFFFD\uFFFD\uFFFD\u00BC": '"contain"',
      "\u00BD\uFFFD\uFFFD": '"cover"',
      "\uFFFD\uFFFD\u00BE\uFFFD": '"fill"',
      "\u00BF\uFFFD\uFFFD": '"scale-down"',
      "\uFFFD\uFFFD\uFFFD\u00C0": '"repeat"',
      "\u00C1\uFFFD\uFFFD": '"no-repeat"',
      "\uFFFD\uFFFD\u00C2\uFFFD": '"repeat-x"',
      "\u00C3\uFFFD\uFFFD": '"repeat-y"',
      "\uFFFD\uFFFD\uFFFD\u00C4": '"space"',
      "\u00C5\uFFFD\uFFFD": '"round"',
      "\uFFFD\uFFFD\u00C6\uFFFD": '"local"',
      "\u00C7\uFFFD\uFFFD": '"scroll"',
      "\uFFFD\uFFFD\uFFFD\u00C8": '"fixed"',
      "\uFFFDb\uFFFD": '"auto"',

      // Colors
      "u\uFFFD\uFFFD": '"red"',
      "\uFFFDx\uFFFD": '"blue"',
      "y\uFFFD\uFFFD": '"yellow"',
      "v\uFFFD\uFFFD": '"purple"',
      "t\uFFFD\uFFFD": '"black"',
      "r\uFFFD\uFFFD": '"transparent"',
      "\uFFFD\uFFFD\uFFFDj\uFFFD": '"primary"',
      "n\uFFFDm\uFFFD": '"right"',
      "\uFFFD\uFFFD\uFFFDz": '"green"',
      "\uFFFD\uFFFDw\uFFFD": '"orange"',
      "\uFFFD\uFFFD\uFFFDq": '"gray"',
      "\uFFFD\uFFFD\uFFFDs": '"white"',

      // Layout and display
      "\uFFFD\uFFFD\uFFFDn": '"inline"',
      "\uFFFD\uFFFDl\uFFFD": '"flex"',
      "\uFFFDp\uFFFD": '"block"',
      "k\uFFFD\uFFFD": '"grid"',
      "g\uFFFD\uFFFD": '"relative"',
      "e\uFFFD\uFFFD": '"sticky"',
      "c\uFFFD\uFFFD": '"hidden"',
      "\uFFFD\uFFFD\uFFFDh": '"absolute"',
      "\uFFFD\uFFFDf\uFFFD": '"fixed"',
      "\uFFFD\uFFFD\uFFFDd": '"static"',
      "\uFFFD\uFFFDa\uFFFD": '"visible"',

      // Sizes
      "\uFFFD1\uFFFD": '"small"',
      "\uFFFD\uFFFD2\uFFFD": '"medium"',
      "3\uFFFD\uFFFD": '"large"',
      "\uFFFD\uFFFD\uFFFD4": '"extra-large"',
      "5\uFFFD\uFFFD": '"xs"',
      "\uFFFD\uFFFD6\uFFFD": '"sm"',
      "7\uFFFD\uFFFD": '"md"',
      "\uFFFD\uFFFD\uFFFD8": '"lg"',
      "9\uFFFD\uFFFD": '"xl"',
      "\uFFFD\uFFFD0\uFFFD": '"2xl"',

      // Special patterns for apostrophe-based obfuscation
      // These patterns use ROT13-like transformations
      "\uFFFD\uFFFD\uFFFD": '"left"', // fallback for 3-char patterns
      "\uFFFD\uFFFD": '"center"', // fallback for 2-char patterns
    };

    // Sort by length descending to handle longer patterns first
    const sortedReplacements = Object.entries(unicodeReplacements).sort(
      (a, b) => b[0].length - a[0].length
    );

    // Apply replacements
    for (const [pattern, replacement] of sortedReplacements) {
      // Use a more robust replacement that handles the pattern as literal text
      const regex = new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      result = result.replace(regex, replacement);
    }

    // Handle apostrophe-based obfuscation patterns (like "JCQ'dhiartnhi='Dfus")
    result = result.replace(
      /'([a-zA-Z]+)'([a-zA-Z]+)'([a-zA-Z]+)'/g,
      (match, p1, p2, p3) => {
        try {
          // Try ROT13 decoding on the obfuscated parts
          const decoded1 = rot13Decode(p1);
          const decoded2 = rot13Decode(p2);
          const decoded3 = rot13Decode(p3);
          return `"${decoded1}${decoded2}${decoded3}"`;
        } catch (e) {
          return match; // Return original if decoding fails
        }
      }
    );

    // Handle simpler apostrophe patterns
    result = result.replace(/([a-zA-Z]+)'([a-zA-Z]+)/g, (match, p1, p2) => {
      try {
        const decoded1 = rot13Decode(p1);
        const decoded2 = rot13Decode(p2);
        return `"${decoded1}${decoded2}"`;
      } catch (e) {
        return match;
      }
    });

    /*
    // Apply React-specific string decoding for any remaining obfuscated strings
    result = result.replace(/"([a-z]+[\^_\/][a-z]+)"/g, (match, p1) => {
      return `"${decodeReactObfuscatedStrings(p1)}"`;
    });
    */

    console.log("DEBUG: Post-processing complete.");

    // --- 17. Format the final code ---
    console.log("DEBUG: Formatting final code...");
    result = formatCode(result);
    console.log("DEBUG: Final code formatted.");

    // --- Compile final renames ---
    console.log("DEBUG: Compiling rename list...");
    const generalRenames = Array.from(nameSuggestions.entries()).map(
      ([oldName, newName]) => `${oldName} → ${newName} (General)`
    );
    allRenames = [...generalRenames, ...allRenames];
    console.log(
      "DEBUG: Rename list compiled. Total renames:",
      allRenames.length
    );

    console.log("DEBUG: Deobfuscation process completed successfully.");
    return {
      code: result,
      patterns,
      functionality,
      branches,
      flow,
      detectedFrameworks,
      allRenames: allRenames,
      nameSuggestions: Array.from(nameSuggestions.entries()),
      reactEventRenames: reactEventResult.renames,
      reactComponentRenames: reactComponentResult.renames,
      webpackRenames: webpackResult.renames,
      frameworkRenames: frameworkRenameResult.renames,
    };
  } catch (error) {
    console.error("Deobfuscation failed in main process:", error);
    return {
      code: code, // Return original code on error
      error: `Deobfuscation failed: ${error.message}`,
      stack: error.stack,
      patterns: [],
      functionality: [],
      branches: [],
      flow: [],
      detectedFrameworks: [],
      allRenames: [],
      nameSuggestions: [],
    };
  }
}

// This function applies the general renaming suggestions from renamer.js to the AST
function applyRenaming(ast, nameSuggestions) {
  traverse(ast, {
    Identifier(path) {
      if (nameSuggestions.has(path.node.name)) {
        path.node.name = nameSuggestions.get(path.node.name);
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.id &&
        path.node.id.type === "Identifier" &&
        nameSuggestions.has(path.node.id.name)
      ) {
        // Fix the typo from previous versions
        path.node.id.name = nameSuggestions.get(path.node.id.name);
      }
    },
    FunctionDeclaration(path) {
      if (
        path.node.id &&
        path.node.id.type === "Identifier" &&
        nameSuggestions.has(path.node.id.name)
      ) {
        path.node.id.name = nameSuggestions.get(path.node.id.name);
      }
    },
    // Add logic for ArrayPattern, ObjectProperty keys, etc., if needed
  });
  return ast;
}

function formatCode(code) {
  try {
    // Skip heavy formatting for very large outputs to reduce memory/CPU spikes
    if (code && code.length > 2_000_000) {
      console.warn(
        "DEBUG: Skipping Prettier for very large output (size > 2MB)."
      );
      return code;
    }
    return prettier.format(code, {
      parser: "babel", // Use 'typescript' if needed
      singleQuote: true,
      trailingComma: "es5",
      tabWidth: 2,
      semi: true,
    });
  } catch (formatError) {
    console.error("Prettier formatting failed:", formatError.message);
    // Return original code if formatting fails
    return code;
  }
}

// --- CLI Interface ---
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: node index.js <snippet.js> [output.js]");
    console.log('Or pipe content: echo "obfuscated code" | node index.js -');
    process.exit(1);
  }

  let code;
  let inputFile = "stdin";
  let outputFile = null;

  if (args[0] === "-") {
    // Read from stdin
    code = fs.readFileSync(0, "utf-8");
  } else {
    // Read from file
    inputFile = args[0];
    outputFile = args[1] || inputFile.replace(/\.js$/, ".deobfuscated.js");
    code = fs.readFileSync(inputFile, "utf-8");
  }

  console.log(`Processing file: ${inputFile}\n`);

  const result = deobfuscateSnippet(code);

  // --- Output Results ---
  if (outputFile) {
    try {
      fs.writeFileSync(outputFile, result.code, "utf8");
      console.log(`\n✅ Deobfuscated code saved to: ${outputFile}`);
    } catch (writeError) {
      console.error(
        `\n❌ Failed to write output file ${outputFile}:`,
        writeError.message
      );
      // Fallback to console output
      console.log("\n=== DEOBFUSCATED CODE (Fallback Output) ===\n");
      console.log(result.code);
    }
  } else {
    console.log("\n=== DEOBFUSCATED CODE ===\n");
    console.log(result.code);
  }

  // Print Analysis (only if successful and has data)
  if (!result.error) {
    if (result.patterns && result.patterns.length > 0) {
      console.log("\n=== DETECTED PATTERNS ===");
      result.patterns.forEach((pattern) => {
        console.log(`• ${pattern.name}: ${pattern.description}`);
      });
    }

    // Modify the functionality display section
    console.log("=== FUNCTIONALITY DETECTED ===");
    console.log("-----------------------------");
    if (result.functionality && result.functionality.length > 0) {
      const groupedFunctions = result.functionality.reduce((acc, func) => {
        // Clean up the code snippet - remove extra whitespace and limit length
        const cleanCode = func.codeSnippet
          ?.replace(/\s+/g, " ")
          .trim()
          .substring(0, 100); // Limit snippet length

        // Format the output
        const formattedFunc = {
          ...func,
          codeSnippet: cleanCode,
          description: func.description || "No description available",
        };

        // Only add if we have valid code and location
        if (formattedFunc.codeSnippet && formattedFunc.location) {
          acc.push(formattedFunc);
        }

        return acc;
      }, []);

      // Sort by line number for better readability
      groupedFunctions.sort(
        (a, b) => (a.location?.startLine || 0) - (b.location?.startLine || 0)
      );

      // Display the cleaned up results
      groupedFunctions.forEach((func) => {
        console.log(`\n• ${func.type}`);
        console.log(`  Description: ${func.description}`);
        console.log(`  Location: Line ${func.location.startLine}`);
        if (func.codeSnippet) {
          console.log(
            `  Code: ${func.codeSnippet}${
              func.codeSnippet.length >= 100 ? "..." : ""
            }`
          );
        }
      });
    } else {
      console.log("No functionality detected");
    }
    console.log("\n-----------------------------");

    if (result.branches && result.branches.length > 0) {
      console.log("\n=== CONTROL FLOW BRANCHES ===");
      const maxBranchesToShow = 20;
      const branchesToShow = result.branches.slice(0, maxBranchesToShow);
      branchesToShow.forEach((branch, index) => {
        console.log(
          `• Branch ${index + 1}: ${branch.type} at Line ${
            branch.location?.start?.line || "N/A"
          }`
        );
      });
      if (result.branches.length > maxBranchesToShow) {
        console.log(
          `... and ${result.branches.length - maxBranchesToShow} more.`
        );
      }
    }

    if (result.flow) {
      console.log("\n=== RECONSTRUCTED CONTROL FLOW ===");
      console.log("(Details captured in result.flow)");
    }

    if (result.detectedFrameworks && result.detectedFrameworks.length > 0) {
      console.log("\n=== DETECTED FRAMEWORKS ===");
      result.detectedFrameworks.forEach((framework) => {
        console.log(`• ${framework}`);
      });
    }

    if (result.allRenames && result.allRenames.length > 0) {
      console.log("\n=== ALL NAME CHANGES ===");
      const maxRenamesToShow = 100;
      const renamesToShow = result.allRenames.slice(0, maxRenamesToShow);
      renamesToShow.forEach((rename) => {
        console.log(`• ${rename}`);
      });
      if (result.allRenames.length > maxRenamesToShow) {
        console.log(
          `... and ${result.allRenames.length - maxRenamesToShow} more.`
        );
      }
    } else if (result.nameSuggestions && result.nameSuggestions.length > 0) {
      console.log("\n=== NAME CHANGES (General) ===");
      result.nameSuggestions.forEach(([oldName, newName]) => {
        console.log(`• ${oldName} → ${newName}`);
      });
    }
  }

  // Print Error if any
  if (result.error) {
    console.log("\n=== ERROR ===");
    console.log(result.error);
    if (result.stack) {
      console.log("\n--- Stack Trace ---");
      console.log(result.stack);
    }
  }
}

module.exports = { deobfuscateSnippet };
