const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class PerformanceRules {
    constructor() {
        this.name = 'PerformanceRules';
        this.version = '1.0.0';
        this.violations = [];
        this.statistics = {
            totalChecks: 0,
            performanceIssues: 0,
            loopIssues: 0,
            memoryLeakIssues: 0,
            asyncIssues: 0,
            domIssues: 0,
            bundleSizeIssues: 0,
            eventListenerIssues: 0
        };
        this.rules = {};
        this.scopes = [];
        this.loopVariables = new Map();
        this.eventListeners = new Map();
    }

    initializeRules() {
        this.rules = {
            loopOptimization: {
                invariant: {
                    name: 'loop-invariant',
                    description: 'Detects code hoisted outside loops for optimization',
                    severity: 'medium',
                    enabled: true
                },
                lengthCaching: {
                    name: 'length-caching',
                    description: 'Detects array.length access inside loop condition',
                    severity: 'medium',
                    enabled: true
                },
                forVsWhile: {
                    name: 'for-vs-while',
                    description: 'Suggests optimal loop type for use case',
                    severity: 'low',
                    enabled: true
                },
                nestedLoops: {
                    name: 'nested-loops',
                    description: 'Warns about deeply nested loops (O(n^2) complexity)',
                    severity: 'high',
                    enabled: true
                }
            },
            memoryLeaks: {
                uncleanedReferences: {
                    name: 'uncleaned-references',
                    description: 'Detects references that may prevent garbage collection',
                    severity: 'high',
                    enabled: true
                },
                closures: {
                    name: 'closure-memory',
                    description: 'Detects closures that may cause memory retention',
                    severity: 'medium',
                    enabled: true
                },
                globalVariables: {
                    name: 'global-variables',
                    description: 'Warns about excessive global variable usage',
                    severity: 'medium',
                    enabled: true
                }
            },
            asyncOptimization: {
                parallelExecution: {
                    name: 'parallel-execution',
                    description: 'Suggests Promise.all for independent async operations',
                    severity: 'medium',
                    enabled: true
                },
                promiseChains: {
                    name: 'promise-chains',
                    description: 'Detects long promise chains that could use async/await',
                    severity: 'low',
                    enabled: true
                },
                awaitInLoop: {
                    name: 'await-in-loop',
                    description: 'Detects await inside loops that could be parallelized',
                    severity: 'high',
                    enabled: true
                }
            },
            domPerformance: {
                reflow: {
                    name: 'dom-reflow',
                    description: 'Detects operations causing layout thrashing',
                    severity: 'high',
                    enabled: true
                },
                repaint: {
                    name: 'dom-repaint',
                    description: 'Detects operations causing unnecessary repaints',
                    severity: 'medium',
                    enabled: true
                },
                batchUpdates: {
                    name: 'batch-updates',
                    description: 'Suggests batching multiple DOM updates',
                    severity: 'medium',
                    enabled: true
                }
            },
            bundleSize: {
                duplicateCode: {
                    name: 'duplicate-code',
                    description: 'Detects potential code duplication',
                    severity: 'medium',
                    enabled: true
                },
                largeImports: {
                    name: 'large-imports',
                    description: 'Warns about importing entire libraries',
                    severity: 'medium',
                    enabled: true
                },
                unusedImports: {
                    name: 'unused-imports',
                    description: 'Detects imported but unused modules',
                    severity: 'low',
                    enabled: true
                }
            },
            eventListeners: {
                missingRemove: {
                    name: 'missing-remove-listener',
                    description: 'Detects addEventListener without removeEventListener',
                    severity: 'high',
                    enabled: true
                },
                passiveListeners: {
                    name: 'passive-listeners',
                    description: 'Suggests passive listeners for scroll/touch events',
                    severity: 'medium',
                    enabled: true
                }
            }
        };
        return this.rules;
    }

    apply(code, options = {}) {
        this.reset();
        this.initializeRules();
        
        const config = {
            checkLoops: options.checkLoops !== false,
            checkMemory: options.checkMemory !== false,
            checkAsync: options.checkAsync !== false,
            checkDOM: options.checkDOM !== false,
            checkBundle: options.checkBundle !== false,
            checkEventListeners: options.checkEventListeners !== false,
            ...options
        };

        let ast;
        try {
            ast = parser.parse(code, {
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                errorRecovery: true
            });
        } catch (error) {
            this.violations.push({
                rule: 'parse-error',
                message: `Failed to parse code: ${error.message}`,
                severity: 'critical',
                line: 0,
                column: 0
            });
            return this.violations;
        }

        this.checkPerformance(ast, config);
        this.statistics.totalChecks = this.violations.length;

        return this.violations;
    }

    checkPerformance(ast, config) {
        const self = this;

        traverse(ast, {
            ForStatement(path) {
                if (config.checkLoops) {
                    self.checkLoopOptimization(path);
                }
            },
            WhileStatement(path) {
                if (config.checkLoops) {
                    self.checkLoopOptimization(path);
                }
            },
            ForInStatement(path) {
                if (config.checkLoops) {
                    self.checkForInOptimization(path);
                }
            },
            ForOfStatement(path) {
                if (config.checkLoops) {
                    self.checkForOfOptimization(path);
                }
            },
            AwaitExpression(path) {
                if (config.checkAsync) {
                    self.checkAwaitOptimization(path);
                }
            },
            CallExpression(path) {
                if (config.checkDOM) {
                    self.checkDOMPerformance(path);
                }
                if (config.checkEventListeners) {
                    self.checkEventListenerPerformance(path);
                }
            },
            FunctionDeclaration(path) {
                if (config.checkMemory) {
                    self.checkClosureMemory(path);
                }
            },
            ArrowFunctionExpression(path) {
                if (config.checkMemory) {
                    self.checkClosureMemory(path);
                }
            },
            ImportDeclaration(path) {
                if (config.checkBundle) {
                    self.checkImportOptimization(path);
                }
            },
            MemberExpression(path) {
                if (config.checkLoops) {
                    self.checkLengthCaching(path);
                }
            },
            Program(path) {
                if (config.checkMemory) {
                    self.checkGlobalVariables(path);
                }
                if (config.checkBundle) {
                    self.checkDuplicateCode(path);
                }
            }
        });
    }

    checkLoopOptimization(path) {
        const node = path.node;
        
        if (t.isForStatement(node)) {
            this.checkForStatementOptimization(path);
        } else if (t.isWhileStatement(node)) {
            this.checkWhileStatementOptimization(path);
        }

        const loopBody = node.body;
        const innerLoops = this.countInnerLoops(loopBody);
        
        if (innerLoops > 0) {
            this.addViolation({
                rule: this.rules.loopOptimization.nestedLoops.name,
                message: `Nested loop detected (${innerLoops} inner loops) - O(n^${innerLoops + 1}) complexity`,
                severity: this.rules.loopOptimization.nestedLoops.severity,
                line: node.loc ? node.loc.start.line : 0,
                column: node.loc ? node.loc.start.column : 0,
                suggestion: 'Consider algorithm optimization or data structure change'
            });
            this.statistics.loopIssues++;
            this.statistics.performanceIssues++;
        }

        this.checkLoopInvariants(path);
    }

    checkForStatementOptimization(path) {
        const node = path.node;
        const test = node.test;
        
        if (t.isBinaryExpression(test)) {
            const right = test.right;
            
            if (t.isMemberExpression(right)) {
                const property = right.property;
                
                if (t.isIdentifier(property, { name: 'length' })) {
                    this.addViolation({
                        rule: this.rules.loopOptimization.lengthCaching.name,
                        message: 'Array length accessed in loop condition - consider caching',
                        severity: this.rules.loopOptimization.lengthCaching.severity,
                        line: node.loc ? node.loc.start.line : 0,
                        column: node.loc ? node.loc.start.column : 0,
                        suggestion: 'Cache array.length in a variable before the loop'
                    });
                    this.statistics.loopIssues++;
                    this.statistics.performanceIssues++;
                }
            }
        }
    }

    checkWhileStatementOptimization(path) {
        const node = path.node;
        const test = node.test;
        
        if (t.isMemberExpression(test)) {
            const property = test.property;
            
            if (t.isIdentifier(property, { name: 'length' })) {
                this.addViolation({
                    rule: this.rules.loopOptimization.lengthCaching.name,
                    message: 'Array length accessed in while condition - consider caching',
                    severity: this.rules.loopOptimization.lengthCaching.severity,
                    line: node.loc ? node.loc.start.line : 0,
                    column: node.loc ? node.loc.start.column : 0,
                    suggestion: 'Cache array.length in a variable before the loop'
                });
                this.statistics.loopIssues++;
                this.statistics.performanceIssues++;
            }
        }
    }

    checkLoopInvariants(path) {
        const body = path.node.body;
        const loopVars = this.getLoopVariables(path);
        
        if (t.isBlockStatement(body)) {
            body.body.forEach(stmt => {
                if (t.isExpressionStatement(stmt) && t.isCallExpression(stmt.expression)) {
                    const callee = stmt.expression.callee;
                    
                    if (t.isMemberExpression(callee) && !this.usesLoopVariables(callee, loopVars)) {
                        this.addViolation({
                            rule: this.rules.loopOptimization.invariant.name,
                            message: 'Loop invariant call detected - consider hoisting outside loop',
                            severity: this.rules.loopOptimization.invariant.severity,
                            line: stmt.loc ? stmt.loc.start.line : 0,
                            column: stmt.loc ? stmt.loc.start.column : 0,
                            suggestion: 'Move the invariant computation before the loop'
                        });
                        this.statistics.loopIssues++;
                        this.statistics.performanceIssues++;
                    }
                }
            });
        }
    }

    checkForInOptimization(path) {
        this.addViolation({
            rule: this.rules.loopOptimization.forVsWhile.name,
            message: 'for...in loop used - consider for...of or Object.keys() for better performance',
            severity: this.rules.loopOptimization.forVsWhile.severity,
            line: path.node.loc ? path.node.loc.start.line : 0,
            column: path.node.loc ? path.node.loc.start.column : 0,
            suggestion: 'Use for...of with Object.values() or Object.keys() for better performance'
        });
        this.statistics.loopIssues++;
        this.statistics.performanceIssues++;
    }

    checkForOfOptimization(path) {
        const right = path.node.right;
        
        if (t.isCallExpression(right)) {
            const callee = right.callee;
            
            if (t.isMemberExpression(callee) && 
                t.isIdentifier(callee.property, { name: 'entries' })) {
                this.addViolation({
                    rule: this.rules.loopOptimization.forVsWhile.name,
                    message: 'Consider using for...in or indexed for loop for better performance',
                    severity: this.rules.loopOptimization.forVsWhile.severity,
                    line: path.node.loc ? path.node.loc.start.line : 0,
                    column: path.node.loc ? path.node.loc.start.column : 0,
                    suggestion: 'Use indexed for loop for performance-critical code'
                });
                this.statistics.loopIssues++;
                this.statistics.performanceIssues++;
            }
        }
    }

    checkLengthCaching(path) {
        const node = path.node;
        
        if (t.isIdentifier(node.property, { name: 'length' })) {
            const parentPath = path.parentPath;
            
            if (parentPath && t.isBinaryExpression(parentPath.node)) {
                const grandParent = parentPath.parentPath;
                
                if (grandParent && t.isForStatement(grandParent.node)) {
                    return;
                }
            }
        }
    }

    checkAwaitOptimization(path) {
        const parent = path.parent;
        
        if (t.isForStatement(parent) || 
            t.isWhileStatement(parent) ||
            t.isForOfStatement(parent)) {
            this.addViolation({
                rule: this.rules.asyncOptimization.awaitInLoop.name,
                message: 'await inside loop - consider Promise.all for parallel execution',
                severity: this.rules.asyncOptimization.awaitInLoop.severity,
                line: path.node.loc ? path.node.loc.start.line : 0,
                column: path.node.loc ? path.node.loc.start.column : 0,
                suggestion: 'Collect promises and use Promise.all() outside the loop'
            });
            this.statistics.asyncIssues++;
            this.statistics.performanceIssues++;
        }

        this.checkSequentialPromises(path);
    }

    checkSequentialPromises(path) {
        const scope = path.scope;
        const node = path.node;
        
        const programPath = path.scope.getProgramParent().path;
        let sequentialAwaits = [];
        
        programPath.traverse({
            AwaitExpression(awaitPath) {
                if (awaitPath.node !== node) return;
                
                const sibling = awaitPath.parentPath.parentPath;
                if (sibling && t.isBlockStatement(sibling.node)) {
                    const body = sibling.node.body;
                    const currentIndex = body.indexOf(awaitPath.parent);
                    
                    if (currentIndex > 0) {
                        const prevStmt = body[currentIndex - 1];
                        if (t.isExpressionStatement(prevStmt) && 
                            t.isAwaitExpression(prevStmt.expression)) {
                            this.addViolation({
                                rule: this.rules.asyncOptimization.parallelExecution.name,
                                message: 'Sequential await operations could be parallelized',
                                severity: this.rules.asyncOptimization.parallelExecution.severity,
                                line: path.node.loc ? path.node.loc.start.line : 0,
                                column: path.node.loc ? path.node.loc.start.column : 0,
                                suggestion: 'Use Promise.all() for independent async operations'
                            });
                            this.statistics.asyncIssues++;
                            this.statistics.performanceIssues++;
                        }
                    }
                }
            }
        });
    }

    checkClosureMemory(path) {
        const node = path.node;
        const body = node.body;
        
        if (t.isBlockStatement(body)) {
            const outerVars = new Set();
            
            path.traverse({
                Identifier(innerPath) {
                    const name = innerPath.node.name;
                    const binding = innerPath.scope.getBinding(name);
                    
                    if (binding && binding.scope !== innerPath.scope && 
                        binding.path.isVariableDeclarator()) {
                        outerVars.add(name);
                    }
                }
            });

            if (outerVars.size > 3) {
                this.addViolation({
                    rule: this.rules.memoryLeaks.closures.name,
                    message: `Closure captures ${outerVars.size} outer variables - potential memory retention`,
                    severity: this.rules.memoryLeaks.closures.severity,
                    line: node.loc ? node.loc.start.line : 0,
                    column: node.loc ? node.loc.start.column : 0,
                    suggestion: 'Consider passing needed values as parameters instead of capturing'
                });
                this.statistics.memoryLeakIssues++;
                this.statistics.performanceIssues++;
            }
        }
    }

    checkDOMPerformance(path) {
        const node = path.node;
        const callee = node.callee;
        
        if (t.isMemberExpression(callee)) {
            const property = callee.property;
            
            if (t.isIdentifier(property)) {
                const propName = property.name;
                
                const reflowMethods = ['offsetWidth', 'offsetHeight', 'clientWidth', 
                                       'clientHeight', 'scrollWidth', 'scrollHeight',
                                       'getBoundingClientRect', 'getComputedStyle'];
                                       
                if (reflowMethods.includes(propName)) {
                    this.addViolation({
                        rule: this.rules.domPerformance.reflow.name,
                        message: `DOM reflow triggered by '${propName}' - avoid in loops`,
                        severity: this.rules.domPerformance.reflow.severity,
                        line: node.loc ? node.loc.start.line : 0,
                        column: node.loc ? node.loc.start.column : 0,
                        suggestion: 'Cache layout values outside loops or batch reads/writes'
                    });
                    this.statistics.domIssues++;
                    this.statistics.performanceIssues++;
                }

                const repaintMethods = ['style', 'className', 'classList'];
                if (repaintMethods.includes(propName) && path.parentPath) {
                    const parentLoop = path.parentPath.getAncestry().find(
                        p => t.isForStatement(p.node) || t.isWhileStatement(p.node)
                    );
                    
                    if (parentLoop) {
                        this.addViolation({
                            rule: this.rules.domPerformance.repaint.name,
                            message: 'DOM style modification inside loop - causes repaints',
                            severity: this.rules.domPerformance.repaint.severity,
                            line: node.loc ? node.loc.start.line : 0,
                            column: node.loc ? node.loc.start.column : 0,
                            suggestion: 'Use classList or batch style changes'
                        });
                        this.statistics.domIssues++;
                        this.statistics.performanceIssues++;
                    }
                }
            }
        }
    }

    checkEventListenerPerformance(path) {
        const node = path.node;
        const callee = node.callee;
        
        if (t.isMemberExpression(callee)) {
            const property = callee.property;
            
            if (t.isIdentifier(property, { name: 'addEventListener' })) {
                const args = node.arguments;
                
                if (args.length >= 2) {
                    const eventType = args[0];
                    
                    if (t.isStringLiteral(eventType)) {
                        const type = eventType.value;
                        const scrollTouchEvents = ['scroll', 'touchstart', 'touchmove', 
                                                   'touchend', 'wheel', 'mousewheel'];
                        
                        if (scrollTouchEvents.includes(type)) {
                            const options = args[2];
                            let hasPassive = false;
                            
                            if (options) {
                                if (t.isObjectExpression(options)) {
                                    options.properties.forEach(prop => {
                                        if (t.isIdentifier(prop.key, { name: 'passive' }) &&
                                            t.isBooleanLiteral(prop.value, { value: true })) {
                                            hasPassive = true;
                                        }
                                    });
                                }
                            }
                            
                            if (!hasPassive) {
                                this.addViolation({
                                    rule: this.rules.eventListeners.passiveListeners.name,
                                    message: `Consider adding { passive: true } for '${type}' event`,
                                    severity: this.rules.eventListeners.passiveListeners.severity,
                                    line: node.loc ? node.loc.start.line : 0,
                                    column: node.loc ? node.loc.start.column : 0,
                                    suggestion: 'Add passive option to improve scroll performance'
                                });
                                this.statistics.eventListenerIssues++;
                                this.statistics.performanceIssues++;
                            }
                        }

                        if (args[1] && t.isIdentifier(args[1])) {
                            const handlerName = args[1].name;
                            
                            if (!this.eventListeners.has(handlerName)) {
                                this.eventListeners.set(handlerName, {
                                    added: node.loc ? node.loc.start.line : 0,
                                    removed: null
                                });
                            }
                        }
                    }
                }
            }

            if (t.isIdentifier(property, { name: 'removeEventListener' })) {
                const args = node.arguments;
                
                if (args.length >= 2 && t.isIdentifier(args[1])) {
                    const handlerName = args[1].name;
                    
                    if (this.eventListeners.has(handlerName)) {
                        const entry = this.eventListeners.get(handlerName);
                        entry.removed = node.loc ? node.loc.start.line : 0;
                    }
                }
            }
        }
    }

    checkImportOptimization(path) {
        const node = path.node;
        const source = node.source;
        
        if (t.isStringLiteral(source)) {
            const importPath = source.value;
            
            if (node.specifiers.length === 0) {
                this.addViolation({
                    rule: this.rules.bundleSize.unusedImports.name,
                    message: `Side-effect only import from '${importPath}'`,
                    severity: this.rules.bundleSize.unusedImports.severity,
                    line: node.loc ? node.loc.start.line : 0,
                    column: node.loc ? node.loc.start.column : 0,
                    suggestion: 'Verify if this import is necessary'
                });
                this.statistics.bundleSizeIssues++;
                this.statistics.performanceIssues++;
            }

            const largeLibraries = ['lodash', 'moment', 'jquery', 'underscore', 'rxjs'];
            
            if (largeLibraries.some(lib => importPath === lib || importPath.startsWith(`${lib}/`))) {
                if (importPath === 'lodash' || importPath === 'moment') {
                    this.addViolation({
                        rule: this.rules.bundleSize.largeImports.name,
                        message: `Full import from '${importPath}' - consider individual imports`,
                        severity: this.rules.bundleSize.largeImports.severity,
                        line: node.loc ? node.loc.start.line : 0,
                        column: node.loc ? node.loc.start.column : 0,
                        suggestion: `Use 'import { x } from "${importPath}/x"' for smaller bundle`
                    });
                    this.statistics.bundleSizeIssues++;
                    this.statistics.performanceIssues++;
                }
            }
        }
    }

    checkGlobalVariables(path) {
        const node = path.node;
        let globalCount = 0;
        const globalVars = [];
        
        path.traverse({
            AssignmentExpression(assignPath) {
                const left = assignPath.node.left;
                
                if (t.isIdentifier(left)) {
                    const binding = assignPath.scope.getBinding(left.name);
                    
                    if (!binding) {
                        globalCount++;
                        globalVars.push(left.name);
                    }
                }
            }
        });

        if (globalCount > 5) {
            this.addViolation({
                rule: this.rules.memoryLeaks.globalVariables.name,
                message: `${globalCount} global variables detected - potential memory issues`,
                severity: this.rules.memoryLeaks.globalVariables.severity,
                line: 1,
                column: 0,
                suggestion: 'Use modules or IIFE to avoid polluting global scope'
            });
            this.statistics.memoryLeakIssues++;
            this.statistics.performanceIssues++;
        }
    }

    checkDuplicateCode(path) {
        const functionBodies = new Map();
        
        path.traverse({
            FunctionDeclaration(funcPath) {
                const body = funcPath.node.body;
                
                if (t.isBlockStatement(body) && body.body.length > 3) {
                    const bodyStr = JSON.stringify(this.getSimpleBody(body));
                    
                    if (functionBodies.has(bodyStr)) {
                        const existing = functionBodies.get(bodyStr);
                        this.addViolation({
                            rule: this.rules.bundleSize.duplicateCode.name,
                            message: `Potential duplicate function detected`,
                            severity: this.rules.bundleSize.duplicateCode.severity,
                            line: funcPath.node.loc ? funcPath.node.loc.start.line : 0,
                            column: funcPath.node.loc ? funcPath.node.loc.start.column : 0,
                            suggestion: `Extract common logic to a shared function (similar to line ${existing})`
                        });
                        this.statistics.bundleSizeIssues++;
                        this.statistics.performanceIssues++;
                    } else {
                        functionBodies.set(bodyStr, funcPath.node.loc ? funcPath.node.loc.start.line : 0);
                    }
                }
            }.bind(this)
        });
    }

    getSimpleBody(body) {
        return body.body.map(stmt => stmt.type);
    }

    countInnerLoops(body) {
        let count = 0;
        
        traverse.cheap(body, (node) => {
            if (t.isForStatement(node) || t.isWhileStatement(node) || 
                t.isForInStatement(node) || t.isForOfStatement(node)) {
                count++;
            }
        });
        
        return count;
    }

    getLoopVariables(path) {
        const vars = new Set();
        const node = path.node;
        
        if (t.isForStatement(node)) {
            const init = node.init;
            
            if (t.isVariableDeclaration(init)) {
                init.declarations.forEach(decl => {
                    if (t.isIdentifier(decl.id)) {
                        vars.add(decl.id.name);
                    }
                });
            }
        }
        
        return vars;
    }

    usesLoopVariables(node, loopVars) {
        let uses = false;
        
        traverse.cheap(node, (n) => {
            if (t.isIdentifier(n) && loopVars.has(n.name)) {
                uses = true;
            }
        });
        
        return uses;
    }

    addViolation(violation) {
        this.violations.push({
            ...violation,
            timestamp: Date.now()
        });
    }

    getViolations() {
        this.checkMissingRemoveListeners();
        return [...this.violations];
    }

    checkMissingRemoveListeners() {
        this.eventListeners.forEach((entry, name) => {
            if (entry.removed === null) {
                this.addViolation({
                    rule: this.rules.eventListeners.missingRemove.name,
                    message: `addEventListener for '${name}' without removeEventListener`,
                    severity: this.rules.eventListeners.missingRemove.severity,
                    line: entry.added,
                    column: 0,
                    suggestion: 'Add removeEventListener to prevent memory leaks'
                });
                this.statistics.eventListenerIssues++;
                this.statistics.performanceIssues++;
            }
        });
    }

    getStatistics() {
        return { ...this.statistics };
    }

    reset() {
        this.violations = [];
        this.statistics = {
            totalChecks: 0,
            performanceIssues: 0,
            loopIssues: 0,
            memoryLeakIssues: 0,
            asyncIssues: 0,
            domIssues: 0,
            bundleSizeIssues: 0,
            eventListenerIssues: 0
        };
        this.rules = {};
        this.scopes = [];
        this.loopVariables = new Map();
        this.eventListeners = new Map();
    }
}

module.exports = PerformanceRules;
