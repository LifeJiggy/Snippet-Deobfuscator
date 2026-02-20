// module_analyzer.js
// Enhanced module analysis for webpack bundles

/**
 * Maps common module IDs to meaningful names based on functionality
 */
const moduleIdMapping = {
  // Common Webpack infrastructure modules
  0: "WebpackBootstrap",
  1: "WebpackRuntime",
  2: "WebpackManifest",
  3: "WebpackModuleCache",
  4: "WebpackPublicPath",
  5: "WebpackChunkLoading",
  6: "WebpackHMR",
  7: "WebpackErrorHandling",
  8: "WebpackJSONP",
  9: "WebpackPrefetch",

  // React ecosystem (10xxx)
  10000: "ReactCore",
  10001: "ReactDOM",
  10002: "ReactHooks",
  10003: "ReactContext",
  10004: "ReactRedux",
  10005: "ReactRouter",
  10006: "ReactRouterDOM",
  10007: "ReactRouterConfig",
  10008: "ReactQuery",
  10009: "ReactForm",
  10010: "ReactLazy",
  10011: "ReactSuspense",
  10012: "ReactMemo",
  10013: "ReactForwardRef",
  10014: "ReactCreateRef",
  10015: "ReactUseRef",
  10016: "ReactUseState",
  10017: "ReactUseEffect",
  10018: "ReactUseCallback",
  10019: "ReactUseMemo",
  10020: "ReactUseContext",
  10021: "ReactUseReducer",
  10022: "ReactUseRef",
  10023: "ReactUseImperativeHandle",
  10024: "ReactUseLayoutEffect",
  10025: "ReactUseDebugValue",
  10026: "ReactUseFetch",
  10027: "ReactUseAsync",
  10028: "ReactUseSWR",
  10029: "ReactUseInfiniteScroll",

  // Vue ecosystem (11xxx)
  11000: "VueCore",
  11001: "VueReactivity",
  11002: "VueRouter",
  11003: "Vuex",
  11004: "Pinia",
  11005: "VueUse",
  11006: "VueCompositionAPI",
  11007: "VueOptionsAPI",
  11008: "VueMixin",
  11009: "VuePlugin",

  // Angular ecosystem (12xxx)
  12000: "AngularCore",
  12001: "AngularRouter",
  12002: "AngularForms",
  12003: "AngularHTTP",
  12004: "AngularAnimations",
  12005: "AngularCommon",
  12006: "AngularCompiler",
  12007: "AngularPlatformBrowser",
  12008: "AngularPlatformServer",
  12009: "AngularUniversal",

  // Redux/MobX ecosystem (13xxx)
  13000: "ReduxCore",
  13001: "ReduxStore",
  13002: "ReduxReducer",
  13003: "ReduxAction",
  13004: "ReduxDispatch",
  13005: "ReduxSelector",
  13006: "ReduxThunk",
  13007: "ReduxSaga",
  13008: "ReduxObservable",
  13009: "ReduxDevTools",
  13010: "MobXCore",
  13011: "MobXStore",
  13012: "MobXObservable",
  13013: "MobXAction",
  13014: "MobXReaction",
  13015: "ZustandStore",
  13016: "JotaiAtom",
  13017: "RecoilState",

  // UI Component Libraries (20xxx)
  20000: "MaterialUI",
  20001: "MUIcore",
  20002: "MUIComponents",
  20003: "MUIUtils",
  20004: "MUIStyles",
  20005: "MUIlab",
  20006: "AntDesign",
  20007: "AntdComponents",
  20008: "AntdIcons",
  20009: "ChakraUI",
  20010: "ChakraComponents",
  20011: "TailwindCSS",
  20012: "TailwindComponents",
  20013: "Bootstrap",
  20014: "BootstrapGrid",
  20015: "BootstrapComponents",
  20016: "ElementUI",
  20017: "Vuetify",
  20018: "SvelteMaterial",
  20019: "RadixUI",
  20020: "HeadlessUI",
  20021: "BlueprintJS",

  // HTTP/Network (30xxx)
  30000: "Axios",
  30001: "AxiosCore",
  30002: "AxiosAdapter",
  30003: "FetchAPI",
  30004: "SuperAgent",
  30005: "KyHTTP",
  30006: "GotHTTP",
  30007: " needleHTTP",
  30008: "NodeFetch",
  30009: "Unfetch",
  30010: "RelayNetwork",
  30011: "ApolloLink",
  30012: "URQLClient",

  // Utilities/Lodash (40xxx)
  40000: "Lodash",
  40001: "LodashCore",
  40002: "LodashString",
  40003: "LodashArray",
  40004: "LodashObject",
  40005: "LodashCollection",
  40006: "LodashMath",
  40007: "LodashDate",
  40008: "LodashFunction",
  40009: "LodashUtil",
  40010: "Underscore",
  40011: "Ramda",
  40012: "RxJS",
  40013: "RxJSObservable",
  40014: "RxJSSubject",
  40015: "RxJSOperator",
  40016: "DayJS",
  40017: "DateFns",
  40018: "MomentJS",
  40019: "LuxonDate",

  // State Management Services (50xxx)
  50000: "AuthService",
  50001: "AuthLogin",
  50002: "AuthLogout",
  50003: "AuthToken",
  50004: "AuthRefresh",
  50005: "AuthGuard",
  50006: "APIService",
  50007: "APIEndpoints",
  50008: "APIInterceptors",
  50009: "CacheService",
  50010: "LocalStorage",
  50011: "SessionStorage",
  50012: "IndexedDB",
  50013: "CookieService",
  50014: "StorageService",
  50015: "NotificationService",
  50016: "AnalyticsService",
  50017: "LoggerService",
  50018: "ConfigService",
  50019: "I18nService",

  // Form Handling (60xxx)
  60000: "Formik",
  60001: "FormikForm",
  60002: "FormikField",
  60003: "ReactHookForm",
  60004: "RHFCore",
  60005: "RHFRegister",
  60006: "RHFUseForm",
  60007: "YupValidation",
  60008: "ZodValidation",
  60009: "JoiValidation",
  60010: "FormValidator",
  60011: "FormSerializer",
  60012: "FormBuilder",

  // GraphQL (70xxx)
  70000: "GraphQLCore",
  70001: "ApolloClient",
  70002: "ApolloCache",
  70003: "ApolloLink",
  70004: "ApolloHooks",
  70005: "URQLClient",
  70006: "URQLExchange",
  70007: "GraphQLTaggedTemplate",
  70008: "GraphQLSchema",
  70009: "GraphQLResolver",

  // Animation (80xxx)
  80000: "FramerMotion",
  80001: "MotionValue",
  80002: "MotionAnimate",
  80003: "GSAP",
  80004: "GSAPTimeline",
  80005: "AnimeJS",
  80006: "Popmotion",
  80007: "Motion",
  80008: "Velocity",
  80009: "Transition",
  80010: "ReactSpring",
  80011: "ReactTransitionGroup",

  // Testing (90xxx)
  90000: "JestCore",
  90001: "JestExpect",
  90002: "JestMock",
  90003: "JestSpyOn",
  90004: "TestingLibrary",
  90005: "RTLRender",
  90006: "RTLFireEvent",
  90007: "RTLWaitFor",
  90008: "RTLAct",
  90009: "Enzyme",
  90010: "EnzymeShallow",
  90011: "EnzymeMount",
  90012: "Mocha",
  90013: "Chai",

  // UI/DOM Components (10xxx - legacy)
  10000: "UserProfileComponent",
  10001: "DashboardComponent",
  10002: "NavigationComponent",
  10003: "HeaderComponent",
  10004: "FooterComponent",
  10005: "SidebarComponent",
  10006: "ModalComponent",
  10007: "PopupComponent",
  10008: "ToastComponent",
  10009: "AlertComponent",
  10010: "TabsComponent",
  10011: "AccordionComponent",
  10012: "CarouselComponent",

  // Services (20xxx - legacy)
  20000: "AuthenticationService",
  20001: "DataFetchService",
  20002: "StateManagementService",
  20003: "APIService",
  20004: "LoggingService",
  20005: "AnalyticsService",
  20006: "CacheService",
  20007: "StorageService",
  20008: "NotificationService",
  20009: "ValidationService",

  // Utilities (30xxx - legacy)
  30000: "DateFormatter",
  30001: "StringUtils",
  30002: "ValidationHelpers",
  30003: "ObjectUtils",
  30004: "ArrayUtils",
  30005: "MathUtils",
  30006: "EventUtils",
  30007: "DOMHelpers",
  30008: "BrowserUtils",
  30009: "DeviceDetection",
  30010: "LocalizationUtils",

  // Known specific modules
  97213: "TaskListBehaviorModule",
  88402: "SSOHandlerModule",
  24791: "DialogManagerModule",
  97422: "EventListenerModule",
  20999: "StateManagerModule",
  85876: "AnalyticsTrackerModule",
  17584: "APIClientModule",
  96540: "ReactSharedInternals",
};

/**
 * Analyzes module usage patterns to determine the likely functionality
 * @param {string} code - The code snippet to analyze
 * @returns {string|null} - The detected module type or null if unknown
 */
function analyzeModuleType(code) {
  // DOM manipulation patterns
  if (
    /document\.getElementById|querySelector|createElement|appendChild|innerHtml|textContent|addEventListener|removeEventListener/.test(
      code
    )
  ) {
    return "DOMManipulation";
  }

  // Network request patterns
  if (
    /fetch\(|\.ajax\(|\.get\(|\.post\(|XMLHttpRequest|axios|\.then\(|\.catch\(|response\.json\(\)/.test(
      code
    )
  ) {
    return "NetworkRequest";
  }

  // State management patterns
  if (
    /setState\(|useReducer|getState|dispatch\(|createStore|subscribe\(|Provider|Context|useContext/.test(
      code
    )
  ) {
    return "StateManagement";
  }

  // Data transformation patterns
  if (
    /\.map\(|\.filter\(|\.reduce\(|\.forEach\(|JSON\.parse|JSON\.stringify|Object\.assign|Object\.keys/.test(
      code
    )
  ) {
    return "DataTransformation";
  }

  // Event handling patterns
  if (
    /onClick|onChange|onSubmit|onBlur|onFocus|onLoad|on\w+|addEventListener|removeEventListener|stopPropagation|preventDefault/.test(
      code
    )
  ) {
    return "EventHandling";
  }

  // Routing/Navigation patterns
  if (
    /router|navigate|history|location\.href|location\.pathname|Link|Route|push\(|replace\(|params|query/.test(
      code
    )
  ) {
    return "Routing";
  }

  // Authentication patterns
  if (
    /login|logout|auth|token|jwt|password|user|session|credential|authenticate|authorize/.test(
      code
    )
  ) {
    return "Authentication";
  }

  // UI component patterns
  if (
    /render\(|component|props|className|style|css|animation|transition|display|visibility|opacity|color|width|height/.test(
      code
    )
  ) {
    return "UIComponent";
  }

  // Utility function patterns
  if (
    /util|helper|format|validate|check|is[A-Z]|get[A-Z]|set[A-Z]|has[A-Z]|can[A-Z]|should[A-Z]/.test(
      code
    )
  ) {
    return "Utility";
  }

  // Analytics patterns
  if (
    /track|analytics|metric|measure|event|log|monitor|report|segment|ga\(|gtag|dataLayer|pixel/.test(
      code
    )
  ) {
    return "Analytics";
  }

  return null;
}

/**
 * Attempts to guess the purpose of a module based on its dependencies
 * @param {Array<number>} dependencies - Array of module IDs this module depends on
 * @returns {string|null} - A guessed module purpose or null
 */
function guessModulePurpose(dependencies) {
  if (!dependencies || dependencies.length === 0) return null;

  // Look for patterns in the dependencies
  const dependencyTypes = dependencies
    .map((depId) => {
      const mappedName = moduleIdMapping[depId] || "";
      if (mappedName.includes("Service")) return "Service";
      if (mappedName.includes("Component")) return "Component";
      if (mappedName.includes("Utils") || mappedName.includes("Helpers"))
        return "Utility";
      return null;
    })
    .filter(Boolean);

  // Count occurrences of each type
  const typeCounts = dependencyTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Find the most common type
  let mostCommonType = null;
  let highestCount = 0;

  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > highestCount) {
      mostCommonType = type;
      highestCount = count;
    }
  });

  return mostCommonType;
}

/**
 * Maps a numeric module ID to a meaningful name
 * @param {string|number} id - The module ID
 * @param {string} codeContext - Surrounding code for context analysis
 * @returns {string} - A meaningful name for the module
 */
function getModuleName(id, codeContext) {
  // Check if we have a predefined mapping
  if (moduleIdMapping[id]) {
    return moduleIdMapping[id];
  }

  // Try to analyze the code to determine module type
  const moduleType = analyzeModuleType(codeContext);

  if (moduleType) {
    return `${moduleType}_${id}`;
  }

  // Fallback based on ID ranges
  if (id < 10) {
    return `WebpackCore_${id}`;
  } else if (id < 1000) {
    return `InfraModule_${id}`;
  } else if (id < 10000) {
    return `AppModule_${id}`;
  } else if (id < 20000) {
    return `UIModule_${id}`;
  } else if (id < 30000) {
    return `ServiceModule_${id}`;
  } else if (id < 40000) {
    return `UtilityModule_${id}`;
  } else if (id < 50000) {
    return `DataModule_${id}`;
  } else {
    return `Module_${id}`;
  }
}

function extractExports(ast) {
  const exports = [];

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const specifiers = path.node.specifiers;
      if (specifiers && specifiers.length > 0) {
        specifiers.forEach((spec) => {
          exports.push({
            name: spec.exported?.name || spec.local?.name,
            local: spec.local?.name,
            type: "named",
          });
        });
      } else if (path.node.declaration) {
        const decl = path.node.declaration;
        exports.push({
          name: decl.id?.name,
          type: "declaration",
        });
      }
    },

    ExportDefaultDeclaration(path) {
      exports.push({
        name: "default",
        type: "default",
      });
    },

    ExportAllDeclaration(path) {
      exports.push({
        name: path.node.source?.value,
        type: "re-export",
      });
    },
  });

  return exports;
}

function extractImports(ast) {
  const imports = [];

  traverse(ast, {
    ImportDeclaration(path) {
      imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((spec) => ({
          type: spec.type,
          name: spec.imported?.name || spec.local?.name,
        })),
      });
    },

    CallExpression(path) {
      if (path.node.callee.name === "require") {
        imports.push({
          source: path.node.arguments[0]?.value,
          type: "require",
        });
      }

      if (path.node.callee.type === "Import") {
        imports.push({
          source: path.node.arguments[0]?.value,
          type: "dynamic-import",
        });
      }
    },
  });

  return imports;
}

function analyzeBundleStructure(code) {
  const structure = {
    chunkCount: 0,
    moduleCount: 0,
    hasWebpack: false,
    hasReact: false,
    hasVue: false,
    hasAngular: false,
    hasTypescript: false,
    hasCSS: false,
    hasImages: false,
    entryPoints: [],
    dependencies: [],
  };

  // Detect chunk patterns
  const chunkMatches = code.match(/webpackChunk\w+\s*=\s*\[\s*\[/g);
  if (chunkMatches) {
    structure.chunkCount = chunkMatches.length;
  }

  // Detect webpack
  structure.hasWebpack = /webpack|__webpack_require__|webpackRuntime/.test(
    code
  );

  // Detect frameworks
  structure.hasReact = /react|React|createElement|useState|useEffect/.test(
    code
  );
  structure.hasVue = /vue|Vue|createApp|defineComponent/.test(code);
  structure.hasAngular = /@angular|ngModule|Component|Injectable/.test(code);

  // Detect TypeScript
  structure.hasTypescript =
    /:\s*(string|number|boolean|any|void|never|unknown)/.test(code);

  // Detect CSS
  structure.hasCSS = /\.css|import\s+['"].*\.css/.test(code);

  // Detect images/assets
  structure.hasImages = /\.(png|jpg|jpeg|gif|svg|webp|ico)/.test(code);

  // Try to find entry points
  const entryPatterns = [
    /(?:const|var|let)\s+(\w+)\s*=\s*(?:require|import).*['"](?:main|index|entry|app)['"]/i,
    /__webpack_require__\.e\((\d+)\)/,
  ];

  entryPatterns.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      structure.entryPoints.push(matches[1] || matches[0]);
    }
  });

  return structure;
}

function detectMinificationLevel(code) {
  const metrics = {
    avgLineLength: 0,
    variableLength: 0,
    hasShortNames: false,
    hasMinifiedPatterns: false,
    compressionRatio: 0,
  };

  const lines = code.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return metrics;

  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  metrics.avgLineLength = totalLength / lines.length;

  // Check for minification patterns
  metrics.hasMinifiedPatterns =
    /\{[\w$]+\:[\w$]+/.test(code) && metrics.avgLineLength > 200;

  // Check for short variable names
  const shortVars = code.match(/\b[a-z]{1,2}\s*=/g);
  if (shortVars && shortVars.length > 10) {
    metrics.hasShortNames = true;
  }

  return metrics;
}

module.exports = {
  moduleIdMapping,
  analyzeModuleType,
  guessModulePurpose,
  getModuleName,
  extractExports,
  extractImports,
  analyzeBundleStructure,
  detectMinificationLevel,
};
