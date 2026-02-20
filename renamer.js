// renamer.js
const { default: traverse } = require("@babel/traverse");

function suggestNames(ast, patterns) {
  const suggestions = new Map();
  const hasReact = patterns.some((p) => p.name === "reactPatterns");
  const hasJQuery = patterns.some((p) => p.name === "jqueryPatterns");
  const hasStatePattern = patterns.some((p) => p.name === "tryFinallyState");

  // Common variable name mappings
  const commonMappings = {
    a: "temp",
    b: "value",
    c: "context", // Or df: "disableFeature" if context is more specific
    d: "data",
    e: "element",
    f: "flag",
    g: "global",
    h: "handler",
    i: "index",
    j: "json",
    k: "key",
    l: "list", // Or lB: "listenBehavior" if list is less likely
    m: "map",
    n: "node",
    o: "options",
    p: "params",
    q: "query",
    r: "result",
    s: "state",
    t: "target",
    u: "url", // Or u: "mountTarget" (mT) if url is less likely
    v: "value",
    w: "width",
    x: "xCoord",
    y: "yCoord",
    z: "zoom",
    // Webpack/Bundle specific hints (if applicable based on context)

    A: "defaultExport", // Often used for default exports in modules
    VH: "getVersionHash", // Handled more specifically below
    df: "disableFeature",
    mT: "mountTarget",
    k_: "kickStart",
    lB: "listenBehavior",
    JW: "jsonWorker",
    Ts: "fetchTemplate",
    Zz: "combineSubscriptions",
    Rt: "registerListener",

    // 🆕 40 more hints
    iM: "initModule",
    rC: "resolveChunk",
    sH: "setHeader",
    bP: "buildPath",
    cN: "createNamespace",
    eE: "emitEvent",
    fC: "fetchConfig",
    gT: "getToken",
    hR: "handleRequest",
    jQ: "joinQueue",
    lC: "loadComponent",
    mD: "moduleData",
    nS: "normalizeStyle",
    oP: "overrideParams",
    pL: "preload",
    qS: "querySelector",
    rM: "registerModule",
    sC: "splitChunk",
    tR: "transformRequest",
    uE: "updateEntry",
    vF: "validateFile",
    wL: "watchList",
    xH: "extractHash",
    yD: "yieldData",
    zB: "zipBundle",
    aC: "applyConfig",
    bH: "bundleHash",
    cL: "createLoader",
    dT: "defineTemplate",
    eM: "enableModule",
    fP: "filePath",
    gC: "generateChunk",
    hC: "hookCallback",
    iL: "injectLink",
    jS: "jsonSchema",
    kH: "keepHot",
    lM: "loadManifest",
    mQ: "mergeQueue",
    nC: "nodeContext",
    oE: "onError",
    pC: "pluginConfig",
  };
  // Framework-specific adjustments
  if (hasReact) {
    Object.assign(commonMappings, {
      s: "state",
      d: "dispatch",
      r: "reducer",
      e: "effect",
      c: "component",
      p: "props",

      // 🆕 Additional 40 mappings
      a: "action",
      b: "booleanFlag",
      f: "fragment",
      g: "getState",
      h: "handleChange",
      i: "inputValue",
      j: "jsxElement",
      k: "key",
      l: "loading",
      m: "memo",
      n: "node",
      o: "onClick",
      q: "query",
      t: "toggle",
      u: "useEffect",
      v: "value",
      w: "wrapper",
      x: "context",
      y: "sync",
      z: "zoomLevel",
      A: "App",
      B: "Button",
      C: "Container",
      D: "Dropdown",
      E: "ErrorBoundary",
      F: "Form",
      G: "Grid",
      H: "Header",
      I: "Icon",
      J: "JoinHandler",
      K: "KeyboardHandler",
      L: "List",
      M: "Modal",
      N: "Navbar",
      O: "Overlay",
      P: "Pagination",
      Q: "QueryClient",
      R: "Router",
      S: "Switch",
      T: "TextInput",
      U: "UserContext",
      V: "View",
    });
  }

  if (hasJQuery) {
    Object.assign(commonMappings, {
      e: "element",
      s: "selector",
      h: "handler",
      d: "data",

      // 🆕 Additional 40 mappings
      a: "ajaxOptions",
      b: "bindEvent",
      c: "callback",
      f: "fadeEffect",
      g: "getValue",
      i: "initFunction",
      j: "jsonData",
      k: "keyCode",
      l: "loadContent",
      m: "matchSelector",
      n: "nodeList",
      o: "offsetValue",
      p: "parentElement",
      q: "queueAnimation",
      r: "removeElement",
      t: "toggleClass",
      u: "unbindEvent",
      v: "visibleState",
      w: "widthValue",
      x: "ajaxResponse",
      y: "styleValue",
      z: "zoomLevel",
      A: "animateProps",
      B: "blurHandler",
      C: "clickHandler",
      D: "delayTimer",
      E: "eventType",
      F: "focusHandler",
      G: "getAttribute",
      H: "hoverHandler",
      I: "isVisible",
      J: "joinElements",
      K: "keyDownHandler",
      L: "loadHandler",
      M: "mouseMoveHandler",
      N: "nextElement",
      O: "onEvent",
      P: "positionValue",
      Q: "querySelectorAll",
      R: "resizeHandler",
      S: "scrollHandler",
      T: "textContent",
    });
  }

  if (hasStatePattern) {
    Object.assign(commonMappings, {
      o: "prevState",
      a: "savedState",
      s: "state",
      d: "dispatch",
      r: "reducer",
      e: "effect",
      c: "component",
      p: "props",
      o: "prevState",
      a: "savedState",
      l: "setState",
      u: "useEffect",
      m: "memoizedValue",
      t: "toggleState",
      v: "value",
      f: "formState",
      n: "nodeRef",

      // ✅ Vue / Composition API
      x: "refValue",
      y: "computedValue",
      z: "watcher",
      g: "getter",
      w: "watchEffect",
      j: "jsxProxy",
      k: "keyBinding",
      q: "queryState",

      // ✅ Angular / RxJS
      A: "actionStream",
      B: "behaviorSubject",
      C: "changeDetector",
      D: "directive",
      E: "eventEmitter",
      F: "formControl",
      G: "guardFunction",
      H: "httpClient",

      // ✅ jQuery / DOM
      I: "inputElement",
      J: "joinSelector",
      K: "keyDownHandler",
      L: "loadHandler",
      M: "mouseMoveHandler",
      N: "nextElement",
      O: "offsetValue",
      P: "parentElement",
      S: "scrollHandler",
      T: "textContent",
      // 🆕 Additional 30 mappings
      U: "updateElement",
      V: "visibilityToggle",
      W: "widthSetter",
      X: "xmlParser",
      Y: "yieldElement",
      Z: "zoomHandler",
      AA: "addClass",
      BB: "blurHandler",
      CC: "clickHandler",
      DD: "delayFunction",
      EE: "eventBinder",
      FF: "fadeInEffect",
      GG: "getAttribute",
      HH: "hoverEffect",
      II: "insertElement",
      JJ: "joinNodes",
      KK: "keyUpHandler",
      LL: "loadContent",
      MM: "mouseEnterHandler",
      NN: "nextSibling",
      OO: "onEventTrigger",
      PP: "positionSetter",
      QQ: "queryDOM",
      RR: "removeClass",
      SS: "setStyle",
      TT: "toggleClass",
      UU: "unbindHandler",
      VV: "validateForm",
      WW: "wrapElement",
      XX: "xmlHttpRequest",

      // ✅ Svelte / Reactive Patterns
      U: "updateFunction",
      V: "visibilityState",
      W: "windowState",
      X: "exportedStore",
      Y: "yieldValue",
      Z: "zoneContext",

      // ✅ General JS / Utility
      b: "booleanFlag",
      h: "handler",
      i: "index",
      R: "result",
      Q: "queue",
      aa: "asyncAction",
      bb: "buffer",
      cc: "callback",
      dd: "debounceTimer",
      ee: "errorState",
      ff: "fetchData",
      gg: "globalState",
      hh: "hoverState",
      ii: "initFunction",
      jj: "jsonData",
      kk: "keyCode",
      ll: "loadingFlag",
      mm: "mountPoint",
      nn: "normalizeInput",
      oo: "observer",
      pp: "pagination",
      qq: "queryParams",
      rr: "resetFunction",
      ss: "syncFunction",
      tt: "timeout",
      uu: "updateProps",
      vv: "validateInput",
      ww: "wrapperElement",
      xx: "xmlHttpRequest",
      yy: "yieldControl",
      zz: "zoomLevel",

      // 🆕 Additional 40 jQuery-style mappings
      a: "ajaxConfig",
      b: "bindMethod",
      c: "callbackFunction",
      f: "fadeToggle",
      g: "getRequest",
      i: "initSelector",
      j: "jsonPayload",
      k: "keyEvent",
      l: "loadCallback",
      m: "matchElement",
      n: "nodeList",
      o: "offsetCoords",
      p: "parentNode",
      q: "queueEffect",
      r: "removeClass",
      t: "toggleVisibility",
      u: "unbindMethod",
      v: "valueAttr",
      w: "widthAttr",
      x: "xmlResponse",
      y: "styleAttr",
      z: "zoomFactor",
      A: "animateConfig",
      B: "blurEvent",
      C: "clickEvent",
      D: "delayDuration",
      E: "eventObject",
      F: "focusEvent",
      G: "getAttr",
      H: "hoverEvent",
      I: "isVisible",
      J: "joinNodes",
      K: "keyPressEvent",
      L: "loadEvent",
      M: "mouseEvent",
      N: "nextSibling",
      O: "onEvent",
      P: "positionAttr",
      Q: "queryAll",
      R: "resizeEvent",
      S: "scrollEvent",
      T: "textValue",
    });
  }

  // --- Property Name Mappings (from your snippet) ---
  // These are often context-dependent but provide good starting points.
  // They might conflict with variable names, so careful integration is needed.
  const propertyMappings = {
    VH: "getVersionHash",
    df: "disableFeature",
    mT: "mountTarget",
    k_: "kickStart", // Seen in your snippets
    lB: "listenBehavior", // Seen in your snippets (e.g., (0, data.lB))
    JW: "jsonWorker", // Seen in your snippets (e.g., (0, i.JW))
    Ts: "fetchTemplate", // Seen in your snippets (e.g., (0, options.Ts))
    Zz: "combineSubscriptions", // Seen in your snippets (e.g., (0, state.Zz))
    Rt: "registerListener", // Seen in your snippets (e.g., (0, state.Rt))
    // Add more as you identify common patterns in bundles

    // Consider context: n.d(t, {VH:..., df:...}) suggests VH,df are exports/properties
    Ee: "getValue",
    value4: "getValue4", // Placeholder, needs context
    M: "renderCount", // Guess based on usage M(element, count)
    handler: "inputHandler", // Guess based on usage
    width: "keyDownHandler", // Guess based on usage with 'keydown'
    value: "inputValueHandler", // Guess based on usage
    context: "getFeatureContext", // Guess based on name
    url: "buildUrl", // Guess based on name
    temp: "processTempData", // Guess based on name
    state: "processStateData", // Guess based on name
    list: "processListData", // Guess based on name
    result: "processResultData", // Guess based on name
    options: "fetchOptions", // Guess based on name
    index: "processIndexData", // Guess based on name
    A: "getDefaultExport", // Guess based on Webpack n.d(t, { ... A: ...})

    // Add more guesses or identified patterns
    // 🆕 60 additional mappings
    B: "bindEvent",
    C: "createElement",
    D: "destroyComponent",
    E: "emitEvent",
    F: "fetchData",
    G: "generateHash",
    H: "handleClick",
    I: "initialize",
    J: "joinStream",
    K: "keepAlive",
    L: "loadModule",
    N: "normalizeInput",
    O: "observeChanges",
    P: "parseResponse",
    Q: "queueTask",
    R: "renderUI",
    S: "syncState",
    T: "trackEvent",
    U: "updateDOM",
    V: "validateInput",
    W: "watchEffect",
    X: "executeCallback",
    Y: "yieldControl",
    Z: "zipPayload",
    a1: "applyMiddleware",
    b2: "buildComponent",
    c3: "cacheResult",
    d4: "dispatchAction",
    e5: "encodePayload",
    f6: "formatDate",
    g7: "generateToken",
    h8: "handleSubmit",
    i9: "injectStyles",
    j0: "jsonParse",
    k1: "keyHandler",
    l2: "loadConfig",
    m3: "mergeProps",
    n4: "navigateTo",
    o5: "optimizeRender",
    p6: "preloadAssets",
    q7: "querySelector",
    r8: "resetState",
    s9: "saveData",
    t0: "transformInput",
    u1: "updateProps",
    v2: "verifyToken",
    w3: "wrapComponent",
    x4: "extractParams",
    y5: "yieldResult",
    z6: "zipFiles",
    _a: "asyncHandler",
    _b: "bufferStream",
    _c: "clearCache",
    _d: "decodePayload",
    _e: "enableFeature",
    _f: "fetchManifest",
  };

  // Integrate property mappings into common mappings
  // Be careful: If 'c' is a variable, and 'df' (property) maps to 'disableFeature',
  // and you have c: "context" and df: "disableFeature", the 'c' variable will be
  // renamed to "context". The property 'df' needs different handling in the AST traversal.
  // For now, let's add property mappings, but be aware of potential conflicts.
  // A more robust system might separate variable renames from property renames.
  Object.assign(commonMappings, propertyMappings);

  // Collect all identifiers from standard locations
  const identifiers = new Set();

  traverse(ast, {
    Identifier(path) {
      // This catches most variable usages, function calls, property accesses (obj.prop)
      // but not the *definition* of properties in ObjectExpressions ({prop: value})
      if (!path.isBindingIdentifier()) {
        // Not a declaration like `var a = ...`
        identifiers.add(path.node.name);
      }
    },
    VariableDeclarator(path) {
      // This catches variable declarations like `var a = ...`
      if (path.node.id && path.node.id.name) {
        identifiers.add(path.node.id.name);
      }
      // Handle destructuring if needed: const { VH: alias } = obj;
      // This is more complex and might be better handled in patterns.js for string replacement
      // if the property names are deeply embedded.
    },
    FunctionDeclaration(path) {
      // This catches function declarations like `function a() {}`
      if (path.node.id && path.node.id.name) {
        identifiers.add(path.node.id.name);
      }
    },
    // --- Add logic to capture MemberExpression property names ---
    // This is key for renaming `obj.VH`, `module.df`, etc.
    MemberExpression(path) {
      // Check for property access like `object.VH` or `module.df`
      // We are interested in the property name itself, not the object or the result
      if (
        path.node.computed === false &&
        path.node.property.type === "Identifier"
      ) {
        const propertyName = path.node.property.name;
        // Add potential property names to identifiers for suggestion
        // You might want to be more selective here based on context
        // e.g., only if the object name matches certain patterns
        identifiers.add(propertyName);
      }
      // For computed properties `obj[computedKey]`, it's harder to statically analyze.
    },
    // --- Add logic to capture ObjectExpression property names ---
    // This is key for renaming `{ VH: () => ..., df: () => ... }`
    ObjectExpression(path) {
      // Check for object literals like `{ VH: value, df: value }`
      path.node.properties.forEach((prop) => {
        if (
          prop.type === "ObjectProperty" &&
          prop.key.type === "Identifier" &&
          !prop.computed // Ignore computed keys like { [dynamicKey]: value }
        ) {
          const propertyName = prop.key.name;
          // Add potential property names to identifiers for suggestion
          identifiers.add(propertyName);
        }
        // Shorthand properties `const VH = 1; const obj = { VH };` are handled by Identifier
      });
    },
    // Add this new visitor for ArrayPattern (destructuring) - INSIDE traverse
    ArrayPattern(path) {
      // Check if this is from useState destructuring
      const parent = path.parent;
      if (
        parent &&
        parent.init &&
        parent.init.callee &&
        parent.init.callee.property &&
        parent.init.callee.property.name === "useState"
      ) {
        // Get the variable names from destructuring
        path.node.elements.forEach((element, index) => {
          if (element && element.name && /^[a-z]$/.test(element.name)) {
            // Suggest names based on position (0 = state, 1 = setter)
            // Use the existing commonMappings if they provide a specific name,
            // otherwise use generic hook names
            const existingSuggestion = commonMappings[element.name];
            if (existingSuggestion && existingSuggestion !== element.name) {
              // If commonMappings already has a specific suggestion, use it
              suggestions.set(element.name, existingSuggestion);
            } else if (index === 0) {
              suggestions.set(element.name, `${element.name}State`);
            } else if (index === 1) {
              suggestions.set(
                element.name,
                `set${
                  element.name.charAt(0).toUpperCase() + element.name.slice(1)
                }State` // Safer capitalization
              );
            } else {
              suggestions.set(element.name, `hookVar${index}`);
            }
          }
        });
      }
    },
    // End of traverse visitors
  }); // Close traverse call

  // Suggest names for obfuscated identifiers
  identifiers.forEach((name) => {
    if (
      /^[a-z]$/.test(name) ||
      /^[A-Z][a-z]?$/.test(name) ||
      /^[a-z][A-Z]$/.test(name) ||
      /^[\w$]{2,3}$/.test(name)
    ) {
      // Expanded pattern
      const suggestion = commonMappings[name];
      if (suggestion && suggestion !== name) {
        // Avoid overriding specific hook renames or existing suggestions for the same key
        if (!suggestions.has(name)) {
          suggestions.set(name, suggestion);
        }
      }
    } else if (/^[a-z]\d+$/.test(name)) {
      const base = name[0];
      const suffix = name.substring(1);
      const baseSuggestion = commonMappings[base];
      if (baseSuggestion) {
        suggestions.set(name, `${baseSuggestion}${suffix}`);
      }
    }
  });

  // Special handling for React hook variables (if not caught by destructuring logic)
  // This is a fallback if the ArrayPattern logic doesn't cover all cases
  if (hasReact) {
    const reactHookFallbackVars = {
      i: "indexState",
      o: "setterFunction",
      l: "setStateFunction",
      c: "componentState",
      d: "dispatchFunction",
      a: "arrayState",
      b: "booleanState",
      r: "resultState",
      s: "stringState",
      t: "tempState",
      u: "urlState", // Or mountTargetState

      // 🆕 Additional 30 guesses
      m: "memoizedValue",
      n: "nodeRef",
      e: "effectCleanup",
      f: "fetchState",
      g: "globalState",
      h: "hoverState",
      j: "jsonState",
      k: "keyState",
      p: "propsState",
      q: "queryState",
      v: "visibilityState",
      w: "windowState",
      x: "expandedState",
      y: "syncState",
      z: "zoomState",
      A: "authState",
      B: "bufferState",
      C: "callbackRef",
      D: "debouncedValue",
      E: "errorState",
      F: "formState",
      G: "geoLocationState",
      H: "hoverTimeout",
      I: "inputRef",
      J: "jobStatusState",
      K: "keyboardState",
      L: "loadingState",
      M: "modalState",
      N: "notificationState",
      O: "observerRef",
    };

    Object.keys(reactHookFallbackVars).forEach((varName) => {
      if (identifiers.has(varName) && !suggestions.has(varName)) {
        suggestions.set(varName, reactHookFallbackVars[varName]);
      }
    });
  }

  return suggestions;
}

module.exports = { suggestNames };
