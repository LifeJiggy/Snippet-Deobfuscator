/**
 * Control Flow Analyzer Agent - Core Implementation
 * World-class control flow analysis for JavaScript deobfuscation
 * 
 * This module provides comprehensive control flow analysis including:
 * - Branch, loop, and switch analysis
 * - Complexity metrics calculation
 * - Obfuscation pattern detection
 * - Web framework analysis (React, Vue, Angular, Node.js)
 * - Security vulnerability detection
 * - Performance issue identification
 */
const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");

class ControlFlowAnalyzerAgent {
  constructor(options = {}) {
    this.name = "control-flow-analyzer";
    this.version = "3.0.0";
    this.options = this.initializeOptions(options);
    this.stats = {
      branches: 0,
      loops: 0,
      switches: 0,
      deadCode: 0,
      flattening: 0,
      opaquePredicates: 0,
      functions: 0,
      asyncFunctions: 0,
      tryCatch: 0
    };
    
    this.webFrameworkPatterns = this.initializeWebFrameworkPatterns();
    this.securityPatterns = this.initializeSecurityPatterns();
    this.obfuscationPatterns = this.initializeObfuscationPatterns();
  }

  /**
   * Initialize agent options with comprehensive defaults
   */
  initializeOptions(options) {
    return {
      maxNestingDepth: options.maxNestingDepth || 10,
      maxSwitchCases: options.maxSwitchCases || 100,
      detectInfiniteLoops: options.detectInfiniteLoops !== false,
      detectRecursion: options.detectRecursion !== false,
      trackComplexity: options.trackComplexity !== false,
      generateCallGraph: options.generateCallGraph || false,
      analyzeDataFlow: options.analyzeDataFlow || false,
      webFrameworkSupport: options.webFrameworkSupport !== false,
      securityAnalysis: options.securityAnalysis || false,
      performanceAnalysis: options.performanceAnalysis || false,
      verboseLogging: options.verboseLogging || false,
      timeout: options.timeout || 45000,
      ...options
    };
  }

  /**
   * Initialize web framework detection patterns
   */
  initializeWebFrameworkPatterns() {
    return {
      react: {
        hooks: ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue'],
        patterns: [/use[A-Z]\w+/, /React\.\w+/, /_jsx/, /_jsxs/, /createElement/],
        stateManagement: [/useState/, /useReducer/, /useContext/],
        eventHandlers: [/onClick/, /onChange/, /onSubmit/, /onMouseEnter/, /onMouseLeave/],
        lifecycle: [/componentDidMount/, /componentDidUpdate/, /componentWillUnmount/, /componentDidCatch/]
      },
      vue: {
        reactive: [/reactive\(/, /ref\(/, /computed\(/],
        lifecycle: [/onMounted/, /onUpdated/, /onUnmounted/, /created/, /mounted/],
        watch: [/watch\(/, /watchEffect\(/],
        methods: [/methods:/],
        template: [/v-if/, /v-for/, /v-show/, /v-bind/, /v-on/]
      },
      angular: {
        decorators: [/@Component/, /@Injectable/, /@Pipe/, /@Directive/, /@NgModule/],
        lifecycle: [/ngOnInit/, /ngOnChanges/, /ngOnDestroy/, /ngAfterViewInit/],
        rxjs: [/\.subscribe\(/, /\.pipe\(/, /Observable/, /Subject/, /BehaviorSubject/],
        di: [/constructor\(/, /@Inject\(/, /inject\(/],
        http: [/HttpClient/, /\.get\(/, /\.post\(/]
      },
      svelte: {
        reactive: [/\$/, /\$state/, /\$derived/, /\$effect/],
        lifecycle: [/onMount/, /onDestroy/, /beforeUpdate/, /afterUpdate/],
        stores: [/writable/, /readable/, /derived/],
        events: [/dispatch/, /createEventDispatcher/]
      },
      nodejs: {
        express: [/app\.(get|post|put|delete|patch)/, /router\.(get|post|put|delete|patch)/],
        middleware: [/app\.use\(/, /router\.use\(/],
        eventEmitter: [/\.on\(/, /\.emit\(/, /EventEmitter/],
        streams: [/\.pipe\(/, /createReadStream/, /createWriteStream/],
        async: [/async\s+\w+\s*\(/, /await\s+/, /\.then\(/, /\.catch\(/]
      },
      nextjs: {
        ssg: [/getStaticProps/, /getStaticPaths/],
        ssr: [/getServerSideProps/],
        api: [/\/api\//, /handler\(/, /req\./, /res\./],
        router: [/useRouter/, /usePathname/, /useSearchParams/],
        appRouter: [/useParams/, /useSearchParams/, /useRouter\(\)/]
      }
    };
  }

  /**
   * Initialize security vulnerability detection patterns
   */
  initializeSecurityPatterns() {
    return {
      codeInjection: {
        patterns: [/eval\s*\(/, /new\s+Function\s*\(/, /setTimeout\s*\(\s*['"`]/, /setInterval\s*\(\s*['"`]/],
        severity: 'critical',
        description: 'Potential code injection vulnerability'
      },
      pathTraversal: {
        patterns: [/\.\.\//, /readFile\s*\([^)]*\+[^)]*\)/, /readFileSync\s*\([^)]*\+[^)]*\)/],
        severity: 'high',
        description: 'Path traversal vulnerability'
      },
      commandInjection: {
        patterns: [/exec\s*\(/, /execSync\s*\(/, /spawn\s*\(/, /spawnSync\s*\(/, /child_process/],
        severity: 'critical',
        description: 'Command injection vulnerability'
      },
      prototypePollution: {
        patterns: [/\.__proto__/, /\.prototype\s*=\s*\{/, /Object\.assign\s*\([^,]*[^,]*\{/],
        severity: 'high',
        description: 'Prototype pollution vulnerability'
      },
      xss: {
        patterns: [/\.innerHTML\s*=/, /document\.write\s*\(/, /\.outerHTML\s*=/],
        severity: 'high',
        description: 'Cross-site scripting vulnerability'
      },
      hardcodedSecrets: {
        patterns: [/(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i],
        severity: 'critical',
        description: 'Hardcoded sensitive data'
      },
      insecureRandom: {
        patterns: [/Math\.random\s*\(\s*\)/],
        severity: 'medium',
        description: 'Insecure random number generation'
      },
      evalWithUserInput: {
        patterns: [/eval\s*\(\s*[^)]*(?:req\.|query|param|body|input|data|user)/i],
        severity: 'critical',
        description: 'eval with user-controlled input'
      }
    };
  }

  /**
   * Initialize obfuscation detection patterns
   */
  initializeObfuscationPatterns() {
    return {
      controlFlowFlattening: {
        detect: (switches) => switches.length > 10 || switches.some(s => s.cases > 10),
        severity: 'high',
        description: 'Control flow flattening detected - code structure obscured'
      },
      opaquePredicates: {
        detect: (branches) => branches.some(b => b.type === 'opaque'),
        severity: 'medium',
        description: 'Opaque predicates found - potentially misleading conditions'
      },
      deadCode: {
        detect: (deadCode) => deadCode.length > 0,
        severity: 'low',
        description: 'Unreachable code detected'
      },
      indirectJump: {
        patterns: [/\[\s*\w+\s*\]\s*\(\s*\)/, /Function\([^)]*\)/],
        severity: 'medium',
        description: 'Indirect jump patterns detected'
      },
      dispatcherPattern: {
        detect: (switches) => switches.some(s => s.cases > 20),
        severity: 'low',
        description: 'Dispatcher pattern detected'
      }
    };
  }

  /**
   * Main analysis entry point - orchestrates complete control flow analysis
   */
  analyze(code, context = {}) {
    const startTime = Date.now();
    const result = {
      agent: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      branches: [],
      loops: [],
      switches: [],
      functions: [],
      flattening: [],
      opaquePredicates: [],
      deadCode: [],
      complexity: {},
      callGraph: null,
      asyncFlows: [],
      exceptions: [],
      webFramework: null,
      securityIssues: [],
      performanceIssues: [],
      statistics: {},
      warnings: [],
      errors: [],
      analysisTime: 0
    };

    try {
      if (this.options.verboseLogging) {
        console.log('[ControlFlowAnalyzer] Starting analysis...');
      }

      const ast = this.parseCode(code);
      if (!ast) {
        throw new Error('Failed to parse code into AST');
      }

      this.stats = { branches: 0, loops: 0, switches: 0, deadCode: 0, flattening: 0, opaquePredicates: 0, functions: 0, asyncFunctions: 0, tryCatch: 0 };

      this.analyzeBranches(ast, result);
      this.analyzeLoops(ast, result);
      this.analyzeSwitches(ast, result);
      this.analyzeFunctions(ast, result);
      this.detectFlattening(ast, result);
      this.detectOpaquePredicates(ast, result);
      this.detectDeadCode(ast, result);
      this.analyzeAsyncFlows(ast, result);
      this.analyzeExceptions(ast, result);

      if (this.options.trackComplexity) {
        result.complexity = this.calculateComplexityMetrics(result, code);
      }

      if (this.options.generateCallGraph) {
        result.callGraph = this.generateCallGraph(ast);
      }

      if (this.options.webFrameworkSupport) {
        result.webFramework = this.detectWebFramework(code, ast);
      }

      if (this.options.securityAnalysis) {
        result.securityIssues = this.performSecurityAnalysis(code);
      }

      if (this.options.performanceAnalysis) {
        result.performanceIssues = this.performPerformanceAnalysis(result);
      }

      result.statistics = this.getStatistics();
      result.analysisTime = Date.now() - startTime;

      if (this.options.verboseLogging) {
        console.log(`[ControlFlowAnalyzer] Analysis complete in ${result.analysisTime}ms`);
      }

    } catch (error) {
      result.errors.push({
        type: 'analysis-error',
        message: error.message,
        stack: error.stack
      });
    }

    return result;
  }

  /**
   * Parse JavaScript code into AST using Babel
   */
  parseCode(code) {
    try {
      return parse(code, {
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'dynamicImport']
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze if/else branches and ternary expressions
   */
  analyzeBranches(ast, result) {
    traverse(ast, {
      IfStatement: {
        enter: (path) => {
          const branch = {
            type: 'if',
            condition: this.extractConditionCode(path.node.test),
            location: this.extractLocation(path.node.loc),
            hasElse: !!path.node.alternate,
            hasElseIf: path.node.alternate?.type === 'IfStatement',
            nestingLevel: this.calculateNestingLevel(path),
            conditionComplexity: this.calculateConditionComplexity(path.node.test)
          };
          
          if (path.node.consequent) {
            branch.consequentType = path.node.consequent.type;
            branch.consequentStatements = this.countStatements(path.node.consequent);
          }
          
          result.branches.push(branch);
          this.stats.branches++;
        }
      },

      ConditionalExpression: {
        enter: (path) => {
          result.branches.push({
            type: 'ternary',
            condition: this.extractConditionCode(path.node.test),
            location: this.extractLocation(path.node.loc),
            nestingLevel: this.calculateNestingLevel(path),
            isNested: path.parent?.type === 'ConditionalExpression'
          });
          this.stats.branches++;
        }
      },

      LogicalExpression: {
        enter: (path) => {
          if (path.parent?.type === 'IfStatement' || path.parent?.type === 'ConditionalExpression') {
            result.branches.push({
              type: 'logical',
              operator: path.node.operator,
              location: this.extractLocation(path.node.loc),
              leftComplexity: this.calculateConditionComplexity(path.node.left),
              rightComplexity: this.calculateConditionComplexity(path.node.right)
            });
            this.stats.branches++;
          }
        }
      }
    });
  }

  /**
   * Analyze all loop types
   */
  analyzeLoops(ast, result) {
    traverse(ast, {
      ForStatement: {
        enter: (path) => {
          const loop = {
            type: 'for',
            location: this.extractLocation(path.node.loc),
            hasInit: !!path.node.init,
            hasTest: !!path.node.test,
            hasUpdate: !!path.node.update,
            nestingLevel: this.calculateNestingLevel(path),
            statementCount: this.countStatements(path.node.body),
            isInfinite: this.detectInfiniteLoop(path.node, 'for')
          };
          
          if (path.node.init) loop.initCode = this.generateCode(path.node.init);
          if (path.node.test) loop.testCode = this.generateCode(path.node.test);
          if (path.node.update) loop.updateCode = this.generateCode(path.node.update);
          
          result.loops.push(loop);
          this.stats.loops++;
        }
      },

      ForInStatement: {
        enter: (path) => {
          result.loops.push({
            type: 'for-in',
            location: this.extractLocation(path.node.loc),
            iterator: this.generateCode(path.node.left),
            iterable: this.generateCode(path.node.right),
            nestingLevel: this.calculateNestingLevel(path),
            statementCount: this.countStatements(path.node.body)
          });
          this.stats.loops++;
        }
      },

      ForOfStatement: {
        enter: (path) => {
          result.loops.push({
            type: 'for-of',
            location: this.extractLocation(path.node.loc),
            iterator: this.generateCode(path.node.left),
            iterable: this.generateCode(path.node.right),
            isAsync: path.node.await,
            nestingLevel: this.calculateNestingLevel(path),
            statementCount: this.countStatements(path.node.body)
          });
          this.stats.loops++;
        }
      },

      WhileStatement: {
        enter: (path) => {
          const loop = {
            type: 'while',
            location: this.extractLocation(path.node.loc),
            condition: this.generateCode(path.node.test),
            nestingLevel: this.calculateNestingLevel(path),
            statementCount: this.countStatements(path.node.body),
            isInfinite: this.detectInfiniteLoop(path.node, 'while')
          };
          
          result.loops.push(loop);
          this.stats.loops++;
        }
      },

      DoWhileStatement: {
        enter: (path) => {
          result.loops.push({
            type: 'do-while',
            location: this.extractLocation(path.node.loc),
            condition: this.generateCode(path.node.test),
            nestingLevel: this.calculateNestingLevel(path),
            statementCount: this.countStatements(path.node.body),
            isInfinite: this.detectInfiniteLoop(path.node, 'do-while')
          });
          this.stats.loops++;
        }
      }
    });
  }

  /**
   * Analyze switch statements
   */
  analyzeSwitches(ast, result) {
    traverse(ast, {
      SwitchStatement: {
        enter: (path) => {
          const switchCase = {
            type: 'switch',
            discriminant: this.generateCode(path.node.discriminant),
            location: this.extractLocation(path.node.loc),
            cases: path.node.cases.length,
            hasDefault: path.node.cases.some(c => c.test === null),
            caseValues: path.node.cases.map(c => c.test?.value).filter(Boolean),
            hasFallThrough: this.detectFallThrough(path.node.cases),
            complexity: this.calculateSwitchComplexity(path.node),
            statementCount: path.node.cases.reduce((sum, c) => sum + c.consequent.length, 0)
          };
          
          if (path.node.cases.length <= this.options.maxSwitchCases) {
            switchCase.caseDetails = path.node.cases.map((c, i) => ({
              index: i,
              value: c.test?.value ?? 'default',
              statements: c.consequent.length,
              hasBreak: c.consequent.some(s => s.type === 'BreakStatement'),
              hasReturn: c.consequent.some(s => s.type === 'ReturnStatement'),
              hasFallThrough: i < path.node.cases.length - 1 && !c.consequent.some(s => s.type === 'BreakStatement' || s.type === 'ReturnStatement')
            }));
          }
          
          result.switches.push(switchCase);
          this.stats.switches++;
        }
      }
    });
  }

  /**
   * Analyze function declarations and expressions
   */
  analyzeFunctions(ast, result) {
    traverse(ast, {
      FunctionDeclaration: {
        enter: (path) => {
          const func = this.extractFunctionInfo(path.node, 'declaration');
          result.functions.push(func);
          this.stats.functions++;
          if (path.node.async) this.stats.asyncFunctions++;
        }
      },

      FunctionExpression: {
        enter: (path) => {
          if (path.parent?.type !== 'VariableDeclarator' || !path.parent.id?.name?.startsWith('_')) {
            const func = this.extractFunctionInfo(path.node, 'expression');
            result.functions.push(func);
            this.stats.functions++;
            if (path.node.async) this.stats.asyncFunctions++;
          }
        }
      },

      ArrowFunctionExpression: {
        enter: (path) => {
          const func = this.extractFunctionInfo(path.node, 'arrow');
          result.functions.push(func);
          this.stats.functions++;
        }
      },

      ClassMethod: {
        enter: (path) => {
          const func = this.extractFunctionInfo(path.node, 'method');
          result.functions.push(func);
          this.stats.functions++;
        }
      }
    });
  }

  /**
   * Detect control flow flattening obfuscation
   */
  detectFlattening(ast, result) {
    traverse(ast, {
      SwitchStatement: {
        enter: (path) => {
          if (path.node.cases.length > 10) {
            const hasStateVariable = this.detectStateVariable(path);
            const hasJumps = path.node.cases.some(c => 
              c.consequent.some(n => n.type === 'ContinueStatement' || n.type === 'BreakStatement')
            );
            
            if (hasStateVariable && hasJumps) {
              const flattening = {
                type: 'control-flow-flattening',
                location: this.extractLocation(path.node.loc),
                states: path.node.cases.length,
                confidence: 0.9,
                description: 'Control flow flattening detected - original code structure obscured',
                stateVariable: hasStateVariable
              };
              
              result.flattening.push(flattening);
              this.stats.flattening++;
              
              if (this.options.verboseLogging) {
                console.log(`[ControlFlowAnalyzer] Flattening detected: ${path.node.cases.length} states`);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Detect opaque predicates (always true/false conditions)
   */
  detectOpaquePredicates(ast, result) {
    traverse(ast, {
      IfStatement: {
        enter: (path) => {
          const test = path.node.test;
          let opaque = null;
          
          if (test.type === 'BooleanLiteral') {
            opaque = {
              type: 'constant-boolean',
              value: test.value,
              location: this.extractLocation(path.node.loc),
              alwaysExecutes: test.value,
              description: `Condition always ${test.value ? 'executes' : 'never executes'}`
            };
          } else if (test.type === 'UnaryExpression' && test.operator === '!') {
            opaque = {
              type: 'negation',
              location: this.extractLocation(path.node.loc),
              description: 'Negation of expression'
            };
          } else if (this.isOpaqueExpression(test)) {
            opaque = {
              type: 'opaque-expression',
              location: this.extractLocation(path.node.loc),
              expression: this.generateCode(test),
              description: 'Complex opaque condition'
            };
          }
          
          if (opaque) {
            result.opaquePredicates.push(opaque);
            this.stats.opaquePredicates++;
          }
        }
      }
    });
  }

  /**
   * Detect dead code and unreachable code
   */
  detectDeadCode(ast, result) {
    traverse(ast, {
      IfStatement: {
        enter: (path) => {
          if (path.node.test.type === 'BooleanLiteral' && path.node.test.value === false) {
            result.deadCode.push({
              type: 'unreachable-branch',
              location: this.extractLocation(path.node.consequent?.loc),
              reason: 'Condition always false',
              severity: 'low'
            });
            this.stats.deadCode++;
          }
        }
      },

      ReturnStatement: {
        enter: (path) => {
          const func = path.getFunctionParent();
          if (func) {
            const body = func.node.body.body;
            const returnIndex = body.indexOf(path.node);
            
            if (returnIndex < body.length - 1) {
              for (let i = returnIndex + 1; i < body.length; i++) {
                if (body[i].type !== 'EmptyStatement' && body[i].type !== 'VariableDeclaration') {
                  result.deadCode.push({
                    type: 'unreachable-code',
                    location: this.extractLocation(body[i].loc),
                    after: this.extractLocation(path.node.loc),
                    reason: 'Code after return statement',
                    severity: 'low'
                  });
                  this.stats.deadCode++;
                  break;
                }
              }
            }
          }
        }
      },

      BreakStatement: {
        enter: (path) => {
          if (!path.parent?.switchCase && path.parent?.type !== 'SwitchCase') {
            result.deadCode.push({
              type: 'unreachable-break',
              location: this.extractLocation(path.node.loc),
              reason: 'Break outside switch statement',
              severity: 'low'
            });
          }
        }
      }
    });
  }

  /**
   * Analyze async/await and Promise patterns
   */
  analyzeAsyncFlows(ast, result) {
    traverse(ast, {
      FunctionDeclaration: {
        enter: (path) => {
          if (path.node.async) {
            result.asyncFlows.push({
              type: 'async-function',
              name: path.node.id?.name || 'anonymous',
              location: this.extractLocation(path.node.loc),
              awaitExpressions: this.countAwaitExpressions(path.node.body),
              hasErrorHandling: this.hasErrorHandling(path.node)
            });
          }
        }
      },

      AwaitExpression: {
        enter: (path) => {
          result.asyncFlows.push({
            type: 'await',
            location: this.extractLocation(path.node.loc),
            expression: this.generateCode(path.node.argument)
          });
        }
      },

      YieldExpression: {
        enter: (path) => {
          result.asyncFlows.push({
            type: 'yield',
            location: this.extractLocation(path.node.loc),
            delegate: path.node.delegate
          });
        }
      }
    });
  }

  /**
   * Analyze try/catch/finally exception handling
   */
  analyzeExceptions(ast, result) {
    traverse(ast, {
      TryStatement: {
        enter: (path) => {
          const exception = {
            type: 'try-catch',
            location: this.extractLocation(path.node.loc),
            hasFinally: !!path.node.finalizer,
            catchVariables: path.node.handler?.param?.name ? [path.node.handler.param.name] : [],
            finallyStatements: path.node.finalizer?.body?.body?.length || 0,
            tryStatements: path.node.block?.body?.length || 0
          };
          
          if (path.node.handler?.body?.body) {
            exception.handlerStatements = path.node.handler.body.body.length;
            exception.errorTypes = this.extractErrorTypes(path.node.handler.body.body);
          }
          
          result.exceptions.push(exception);
          this.stats.tryCatch++;
        }
      },

      ThrowStatement: {
        enter: (path) => {
          result.exceptions.push({
            type: 'throw',
            location: this.extractLocation(path.node.loc),
            expression: this.generateCode(path.node.argument)
          });
        }
      }
    });
  }

  /**
   * Calculate comprehensive complexity metrics
   */
  calculateComplexityMetrics(result, code) {
    const metrics = {
      cyclomatic: 1,
      cognitive: 0,
      nestingDepth: 0,
      maintainabilityIndex: 0,
      linesOfCode: 0,
      functionCount: result.functions.length,
      parameterCount: 0,
      statementCount: 0
    };

    metrics.cyclomatic += result.branches.length;
    metrics.cyclomatic += result.loops.length;
    metrics.cyclomatic += result.switches.reduce((sum, s) => sum + s.cases - 1, 0);

    for (const branch of result.branches) {
      metrics.cognitive += 1 + (branch.nestingLevel || 0);
    }
    for (const loop of result.loops) {
      metrics.cognitive += 1 + (loop.nestingLevel || 0);
    }

    metrics.nestingDepth = Math.max(
      ...result.branches.map(b => b.nestingLevel || 0),
      ...result.loops.map(l => l.nestingLevel || 0),
      0
    );

    metrics.linesOfCode = code.split('\n').length;

    for (const func of result.functions) {
      metrics.parameterCount += func.parameters || 0;
      metrics.statementCount += func.statementCount || 0;
    }

    const volume = metrics.linesOfCode * Math.log2(metrics.linesOfCode || 1);
    metrics.maintainabilityIndex = Math.max(0, Math.min(100, 
      171 - 5.2 * Math.log(volume || 1) - 0.23 * metrics.cyclomatic - 16.2 * Math.log(metrics.linesOfCode || 1)
    ));

    metrics.cyclomaticRisk = this.getComplexityRisk(metrics.cyclomatic);
    metrics.maintainabilityRisk = this.getMaintainabilityRisk(metrics.maintainabilityIndex);

    return metrics;
  }

  /**
   * Generate function call graph
   */
  generateCallGraph(ast) {
    const graph = {
      nodes: [],
      edges: []
    };

    const functionMap = new Map();

    traverse(ast, {
      FunctionDeclaration: {
        enter: (path) => {
          const name = path.node.id?.name || `anonymous_${graph.nodes.length}`;
          functionMap.set(path.node, name);
          graph.nodes.push({ name, type: 'function', line: path.node.loc?.start?.line });
        }
      },

      CallExpression: {
        enter: (path) => {
          const caller = path.getFunctionParent()?.node;
          const calleeName = this.getCalleeName(path.node.callee);
          
          if (caller && calleeName) {
            const callerName = functionMap.get(caller) || 'anonymous';
            graph.edges.push({ from: callerName, to: calleeName, location: this.extractLocation(path.node.loc) });
          }
        }
      }
    });

    return graph;
  }

  /**
   * Detect web framework used in the code
   */
  detectWebFramework(code, ast) {
    const frameworks = {
      react: { score: 0, patterns: [] },
      vue: { score: 0, patterns: [] },
      angular: { score: 0, patterns: [] },
      svelte: { score: 0, patterns: [] },
      nodejs: { score: 0, patterns: [] },
      nextjs: { score: 0, patterns: [] }
    };

    for (const [framework, config] of Object.entries(this.webFrameworkPatterns.react)) {
      if (Array.isArray(config)) {
        for (const pattern of config) {
          if (pattern.test(code)) {
            frameworks.react.score++;
            frameworks.react.patterns.push(pattern.toString());
          }
        }
      }
    }

    const patterns = {
      react: this.webFrameworkPatterns.react,
      vue: this.webFrameworkPatterns.vue,
      angular: this.webFrameworkPatterns.angular,
      svelte: this.webFrameworkPatterns.svelte,
      nodejs: this.webFrameworkPatterns.nodejs,
      nextjs: this.webFrameworkPatterns.nextjs
    };

    for (const [name, config] of Object.entries(patterns)) {
      for (const [category, patternList] of Object.entries(config)) {
        for (const pattern of patternList) {
          if (typeof pattern === 'object' && pattern.test) {
            if (pattern.test(code)) {
              frameworks[name].score++;
              frameworks[name].patterns.push(category);
            }
          } else if (typeof pattern === 'string' && code.includes(pattern)) {
            frameworks[name].score++;
            frameworks[name].patterns.push(pattern);
          }
        }
      }
    }

    let detected = null;
    let maxScore = 0;

    for (const [name, data] of Object.entries(frameworks)) {
      if (data.score > maxScore) {
        maxScore = data.score;
        detected = { name, ...data };
      }
    }

    return detected?.score > 0 ? detected : null;
  }

  /**
   * Perform security vulnerability analysis
   */
  performSecurityAnalysis(code) {
    const issues = [];

    for (const [name, config] of Object.entries(this.securityPatterns)) {
      for (const pattern of config.patterns) {
        const matches = code.match(pattern);
        if (matches) {
          issues.push({
            type: name,
            severity: config.severity,
            description: config.description,
            count: matches.length,
            samples: matches.slice(0, 3)
          });
        }
      }
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Perform performance issue analysis
   */
  performPerformanceAnalysis(result) {
    const issues = [];

    for (const loop of result.loops) {
      if (loop.statementCount > 50) {
        issues.push({
          type: 'large-loop',
          severity: 'medium',
          location: loop.location,
          description: `Loop with ${loop.statementCount} statements - consider optimization`
        });
      }

      if (loop.isInfinite) {
        issues.push({
          type: 'infinite-loop',
          severity: 'high',
          location: loop.location,
          description: 'Potential infinite loop detected'
        });
      }
    }

    for (const func of result.functions) {
      if (func.statementCount > 100) {
        issues.push({
          type: 'large-function',
          severity: 'low',
          location: func.location,
          description: `Function with ${func.statementCount} statements - consider splitting`
        });
      }

      if (func.parameters > 8) {
        issues.push({
          type: 'too-many-parameters',
          severity: 'low',
          location: func.location,
          description: `Function with ${func.parameters} parameters - consider using object`
        });
      }
    }

    return issues;
  }

  /**
   * Helper: Extract location info from AST node
   */
  extractLocation(loc) {
    if (!loc || !loc.start || !loc.end) return null;
    return {
      start: { line: loc.start.line, column: loc.start.column },
      end: { line: loc.end.line, column: loc.end.column }
    };
  }

  /**
   * Helper: Extract condition code
   */
  extractConditionCode(node) {
    if (!node) return null;
    try {
      return this.generateCode(node);
    } catch {
      return node.type;
    }
  }

  /**
   * Helper: Generate code from AST node
   */
  generateCode(node) {
    if (!node) return '';
    try {
      const generate = require("@babel/generator").default;
      return generate(node).code;
    } catch {
      return node.type || '';
    }
  }

  /**
   * Helper: Calculate nesting level
   */
  calculateNestingLevel(path) {
    let level = 0;
    let current = path;
    while (current.parent) {
      if (['IfStatement', 'ForStatement', 'WhileStatement', 'DoWhileStatement', 'SwitchStatement', 'TryStatement'].includes(current.parent.type)) {
        level++;
      }
      current = current.parent;
    }
    return level;
  }

  /**
   * Helper: Calculate condition complexity
   */
  calculateConditionComplexity(node) {
    if (!node) return 0;
    
    let complexity = 1;
    
    const traverse = (n) => {
      if (!n) return;
      if (n.type === 'LogicalExpression') complexity++;
      if (n.type === 'BinaryExpression') complexity++;
      if (n.left) traverse(n.left);
      if (n.right) traverse(n.right);
    };
    
    traverse(node);
    return complexity;
  }

  /**
   * Helper: Count statements in a node
   */
  countStatements(node) {
    if (!node) return 0;
    if (node.type === 'BlockStatement') return node.body.length;
    return 1;
  }

  /**
   * Helper: Extract function information
   */
  extractFunctionInfo(node, type) {
    return {
      type,
      name: node.id?.name || 'anonymous',
      location: this.extractLocation(node.loc),
      parameters: node.params?.length || 0,
      statementCount: this.countStatements(node.body),
      hasReturn: node.body?.body?.some(s => s.type === 'ReturnStatement'),
      isAsync: node.async || false,
      isGenerator: node.generator || false
    };
  }

  /**
   * Helper: Detect infinite loop
   */
  detectInfiniteLoop(node, type) {
    if (!this.options.detectInfiniteLoops) return false;
    
    if (type === 'while' || type === 'do-while') {
      if (!node.test) return true;
      const testCode = this.generateCode(node.test);
      return testCode === 'true' || testCode === '1';
    }
    
    if (type === 'for') {
      if (!node.test) return true;
      const testCode = this.generateCode(node.test);
      return testCode === 'true';
    }
    
    return false;
  }

  /**
   * Helper: Detect fall-through cases in switch
   */
  detectFallThrough(cases) {
    return cases.some((c, i) => {
      if (i === cases.length - 1) return false;
      return !c.consequent.some(s => s.type === 'BreakStatement' || s.type === 'ReturnStatement' || s.type === 'ThrowStatement');
    });
  }

  /**
   * Helper: Detect state variable in switch
   */
  detectStateVariable(path) {
    const discriminant = path.node.discriminant;
    if (discriminant.type === 'Identifier') {
      return discriminant.name;
    }
    if (discriminant.type === 'MemberExpression') {
      return this.generateCode(discriminant);
    }
    return null;
  }

  /**
   * Helper: Check if expression is opaque
   */
  isOpaqueExpression(node) {
    if (!node) return false;
    if (node.type === 'BinaryExpression') {
      return node.operator === '===' || node.operator === '==';
    }
    if (node.type === 'CallExpression') {
      return true;
    }
    return false;
  }

  /**
   * Helper: Count await expressions
   */
  countAwaitExpressions(node) {
    let count = 0;
    if (!node) return count;
    
    traverse({
      type: 'File',
      program: { type: 'Program', body: [node] }
    }, {
      AwaitExpression: () => count++
    });
    
    return count;
  }

  /**
   * Helper: Check if function has error handling
   */
  hasErrorHandling(path) {
    const body = path.node.body;
    if (!body) return false;
    
    const statements = body.body || [];
    return statements.some(s => 
      s.type === 'TryStatement' || 
      s.type === 'CatchClause' ||
      (s.type === 'IfStatement' && s.block?.body?.some(b => b.type === 'ThrowStatement'))
    );
  }

  /**
   * Helper: Extract error types from catch block
   */
  extractErrorTypes(statements) {
    const types = [];
    for (const stmt of statements) {
      if (stmt.type === 'IfStatement' && stmt.test?.type === 'BinaryExpression') {
        if (stmt.test.left?.type === 'UnaryExpression' && stmt.test.left.argument?.property?.name === 'name') {
          types.push(stmt.test.right?.value);
        }
      }
    }
    return types.filter(Boolean);
  }

  /**
   * Helper: Get complexity risk level
   */
  getComplexityRisk(value) {
    if (value <= 10) return 'low';
    if (value <= 20) return 'moderate';
    if (value <= 50) return 'high';
    return 'very-high';
  }

  /**
   * Helper: Get maintainability risk level
   */
  getMaintainabilityRisk(value) {
    if (value >= 85) return 'excellent';
    if (value >= 65) return 'good';
    if (value >= 45) return 'moderate';
    return 'poor';
  }

  /**
   * Helper: Get callee name from call expression
   */
  getCalleeName(callee) {
    if (!callee) return null;
    if (callee.type === 'Identifier') return callee.name;
    if (callee.type === 'MemberExpression' && callee.property) return callee.property.name;
    return null;
  }

  /**
   * Helper: Calculate switch complexity
   */
  calculateSwitchComplexity(node) {
    let complexity = node.cases.length;
    for (const c of node.cases) {
      complexity += c.consequent.length;
    }
    return complexity;
  }

  /**
   * Get agent statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      totalStructures: this.stats.branches + this.stats.loops + this.stats.switches
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      branches: 0,
      loops: 0,
      switches: 0,
      deadCode: 0,
      flattening: 0,
      opaquePredicates: 0,
      functions: 0,
      asyncFunctions: 0,
      tryCatch: 0
    };
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.webFrameworkPatterns = null;
    this.securityPatterns = null;
    this.obfuscationPatterns = null;
  }
}

module.exports = ControlFlowAnalyzerAgent;
