// module_analyzer.js
// Enhanced module analysis for webpack bundles

/**
 * Maps common module IDs to meaningful names based on functionality
 */
const moduleIdMapping = {
  // Common Webpack infrastructure modules
  1: "WebpackBootstrap",
  2: "WebpackRequireCache",
  3: "WebpackModuleCache",
  4: "WebpackPublicPath",
  5: "WebpackBaseURI",
  6: "WebpackGlobalThis",
  7: "WebpackOnLoad",
  8: "WebpackModuleFactories",
  9: "WebpackHMR",

  // UI/DOM Modules
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

  // Services
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

  // Utilities
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

  // Common modules by ID patterns
  90000: "ReactCore",
  90001: "ReactDOM",
  90002: "ReactRouter",
  90003: "Redux",
  90004: "Axios",
  90005: "Lodash",
  90006: "Moment",
  90007: "jQuery",
  90008: "Bootstrap",

  // Known specific modules (add these as you discover them)
  97213: "TaskListBehaviorModule",
  88402: "SSOHandlerModule",
  24791: "DialogManagerModule",
  97422: "EventListenerModule",
  20999: "StateManagerModule",
  85876: "AnalyticsTrackerModule",
  17584: "APIClientModule",
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

module.exports = {
  moduleIdMapping,
  analyzeModuleType,
  guessModulePurpose,
  getModuleName,
};
