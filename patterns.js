// patterns.js
const { default: traverse } = require("@babel/traverse");
const generate = require("@babel/generator").default;
const { parse } = require("@babel/parser");
const crypto = require("crypto");

// Add this function before the controlFlowAnalyzer definition
function calculateComplexity(path) {
  let complexity = 1; // Base complexity

  try {
    // Count nested conditions
    path.traverse({
      IfStatement(p) {
        complexity++;
        // Add complexity for else-if chains
        if (p.node.alternate && p.node.alternate.type === "IfStatement") {
          complexity++;
        }
      },
      LogicalExpression(p) {
        complexity++; // && and || add complexity
      },
      ConditionalExpression(p) {
        complexity++; // Ternary operators add complexity
      },
      SwitchCase(p) {
        complexity++; // Each case adds complexity
      },
      // Loop constructs add complexity
      WhileStatement(p) {
        complexity++;
      },
      ForStatement(p) {
        complexity++;
      },
      ForInStatement(p) {
        complexity++;
      },
      ForOfStatement(p) {
        complexity++;
      },
      DoWhileStatement(p) {
        complexity++;
      },
    });

    // Add complexity for multiple return statements
    let returns = 0;
    path.traverse({
      ReturnStatement() {
        returns++;
      },
    });
    if (returns > 1) complexity += returns - 1;

    return complexity;
  } catch (error) {
    console.error("Error calculating complexity:", error);
    return 1; // Return base complexity on error
  }
}

// Add this function before the controlFlowAnalyzer definition
function detectJumps(path) {
  const jumps = [];

  try {
    path.traverse({
      // Detect break statements
      BreakStatement(p) {
        jumps.push({
          type: "break",
          label: p.node.label?.name,
          loc: p.node.loc,
        });
      },

      // Detect continue statements
      ContinueStatement(p) {
        jumps.push({
          type: "continue",
          label: p.node.label?.name,
          loc: p.node.loc,
        });
      },

      // Detect return statements
      ReturnStatement(p) {
        jumps.push({
          type: "return",
          argument: p.node.argument ? generate(p.node.argument).code : null,
          loc: p.node.loc,
        });
      },

      // Detect throw statements
      ThrowStatement(p) {
        jumps.push({
          type: "throw",
          argument: generate(p.node.argument).code,
          loc: p.node.loc,
        });
      },

      // Detect goto-like constructs (labeled breaks)
      LabeledStatement(p) {
        jumps.push({
          type: "label",
          name: p.node.label.name,
          loc: p.node.loc,
        });
      },
    });

    // Map jumps to their string representations for the return value
    return jumps.map((jump) => {
      switch (jump.type) {
        case "break":
          return jump.label ? `break ${jump.label}` : "break";
        case "continue":
          return jump.label ? `continue ${jump.label}` : "continue";
        case "return":
          return jump.argument ? `return ${jump.argument}` : "return";
        case "throw":
          return `throw ${jump.argument}`;
        case "label":
          return `label ${jump.name}`;
        default:
          return jump.type;
      }
    });
  } catch (error) {
    console.error("Error detecting jumps:", error);
    return [];
  }
}

// --- Pattern Recognition ---
function recognizePatterns(ast, code) {
  const patterns = [];
  traverse(ast, {
    VariableDeclarator(path) {
      if (path.node.id && path.node.id.name) {
        const name = path.node.id.name;
        if (/^[a-z]$/.test(name)) {
          addPattern(
            patterns,
            "singleLetterVars",
            "Uses single letter variable names"
          );
        }
        if (/^[a-z]\d+$/.test(name)) {
          addPattern(
            patterns,
            "numericSuffixVars",
            "Uses numeric suffixes in variables"
          );
        }
        // Inside recognizePatterns function
        // Add checks for custom obfuscation techniques
        if (/\w+\[\"\w+\"\]\[\"\w+\"\]/.test(code)) {
          addPattern(
            patterns,
            "arrayAccessObfuscation",
            "Uses nested array access for obfuscation"
          );
        }

        if (/(\d+\s*[+\-*\/]\s*)+\d+/.test(code)) {
          addPattern(
            patterns,
            "arithmeticObfuscation",
            "Uses arithmetic operations to obfuscate values"
          );
        }

        if (/String\.fromCharCode\(.*?\)/.test(code)) {
          addPattern(
            patterns,
            "charCodeObfuscation",
            "Uses character codes to obfuscate strings"
          );
        }

        if (
          /eval\(atob\(/.test(code) ||
          /eval\(decodeURIComponent\(/.test(code)
        ) {
          addPattern(
            patterns,
            "encodedEval",
            "Uses encoded eval statements (high risk)"
          );
        }

        if (/\[\[".*?"\],\[".*?"\],\[".*?"\]/.test(code)) {
          addPattern(
            patterns,
            "splitStringObfuscation",
            "Uses split strings in arrays"
          );
        }
      }
    },

    FunctionDeclaration(path) {
      if (path.node.id && path.node.id.name) {
        const name = path.node.id.name;
        if (
          /^[a-z]$/.test(name) ||
          // 🆕 30 additional short/cryptic function name patterns
          /^_[a-z]$/.test(name) ||
          /^[A-Z]$/.test(name) ||
          /^[a-zA-Z]{2}$/.test(name) ||
          /^[a-z]{1}[0-9]{1}$/.test(name) ||
          /^[a-z]{1}[A-Z]{1}$/.test(name) ||
          /^[A-Z]{2}$/.test(name) ||
          /^fn$/.test(name) ||
          /^cb$/.test(name) ||
          /^fx$/.test(name) ||
          /^do$/.test(name) ||
          /^go$/.test(name) ||
          /^up$/.test(name) ||
          /^ok$/.test(name) ||
          /^on$/.test(name) ||
          /^it$/.test(name) ||
          /^to$/.test(name) ||
          /^by$/.test(name) ||
          /^id$/.test(name) ||
          /^el$/.test(name) ||
          /^ui$/.test(name) ||
          /^vm$/.test(name) ||
          /^rx$/.test(name) ||
          /^tx$/.test(name) ||
          /^op$/.test(name) ||
          /^in$/.test(name) ||
          /^ex$/.test(name) ||
          /^fn1$/.test(name) ||
          /^fn2$/.test(name) ||
          /^a1$/.test(name) ||
          /^b2$/.test(name) ||
          /^z9$/.test(name)
        ) {
          addPattern(
            patterns,
            "singleLetterFuncs",
            "Uses single or cryptic function names"
          );
        }
      }
    },
  });
  if (
    (code.includes(".replace(") && code.includes("/g")) ||
    // 🆕 30 additional regex replacement patterns
    code.includes(".replace(/\\s+/g") ||
    code.includes(".replace(/[^a-zA-Z0-9]/g") ||
    code.includes(".replace(/\\d+/g") ||
    code.includes(".replace(/\\W+/g") ||
    code.includes(".replace(/\\n/g") ||
    code.includes(".replace(/\\r/g") ||
    code.includes(".replace(/\\t/g") ||
    code.includes(".replace(/\\b/g") ||
    code.includes(".replace(/\\f/g") ||
    code.includes(".replace(/\\v/g") ||
    code.includes(".replace(/\\0/g") ||
    code.includes(".replace(/\\./g") ||
    code.includes(".replace(/\\*/g") ||
    code.includes(".replace(/\\+/g") ||
    code.includes(".replace(/\\?/g") ||
    code.includes(".replace(/\\^/g") ||
    code.includes(".replace(/\\$/g") ||
    code.includes(".replace(/\\[/g") ||
    code.includes(".replace(/\\]/g") ||
    code.includes(".replace(/\\(/g") ||
    code.includes(".replace(/\\)/g") ||
    code.includes(".replace(/\\{/g") ||
    code.includes(".replace(/\\}/g") ||
    code.includes(".replace(/\\/g") ||
    code.includes(".replace(/\\|/g") ||
    code.includes(".replace(/\\=/g") ||
    code.includes(".replace(/\\!/g") ||
    code.includes(".replace(/\\:/g") ||
    code.includes(".replace(/\\;/g") ||
    code.includes('.replace(/\\"/g')
  ) {
    addPattern(patterns, "regexReplace", "Uses regex-based string replacement");
  }
  if (
    (code.includes("===") && code.includes("typeof")) ||
    // 🆕 30 additional type-checking patterns
    code.includes("!==") ||
    code.includes("==") ||
    code.includes("!=") ||
    code.includes("typeof ") ||
    code.includes("instanceof") ||
    code.includes("Object.prototype.toString") ||
    code.includes("Array.isArray") ||
    code.includes("Number.isNaN") ||
    code.includes("Number.isFinite") ||
    code.includes("isNaN(") ||
    code.includes("isFinite(") ||
    code.includes("typeof variable") ||
    code.includes("typeof value") ||
    code.includes("typeof input") ||
    code.includes("typeof obj") ||
    code.includes("typeof str") ||
    code.includes("typeof num") ||
    code.includes("typeof bool") ||
    code.includes("typeof func") ||
    code.includes("typeof undefined") ||
    code.includes("typeof null") ||
    code.includes("typeof ===") ||
    code.includes("typeof !==") ||
    code.includes("typeof ==") ||
    code.includes("typeof !=") ||
    code.includes("typeof x ===") ||
    code.includes("typeof x !==") ||
    code.includes("typeof x ==") ||
    code.includes("typeof x !=") ||
    code.includes("typeof x === 'string'") ||
    code.includes("typeof x === 'object'")
  ) {
    addPattern(patterns, "typeChecking", "Performs type checking");
  }

  // Loadable chunks and numeric module map (Webpack) signals
  if (/__LOADABLE_LOADED_CHUNKS__/.test(code)) {
    addPattern(patterns, "loadableChunks", "Loadable chunks pattern detected");
  }
  if (/\b\d{3,}\s*:\s*\(/.test(code)) {
    addPattern(
      patterns,
      "numericModuleMap",
      "Numeric module map (Webpack) detected"
    );
  }

  if (
    code.includes("transition") ||
    code.includes("useState") ||
    code.includes("useEffect") ||
    // 🆕 30 additional React patterns
    code.includes("useRef") ||
    code.includes("useMemo") ||
    code.includes("useCallback") ||
    code.includes("useReducer") ||
    code.includes("useContext") ||
    code.includes("useLayoutEffect") ||
    code.includes("useImperativeHandle") ||
    code.includes("useSyncExternalStore") ||
    code.includes("useId") ||
    code.includes("useDeferredValue") ||
    code.includes("ReactDOM") ||
    code.includes("React.createElement") ||
    code.includes("React.Fragment") ||
    code.includes("React.StrictMode") ||
    code.includes("React.lazy") ||
    code.includes("React.Suspense") ||
    code.includes("React.memo") ||
    code.includes("React.forwardRef") ||
    code.includes("React.Children") ||
    code.includes("React.cloneElement") ||
    code.includes("React.isValidElement") ||
    code.includes("React.PureComponent") ||
    code.includes("React.Component") ||
    code.includes("React.use") ||
    code.includes("JSX") ||
    code.includes("render()") ||
    code.includes("return <") ||
    code.includes("className=") ||
    code.includes("props.") ||
    code.includes("setState(") ||
    code.includes("this.state")
  ) {
    addPattern(patterns, "reactPatterns", "Contains React patterns");
  }
  // Add React pattern detection
  if (
    ast.program.body.some(
      (node) =>
        node.type === "VariableDeclaration" &&
        node.declarations.some((d) => d.id?.name?.includes("React"))
    )
  ) {
    patterns.push({
      name: "reactHooks",
      description: "Contains React Hooks implementation",
    });
  }

  function detectReactHooks(code) {
    const hookPatterns = {
      useState: /useState\s*\(/,
      useEffect: /useEffect\s*\(/,
      useContext: /useContext\s*\(/,
      useReducer: /useReducer\s*\(/,
      useCallback: /useCallback\s*\(/,
      useMemo: /useMemo\s*\(/,
      useRef: /useRef\s*\(/,
      useImperativeHandle: /useImperativeHandle\s*\(/,
      useLayoutEffect: /useLayoutEffect\s*\(/,
      useDebugValue: /useDebugValue\s*\(/,
      useDeferredValue: /useDeferredValue\s*\(/,
      useTransition: /useTransition\s*\(/,
      useId: /useId\s*\(/,
      useSyncExternalStore: /useSyncExternalStore\s*\(/,
      useInsertionEffect: /useInsertionEffect\s*\(/,
    };

    return Object.entries(hookPatterns)
      .filter(([_, pattern]) => pattern.test(code))
      .map(([hookName]) => ({
        type: "hook",
        name: hookName,
        framework: "React",
      }));
  }

  const hooks = detectReactHooks(code);
  if (hooks.length > 0) {
    addPattern(
      patterns,
      "reactHooks",
      `Contains React Hooks: ${hooks.map((h) => h.name).join(", ")}`
    );
  }

  const reactHookTransforms = {
    transformHookExports(code) {
      return code.replace(
        /t\.(\w+)\s*=\s*function\s*\((.*?)\)\s*{\s*return\s*P\.current\.\1\((.*?)\);\s*}/g,
        "export function $1($2) {\n  return P.current.$1($3);\n}"
      );
    },

    cleanupModuleExports(code) {
      return code.replace(
        /(\d+):\s*\(e,\s*t,\s*n\)\s*=>\s*{\s*"use strict";\s*e\.exports\s*=\s*n\((\d+)\);\s*}/g,
        'export { default as module$1 } from "./$2";'
      );
    },
  };

  if (
    code.includes("$(") ||
    code.includes("jQuery") ||
    // 🆕 30 additional jQuery patterns
    code.includes("$.ajax") ||
    code.includes("$.get") ||
    code.includes("$.post") ||
    code.includes("$.getJSON") ||
    code.includes("$.each") ||
    code.includes("$.extend") ||
    code.includes("$.fn") ||
    code.includes("$.data") ||
    code.includes("$.on") ||
    code.includes("$.off") ||
    code.includes("$.trigger") ||
    code.includes("$.ready") ||
    code.includes("$.hide") ||
    code.includes("$.show") ||
    code.includes("$.fadeIn") ||
    code.includes("$.fadeOut") ||
    code.includes("$.slideUp") ||
    code.includes("$.slideDown") ||
    code.includes("$.animate") ||
    code.includes("$.val") ||
    code.includes("$.html") ||
    code.includes("$.text") ||
    code.includes("$.append") ||
    code.includes("$.prepend") ||
    code.includes("$.remove") ||
    code.includes("$.attr") ||
    code.includes("$.prop") ||
    code.includes("$.css") ||
    code.includes("$.hasClass") ||
    code.includes("$.addClass") ||
    code.includes("$.removeClass")
  ) {
    addPattern(patterns, "jqueryPatterns", "Contains jQuery patterns");
  }
  if (detectWebpackPatterns(code)) {
    addPattern(patterns, "webpackBundle", "Appears to be a Webpack bundle");
  }

  if (
    code.includes("@Component") ||
    code.includes("@NgModule") ||
    code.includes("ngOnInit") ||
    code.includes("ngOnDestroy") ||
    // 🆕 30 additional Angular patterns
    code.includes("@Injectable") ||
    code.includes("@Input") ||
    code.includes("@Output") ||
    code.includes("@HostListener") ||
    code.includes("@ViewChild") ||
    code.includes("@ContentChild") ||
    code.includes("@Directive") ||
    code.includes("@Pipe") ||
    code.includes("@HostBinding") ||
    code.includes("@Self") ||
    code.includes("@SkipSelf") ||
    code.includes("@Optional") ||
    code.includes("@Inject") ||
    code.includes("ngAfterViewInit") ||
    code.includes("ngAfterContentInit") ||
    code.includes("ngAfterViewChecked") ||
    code.includes("ngAfterContentChecked") ||
    code.includes("ngDoCheck") ||
    code.includes("ngOnChanges") ||
    code.includes("ngSubmit") ||
    code.includes("ngModel") ||
    code.includes("ngClass") ||
    code.includes("ngStyle") ||
    code.includes("ngIf") ||
    code.includes("ngFor") ||
    code.includes("ngSwitch") ||
    code.includes("ng-template") ||
    code.includes("ng-container") ||
    code.includes("RouterModule") ||
    code.includes("HttpClientModule")
  ) {
    addPattern(patterns, "angularPatterns", "Contains Angular patterns");
  }
  if (
    code.includes("Vue") ||
    code.includes("vm.$") ||
    code.includes("data:") ||
    code.includes("computed:") ||
    code.includes("methods:") ||
    // 🆕 30 additional Vue.js patterns
    code.includes("template:") ||
    code.includes("components:") ||
    code.includes("props:") ||
    code.includes("watch:") ||
    code.includes("mounted()") ||
    code.includes("created()") ||
    code.includes("updated()") ||
    code.includes("destroyed()") ||
    code.includes("beforeMount()") ||
    code.includes("beforeCreate()") ||
    code.includes("beforeUpdate()") ||
    code.includes("beforeDestroy()") ||
    code.includes("v-if") ||
    code.includes("v-else") ||
    code.includes("v-for") ||
    code.includes("v-bind") ||
    code.includes("v-model") ||
    code.includes("v-on") ||
    code.includes("v-show") ||
    code.includes("v-html") ||
    code.includes("v-text") ||
    code.includes("v-slot") ||
    code.includes("v-pre") ||
    code.includes("v-cloak") ||
    code.includes("this.$emit") ||
    code.includes("this.$refs") ||
    code.includes("this.$nextTick") ||
    code.includes("this.$router") ||
    code.includes("this.$store") ||
    code.includes("vuex") ||
    code.includes("vue-router")
  ) {
    addPattern(patterns, "vuePatterns", "Contains Vue.js patterns");
  }
  if (
    code.includes("svelte") ||
    code.includes("$$") ||
    code.includes("$on") ||
    code.includes("$set") ||
    // 🆕 30 additional Svelte patterns
    code.includes("$capture_state") ||
    code.includes("$inject_state") ||
    code.includes("$invalidate") ||
    code.includes("$$.dirty") ||
    code.includes("$$unsubscribe") ||
    code.includes("$$props") ||
    code.includes("$$slots") ||
    code.includes("$$scope") ||
    code.includes("$$restProps") ||
    code.includes("$$render") ||
    code.includes("$$context") ||
    code.includes("$$self") ||
    code.includes("$$store") ||
    code.includes("$$bindings") ||
    code.includes("$$fragment") ||
    code.includes("$$set") ||
    code.includes("$$update") ||
    code.includes("$$create") ||
    code.includes("$$destroy") ||
    code.includes("$$transition") ||
    code.includes("$$animation") ||
    code.includes("$$tick") ||
    code.includes("$$flush") ||
    code.includes("$$props_changed") ||
    code.includes("$$component") ||
    code.includes("$$template") ||
    code.includes("$$hydrate") ||
    code.includes("$$mount") ||
    code.includes("$$detach") ||
    code.includes("$$insert")
  ) {
    addPattern(patterns, "sveltePatterns", "Contains Svelte patterns");
  }

  if (
    code.includes("_.") ||
    code.includes("R.") ||
    code.includes("fp.") ||
    code.includes("compose(") ||
    code.includes("curry(") ||
    // 🆕 30 additional utility patterns
    code.includes("pipe(") ||
    code.includes("flow(") ||
    code.includes("map(") ||
    code.includes("filter(") ||
    code.includes("reduce(") ||
    code.includes("flatMap(") ||
    code.includes("chain(") ||
    code.includes("identity(") ||
    code.includes("memoize(") ||
    code.includes("debounce(") ||
    code.includes("throttle(") ||
    code.includes("cloneDeep(") ||
    code.includes("merge(") ||
    code.includes("assign(") ||
    code.includes("pick(") ||
    code.includes("omit(") ||
    code.includes("get(") ||
    code.includes("set(") ||
    code.includes("has(") ||
    code.includes("isEqual(") ||
    code.includes("isEmpty(") ||
    code.includes("uniq(") ||
    code.includes("sortBy(") ||
    code.includes("groupBy(") ||
    code.includes("partition(") ||
    code.includes("zip(") ||
    code.includes("unzip(") ||
    code.includes("flatten(") ||
    code.includes("difference(") ||
    code.includes("intersection(")
  ) {
    addPattern(patterns, "utilityPatterns", "Contains Lodash/Ramda patterns");
  }
  if (
    code.includes("express") ||
    code.includes("require('express')") ||
    code.includes("app.use") ||
    code.includes("router") ||
    code.includes("koa") ||
    code.includes("ctx.") ||
    // 🆕 30 additional backend patterns
    code.includes("require('http')") ||
    code.includes("require('https')") ||
    code.includes("require('fs')") ||
    code.includes("require('path')") ||
    code.includes("require('url')") ||
    code.includes("require('body-parser')") ||
    code.includes("require('cors')") ||
    code.includes("require('helmet')") ||
    code.includes("require('morgan')") ||
    code.includes("require('cookie-parser')") ||
    code.includes("require('compression')") ||
    code.includes("require('dotenv')") ||
    code.includes("require('jsonwebtoken')") ||
    code.includes("require('bcrypt')") ||
    code.includes("require('multer')") ||
    code.includes("require('socket.io')") ||
    code.includes("require('mongoose')") ||
    code.includes("require('pg')") ||
    code.includes("require('mysql')") ||
    code.includes("require('sqlite3')") ||
    code.includes("require('redis')") ||
    code.includes("require('cluster')") ||
    code.includes("require('child_process')") ||
    code.includes("require('nodemailer')") ||
    code.includes("require('passport')") ||
    code.includes("require('express-session')") ||
    code.includes("require('graphql')") ||
    code.includes("require('apollo-server-express')") ||
    code.includes("require('hapi')") ||
    code.includes("require('fastify')")
  ) {
    addPattern(patterns, "backendPatterns", "Contains Express/Koa patterns");
  }

  return patterns;
}

function addPattern(patterns, name, description) {
  if (!patterns.some((p) => p.name === name)) {
    patterns.push({ name, description });
  }
}

const controlFlowAnalyzer = {
  analyzeBranches: (ast) => {
    const branches = [];
    traverse(ast, {
      IfStatement(path) {
        branches.push({
          type: "if",
          location: path.node.loc,
          condition: path.node.test,
          complexity: calculateComplexity(path),
        });
      },
      SwitchStatement(path) {
        branches.push({
          type: "switch",
          location: path.node.loc,
          cases: path.node.cases.length,
          hasDefault: path.node.cases.some((c) => c.test === null),
        });
      },
      WhileStatement(path) {
        branches.push({
          type: "while",
          location: path.node.loc,
          condition: path.node.test,
        });
      },
    });
    return branches;
  },

  reconstructControlFlow: (ast) => {
    let flow = [];
    traverse(ast, {
      enter(path) {
        if (path.isBlockStatement()) {
          const block = {
            type: "block",
            statements: [],
            jumps: detectJumps(path),
          };
          flow.push(block);
        }
      },
    });
    return flow;
  },

  analyzeLoops: (ast) => {
    const loops = [];
    traverse(ast, {
      ForStatement(path) {
        loops.push({
          type: "for",
          location: path.node.loc,
          init: path.node.init,
          test: path.node.test,
          update: path.node.update,
        });
      },
      DoWhileStatement(path) {
        loops.push({
          type: "do-while",
          location: path.node.loc,
          test: path.node.test,
        });
      },
    });
    return loops;
  },

  detectControlFlowFlattening: (ast) => {
    let hasFlattening = false;
    traverse(ast, {
      SwitchStatement(path) {
        if (path.node.cases.length > 10) {
          const hasJumps = path.node.cases.some((c) =>
            c.consequent.some(
              (node) =>
                node.type === "ContinueStatement" ||
                node.type === "BreakStatement"
            )
          );
          if (hasJumps) {
            hasFlattening = true;
          }
        }
      },
    });
    return hasFlattening;
  },
};

const constantFolder = {
  evaluate: (node) => {
    if (!node) return null;

    switch (node.type) {
      case "NumericLiteral":
        return node.value;
      case "StringLiteral":
        return node.value;
      case "BooleanLiteral":
        return node.value;
      case "NullLiteral":
        return null;
      case "UnaryExpression":
        const arg = constantFolder.evaluate(node.argument);
        if (arg === null) return null;
        switch (node.operator) {
          case "-":
            return -arg;
          case "+":
            return +arg;
          case "!":
            return !arg;
          case "~":
            return ~arg;
          case "typeof":
            return typeof arg;
          default:
            return null;
        }
      case "BinaryExpression":
        const left = constantFolder.evaluate(node.left);
        const right = constantFolder.evaluate(node.right);
        if (left === null || right === null) return null;
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
          case "**":
            return Math.pow(left, right);
          case "|":
            return left | right;
          case "&":
            return left & right;
          case "^":
            return left ^ right;
          case "<<":
            return left << right;
          case ">>":
            return left >> right;
          case ">>>":
            return left >>> right;
          case "==":
            return left == right;
          case "===":
            return left === right;
          case "!=":
            return left != right;
          case "!==":
            return left !== right;
          case "<":
            return left < right;
          case ">":
            return left > right;
          case "<=":
            return left <= right;
          case ">=":
            return left >= right;
          case "in":
            return left in right;
          case "instanceof":
            return left instanceof right;
          default:
            return null;
        }
      case "LogicalExpression":
        const logicalLeft = constantFolder.evaluate(node.left);
        const logicalRight = constantFolder.evaluate(node.right);
        if (logicalLeft === null || logicalRight === null) return null;
        switch (node.operator) {
          case "||":
            return logicalLeft || logicalRight;
          case "&&":
            return logicalLeft && logicalRight;
          case "??":
            return logicalLeft ?? logicalRight;
          default:
            return null;
        }
      case "ConditionalExpression":
        const test = constantFolder.evaluate(node.test);
        if (test === null) return null;
        return test
          ? constantFolder.evaluate(node.consequent)
          : constantFolder.evaluate(node.alternate);
      case "MemberExpression":
        if (
          node.object.type === "Identifier" &&
          node.property.type === "StringLiteral"
        ) {
          return {
            type: "memberAccess",
            object: node.object.name,
            property: node.property.value,
          };
        }
        return null;
      default:
        return null;
    }
  },

  foldConstants: (ast) => {
    let changed = false;
    traverse(ast, {
      BinaryExpression(path) {
        const result = constantFolder.evaluate(path.node);
        if (result !== null && typeof result !== "object") {
          path.replaceWith({
            type: "NumericLiteral",
            value: result,
            loc: path.node.loc,
          });
          changed = true;
        }
      },
      UnaryExpression(path) {
        const result = constantFolder.evaluate(path.node);
        if (result !== null && typeof result !== "object") {
          path.replaceWith({
            type:
              typeof result === "number" ? "NumericLiteral" : "BooleanLiteral",
            value: result,
            loc: path.node.loc,
          });
          changed = true;
        }
      },
    });
    return changed;
  },
};

const stringArrayDetector = {
  findArrays: (ast) => {
    const arrays = [];
    traverse(ast, {
      VariableDeclarator(path) {
        const init = path.node.init;
        if (
          init &&
          init.type === "ArrayExpression" &&
          init.elements.length > 5
        ) {
          const allStrings = init.elements.every(
            (el) =>
              el &&
              (el.type === "StringLiteral" || el.type === "NumericLiteral")
          );
          if (allStrings) {
            arrays.push({
              name: path.node.id?.name,
              elements: init.elements.map((el) => el.value),
              loc: path.node.loc,
            });
          }
        }
      },
    });
    return arrays;
  },

  findStringFunctions: (ast) => {
    const functions = [];
    traverse(ast, {
      FunctionDeclaration(path) {
        const body = path.get("body");
        if (body.isBlockStatement()) {
          const statements = body.node.body;
          if (statements.length > 10) {
            const hasArrayAccess = statements.some(
              (stmt) =>
                stmt.expression && stmt.expression.type === "MemberExpression"
            );
            if (hasArrayAccess) {
              functions.push({
                name: path.node.id?.name,
                params: path.node.params.map((p) => p.name),
                loc: path.node.loc,
              });
            }
          }
        }
      },
    });
    return functions;
  },
};

const stringDecryptor = {
  decryptString: (encryptedStr, key) => {
    try {
      const decipher = crypto.createDecipher("aes-256-cbc", key);
      let decrypted = decipher.update(encryptedStr, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (e) {
      return encryptedStr;
    }
  },

  detectEncryption: (str) => {
    const patterns = {
      base64: /^[A-Za-z0-9+/=]+$/,
      hex: /^[0-9a-fA-F]+$/,
      rot13: /^[A-Za-z]+$/,
      customEncryption: /[a-z]+'[a-z]+/, // Detects patterns like @F'dhrkc'ihs'eb used in the obfuscated code
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(str)) {
        return type;
      }
    }
    return null;
  },

  // New specialized decoder for the custom obfuscation seen in outputs
  specializedDecoder: (str) => {
    // Check if this is the type of encoding with apostrophes
    if (str.includes("'") && /[a-z]+'[a-z]+/.test(str)) {
      // Apply a simple character shift algorithm (this is an example - adjust based on actual pattern)
      // Some obfuscators use a consistent shift or substitution pattern
      return str
        .split("")
        .map((char) => {
          if (char === "'") return "";
          const code = char.charCodeAt(0);
          if (code >= 97 && code <= 122) {
            // lowercase letters
            return String.fromCharCode(((code - 97 + 13) % 26) + 97); // ROT13 for lowercase
          }
          return char;
        })
        .join("");
    }
    return str;
  },

  // Enhanced Unicode handling
  fixUnicodeReplacements: (str) => {
    if (!str.includes("\uFFFD")) return str;

    try {
      // Try alternate encodings when Unicode replacement chars are found
      const decodings = [
        // Try different encodings
        Buffer.from(str, "utf8").toString("latin1"),
        Buffer.from(str, "latin1").toString("utf8"),
        Buffer.from(str, "ascii").toString("utf8"),
        Buffer.from(str, "utf-16le").toString("utf8"),
        Buffer.from(str, "windows-1252").toString("utf8"),
      ];

      // Return the first decoded string that doesn't have replacement chars
      const validDecoding = decodings.find(
        (decoded) => !decoded.includes("\uFFFD")
      );
      if (validDecoding) return validDecoding;

      // If no valid encoding found, replace with a placeholder
      return str.replace(/\uFFFD/g, "[?]");
    } catch (e) {
      console.warn("Unicode decoding failed:", e);
      return str.replace(/\uFFFD/g, "[?]");
    }
  },

  customSubstitutionDecoder: (str) => {
    const substitutionMap = {
      qsnln: "promo",
      ghsd: "fire",
      qsdwhdv: "preview",
      cnuunl: "bottom",
      rtcuhumd: "subtitle",
      z: "render",
      sunfk: "trial",
      jhcfk: "modal",
    };

    // Simple word-part substitution based on debug logs
    // This is a very specific decoder and might need to be expanded
    const parts = str.split(/([,*.#$])/);
    if (parts.length > 1) {
      const decodedParts = parts.map((part) => {
        if (substitutionMap[part]) {
          return substitutionMap[part];
        }
        if (part === ",") return "-";
        if (part === "*") return "-";
        if (part === "*") return "-";
        return part;
      });
      const decodedStr = decodedParts.join("");
      // Only return if something was actually changed
      if (decodedStr !== str) {
        return decodedStr;
      }
    }
    return str;
  },

  decodeString: (str) => {
    if (!str || typeof str !== "string") return str;

    // Skip very short strings (likely not encrypted)
    if (str.length < 3) return str;

    // Skip strings that are already valid readable text
    const readableRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
    if (readableRatio > 0.7 && /^[a-zA-Z\s.,;:!?()\[\]"'\-_]+$/.test(str)) {
      return str;
    }

    try {
      // First fix any Unicode replacement characters
      str = stringDecryptor.fixUnicodeReplacements(str);

      // React-specific ROT cipher detection - only for strings with special chars
      // that indicate obfuscation (^, _, / in middle of words)
      if (
        /^[a-z]+[\^_\/]{1}[a-z]+$/.test(str) ||
        /tuw[A-Za-z]+$/.test(str) ||
        /wfkbssb[A-Za-z]+$/.test(str) ||
        /^[a-z]+'[a-z]+/.test(str) // Only for strings with embedded apostrophes
      ) {
        const decoded = str
          .split("")
          .map((char) => {
            const code = char.charCodeAt(0);
            // Only transform letters
            if (code >= 97 && code <= 122) {
              // lowercase letters
              // ROT13 for lowercase with offset adjustment
              return String.fromCharCode(((code - 97 + 13) % 26) + 97);
            } else if (code >= 65 && code <= 90) {
              // uppercase letters
              // ROT13 for uppercase
              return String.fromCharCode(((code - 65 + 13) % 26) + 65);
            }
            // Keep special characters as is
            return char;
          })
          .join("");

        return decoded;
      }

      // Try the specialized decoder for other patterns - ONLY for obvious obfuscation
      if (/[a-z]+'[a-z]+/.test(str)) {
        const specialDecoded = stringDecryptor.specializedDecoder(str);
        if (specialDecoded !== str) {
          return specialDecoded;
        }
      }

      // Check for common encryption patterns - only for obvious encoded strings
      const type = stringDecryptor.detectEncryption(str);

      // Attempt standard decoding based on detected type
      switch (type) {
        case "base64":
          // Only decode if it looks like valid base64 (proper padding)
          if (/^[A-Za-z0-9+/]+=*$/.test(str) && str.length >= 4) {
            try {
              return Buffer.from(str, "base64").toString();
            } catch (e) {
              /* ignore */
            }
          }
          return str;
        case "hex":
          // Only decode if even length hex
          if (
            /^[0-9a-fA-F]+$/.test(str) &&
            str.length % 2 === 0 &&
            str.length >= 4
          ) {
            try {
              return Buffer.from(str, "hex").toString();
            } catch (e) {
              /* ignore */
            }
          }
          return str;
        case "rot13":
          // Only apply ROT13 if result is different and looks valid
          const rot13Result = str.replace(/[a-zA-Z]/g, (c) =>
            String.fromCharCode(
              (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
            )
          );
          // Only return if the decoded version looks like valid text
          if (
            /^[a-zA-Z][a-zA-Z\s]*[a-zA-Z]$/.test(rot13Result) &&
            rot13Result.length >= 3
          ) {
            return rot13Result;
          }
          return str;
        case "customEncryption":
          return stringDecryptor.specializedDecoder(str);
        default:
          // Try multiple decoding strategies for unidentified patterns

          // 1. Check for Unicode escape sequences
          if (/\\u[\da-f]{4}/i.test(str)) {
            return str.replace(/\\u([\da-f]{4})/gi, (match, hex) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          }

          // 2. Check for ASCII character codes
          if (/^(?:\d{1,3},)*\d{1,3}$/.test(str)) {
            return str
              .split(",")
              .map((code) => String.fromCharCode(parseInt(code, 10)))
              .join("");
          }

          // 3. Check for XOR encoding (with common keys)
          const commonXorKeys = [0x1, 0x7, 0xf, 0xff, 0x33, 0x42, 0x5a]; // Added more common XOR keys
          for (const key of commonXorKeys) {
            const decoded = Array.from(str)
              .map((c) => String.fromCharCode(c.charCodeAt(0) ^ key))
              .join("");

            // Simple heuristic: if result looks like readable text, return it
            if (
              /^[a-zA-Z0-9\s.,;:!?(){}\[\]"'\/\\-_+=@#$%^&*|<>]+$/.test(decoded)
            ) {
              return decoded;
            }
          }

          // 4. Try Caesar cipher with different shift values
          for (let shift = 1; shift <= 25; shift++) {
            const decoded = Array.from(str)
              .map((char) => {
                const code = char.charCodeAt(0);
                if (code >= 65 && code <= 90) {
                  // uppercase letters
                  return String.fromCharCode(((code - 65 + shift) % 26) + 65);
                } else if (code >= 97 && code <= 122) {
                  // lowercase letters
                  return String.fromCharCode(((code - 97 + shift) % 26) + 97);
                }
                return char;
              })
              .join("");

            // Check if result looks like readable text
            if (
              /^[a-zA-Z0-9\s.,;:!?(){}\[\]"'\/\\-_+=@#$%^&*|<>]+$/.test(decoded)
            ) {
              return decoded;
            }
          }

          // If nothing worked, return original
          return str;
      }
    } catch (e) {
      console.warn(
        `String decryption failed for: ${str.substring(0, 30)}...`,
        e.message
      );
      return str; // Return original on error
    }
  },
};

const minifiedCodeHandler = {
  beautifyCode: (code) => {
    // Use consistent parser options to avoid altering semantics on large files
    const parserOptions = {
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
    };
    const ast = parse(code, parserOptions);
    return generate(ast, {
      comments: true,
      compact: false,
      retainLines: true, // preserve line structure to reduce risk around strings
      concise: false,
      // Avoid forcing quotes; let generator escape minimally
      jsescOption: { minimal: true },
    }).code;
  },

  decompressCode: (code) => {
    // Avoid unsafe regex-based expansions that can corrupt strings/regex.
    // Rely on beautifyCode (AST-based) for formatting.
    return code;
  },

  restoreIdentifiers: (ast) => {
    traverse(ast, {
      Identifier(path) {
        if (path.node.name.length <= 2) {
          path.node.name = generateMeaningfulName(path);
        }
      },
    });
  },

  analyzeMinification: (code) => {
    return {
      mangled: code.match(/\b[a-z]{1,2}\b/g)?.length || 0,
      compressed: code.includes(";") && !code.includes("\n"),
      sourceMapped: code.includes("//# sourceMappingURL="),
      webpacked: code.includes("__webpack_require__"),
    };
  },

  restoreComments: (ast) => {
    traverse(ast, {
      enter(path) {
        if (path.node.leadingComments || path.node.trailingComments) {
          // Preserve and enhance existing comments
          const comments = [...(path.node.leadingComments || [])];
          comments.forEach((comment) => {
            comment.value = comment.value.trim();
            if (comment.value.startsWith("*")) {
              comment.value = ` ${comment.value}`; // Proper JSDoc formatting
            }
          });
        }
      },
    });
  },
};

const frameworkPatterns = {
  // Next.js Patterns
  nextjs: {
    imports: ["next/router", "next/link", "next/head"],
    components: [
      "getStaticProps",
      "getServerSideProps",
      "_app.js",
      "_document.js",
    ],
    patterns: /getInitialProps|useRouter|withRouter/,
  },

  // Gatsby Patterns
  gatsby: {
    imports: ["gatsby", "gatsby-link", "gatsby-image"],
    components: ["gatsby-browser.js", "gatsby-config.js", "gatsby-node.js"],
    patterns: /graphql`[^`]+`|useStaticQuery|createPages/,
  },

  // Nuxt.js Patterns
  nuxtjs: {
    imports: ["nuxt", "@nuxtjs", "nuxt-link"],
    components: ["asyncData", "fetch", "middleware"],
    patterns: /asyncData|nuxtServerInit|scrollToTop/,
  },

  // SvelteKit Patterns
  sveltekit: {
    imports: ["@sveltejs/kit"],
    components: ["load", "preload", "+page.svelte"],
    patterns: /\$app\/stores|\$app\/navigation/,
  },
};

const frameworkDetector = {
  detectFramework: (code) => {
    const detectedFrameworks = [];

    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
      if (
        patterns.imports.some((imp) => code.includes(imp)) ||
        patterns.components.some((comp) => code.includes(comp)) ||
        patterns.patterns.test(code)
      ) {
        detectedFrameworks.push(framework);
      }
    }

    return detectedFrameworks;
  },

  // Inside patterns.js -> frameworkDetector object
  applyFrameworkSpecificRules: (code, frameworks) => {
    console.log(
      "DEBUG (applyFrameworkSpecificRules): Starting framework-specific rules for",
      frameworks
    );
    let result = code;

    // Check if any frameworks were detected
    if (!frameworks || frameworks.length === 0) {
      console.log(
        "DEBUG (applyFrameworkSpecificRules): No frameworks detected, returning code unchanged."
      );
      return result; // Return original code if no frameworks
    }

    // Iterate through each detected framework
    frameworks.forEach((framework) => {
      console.log(
        `DEBUG (applyFrameworkSpecificRules): Processing framework: ${framework}`
      );
      // Apply framework-specific transformations by calling the defined function
      try {
        result = transformCodeForFramework(result, framework);
      } catch (transformError) {
        // Handle errors within a specific transformation gracefully
        console.error(
          `Error applying transformations for framework '${framework}':`,
          transformError.message
        );
        // Continue with the next framework, don't stop the whole process
      }
    });

    console.log(
      "DEBUG (applyFrameworkSpecificRules): Completed framework-specific rules."
    );
    // Return the final transformed code
    return result;

    // --- Remove or comment out the old/unreachable code ---
    /*
  // The lines below are unreachable due to the 'return result;' above
  // and also duplicate logic that's now handled inside transformCodeForFramework
  if (frameworks.includes("React")) {
    code = reactHookTransforms.transformHookExports(code);
    code = reactHookTransforms.cleanupModuleExports(code);
  }
  return code; // This was also unreachable
  */
  },

  analyzeFrameworkVersion: (code) => {
    const versions = {
      react: code.match(/react@([0-9.]+)/)?.[1],
      vue: code.match(/vue@([0-9.]+)/)?.[1],
      angular: code.match(/angular@([0-9.]+)/)?.[1],
      svelte: code.match(/svelte@([0-9.]+)/)?.[1],
    };
    return versions;
  },

  detectBuildTools: (code) => {
    return {
      webpack: code.includes("__webpack_require__"),
      babel: code.includes("_interopRequireDefault"),
      typescript: code.includes(":") && code.includes("interface"),
      rollup: code.includes("_rollupPluginBabelHelpers"),
      vite: code.includes("__vite_ssr_import__"),
    };
  },
};

// Define transformCodeForFramework to handle specific transformations per framework
function transformCodeForFramework(code, frameworkName) {
  console.log(
    `DEBUG (transformCodeForFramework): Applying transformations for ${frameworkName}`
  );
  let transformedCode = code;

  // Apply transformations based on the detected framework
  switch (
    frameworkName.toLowerCase() // Use toLowerCase for case-insensitive matching
  ) {
    case "react":
      // Apply the React-specific transformations that were in the unreachable part
      transformedCode =
        reactHookTransforms.transformHookExports(transformedCode);
      transformedCode =
        reactHookTransforms.cleanupModuleExports(transformedCode);
      // Add more React-specific transformations here if needed
      console.log(
        `DEBUG (transformCodeForFramework): Applied React transformations.`
      );
      break;
    case "vue":
    case "vue.js":
      // Add Vue-specific transformations here
      // Example: transformedCode = vueTransforms.simplifyComponentStructure(transformedCode);
      console.log(
        `DEBUG (transformCodeForFramework): Applied (placeholder) Vue transformations.`
      );
      break;
    case "angular":
      // Add Angular-specific transformations here
      console.log(
        `DEBUG (transformCodeForFramework): Applied (placeholder) Angular transformations.`
      );
      break;
    case "nuxtjs":
      // Add Nuxt.js-specific transformations here
      console.log(
        `DEBUG (transformCodeForFramework): Applied (placeholder) Nuxt.js transformations.`
      );
      break;
    case "svelte":
    case "sveltekit":
      // Add Svelte/SvelteKit-specific transformations here
      console.log(
        `DEBUG (transformCodeForFramework): Applied (placeholder) Svelte/SvelteKit transformations.`
      );
      break;
    default:
      // Handle unknown or generic frameworks
      console.warn(
        `Warning (transformCodeForFramework): No specific transformation defined for framework '${frameworkName}'. Returning code unchanged.`
      );
    // Optionally apply very generic fixes
    // transformedCode = syntaxFixer.fixSyntax(transformedCode); // Example
  }

  return transformedCode;
}
// --- Framework/Library-Specific Renaming Patterns ---

const syntaxFixer = {
  fixSyntax: (code) => {
    return code
      .replace(/;(?=[}\]])/g, "")
      .replace(/,(?=[}\]])/g, "")
      .replace(/([{,])\s*(\w+)\s*;\s*function/g, "$1 $2: function")
      .replace(/}\s*;\s*,\s*{/g, "}, {")
      .replace(/;\s*}/g, "}");
  },
};

const deobfuscatormapping = {
  stringDecrypt: () => {},
  controlFlowRecovery: () => {},
  nameRecovery: () => {},
  evalHandler: () => {},

  literalUnpacker: () => {},
  deadCodeEliminator: () => {},
  proxyFunctionResolver: () => {},
  objectKeyNormalizer: () => {},
  arrayRotator: () => {},
  functionInliner: () => {},
  scopeFlattener: () => {},
  ternarySimplifier: () => {},
  logicalExpressionReducer: () => {},
  unicodeDecoder: () => {},
  hexDecoder: () => {},
  base64Decoder: () => {},
  iifeUnwrapper: () => {},
  splitJoinResolver: () => {},
  dynamicRequireResolver: () => {},
  memberExpressionSimplifier: () => {},
  callExpressionTracer: () => {},
  loopUnroller: () => {},
  conditionalSimplifier: () => {},
  constantFolder: () => {},
  identifierRenamer: () => {},
  astCleaner: () => {},
  binaryExpressionReducer: () => {},
  templateLiteralNormalizer: () => {},
  regexSimplifier: () => {},
  functionAliasResolver: () => {},
  obfuscatedArrayResolver: () => {},
  encryptedPayloadExtractor: () => {},
  runtimeHookInjector: () => {},
  sandboxExecutor: () => {},
  antiDebugBypasser: () => {},
  timingAttackNeutralizer: () => {},
  environmentDetector: () => {},
  virtualMachineBypasser: () => {},
  stackTraceCleaner: () => {},
  obfuscatedSwitchResolver: () => {},
  controlFlowGraphBuilder: () => {},
};
const patternsmapping = {
  isControlFlowFlattened: () => {},
  isStringEncrypted: () => {},
  isEvalBased: () => {},

  isDynamicRequireUsed: () => {},
  isChildProcessSpawned: () => {},
  isObfuscatedArrayPresent: () => {},
  isProxyFunctionUsed: () => {},
  isIIFEWrapped: () => {},
  isBase64Encoded: () => {},
  isHexEncoded: () => {},
  isUnicodeEscaped: () => {},
  isFunctionAliased: () => {},
  isDeadCodeInjected: () => {},
  isLoopObfuscated: () => {},
  isSwitchObfuscated: () => {},
  isGlobalLeakDetected: () => {},
  isProcessHijacked: () => {},
  isEvalInString: () => {},
  isVMModuleUsed: () => {},
  isSandboxBypassed: () => {},
  isDebuggerTrapPresent: () => {},
  isAntiDebugLogicUsed: () => {},
  isTimingAttackLogicPresent: () => {},
  isEncryptedPayloadLoaded: () => {},
  isRequireHooked: () => {},
  isStackTraceManipulated: () => {},
  isEventEmitterHijacked: () => {},
  isFileSystemAccessed: () => {},
  isNetworkSocketOpened: () => {},
  isCryptoUsedSuspiciously: () => {},
  isEnvironmentChecked: () => {},
  isPlatformFingerprinting: () => {},
  isObfuscatedFunctionNames: () => {},
  isObfuscatedPropertyAccess: () => {},
  isObfuscatedMemberExpression: () => {},
  isObfuscatedBinaryExpression: () => {},
  isObfuscatedTemplateLiteral: () => {},
  isObfuscatedRegex: () => {},
  isObfuscatedControlFlowGraph: () => {},
  isObfuscatedScope: () => {},
  isObfuscatedCallExpression: () => {},
};

const nodeMappings = {
  fs: "FileSystemModule",
  path: "PathModule",
  http: "HttpModule",
  https: "HttpsModule",
  net: "NetworkModule",
  tls: "SecureSocketModule",
  os: "OperatingSystemModule",
  child_process: "ProcessSpawningModule",
  cluster: "MultiProcessModule",
  stream: "StreamModule",
  buffer: "BufferModule",
  crypto: "CryptoModule",
  util: "UtilityModule",
  events: "EventEmitterModule",
  assert: "AssertionModule",
  readline: "ReadlineModule",
  zlib: "CompressionModule",
  dns: "DNSModule",
  url: "URLModule",
  querystring: "QueryStringModule",
  timers: "TimersModule",
  vm: "VirtualMachineModule",
  inspector: "InspectorModule",
  worker_threads: "WorkerThreadsModule",
  process: "ProcessGlobal",
  global: "GlobalScope",
  require: "ModuleImport",
  module: "ModuleObject",
  exports: "ModuleExports",
  __dirname: "CurrentDirectory",
  __filename: "CurrentFile",
  setImmediate: "AsyncExecution",
  nextTick: "MicrotaskQueue",
  createServer: "ServerCreation",
  listen: "ServerListening",
  emit: "EventEmission",
  on: "EventBinding",
  writeFile: "FileWrite",
  readFile: "FileRead",
  exec: "ExecuteShellCommand",
  spawn: "SpawnChildProcess",
  fork: "ForkProcess",
  pipe: "StreamPiping",
  unpipe: "StreamUnpiping",
  write: "StreamWrite",
  end: "StreamEnd",
  read: "StreamRead",
  createReadStream: "FileReadStream",
  createWriteStream: "FileWriteStream",
  stat: "FileStats",
  readdir: "ReadDirectory",
  mkdir: "MakeDirectory",
  rmdir: "RemoveDirectory",
  unlink: "DeleteFile",
  rename: "RenameFile",
  existsSync: "CheckFileExists",
  readFileSync: "SyncFileRead",
  writeFileSync: "SyncFileWrite",
  join: "JoinPath",
  resolve: "ResolvePath",
  basename: "GetFileName",
  dirname: "GetDirectoryName",
  extname: "GetFileExtension",
  parse: "ParseURL",
  format: "FormatURL",
  stringify: "StringifyQuery",
  parseQuery: "ParseQueryString",
  setTimeout: "DelayExecution",
  clearTimeout: "CancelTimeout",
  setInterval: "RepeatExecution",
  clearInterval: "CancelInterval",
  argv: "CommandLineArguments",
  cwd: "CurrentWorkingDirectory",
  exit: "ProcessExit",
  kill: "TerminateProcess",
  uptime: "SystemUptime",
  hostname: "SystemHostname",
  platform: "OperatingSystemPlatform",
  arch: "SystemArchitecture",
  memoryUsage: "MemoryStats",
};

const nodepatterns = {
  fs: "fileSystemAccess",
  path: "pathResolution",
  http: "httpServer",
  https: "httpsServer",
  net: "networkSocket",
  tls: "secureSocket",
  os: "systemInfo",
  child_process: "processSpawning",
  cluster: "multiProcessManagement",
  stream: "streamHandling",
  buffer: "binaryBuffer",
  crypto: "encryption",
  util: "utilityFunctions",
  events: "eventEmitter",
  assert: "assertionTesting",
  readline: "interactiveCLI",
  zlib: "compression",
  dns: "domainLookup",
  url: "urlParsing",
  querystring: "queryParsing",
  timers: "timingFunctions",
  vm: "virtualMachine",
  inspector: "debuggingTools",
  worker_threads: "threading",
  process: "processControl",
  global: "globalScope",
  require: "moduleImport",
  module: "moduleObject",
  exports: "moduleExports",
  __dirname: "currentDirectory",
  __filename: "currentFile",
  setImmediate: "asyncExecution",
  nextTick: "microtaskQueue",
  createServer: "serverCreation",
  listen: "serverListening",
  emit: "eventEmission",
  on: "eventBinding",
  writeFile: "fileWrite",
  readFile: "fileRead",
};

const angularMappings = {
  ng: "AngularCore",
  ngOnInit: "onInitLifecycle",
  ngOnDestroy: "onDestroyLifecycle",
  ngModule: "AngularModule",
  ngComponent: "AngularComponent",
  ngService: "AngularService",
  ngInjectable: "AngularInjectable",
  ngPipe: "AngularPipe",
  ngDirective: "AngularDirective",
  ngFor: "ngForDirective",
  ngIf: "ngIfDirective",
  ngSwitch: "ngSwitchDirective",
  ngModel: "ngModelDirective",
  ngClass: "ngClassDirective",
  ngStyle: "ngStyleDirective",
};

const vueMappings = {
  vm: "VueInstance",
  $el: "rootElement",
  $refs: "elementRefs",
  $emit: "emitEvent",
  $nextTick: "nextTickCallback",
  $watch: "watchProperty",
  $set: "setReactiveProperty",
  $data: "componentData",
  $props: "componentProps",
  $computed: "computedProperties",
  $methods: "componentMethods",
  $options: "componentOptions",
};

const svelteMappings = {
  $$: "svelteInternal",
  $capture_state: "captureState",
  $inject_state: "injectState",
  $on: "onEvent",
  $destroy: "destroyComponent",
  $set: "setProps",
  $update: "updateComponent",
};

const utilityMappings = {
  _: "lodash",
  R: "ramda",
  fp: "lodashFP",
  map: "mapArray",
  filter: "filterArray",
  reduce: "reduceArray",
  compose: "composeFunctions",
  curry: "curryFunction",
  pipe: "pipeFunctions",

  clone: "cloneObject",
  merge: "mergeObjects",
  assign: "assignProperties",
  pick: "pickKeys",
  omit: "omitKeys",
  debounce: "debounceFunction",
  throttle: "throttleFunction",
  memoize: "memoizeFunction",
  flatten: "flattenArray",
  uniq: "uniqueValues",
  sortBy: "sortByProperty",
  groupBy: "groupByProperty",
  chunk: "chunkArray",
  compact: "removeFalsyValues",
  zip: "zipArrays",
  unzip: "unzipArrays",
  intersection: "arrayIntersection",
  difference: "arrayDifference",
  union: "arrayUnion",
  isEqual: "deepEqualityCheck",
  isEmpty: "checkIfEmpty",
  isArray: "checkIfArray",
  isObject: "checkIfObject",
  isFunction: "checkIfFunction",
  isString: "checkIfString",
  isNumber: "checkIfNumber",
  get: "safeGetProperty",
  set: "safeSetProperty",
  has: "checkPropertyExists",
  defaults: "applyDefaultValues",
  range: "generateRange",
  times: "repeatFunction",
  identity: "identityFunction",
  constant: "constantFunction",
  noop: "noOperationFunction",
};

const backendMappings = {
  req: "request",
  res: "response",
  next: "nextMiddleware",
  app: "expressApp",
  ctx: "koaContext",
  router: "expressRouter",
  middleware: "routeMiddleware",
  body: "requestBody",
  query: "queryParams",
  params: "routeParams",
  headers: "requestHeaders",
  cookies: "requestCookies",
  session: "userSession",
  status: "responseStatus",
  send: "sendResponse",
  json: "sendJson",
  redirect: "redirectResponse",
  render: "renderTemplate",
  locals: "responseLocals",
  baseUrl: "baseRouteUrl",
  originalUrl: "originalRequestUrl",
  hostname: "requestHostname",
  ip: "clientIpAddress",
  method: "httpMethod",
  url: "requestUrl",
  path: "requestPath",
  protocol: "requestProtocol",
  secure: "isHttps",
  xhr: "isAjaxRequest",
  use: "registerMiddleware",
  get: "httpGetRoute",
  post: "httpPostRoute",
  put: "httpPutRoute",
  delete: "httpDeleteRoute",
  patch: "httpPatchRoute",
  all: "httpAllMethods",
  listen: "startServer",
  set: "setAppConfig",
  enable: "enableFeature",
  disable: "disableFeature",

  createServer: "createHttpServer",
  handleRequest: "handleIncomingRequest",
  handleError: "errorHandler",
  validate: "requestValidator",
  authorize: "authorizationMiddleware",
  authenticate: "authenticationMiddleware",
  logger: "loggingMiddleware",
  cors: "corsMiddleware",
  helmet: "securityHeadersMiddleware",
  rateLimit: "rateLimitingMiddleware",
  compression: "responseCompression",
  static: "serveStaticFiles",
  jsonParser: "parseJsonBody",
  urlencodedParser: "parseUrlEncodedBody",
  errorHandler: "globalErrorHandler",
  notFoundHandler: "notFoundMiddleware",

  controller: "routeController",
  service: "businessLogicService",
  repository: "dataAccessLayer",
  model: "dataModel",
  schema: "validationSchema",
  config: "appConfiguration",
  env: "environmentVariables",
  loggerService: "loggingService",
  cache: "cacheLayer",
  database: "databaseConnection",
  connect: "connectToDatabase",
  disconnect: "disconnectDatabase",
};
const {
  moduleIdMapping,
  analyzeModuleType,
  getModuleName,
} = require("./module_analyzer");

function generalJSPatterns(code, patterns) {
  if (
    code.includes("eval(") ||
    code.includes("Function(") ||
    code.includes("setTimeout(") ||
    code.includes("setInterval(") ||
    code.includes("document.write(") ||
    code.includes("window.location") ||
    code.includes("location.href") ||
    code.includes("innerHTML") ||
    code.includes("outerHTML") ||
    code.includes("atob(") ||
    code.includes("btoa(") ||
    code.includes("Array.from(") ||
    code.includes("Object.assign(") ||
    code.includes("Object.entries(") ||
    code.includes("Object.values(") ||
    code.includes("Object.keys(") ||
    code.includes("Object.defineProperty(") ||
    code.includes("Object.create(") ||
    code.includes("Object.freeze(") ||
    code.includes("Object.seal(") ||
    code.includes("Object.prototype") ||
    code.includes("Array.prototype") ||
    code.includes("String.prototype") ||
    code.includes("Promise.resolve(") ||
    code.includes("Promise.reject(") ||
    code.includes("Promise.all(") ||
    code.includes("Promise.race(") ||
    code.includes("Promise.any(") ||
    code.includes("async function") ||
    code.includes("await ")
  ) {
    addPattern(patterns, "generalJS", "Contains general JavaScript patterns");
  }
}

function detectWebpackPatterns(code) {
  return (
    code.includes("webpackChunk") ||
    code.includes(".push([") ||
    /[\d]+:\s*\([^)]+\)\s*=>/.test(code) ||
    // Additional patterns
    code.includes("__webpack_require__") ||
    code.includes("__webpack_exports__") ||
    code.includes("__webpack_modules__") ||
    code.includes("webpackJsonp") ||
    code.includes("webpackPublicPath") ||
    code.includes("webpack_require") ||
    code.includes("webpackHotUpdate") ||
    code.includes("webpack/runtime") ||
    code.includes("webpack/buildin") ||
    code.includes("webpack/bootstrap") ||
    code.includes("webpack/module") ||
    code.includes("webpackChunkName") ||
    code.includes("webpackPrefetch") ||
    code.includes("webpackPreload") ||
    code.includes("webpackMode") ||
    code.includes("webpackIgnore") ||
    code.includes("webpackInclude") ||
    code.includes("webpackExclude") ||
    code.includes("webpackMagicComment") ||
    code.includes("webpackDevtool") ||
    code.includes("webpackHash") ||
    code.includes("webpackChunkLoad") ||
    code.includes("webpackChunkLoading") ||
    code.includes("webpackChunkFilename") ||
    code.includes("webpackChunkGlobal") ||
    code.includes("webpackChunkCallback") ||
    code.includes("webpackChunkPush") ||
    code.includes("webpackChunkInstall") ||
    code.includes("webpackChunkLoadCallback") ||
    code.includes("webpackChunkLoadError")
  );
}

// --- React Event System Renaming ---
function applyReactEventSystemRenaming(code, analysis) {
  let result = code;
  const renames = [];
  const hasReactPatterns =
    code.includes("stopPropagation") ||
    code.includes("pointerId") ||
    code.includes("switch") ||
    code.includes("case 'focusin'") ||
    code.includes("Ht") ||
    code.includes("Qt") ||
    code.includes("Hr") ||
    code.includes("Yt") ||
    code.includes("React.createElement") ||
    code.includes("useEffect") ||
    code.includes("useState") ||
    code.includes("useRef") ||
    code.includes("useCallback") ||
    code.includes("useMemo") ||
    code.includes("useContext") ||
    code.includes("useReducer") ||
    code.includes("useLayoutEffect") ||
    code.includes("useImperativeHandle") ||
    code.includes("memo") ||
    code.includes("forwardRef") ||
    code.includes("Fragment") ||
    code.includes("Suspense") ||
    code.includes("lazy") ||
    code.includes("setState") ||
    code.includes("componentDidMount") ||
    code.includes("componentWillUnmount") ||
    code.includes("shouldComponentUpdate") ||
    code.includes("render") ||
    code.includes("props.children") ||
    code.includes("className") ||
    code.includes("onClick") ||
    code.includes("onChange") ||
    code.includes("onSubmit") ||
    code.includes("ref.current") ||
    code.includes("event.target") ||
    code.includes("dangerouslySetInnerHTML");

  if (!hasReactPatterns) return { code: result, renames };

  const reactEventMappings = {
    Yt: "handleDOMEvent",
    Ht: "isEventSystemEnabled",
    Qt: "getEventTargetNode",
    Hr: "dispatchEventForPluginEventSystem",
    Nt: "accumulateEventListeners",
    Lt: "accumulateTwoPhaseDispatches",
    Rt: "focusInDispatchListeners",
    _t: "dragEnterDispatchListeners",
    Ot: "mouseOverDispatchListeners",
    Pt: "pointerOverDispatchListenersMap",
    jt: "gotPointerCaptureDispatchListenersMap",
    Xt: "eventListenersMap",
    Mt: "specialDOMEventTypes",
    wo: "getClosestInstanceFromNode",
    xt: "processDispatchListeners",

    // 🔧 Additional 30 mappings
    Zt: "getRawEventName",
    Bt: "registerSimplePluginEvents",
    Ft: "registerTwoPhasePluginEvents",
    Dt: "extractEvents",
    Ct: "getListenerMapForElement",
    Et: "getEventPriority",
    At: "getEventTarget",
    St: "getEventListenerSet",
    It: "getEventHandlerListener",
    Tt: "getEventTargetChildHost",
    Vt: "getEventTargetParentHost",
    Ut: "getEventTargetFiber",
    Gt: "getEventTargetContainer",
    Kt: "getEventTargetDocument",
    Jt: "getEventTargetWindow",
    Wt: "getEventTargetRoot",
    $t: "getEventTargetInstance",
    qt: "getEventTargetType",
    vt: "getEventTargetProps",
    yt: "getEventTargetState",
    kt: "getEventTargetFlags",
    bt: "getEventTargetListeners",
    gt: "getEventTargetDispatchQueue",
    mt: "getEventTargetResponder",
    st: "getEventTargetResponderInstance",
    rt: "getEventTargetResponderProps",
    lt: "getEventTargetResponderState",
    dt: "getEventTargetResponderContext",
    ft: "getEventTargetResponderPriority",
    nt: "getEventTargetResponderQueue",
  };

  Object.keys(reactEventMappings).forEach((oldName) => {
    const newName = reactEventMappings[oldName];
    let replaced = false;
    const funcPattern = new RegExp(`function\\s+${oldName}\\b`, "g");
    if (funcPattern.test(result)) {
      result = result.replace(funcPattern, `function ${newName}`);
      renames.push(`${oldName} → ${newName} (React Event System)`);
      replaced = true;
    }
    const assignmentPattern = new RegExp(
      `(var|let|const)\\s+${oldName}\\s*=`,
      "g"
    );
    if (assignmentPattern.test(result)) {
      result = result.replace(assignmentPattern, `$1 ${newName} =`);
      if (!replaced) {
        renames.push(`${oldName} → ${newName} (React Event System)`);
        replaced = true;
      }
    }
    const refPattern = new RegExp(
      `(?<!\\w)${oldName}(?!\\w)(?=\\s*[\\(\\[\\.\\,\\;\\)\\}\\]])`,
      "g"
    );
    if (refPattern.test(result)) {
      result = result.replace(refPattern, newName);
      if (!replaced) {
        renames.push(`${oldName} → ${newName} (React Event System)`);
      }
    }
  });

  result = result.replace(
    /case\s+'focusin':/g,
    "case 'focusin': // Handle focus events"
  );
  result = result.replace(
    /case\s+'dragenter':/g,
    "case 'dragenter': // Handle drag enter events"
  );
  result = result.replace(
    /case\s+'mouseover':/g,
    "case 'mouseover': // Handle mouse over events"
  );
  result = result.replace(
    /case\s+'pointerover':/g,
    "case 'pointerover': // Handle pointer over events"
  );
  result = result.replace(
    /case\s+'gotpointercapture':/g,
    "case 'gotpointercapture': // Handle pointer capture events"
  );
  result = result.replace(
    /r\.stopPropagation\(\)/g,
    "event.stopPropagation() // Stop event propagation"
  );

  // 🆕 30 additional replacements
  result = result.replace(
    /case\s+'click':/g,
    "case 'click': // Handle click events"
  );
  result = result.replace(
    /case\s+'keydown':/g,
    "case 'keydown': // Handle key down events"
  );
  result = result.replace(
    /case\s+'keyup':/g,
    "case 'keyup': // Handle key up events"
  );
  result = result.replace(
    /case\s+'submit':/g,
    "case 'submit': // Handle form submit events"
  );
  result = result.replace(
    /case\s+'change':/g,
    "case 'change': // Handle input change events"
  );
  result = result.replace(
    /case\s+'blur':/g,
    "case 'blur': // Handle blur events"
  );
  result = result.replace(
    /case\s+'focus':/g,
    "case 'focus': // Handle focus events"
  );
  result = result.replace(
    /case\s+'dblclick':/g,
    "case 'dblclick': // Handle double click events"
  );
  result = result.replace(
    /case\s+'contextmenu':/g,
    "case 'contextmenu': // Handle right-click events"
  );
  result = result.replace(
    /case\s+'wheel':/g,
    "case 'wheel': // Handle mouse wheel events"
  );
  result = result.replace(
    /case\s+'touchstart':/g,
    "case 'touchstart': // Handle touch start events"
  );
  result = result.replace(
    /case\s+'touchend':/g,
    "case 'touchend': // Handle touch end events"
  );
  result = result.replace(
    /case\s+'touchmove':/g,
    "case 'touchmove': // Handle touch move events"
  );
  result = result.replace(
    /case\s+'resize':/g,
    "case 'resize': // Handle window resize events"
  );
  result = result.replace(
    /case\s+'scroll':/g,
    "case 'scroll': // Handle scroll events"
  );
  result = result.replace(
    /case\s+'mouseenter':/g,
    "case 'mouseenter': // Handle mouse enter events"
  );
  result = result.replace(
    /case\s+'mouseleave':/g,
    "case 'mouseleave': // Handle mouse leave events"
  );
  result = result.replace(
    /case\s+'input':/g,
    "case 'input': // Handle input events"
  );
  result = result.replace(
    /case\s+'animationstart':/g,
    "case 'animationstart': // Handle animation start"
  );
  result = result.replace(
    /case\s+'animationend':/g,
    "case 'animationend': // Handle animation end"
  );
  result = result.replace(
    /case\s+'transitionstart':/g,
    "case 'transitionstart': // Handle transition start"
  );
  result = result.replace(
    /case\s+'transitionend':/g,
    "case 'transitionend': // Handle transition end"
  );
  result = result.replace(
    /case\s+'dragstart':/g,
    "case 'dragstart': // Handle drag start events"
  );
  result = result.replace(
    /case\s+'dragend':/g,
    "case 'dragend': // Handle drag end events"
  );
  result = result.replace(
    /case\s+'drop':/g,
    "case 'drop': // Handle drop events"
  );
  result = result.replace(
    /case\s+'paste':/g,
    "case 'paste': // Handle paste events"
  );
  result = result.replace(
    /case\s+'copy':/g,
    "case 'copy': // Handle copy events"
  );
  result = result.replace(/case\s+'cut':/g, "case 'cut': // Handle cut events");
  result = result.replace(
    /case\s+'beforeunload':/g,
    "case 'beforeunload': // Handle page unload warning"
  );

  return { code: result, renames };
}

function applyAdvancedReactRenaming(code, analysis) {
  return { code: code, renames: [] };
}

// --- React Component Renaming ---
function applyReactComponentRenaming(code, analysis) {
  let result = code;
  const renames = [];
  const hasReactComponentPatterns =
    code.includes("useState") ||
    code.includes("useMemo") ||
    code.includes("useEffect") ||
    code.includes("props") ||
    code.includes("Pe.A") ||
    code.includes("ne.useState") ||
    code.includes("const [") ||
    // 🆕 30 additional patterns
    code.includes("useRef") ||
    code.includes("useCallback") ||
    code.includes("useContext") ||
    code.includes("useReducer") ||
    code.includes("useLayoutEffect") ||
    code.includes("useImperativeHandle") ||
    code.includes("forwardRef") ||
    code.includes("memo") ||
    code.includes("Fragment") ||
    code.includes("Suspense") ||
    code.includes("lazy") ||
    code.includes("return (") ||
    code.includes("export default") ||
    code.includes("function ") ||
    code.includes("=> (") ||
    code.includes("className=") ||
    code.includes("onClick=") ||
    code.includes("onChange=") ||
    code.includes("onSubmit=") ||
    code.includes("ref=") ||
    code.includes("children") ||
    code.includes("setState(") ||
    code.includes("componentDidMount") ||
    code.includes("componentWillUnmount") ||
    code.includes("shouldComponentUpdate") ||
    code.includes("render()") ||
    code.includes("React.createElement") ||
    code.includes("ReactDOM.render") ||
    code.includes("jsx-runtime") ||
    code.includes("createContext") ||
    code.includes("Provider") ||
    code.includes("Consumer");

  if (!hasReactComponentPatterns) return { code: result, renames };

  const reactMappings = {
    Sp: "StepComponent",
    Pe: "ReactLibrary",
    ue: "HookLibrary",
    ne: "ReactHooks",
    yp: "initialSteps",
    _p: "initialState",
    i: "currentIndex",
    o: "setCurrentIndex",
    l: "setState",
    c: "currentView",
    d: "setView",

    // 🆕 30 additional mappings
    mp: "useEffect",
    vp: "useState",
    hp: "useRef",
    gp: "useMemo",
    fp: "useCallback",
    bp: "useReducer",
    tp: "useContext",
    xp: "useLayoutEffect",
    Cp: "useImperativeHandle",
    Rp: "forwardRef",
    kp: "memo",
    wp: "Fragment",
    Ep: "Suspense",
    Tp: "lazy",
    Ap: "props",
    Dp: "children",
    Ip: "onClick",
    Op: "onChange",
    Lp: "onSubmit",
    Np: "className",
    Jp: "ref",
    Qp: "eventHandler",
    Zp: "handleClick",
    Yp: "handleChange",
    Xp: "handleSubmit",
    Vp: "isMounted",
    Bp: "componentDidMount",
    Fp: "componentWillUnmount",
    Gp: "shouldComponentUpdate",
    Hp: "renderComponent",
  };

  Object.keys(reactMappings).forEach((oldName) => {
    const newName = reactMappings[oldName];
    let replaced = false;
    const funcPattern = new RegExp(`function\\s+${oldName}\\b`, "g");
    if (funcPattern.test(result)) {
      result = result.replace(funcPattern, `function ${newName}`);
      renames.push(`${oldName} → ${newName} (React Component)`);
      replaced = true;
    }
    const varPattern = new RegExp(`(const|let|var)\\s+${oldName}\\s*=`, "g");
    if (varPattern.test(result)) {
      result = result.replace(varPattern, `$1 ${newName} =`);
      if (!replaced) {
        renames.push(`${oldName} → ${newName} (React Component)`);
        replaced = true;
      }
    }
    const refPattern = new RegExp(
      `(?<!\\w)${oldName}(?!\\w)(?=\\s*[\\(\\[\\.\\,\\;\\)\\}\\]])`,
      "g"
    );
    if (refPattern.test(result)) {
      result = result.replace(refPattern, newName);
      if (!replaced) {
        renames.push(`${oldName} → ${newName} (React Component)`);
      }
    }
  });

  result = result.replace(
    /\(\s*0\s*,\s*(\w+)\.(useState)\s*\)/g,
    "(0, $1.$2) // React useState hook"
  );
  result = result.replace(
    /\(\s*0\s*,\s*(\w+)\.(useMemo)\s*\)/g,
    "(0, $1.$2) // React useMemo hook"
  );
  result = result.replace(
    /\(\s*0\s*,\s*(\w+)\.(useEffect)\s*\)/g,
    "(0, $1.$2) // React useEffect hook"
  );

  return { code: result, renames };
}

// --- Module Context Renaming (Webpack etc.) ---
function applyModuleContextRenaming(code, analysis) {
  let result = code;
  const renames = [];
  if (
    code.includes("task-list") ||
    code.includes("sso-modal") ||
    code.includes("js-task-list-field") ||
    // 🆕 30 additional patterns
    code.includes("dashboard-container") ||
    code.includes("modal-overlay") ||
    code.includes("form-input") ||
    code.includes("submit-button") ||
    code.includes("cancel-button") ||
    code.includes("header-title") ||
    code.includes("nav-sidebar") ||
    code.includes("footer-links") ||
    code.includes("profile-avatar") ||
    code.includes("notification-badge") ||
    code.includes("search-bar") ||
    code.includes("loading-spinner") ||
    code.includes("error-message") ||
    code.includes("success-toast") ||
    code.includes("js-dropdown-toggle") ||
    code.includes("js-tab-content") ||
    code.includes("js-accordion-panel") ||
    code.includes("js-tooltip") ||
    code.includes("js-modal-close") ||
    code.includes("js-form-validator") ||
    code.includes("js-step-indicator") ||
    code.includes("react-root") ||
    code.includes("component-wrapper") ||
    code.includes("state-manager") ||
    code.includes("context-provider") ||
    code.includes("hook-initializer") ||
    code.includes("jsx-runtime") ||
    code.includes("fiber-node") ||
    code.includes("virtual-dom") ||
    code.includes("event-dispatcher") ||
    code.includes("hydration-complete")
  ) {
    const moduleMappings = {
      97213: "TaskListBehaviorModule",
      88402: "SSOHandlerModule",
      24791: "DialogManagerModule",
      21403: "UnknownModule21403",
      26559: "HeaderUtilityModule",
      6986: "UnknownModule6986",
      12559: "UnknownModule12559",
      21715: "SoftNavEventManagerModule",
      // 🆕 40 additional mappings
      30112: "UserProfileModule",
      44221: "NotificationCenterModule",
      11890: "AnalyticsTrackerModule",
      50987: "ThemeManagerModule",
      67345: "SearchBarModule",
      81234: "NavigationRouterModule",
      93456: "SettingsPanelModule",
      10234: "AuthTokenModule",
      11223: "FormValidationModule",
      12345: "DataSyncModule",
      13456: "CacheManagerModule",
      14567: "LocalizationModule",
      15678: "AccessibilityHelperModule",
      16789: "TooltipRendererModule",
      17890: "ModalWindowModule",
      18901: "SidebarToggleModule",
      19012: "BreadcrumbModule",
      20123: "FileUploaderModule",
      21234: "ImageCropperModule",
      22345: "VideoPlayerModule",
      23456: "AudioManagerModule",
      24567: "ChartRendererModule",
      25678: "TableSorterModule",
      26789: "PaginationModule",
      27890: "TagInputModule",
      28901: "DatePickerModule",
      29012: "TimeZoneConverterModule",
      30123: "SessionManagerModule",
      31234: "ErrorBoundaryModule",
      32345: "LoggerModule",
      33456: "StateMachineModule",
      34567: "EventBusModule",
      35678: "DragDropHandlerModule",
      36789: "ClipboardHelperModule",
      37890: "KeyboardShortcutModule",
      38901: "HoverIntentModule",
      39012: "ResizeObserverModule",
      40123: "MutationObserverModule",
      41234: "ScrollTrackerModule",
      42345: "UnknownModule42345",
    };

    Object.keys(moduleMappings).forEach((id) => {
      const newName = moduleMappings[id];
      const pattern = new RegExp(`(${id})\\s*:\\s*\\(`, "g");
      if (pattern.test(result)) {
        result = result.replace(pattern, `${newName} /* ${id} */: (`);
        renames.push(`${id} → ${newName} (Webpack Module ID - Contextual)`);
      }
    });
  }
  return { code: result, renames };
} // Helper function to guess module type based on content
function guessModuleType(code) {
  if (
    code.includes("innerHTML") ||
    code.includes("querySelector") ||
    code.includes("getElementById") ||
    code.includes("appendChild")
  ) {
    return "DOMUtility";
  } else if (
    code.includes("xhr") ||
    code.includes("fetch") ||
    code.includes("ajax") ||
    code.includes("http")
  ) {
    return "NetworkUtility";
  } else if (
    code.includes("JSON.parse") ||
    code.includes("JSON.stringify") ||
    code.includes("data")
  ) {
    return "DataUtility";
  } else if (
    code.includes("Math.") ||
    code.includes("parseInt") ||
    code.includes("parseFloat")
  ) {
    return "MathUtility";
  } else if (
    code.includes("cookie") ||
    code.includes("localStorage") ||
    code.includes("sessionStorage")
  ) {
    return "StorageUtility";
  } else if (
    code.includes("event") ||
    code.includes("click") ||
    code.includes("submit") ||
    code.includes("listener")
  ) {
    return "EventUtility";
  } else if (
    code.includes("animation") ||
    code.includes("transition") ||
    code.includes("style")
  ) {
    return "AnimationUtility";
  } else if (
    code.includes("route") ||
    code.includes("navigate") ||
    code.includes("history")
  ) {
    return "RouterUtility";
  }
  return null;
}

// --- Webpack Chunk Renaming (non-breaking; annotate numeric module IDs) ---
function applyWebpackChunkRenaming(code) {
  let result = code;
  const renames = [];

  try {
    // Find loadable chunk push patterns and annotate module numeric keys with comments
    const chunkRegex =
      /(push\s*\(\s*\[\s*\[(\d+)\]\s*,\s*\{)([\s\S]*?)(\}\s*\]\s*\)\s*\))/g;

    result = result.replace(
      chunkRegex,
      (full, startObj, chunkId, objBody, endObj) => {
        // Annotate each numeric module id safely: keep numeric key and add an inline comment
        const moduleEntryRegex = /(\b(\d{2,})\b)(\s*):\s*\(/g; // capture numeric id
        let annotatedBody = objBody.replace(
          moduleEntryRegex,
          (m, idFull, idNumber, ws) => {
            // Try to intelligently guess the module's purpose by analyzing nearby code
            // Get a reasonable chunk of code to analyze (200 chars around the match)
            const startPos = Math.max(0, objBody.indexOf(m) - 100);
            const endPos = Math.min(objBody.length, objBody.indexOf(m) + 200);
            const codeContext = objBody.substring(startPos, endPos);

            // Use our enhanced module analyzer to get a meaningful name
            const moduleName = getModuleName(idNumber, codeContext);

            renames.push(`${idNumber} → ${moduleName} (chunk ${chunkId})`);
            return `${idNumber} /* ${moduleName} (chunk ${chunkId}) */:${ws}(`;
          }
        );
        return `${startObj}${annotatedBody}${endObj}`;
      }
    );
  } catch (e) {
    // Fail-safe: do nothing if regex blows up
    console.warn("Warning: Module ID annotation failed:", e.message);
  }

  return { code: result, renames };
}

// --- Annotate module resolver calls like foo(66208) without changing behavior ---
function applyModuleIdCallAnnotation(code) {
  let result = code;
  const renames = [];
  try {
    // Match identifier(number) where number has at least 3 digits: removeElement(66208)
    const callIdRegex = /(\b[A-Za-z_\$][\w\$]*\b)\(\s*(\d{3,})\s*\)/g;
    result = result.replace(callIdRegex, (m, fn, id) => {
      renames.push(`${fn}(${id})`);
      return `${fn}(${id}) /* Module ${id} */`;
    });
  } catch (e) {}
  return { code: result, renames };
}

// --- Annotate module function params (module, exports, require) inside numeric module maps ---
function annotateModuleFunctionParams(code) {
  let result = code;
  const renames = [];
  try {
    // Arrow function form: 12345: (a,b,c) => {
    const arrowRe =
      /(\b\d{2,}\b\s*:\s*\()\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*(\)\s*=>\s*\{)/g;
    result = result.replace(arrowRe, (m, start, p1, p2, p3, end) => {
      renames.push(`params for module annotated: ${p1}, ${p2}, ${p3}`);
      return `${start}${p1} /* module */, ${p2} /* exports */, ${p3} /* require */${end}`;
    });
    // Function form: 12345: function(a,b,c){
    const funcRe =
      /(\b\d{2,}\b\s*:\s*function\s*\()\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*(\)\s*\{)/g;
    result = result.replace(funcRe, (m, start, p1, p2, p3, end) => {
      renames.push(`params for module annotated: ${p1}, ${p2}, ${p3}`);
      return `${start}${p1} /* module */, ${p2} /* exports */, ${p3} /* require */${end}`;
    });
  } catch (e) {}
  return { code: result, renames };
}

// --- Framework Renaming ---
function applyFrameworkRenaming(code, analysis) {
  let result = code;
  const renames = [];
  function applyMappings(mappings, context) {
    Object.keys(mappings).forEach((oldName) => {
      const newName = mappings[oldName];
      const refPattern = new RegExp(
        `(?<!\\w)${oldName}(?!\\w)(?=\\s*[\\(\\[\\.\\,\\;\\)\\}\\]])`,
        "g"
      );
      if (refPattern.test(result)) {
        result = result.replace(refPattern, newName);
        renames.push(`${oldName} → ${newName} (${context})`);
      }
    });
  }
  applyMappings(angularMappings, "Angular");
  applyMappings(vueMappings, "Vue.js");
  applyMappings(svelteMappings, "Svelte");
  applyMappings(utilityMappings, "Utility Library");
  applyMappings(backendMappings, "Backend Framework");
  applyMappings(nodepatterns, "Node.js Patterns");
  //applyMappings(generalJSPatterns, "General JavaScript Patterns");
  applyMappings(nodeMappings, "Node.js Modules");
  applyMappings(patternsmapping, "Patterns Mapping");
  applyMappings(deobfuscatormapping, "Deobfuscator Mapping");

  return { code: result, renames };
}

// --- Exports ---
module.exports = {
  recognizePatterns,
  controlFlowAnalyzer,
  constantFolder,
  stringArrayDetector,
  stringDecryptor,
  minifiedCodeHandler,
  frameworkDetector,
  syntaxFixer,
  applyReactEventSystemRenaming,
  applyAdvancedReactRenaming,
  applyReactComponentRenaming,
  applyModuleContextRenaming,
  applyFrameworkRenaming,
  applyWebpackChunkRenaming,
  applyModuleIdCallAnnotation,
  annotateModuleFunctionParams,
};
