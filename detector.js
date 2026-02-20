const { default: traverse } = require("@babel/traverse");

function detectFunctionality(ast, code = "") {
  const functionality = [];

  // Analyze imports and requires for better detection
  const imports = [];
  const requires = [];
  traverse(ast, {
    ImportDeclaration(path) {
      imports.push(path.node.source.value);
    },
    CallExpression(path) {
      if (path.node.callee.name === "require") {
        requires.push(path.node.arguments[0]?.value);
      }
    },
  });

  // Detect third-party libraries from imports
  const detectedLibs = detectLibraries(imports, requires);
  if (detectedLibs.length > 0) {
    functionality.push({
      type: "libraries",
      description: `Third-party libraries: ${detectedLibs.join(", ")}`,
      codeSnippet: detectedLibs.join(", "),
      location: { startLine: 1, endLine: 1 },
    });
  }

  // Detect security-related patterns
  const securityPatterns = detectSecurityPatterns(ast);
  securityPatterns.forEach((pattern) => {
    functionality.push({
      type: "security",
      description: pattern,
      codeSnippet: pattern,
      location: { startLine: 1, endLine: 1 },
    });
  });

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;

      if (isEventHandler(callee)) {
        addFunctionality(
          functionality,
          "eventHandler",
          `Event handler detected (${callee.property?.name || "unknown"})`,
          path
        );
      }

      if (isUserInput(callee)) {
        addFunctionality(
          functionality,
          "UserInput",
          "User input processing detected",
          path
        );
      }

      if (isFormHandling(callee)) {
        addFunctionality(
          functionality,
          "FormHandling",
          "Form handling logic detected",
          path
        );
      }

      if (isApiCall(callee)) {
        addFunctionality(
          functionality,
          "ApiCall",
          "API or network request detected",
          path
        );
      }

      if (isAuthCall(callee)) {
        addFunctionality(
          functionality,
          "Authentication",
          "Authentication or authorization logic detected",
          path
        );
      }

      if (isStorageCall(callee)) {
        addFunctionality(
          functionality,
          "Storage",
          "Storage or persistence logic detected",
          path
        );
      }

      if (isUiInteraction(callee)) {
        addFunctionality(
          functionality,
          "UIInteraction",
          "UI interaction or component toggling detected",
          path
        );
      }

      if (isAnalyticsCall(callee)) {
        addFunctionality(
          functionality,
          "Analytics",
          "Analytics or tracking logic detected",
          path
        );
      }

      if (isFileHandling(callee)) {
        addFunctionality(
          functionality,
          "FileHandling",
          "download, or manipulation detected",
          path
        );
      }

      if (isMediaControl(callee)) {
        addFunctionality(
          functionality,
          "MediaControl",
          "Media playback or recording logic detected",
          path
        );
      }

      if (isStateManagement(callee)) {
        addFunctionality(
          functionality,
          "stateManagement",
          "State management pattern detected",
          path
        );
      }

      if (isStringProcessing(callee)) {
        addFunctionality(
          functionality,
          "stringProcessing",
          "String processing/normalization detected",
          path
        );
      }

      if (isErrorHandling(callee)) {
        addFunctionality(
          functionality,
          "errorHandling",
          "Error handling mechanism detected",
          path
        );
      }

      if (isDOMManipulation(callee)) {
        addFunctionality(
          functionality,
          "domManipulation",
          "DOM manipulation detected",
          path
        );
      }

      if (isAjaxCall(callee)) {
        addFunctionality(
          functionality,
          "ajaxRequest",
          "AJAX/fetch request detected",
          path
        );
      }

      if (isAnimationCall(callee)) {
        addFunctionality(
          functionality,
          "animation",
          "Animation or transition detected",
          path
        );
      }

      if (isValidationCall(callee)) {
        addFunctionality(
          functionality,
          "validation",
          "Input validation detected",
          path
        );
      }

      if (isRoutingCall(callee)) {
        addFunctionality(
          functionality,
          "routing",
          "Routing/navigation detected",
          path
        );
      }

      if (isStorageAccess(callee)) {
        addFunctionality(
          functionality,
          "storageAccess",
          "Local/session storage access detected",
          path
        );
      }

      if (isLoggingCall(callee)) {
        addFunctionality(
          functionality,
          "logging",
          "Console logging or debug output detected",
          path
        );
      }

      if (isHookUsage(callee)) {
        addFunctionality(
          functionality,
          "reactHook",
          "React hook usage detected",
          path
        );
      }

      if (isReduxDispatch(callee)) {
        addFunctionality(
          functionality,
          "reduxDispatch",
          "Redux dispatch detected",
          path
        );
      }

      if (isCryptoUsage(callee)) {
        addFunctionality(
          functionality,
          "crypto",
          "Cryptographic operation detected",
          path
        );
      }

      if (isMathOperation(callee)) {
        addFunctionality(
          functionality,
          "mathOperation",
          "Math computation detected",
          path
        );
      }

      if (isTimerCall(callee)) {
        addFunctionality(
          functionality,
          "timer",
          "setTimeout/setInterval detected",
          path
        );
      }

      if (isFileUpload(callee)) {
        addFunctionality(
          functionality,
          "fileUpload",
          "File upload or input detected",
          path
        );
      }

      if (isFormSubmission(callee)) {
        addFunctionality(
          functionality,
          "formSubmission",
          "Form submission detected",
          path
        );
      }

      if (isThirdPartyAPI(callee)) {
        addFunctionality(
          functionality,
          "thirdPartyAPI",
          "Third-party API usage detected",
          path
        );
      }

      if (isIntlUsage(callee)) {
        addFunctionality(
          functionality,
          "internationalization",
          "Intl or localization detected",
          path
        );
      }

      if (isComponentRender(callee)) {
        addFunctionality(
          functionality,
          "componentRender",
          "Component rendering detected",
          path
        );
      }

      if (isDependencyInjection(callee)) {
        addFunctionality(
          functionality,
          "dependencyInjection",
          "Dependency injection detected",
          path
        );
      }

      if (isMemoization(callee)) {
        addFunctionality(
          functionality,
          "memoization",
          "Memoization or caching detected",
          path
        );
      }

      if (isCustomEvent(callee)) {
        addFunctionality(
          functionality,
          "customEvent",
          "Custom event dispatch detected",
          path
        );
      }

      if (isNavigationCall(callee)) {
        addFunctionality(
          functionality,
          "navigation",
          "Navigation or redirect detected",
          path
        );
      }

      if (isDataTransformation(callee)) {
        addFunctionality(
          functionality,
          "dataTransformation",
          "Data transformation detected",
          path
        );
      }

      if (isRegexUsage(callee)) {
        addFunctionality(
          functionality,
          "regex",
          "Regular expression usage detected",
          path
        );
      }

      if (isModuleImport(callee)) {
        addFunctionality(
          functionality,
          "moduleImport",
          "Dynamic module import detected",
          path
        );
      }

      if (isAnalyticsCall(callee)) {
        addFunctionality(
          functionality,
          "analytics",
          "Analytics tracking detected",
          path
        );
      }

      if (isWebSocketUsage(callee)) {
        addFunctionality(
          functionality,
          "webSocket",
          "WebSocket communication detected",
          path
        );
      }

      if (isClipboardAccess(callee)) {
        addFunctionality(
          functionality,
          "clipboard",
          "Clipboard access detected",
          path
        );
      }

      if (isDragDrop(callee)) {
        addFunctionality(
          functionality,
          "dragDrop",
          "Drag-and-drop interaction detected",
          path
        );
      }

      if (isMutationObserver(callee)) {
        addFunctionality(
          functionality,
          "mutationObserver",
          "DOM mutation observer detected",
          path
        );
      }

      if (isIntersectionObserver(callee)) {
        addFunctionality(
          functionality,
          "intersectionObserver",
          "Intersection observer detected",
          path
        );
      }

      if (isMediaQuery(callee)) {
        addFunctionality(
          functionality,
          "mediaQuery",
          "Responsive media query detected",
          path
        );
      }

      if (isAccessibilityFeature(callee)) {
        addFunctionality(
          functionality,
          "accessibility",
          "Accessibility feature detected",
          path
        );
      }
    },

    TryStatement(path) {
      addFunctionality(
        functionality,
        "errorHandling",
        "Try/catch error handling detected",
        path
      );
    },

    AssignmentExpression(path) {
      if (isStateAssignment(path.node)) {
        addFunctionality(
          functionality,
          "stateChange",
          "State assignment/transition detected",
          path
        );
      }
    },
  });

  return functionality;
}

// Add a function to pretty print the results
function printDetectedFunctionality(functionality) {
  console.log("=== FUNCTIONALITY DETECTED ===");
  functionality.forEach((item) => {
    console.log(`• ${item.type}: ${item.description}`);
    console.log(`  Code: ${item.codeSnippet}`);
    console.log(
      `  Location: Line ${item.location.startLine}-${item.location.endLine}\n`
    );
  });
}

function isEventHandler(callee) {
  return [
    // DOM & jQuery-style
    "addEventListener",
    "removeEventListener",
    "dispatchEvent",
    "handleEvent",
    "captureEvents",
    "on",
    "off",
    "bind",
    "unbind",
    "trigger",
    "emit",
    // jQuery-style aliases & legacy
    "delegate",
    "undelegate",
    "live",
    "die",
    "one",

    // Vue / Node / EventEmitter-style
    "once",
    "prependListener",
    "prependOnceListener",
    "removeAllListeners",
    "listeners",
    "rawListeners",
    "on",
    "off",
    "emit",
    "addListener",
    "removeListener",
    "hasListeners",
    "eventNames",
    "getMaxListeners",
    "setMaxListeners",
    "listenerCount",
    "subscribe",
    "unsubscribe",
    "publish",
    "notify",
    "broadcast",
    "registerListener",
    "unregisterListener",
    "attachListener",
    "detachListener",
    "trigger",
    "handleEvent",
    "dispatchEvent",
    "observe",
    "unobserve",
    "watch",
    "unwatch",
    "hook",
    "unhook",
    "connect",
    "disconnect",
    "pipe",
    "unpipe",
    "forwardEvent",
    "interceptEvent",
    "relayEvent",
    "captureEvent",
    "releaseEvent",
    "queueEvent",
    "flushEvents",
    "syncEvents",
    "emitChange",
    "emitUpdate",
    "emitError",
    "emitReady",
    "emitDestroy",

    // Angular-style
    "listen",
    "unlisten",
    "emitEventForComponent",
    // DOM event helpers
    "attachEvent",
    "detachEvent",
    "fireEvent",
    "cancelEvent",
    "stopPropagation",
    "preventDefault",

    // Synthetic event wrappers
    "createEvent",
    "initEvent",
    "initMouseEvent",
    "initKeyboardEvent",
    "initUIEvent",
    // Custom emitter libraries
    "subscribe",
    "unsubscribe",
    "publish",
    "notify",
    "broadcast",
    // Web components / shadow DOM
    "addEventHandler",
    "removeEventHandler",
    "dispatchCustomEvent",
    "emitCustomEvent",
    "fireCustomEvent",

    // Mouse events
    "click",
    "dblclick",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseenter",
    "mouseleave",
    "mouseover",
    "mouseout",
    "contextmenu",

    // Keyboard events
    "keydown",
    "keyup",
    "keypress",
    "textInput",
    "beforeinput",
    "input",
    "compositionstart",
    "compositionupdate",
    "compositionend",
    "keyhold",
    "keyrelease",
    "shortcut",
    "hotkey",
    "keychange",
    "keytoggle",
    "keyactivate",
    "keydeactivate",
    "keymap",
    "keybind",
    "keyunbind",
    "keyevent",
    "keyaction",
    "keycommand",
    "keycombo",
    "keysequence",
    "keymatch",
    "keydetect",
    "keycapture",
    "keypressstart",
    "keypressend",
    "keyrepeat",
    "keyscan",
    "keyinput",
    "keyoverride",
    "keyintercept",
    "keyhook",
    "keylistener",
    "keyhandler",
    "keytrigger",
    "keydispatch",
    "keyemit",
    "keyfire",
    "keydownstart",
    "keydownend",
    "keyupstart",
    "keyupend",
    "keytransition",
    "keynavigation",
    "keyfocus",
    "keyblur",

    // Form events
    "focus",
    "blur",
    "change",
    "submit",
    "reset",
    "input",
    "invalid",
    "formdata",
    "beforeinput",
    "afterinput",
    "fieldchange",
    "fieldfocus",
    "fieldblur",
    "fieldreset",
    "fieldsubmit",
    "fieldvalidate",
    "fieldinvalid",
    "fielderror",
    "fieldupdate",
    "fieldclear",
    "fieldready",
    "formchange",
    "formsubmit",
    "formreset",
    "formvalidate",
    "forminvalid",
    "formerror",
    "formupdate",
    "formclear",
    "formready",
    "validate",
    "invalidate",
    "error",
    "clear",
    "populate",
    "prefill",
    "autofill",
    "formmount",
    "formunmount",
    "formload",
    "formunload",
    "formfocus",
    "formblur",
    "forminput",
    "formpatch",
    "formsync",
    "formwatch",
    "formtouch",
    "formdirty",
    "formpristine",

    // Touch & pointer events
    "touchstart",
    "touchend",
    "touchmove",
    "pointerdown",
    "pointerup",
    "pointermove",
    "pointerenter",
    "pointerleave",
    "pointercancel",
    "pointerout",

    // Drag & drop
    "drag",
    "dragstart",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "drop",

    // Window & scroll
    "scroll",
    "resize",
    "load",
    "unload",
    "beforeunload",

    // Media & misc
    "play",
    "pause",
    "ended",
    "error",
    "abort",
  ].includes(callee.property?.name);
}

function isUserInput(callee) {
  return (
    callee.property?.name === "value" ||
    callee.property?.name === "innerHTML" ||
    callee.property?.name === "textContent" ||
    callee.property?.name === "checked" ||
    callee.property?.name === "selected" ||
    callee.property?.name === "disabled" ||
    callee.property?.name === "readOnly" ||
    callee.property?.name === "placeholder" ||
    callee.property?.name === "name" ||
    callee.property?.name === "id" ||
    callee.property?.name === "type" ||
    callee.property?.name === "className" ||
    callee.property?.name === "style" ||
    callee.property?.name === "title" ||
    callee.property?.name === "tabIndex" ||
    callee.property?.name === "submit" ||
    callee.property?.name === "reset" ||
    callee.property?.name === "focus" ||
    callee.property?.name === "blur" ||
    callee.property?.name === "select" ||
    callee.property?.name === "setCustomValidity" ||
    callee.property?.name === "checkValidity" ||
    callee.property?.name === "reportValidity" ||
    callee.property?.name === "setAttribute" ||
    callee.property?.name === "getAttribute" ||
    callee.property?.name === "removeAttribute" ||
    callee.property?.name === "appendChild" ||
    callee.property?.name === "removeChild" ||
    callee.property?.name === "replaceChild" ||
    callee.property?.name === "insertBefore" ||
    callee.property?.name === "cloneNode" ||
    callee.property?.name === "ariaLabel" ||
    callee.property?.name === "ariaHidden" ||
    callee.property?.name === "ariaChecked" ||
    callee.property?.name === "ariaSelected" ||
    callee.property?.name === "ariaDisabled" ||
    callee.property?.name === "ariaExpanded" ||
    callee.property?.name === "ariaPressed" ||
    callee.property?.name === "ariaRequired" ||
    callee.property?.name === "ariaInvalid" ||
    callee.property?.name === "ariaDescribedBy" ||
    callee.property?.name === "ariaControls" ||
    callee.property?.name === "ariaOwns" ||
    callee.property?.name === "ariaHasPopup" ||
    callee.property?.name === "ariaLive" ||
    callee.property?.name === "ariaAtomic" ||
    callee.property?.name === "ariaRelevant" ||
    callee.property?.name === "ariaBusy" ||
    callee.property?.name === "ariaRole" ||
    callee.property?.name === "formAction" ||
    callee.property?.name === "formMethod" ||
    callee.property?.name === "formEnctype" ||
    callee.property?.name === "formTarget" ||
    callee.property?.name === "autocomplete" ||
    callee.property?.name === "autofocus" ||
    callee.property?.name === "maxLength" ||
    callee.property?.name === "minLength" ||
    callee.property?.name === "pattern"
  );
}

function isFormHandling(callee) {
  return (
    callee.property?.name === "handleSubmit" ||
    callee.property?.name === "submitForm" ||
    callee.property?.name === "resetForm" ||
    callee.property?.name === "clearForm" ||
    callee.property?.name === "validateForm" ||
    callee.property?.name === "updateField" ||
    callee.property?.name === "setFieldValue" ||
    callee.property?.name === "setFieldTouched" ||
    callee.property?.name === "setFormErrors" ||
    callee.property?.name === "setFormValues" ||
    callee.property?.name === "getFormValues" ||
    callee.property?.name === "getFieldValue" ||
    callee.property?.name === "getFieldError" ||
    callee.property?.name === "getFieldTouched" ||
    callee.property?.name === "onSubmit" ||
    callee.property?.name === "onReset" ||
    callee.property?.name === "onChange" ||
    callee.property?.name === "onInput" ||
    callee.property?.name === "onBlur" ||
    callee.property?.name === "onFocus" ||
    callee.property?.name === "onValidate" ||
    callee.property?.name === "registerField" ||
    callee.property?.name === "unregisterField" ||
    callee.property?.name === "addField" ||
    callee.property?.name === "removeField" ||
    callee.property?.name === "enableField" ||
    callee.property?.name === "disableField" ||
    callee.property?.name === "touchField" ||
    callee.property?.name === "untouchField" ||
    callee.property?.name === "markFieldValid" ||
    callee.property?.name === "markFieldInvalid" ||
    callee.property?.name === "validateField" ||
    callee.property?.name === "validateInput" ||
    callee.property?.name === "validateData" ||
    callee.property?.name === "validateSchema" ||
    callee.property?.name === "validateValues" ||
    callee.property?.name === "validateRequest" ||
    callee.property?.name === "validateResponse" ||
    callee.property?.name === "validatePayload" ||
    callee.property?.name === "validateParams" ||
    callee.property?.name === "validateQuery" ||
    callee.property?.name === "validateBody" ||
    callee.property?.name === "formSubmit" ||
    callee.property?.name === "formReset" ||
    callee.property?.name === "formValidate" ||
    callee.property?.name === "formChange" ||
    callee.property?.name === "formInput" ||
    callee.property?.name === "formBlur" ||
    callee.property?.name === "formFocus" ||
    callee.property?.name === "formError" ||
    callee.property?.name === "formSuccess" ||
    callee.property?.name === "formFailure" ||
    callee.property?.name === "formValues" ||
    callee.property?.name === "formFields" ||
    callee.property?.name === "formTouched" ||
    callee.property?.name === "formDirty" ||
    callee.property?.name === "formPristine" ||
    callee.property?.name === "formState"
  );
}

function isApiCall(callee) {
  return (
    callee.property?.name === "fetch" ||
    callee.property?.name === "get" ||
    callee.property?.name === "post" ||
    callee.property?.name === "put" ||
    callee.property?.name === "delete" ||
    callee.property?.name === "patch" ||
    callee.property?.name === "head" ||
    callee.property?.name === "options" ||
    callee.property?.name === "request" ||
    callee.property?.name === "sendRequest" ||
    callee.property?.name === "makeRequest" ||
    callee.property?.name === "callApi" ||
    callee.property?.name === "axios" ||
    callee.property?.name === "axiosGet" ||
    callee.property?.name === "axiosPost" ||
    callee.property?.name === "axiosPut" ||
    callee.property?.name === "axiosDelete" ||
    callee.property?.name === "httpGet" ||
    callee.property?.name === "httpPost" ||
    callee.property?.name === "httpPut" ||
    callee.property?.name === "httpDelete" ||
    callee.property?.name === "apiGet" ||
    callee.property?.name === "apiPost" ||
    callee.property?.name === "apiPut" ||
    callee.property?.name === "apiDelete" ||
    callee.property?.name === "apiCall" ||
    callee.property?.name === "apiRequest" ||
    callee.property?.name === "apiFetch" ||
    callee.property?.name === "getData" ||
    callee.property?.name === "postData" ||
    callee.property?.name === "putData" ||
    callee.property?.name === "deleteData" ||
    callee.property?.name === "fetchData" ||
    callee.property?.name === "loadData" ||
    callee.property?.name === "sendData" ||
    callee.property?.name === "submitData" ||
    callee.property?.name === "retrieveData" ||
    callee.property?.name === "updateData" ||
    callee.property?.name === "removeData" ||
    callee.property?.name === "getJSON" ||
    callee.property?.name === "postJSON" ||
    callee.property?.name === "fetchJSON" ||
    callee.property?.name === "sendJSON" ||
    callee.property?.name === "getResource" ||
    callee.property?.name === "postResource" ||
    callee.property?.name === "fetchResource" ||
    callee.property?.name === "sendResource" ||
    callee.property?.name === "getUserData" ||
    callee.property?.name === "postUserData" ||
    callee.property?.name === "fetchUserData" ||
    callee.property?.name === "sendUserData" ||
    callee.property?.name === "getRequest" ||
    callee.property?.name === "postRequest" ||
    callee.property?.name === "putRequest" ||
    callee.property?.name === "deleteRequest" ||
    callee.property?.name === "executeRequest"
  );
}

function isAuthCall(callee) {
  return (
    callee.property?.name === "login" ||
    callee.property?.name === "logout" ||
    callee.property?.name === "signIn" ||
    callee.property?.name === "signOut" ||
    callee.property?.name === "register" ||
    callee.property?.name === "signup" ||
    callee.property?.name === "signin" ||
    callee.property?.name === "authenticate" ||
    callee.property?.name === "authorize" ||
    callee.property?.name === "checkAuth" ||
    callee.property?.name === "getToken" ||
    callee.property?.name === "setToken" ||
    callee.property?.name === "refreshToken" ||
    callee.property?.name === "verifyToken" ||
    callee.property?.name === "decodeToken" ||
    callee.property?.name === "validateToken" ||
    callee.property?.name === "invalidateToken" ||
    callee.property?.name === "getUser" ||
    callee.property?.name === "setUser" ||
    callee.property?.name === "getSession" ||
    callee.property?.name === "setSession" ||
    callee.property?.name === "destroySession" ||
    callee.property?.name === "checkSession" ||
    callee.property?.name === "isAuthenticated" ||
    callee.property?.name === "isAuthorized" ||
    callee.property?.name === "requireAuth" ||
    callee.property?.name === "requireLogin" ||
    callee.property?.name === "requirePermission" ||
    callee.property?.name === "hasPermission" ||
    callee.property?.name === "hasRole" ||
    callee.property?.name === "getRole" ||
    callee.property?.name === "setRole" ||
    callee.property?.name === "checkRole" ||
    callee.property?.name === "checkPermission" ||
    callee.property?.name === "grantAccess" ||
    callee.property?.name === "denyAccess" ||
    callee.property?.name === "requestAccess" ||
    callee.property?.name === "validateCredentials" ||
    callee.property?.name === "submitCredentials" ||
    callee.property?.name === "verifyCredentials" ||
    callee.property?.name === "getCredentials" ||
    callee.property?.name === "setCredentials" ||
    callee.property?.name === "clearCredentials" ||
    callee.property?.name === "authUser" ||
    callee.property?.name === "authCheck" ||
    callee.property?.name === "authStatus" ||
    callee.property?.name === "authToken" ||
    callee.property?.name === "authSession" ||
    callee.property?.name === "authHeader" ||
    callee.property?.name === "authMiddleware" ||
    callee.property?.name === "authGuard" ||
    callee.property?.name === "authProvider" ||
    callee.property?.name === "authCallback" ||
    callee.property?.name === "authRedirect" ||
    callee.property?.name === "authFlow" ||
    callee.property?.name === "authStrategy" ||
    callee.property?.name === "authContext"
  );
}

function isStorageCall(callee) {
  return (
    callee.property?.name === "setItem" ||
    callee.property?.name === "getItem" ||
    callee.property?.name === "removeItem" ||
    callee.property?.name === "clear" ||
    callee.property?.name === "saveData" ||
    callee.property?.name === "loadData" ||
    callee.property?.name === "storeData" ||
    callee.property?.name === "retrieveData" ||
    callee.property?.name === "deleteData" ||
    callee.property?.name === "updateData" ||
    callee.property?.name === "persist" ||
    callee.property?.name === "cache" ||
    callee.property?.name === "readStorage" ||
    callee.property?.name === "writeStorage" ||
    callee.property?.name === "syncStorage" ||
    callee.property?.name === "backupStorage" ||
    callee.property?.name === "restoreStorage" ||
    callee.property?.name === "getStorage" ||
    callee.property?.name === "setStorage" ||
    callee.property?.name === "removeStorage" ||
    callee.property?.name === "clearStorage" ||
    callee.property?.name === "hasItem" ||
    callee.property?.name === "hasKey" ||
    callee.property?.name === "getKey" ||
    callee.property?.name === "setKey" ||
    callee.property?.name === "deleteKey" ||
    callee.property?.name === "readData" ||
    callee.property?.name === "writeData" ||
    callee.property?.name === "flushData" ||
    callee.property?.name === "syncData" ||
    callee.property?.name === "loadFromStorage" ||
    callee.property?.name === "saveToStorage" ||
    callee.property?.name === "fetchFromStorage" ||
    callee.property?.name === "writeToStorage" ||
    callee.property?.name === "readFromStorage" ||
    callee.property?.name === "storeToDisk" ||
    callee.property?.name === "loadFromDisk" ||
    callee.property?.name === "saveToDisk" ||
    callee.property?.name === "deleteFromDisk" ||
    callee.property?.name === "readFromDisk" ||
    callee.property?.name === "writeToDisk" ||
    callee.property?.name === "getLocal" ||
    callee.property?.name === "setLocal" ||
    callee.property?.name === "removeLocal" ||
    callee.property?.name === "getSession" ||
    callee.property?.name === "setSession" ||
    callee.property?.name === "removeSession" ||
    callee.property?.name === "getCookie" ||
    callee.property?.name === "setCookie" ||
    callee.property?.name === "deleteCookie" ||
    callee.property?.name === "readCookie" ||
    callee.property?.name === "writeCookie" ||
    callee.property?.name === "getCache" ||
    callee.property?.name === "setCache" ||
    callee.property?.name === "clearCache" ||
    callee.property?.name === "deleteCache"
  );
}

function isUiInteraction(callee) {
  return (
    callee.property?.name === "toggle" ||
    callee.property?.name === "open" ||
    callee.property?.name === "close" ||
    callee.property?.name === "show" ||
    callee.property?.name === "hide" ||
    callee.property?.name === "expand" ||
    callee.property?.name === "collapse" ||
    callee.property?.name === "activate" ||
    callee.property?.name === "deactivate" ||
    callee.property?.name === "highlight" ||
    callee.property?.name === "focus" ||
    callee.property?.name === "blur" ||
    callee.property?.name === "click" ||
    callee.property?.name === "hover" ||
    callee.property?.name === "press" ||
    callee.property?.name === "drag" ||
    callee.property?.name === "drop" ||
    callee.property?.name === "scroll" ||
    callee.property?.name === "resize" ||
    callee.property?.name === "move" ||
    callee.property?.name === "select" ||
    callee.property?.name === "deselect" ||
    callee.property?.name === "enable" ||
    callee.property?.name === "disable" ||
    callee.property?.name === "switch" ||
    callee.property?.name === "flip" ||
    callee.property?.name === "rotate" ||
    callee.property?.name === "zoom" ||
    callee.property?.name === "pan" ||
    callee.property?.name === "pinch" ||
    callee.property?.name === "tap" ||
    callee.property?.name === "doubleTap" ||
    callee.property?.name === "longPress" ||
    callee.property?.name === "swipe" ||
    callee.property?.name === "scrollTo" ||
    callee.property?.name === "scrollIntoView" ||
    callee.property?.name === "toggleVisibility" ||
    callee.property?.name === "toggleState" ||
    callee.property?.name === "toggleClass" ||
    callee.property?.name === "addClass" ||
    callee.property?.name === "removeClass" ||
    callee.property?.name === "setClass" ||
    callee.property?.name === "setStyle" ||
    callee.property?.name === "updateStyle" ||
    callee.property?.name === "applyStyle" ||
    callee.property?.name === "showModal" ||
    callee.property?.name === "hideModal" ||
    callee.property?.name === "openModal" ||
    callee.property?.name === "closeModal" ||
    callee.property?.name === "showDropdown" ||
    callee.property?.name === "hideDropdown" ||
    callee.property?.name === "openDropdown" ||
    callee.property?.name === "closeDropdown" ||
    callee.property?.name === "showTooltip" ||
    callee.property?.name === "hideTooltip" ||
    callee.property?.name === "openPanel" ||
    callee.property?.name === "closePanel" ||
    callee.property?.name === "togglePanel" ||
    callee.property?.name === "toggleTab" ||
    callee.property?.name === "activateTab" ||
    callee.property?.name === "deactivateTab"
  );
}

function isAnalyticsCall(callee) {
  return (
    callee.property?.name === "trackEvent" ||
    callee.property?.name === "logEvent" ||
    callee.property?.name === "sendMetric" ||
    callee.property?.name === "recordAction" ||
    callee.property?.name === "reportUsage" ||
    callee.property?.name === "trackPageView" ||
    callee.property?.name === "trackClick" ||
    callee.property?.name === "trackConversion" ||
    callee.property?.name === "trackInteraction" ||
    callee.property?.name === "trackScroll" ||
    callee.property?.name === "trackNavigation" ||
    callee.property?.name === "trackFormSubmit" ||
    callee.property?.name === "trackError" ||
    callee.property?.name === "trackTiming" ||
    callee.property?.name === "trackPerformance" ||
    callee.property?.name === "trackEngagement" ||
    callee.property?.name === "trackSession" ||
    callee.property?.name === "trackUser" ||
    callee.property?.name === "trackBehavior" ||
    callee.property?.name === "trackImpression" ||
    callee.property?.name === "trackGoal" ||
    callee.property?.name === "trackRevenue" ||
    callee.property?.name === "trackRetention" ||
    callee.property?.name === "trackBounce" ||
    callee.property?.name === "trackExit" ||
    callee.property?.name === "trackVisit" ||
    callee.property?.name === "trackSignup" ||
    callee.property?.name === "trackLogin" ||
    callee.property?.name === "trackLogout" ||
    callee.property?.name === "trackShare" ||
    callee.property?.name === "trackDownload" ||
    callee.property?.name === "trackUpload" ||
    callee.property?.name === "trackView" ||
    callee.property?.name === "trackPlay" ||
    callee.property?.name === "trackPause" ||
    callee.property?.name === "trackStop" ||
    callee.property?.name === "trackSkip" ||
    callee.property?.name === "trackRate" ||
    callee.property?.name === "trackLike" ||
    callee.property?.name === "trackDislike" ||
    callee.property?.name === "trackComment" ||
    callee.property?.name === "trackReaction" ||
    callee.property?.name === "trackFollow" ||
    callee.property?.name === "trackUnfollow" ||
    callee.property?.name === "trackAddToCart" ||
    callee.property?.name === "trackRemoveFromCart" ||
    callee.property?.name === "trackPurchase" ||
    callee.property?.name === "trackCheckout" ||
    callee.property?.name === "trackSearch" ||
    callee.property?.name === "trackFilter" ||
    callee.property?.name === "trackSort" ||
    callee.property?.name === "trackViewItem" ||
    callee.property?.name === "trackViewList" ||
    callee.property?.name === "trackViewDetail" ||
    callee.property?.name === "trackCustomEvent" ||
    callee.property?.name === "trackCustomMetric" ||
    callee.property?.name === "trackCustomDimension" ||
    callee.property?.name === "trackCustomGoal" ||
    callee.property?.name === "trackCustomBehavior"
  );
}

function isFileHandling(callee) {
  return (
    callee.property?.name === "uploadFile" ||
    callee.property?.name === "downloadFile" ||
    callee.property?.name === "readFile" ||
    callee.property?.name === "writeFile" ||
    callee.property?.name === "deleteFile" ||
    callee.property?.name === "openFile" ||
    callee.property?.name === "saveFile" ||
    callee.property?.name === "selectFile" ||
    callee.property?.name === "chooseFile" ||
    callee.property?.name === "loadFile" ||
    callee.property?.name === "storeFile" ||
    callee.property?.name === "fetchFile" ||
    callee.property?.name === "sendFile" ||
    callee.property?.name === "receiveFile" ||
    callee.property?.name === "processFile" ||
    callee.property?.name === "parseFile" ||
    callee.property?.name === "streamFile" ||
    callee.property?.name === "zipFile" ||
    callee.property?.name === "unzipFile" ||
    callee.property?.name === "compressFile" ||
    callee.property?.name === "decompressFile" ||
    callee.property?.name === "renameFile" ||
    callee.property?.name === "moveFile" ||
    callee.property?.name === "copyFile" ||
    callee.property?.name === "previewFile" ||
    callee.property?.name === "scanFile" ||
    callee.property?.name === "syncFile" ||
    callee.property?.name === "shareFile" ||
    callee.property?.name === "attachFile" ||
    callee.property?.name === "detachFile" ||
    callee.property?.name === "transferFile" ||
    callee.property?.name === "validateFile" ||
    callee.property?.name === "verifyFile" ||
    callee.property?.name === "encryptFile" ||
    callee.property?.name === "decryptFile" ||
    callee.property?.name === "archiveFile" ||
    callee.property?.name === "extractFile" ||
    callee.property?.name === "tagFile" ||
    callee.property?.name === "untagFile" ||
    callee.property?.name === "lockFile" ||
    callee.property?.name === "unlockFile" ||
    callee.property?.name === "watchFile" ||
    callee.property?.name === "monitorFile" ||
    callee.property?.name === "trackFile" ||
    callee.property?.name === "logFile" ||
    callee.property?.name === "inspectFile" ||
    callee.property?.name === "analyzeFile" ||
    callee.property?.name === "editFile" ||
    callee.property?.name === "updateFile" ||
    callee.property?.name === "replaceFile" ||
    callee.property?.name === "appendFile" ||
    callee.property?.name === "truncateFile" ||
    callee.property?.name === "clearFile" ||
    callee.property?.name === "formatFile" ||
    callee.property?.name === "readFileSync" ||
    callee.property?.name === "writeFileSync" ||
    callee.property?.name === "readFileAsync" ||
    callee.property?.name === "writeFileAsync"
  );
}

function isMediaControl(callee) {
  return (
    callee.property?.name === "play" ||
    callee.property?.name === "pause" ||
    callee.property?.name === "stop" ||
    callee.property?.name === "seek" ||
    callee.property?.name === "rewind" ||
    callee.property?.name === "fastForward" ||
    callee.property?.name === "record" ||
    callee.property?.name === "mute" ||
    callee.property?.name === "unmute" ||
    callee.property?.name === "loadMedia" ||
    callee.property?.name === "togglePlayback" ||
    callee.property?.name === "startPlayback" ||
    callee.property?.name === "endPlayback" ||
    callee.property?.name === "resumePlayback" ||
    callee.property?.name === "pausePlayback" ||
    callee.property?.name === "stopPlayback" ||
    callee.property?.name === "playMedia" ||
    callee.property?.name === "pauseMedia" ||
    callee.property?.name === "stopMedia" ||
    callee.property?.name === "seekMedia" ||
    callee.property?.name === "recordMedia" ||
    callee.property?.name === "muteMedia" ||
    callee.property?.name === "unmuteMedia" ||
    callee.property?.name === "toggleMedia" ||
    callee.property?.name === "loadAudio" ||
    callee.property?.name === "loadVideo" ||
    callee.property?.name === "playAudio" ||
    callee.property?.name === "playVideo" ||
    callee.property?.name === "pauseAudio" ||
    callee.property?.name === "pauseVideo" ||
    callee.property?.name === "stopAudio" ||
    callee.property?.name === "stopVideo" ||
    callee.property?.name === "seekAudio" ||
    callee.property?.name === "seekVideo" ||
    callee.property?.name === "recordAudio" ||
    callee.property?.name === "recordVideo" ||
    callee.property?.name === "muteAudio" ||
    callee.property?.name === "muteVideo" ||
    callee.property?.name === "unmuteAudio" ||
    callee.property?.name === "unmuteVideo" ||
    callee.property?.name === "toggleAudio" ||
    callee.property?.name === "toggleVideo" ||
    callee.property?.name === "setVolume" ||
    callee.property?.name === "getVolume" ||
    callee.property?.name === "increaseVolume" ||
    callee.property?.name === "decreaseVolume" ||
    callee.property?.name === "adjustVolume" ||
    callee.property?.name === "setPlaybackRate" ||
    callee.property?.name === "getPlaybackRate" ||
    callee.property?.name === "changePlaybackRate" ||
    callee.property?.name === "setCurrentTime" ||
    callee.property?.name === "getCurrentTime" ||
    callee.property?.name === "setDuration" ||
    callee.property?.name === "getDuration" ||
    callee.property?.name === "toggleFullscreen" ||
    callee.property?.name === "enterFullscreen" ||
    callee.property?.name === "exitFullscreen"
  );
}

function isStateManagement(callee) {
  return (
    callee.name === "useState" ||
    callee.name === "useReducer" ||
    (callee.type === "MemberExpression" &&
      callee.property?.name === "setState") ||
    callee.name === "useSyncExternalStore" ||
    callee.name === "useRef" ||
    callee.name === "useContext" ||
    callee.name === "useAtom" ||
    callee.name === "useStore" ||
    callee.name === "useSnapshot" ||
    callee.name === "useSignal" ||
    callee.name === "useValue" ||
    callee.name === "useWritable" ||
    callee.name === "useSelector" ||
    callee.name === "useDispatch" ||
    callee.name === "createStore" ||
    callee.name === "configureStore" ||
    callee.name === "createSlice" ||
    callee.name === "createReducer" ||
    callee.name === "createAction" ||
    callee.name === "createContext" ||
    callee.name === "createSignal" ||
    callee.name === "createEffect" ||
    callee.name === "createMemo" ||
    callee.name === "createAtom" ||
    callee.name === "createWritable" ||
    callee.name === "observable" ||
    callee.name === "action" ||
    callee.name === "computed" ||
    callee.name === "makeAutoObservable" ||
    callee.name === "set" ||
    callee.name === "get"
  );
}

function isStringProcessing(callee) {
  return (
    callee.property?.name === "replace" ||
    callee.property?.name === "normalize" ||
    callee.name === "String" ||
    callee.property?.name === "match" ||
    callee.property?.name === "charAt" ||
    callee.property?.name === "charCodeAt" ||
    callee.property?.name === "codePointAt" ||
    callee.property?.name === "concat" ||
    callee.property?.name === "endsWith" ||
    callee.property?.name === "includes" ||
    callee.property?.name === "indexOf" ||
    callee.property?.name === "lastIndexOf" ||
    callee.property?.name === "localeCompare" ||
    callee.property?.name === "padEnd" ||
    callee.property?.name === "padStart" ||
    callee.property?.name === "repeat" ||
    callee.property?.name === "search" ||
    callee.property?.name === "slice" ||
    callee.property?.name === "split" ||
    callee.property?.name === "startsWith" ||
    callee.property?.name === "substr" ||
    callee.property?.name === "substring" ||
    callee.property?.name === "toLocaleLowerCase" ||
    callee.property?.name === "toLocaleUpperCase" ||
    callee.property?.name === "toLowerCase" ||
    callee.property?.name === "toUpperCase" ||
    callee.property?.name === "trim" ||
    callee.property?.name === "trimStart" ||
    callee.property?.name === "trimEnd" ||
    callee.property?.name === "valueOf" ||
    callee.property?.name === "length"
  );
}

function isErrorHandling(callee) {
  return (
    callee.property?.name === "catch" ||
    callee.property?.name === "throw" ||
    callee.property?.name === "try" ||
    callee.property?.name === "handleError" ||
    callee.property?.name === "onError" ||
    callee.property?.name === "errorHandler" ||
    callee.property?.name === "logError" ||
    callee.property?.name === "reportError" ||
    callee.property?.name === "raiseError" ||
    callee.property?.name === "fail" ||
    callee.property?.name === "reject" ||
    callee.property?.name === "abort" ||
    callee.property?.name === "terminate" ||
    callee.property?.name === "crash" ||
    callee.property?.name === "panic" ||
    callee.property?.name === "recover" ||
    callee.property?.name === "rescue" ||
    callee.property?.name === "fallback" ||
    callee.property?.name === "handleException" ||
    callee.property?.name === "handleFailure" ||
    callee.property?.name === "handleCrash" ||
    callee.property?.name === "handleReject" ||
    callee.property?.name === "handleAbort" ||
    callee.property?.name === "handleTerminate" ||
    callee.property?.name === "handlePanic" ||
    callee.property?.name === "handleThrow" ||
    callee.property?.name === "handleCatch" ||
    callee.property?.name === "handleTry" ||
    callee.property?.name === "handleTimeout" ||
    callee.property?.name === "handleErrorResponse" ||
    callee.property?.name === "handleErrorEvent" ||
    callee.property?.name === "handleErrorMessage" ||
    callee.property?.name === "handleErrorCode" ||
    callee.property?.name === "handleErrorSignal" ||
    callee.property?.name === "handleErrorStatus" ||
    callee.property?.name === "handleErrorPayload" ||
    callee.property?.name === "handleErrorObject" ||
    callee.property?.name === "handleErrorType" ||
    callee.property?.name === "handleErrorReason" ||
    callee.property?.name === "handleErrorCause" ||
    callee.property?.name === "handleErrorSource" ||
    callee.property?.name === "handleErrorTrace" ||
    callee.property?.name === "handleErrorStack" ||
    callee.property?.name === "handleErrorLog" ||
    callee.property?.name === "handleErrorReport" ||
    callee.property?.name === "handleErrorAlert" ||
    callee.property?.name === "handleErrorNotification" ||
    callee.property?.name === "handleErrorCallback" ||
    callee.property?.name === "handleErrorHook" ||
    callee.property?.name === "handleErrorMiddleware" ||
    callee.property?.name === "handleErrorHandler" ||
    callee.property?.name === "handleErrorWrapper" ||
    callee.property?.name === "handleErrorInterceptor" ||
    callee.property?.name === "handleErrorBoundary" ||
    callee.property?.name === "handleErrorLayer" ||
    callee.property?.name === "handleErrorModule" ||
    callee.property?.name === "handleErrorFunction"
  );
}

function isStateAssignment(node) {
  return (
    node.left.type === "MemberExpression" &&
    (node.left.property?.name === "state" ||
      node.left.property?.name === "transition" ||
      node.left.property?.name === "context" ||
      node.left.property?.name === "status" ||
      node.left.property?.name === "phase" ||
      node.left.property?.name === "stage" ||
      node.left.property?.name === "mode" ||
      node.left.property?.name === "step" ||
      node.left.property?.name === "screen" ||
      node.left.property?.name === "view" ||
      node.left.property?.name === "scene" ||
      node.left.property?.name === "route" ||
      node.left.property?.name === "page" ||
      node.left.property?.name === "tab" ||
      node.left.property?.name === "panel" ||
      node.left.property?.name === "section" ||
      node.left.property?.name === "active" ||
      node.left.property?.name === "current" ||
      node.left.property?.name === "selected" ||
      node.left.property?.name === "visible" ||
      node.left.property?.name === "enabled" ||
      node.left.property?.name === "disabled" ||
      node.left.property?.name === "loading" ||
      node.left.property?.name === "ready" ||
      node.left.property?.name === "initialized" ||
      node.left.property?.name === "mounted" ||
      node.left.property?.name === "unmounted" ||
      node.left.property?.name === "connected" ||
      node.left.property?.name === "disconnected" ||
      node.left.property?.name === "expanded" ||
      node.left.property?.name === "collapsed" ||
      node.left.property?.name === "open" ||
      node.left.property?.name === "closed" ||
      node.left.property?.name === "started" ||
      node.left.property?.name === "stopped" ||
      node.left.property?.name === "paused" ||
      node.left.property?.name === "resumed" ||
      node.left.property?.name === "completed" ||
      node.left.property?.name === "failed" ||
      node.left.property?.name === "success" ||
      node.left.property?.name === "error" ||
      node.left.property?.name === "warning" ||
      node.left.property?.name === "info" ||
      node.left.property?.name === "message" ||
      node.left.property?.name === "event" ||
      node.left.property?.name === "signal" ||
      node.left.property?.name === "flag" ||
      node.left.property?.name === "trigger" ||
      node.left.property?.name === "action" ||
      node.left.property?.name === "intent" ||
      node.left.property?.name === "flow" ||
      node.left.property?.name === "machine" ||
      node.left.property?.name === "node" ||
      node.left.property?.name === "graph" ||
      node.left.property?.name === "path" ||
      node.left.property?.name === "direction" ||
      node.left.property?.name === "position" ||
      node.left.property?.name === "index")
  );
}

function isDOMManipulation(callee) {
  return (
    callee.property?.name === "querySelector" ||
    callee.property?.name === "getElementById" ||
    callee.property?.name === "createElement" ||
    callee.property?.name === "appendChild" ||
    callee.object?.name === "document" ||
    callee.object?.name === "$" ||
    callee.property?.name === "innerHTML" ||
    callee.property?.name === "getElementsByClassName" ||
    callee.property?.name === "getElementsByTagName" ||
    callee.property?.name === "getElementsByName" ||
    callee.property?.name === "querySelectorAll" ||
    callee.property?.name === "removeChild" ||
    callee.property?.name === "replaceChild" ||
    callee.property?.name === "insertBefore" ||
    callee.property?.name === "cloneNode" ||
    callee.property?.name === "setAttribute" ||
    callee.property?.name === "getAttribute" ||
    callee.property?.name === "removeAttribute" ||
    callee.property?.name === "hasAttribute" ||
    callee.property?.name === "classList" ||
    callee.property?.name === "className" ||
    callee.property?.name === "style" ||
    callee.property?.name === "textContent" ||
    callee.property?.name === "outerHTML" ||
    callee.property?.name === "scrollIntoView" ||
    callee.property?.name === "contains" ||
    callee.property?.name === "matches" ||
    callee.property?.name === "closest" ||
    callee.property?.name === "nextElementSibling" ||
    callee.property?.name === "previousElementSibling" ||
    callee.property?.name === "parentNode" ||
    callee.property?.name === "children" ||
    callee.property?.name === "firstElementChild" ||
    callee.property?.name === "lastElementChild" ||
    callee.property?.name === "remove" ||
    callee.property?.name === "toggleAttribute" ||
    callee.property?.name === "insertAdjacentHTML" ||
    callee.property?.name === "insertAdjacentElement" ||
    callee.property?.name === "insertAdjacentText" ||
    callee.property?.name === "createTextNode" ||
    callee.property?.name === "createDocumentFragment" ||
    callee.property?.name === "createComment" ||
    callee.property?.name === "createRange" ||
    callee.property?.name === "createEvent" ||
    callee.property?.name === "dispatchEvent" ||
    callee.property?.name === "getRootNode" ||
    callee.property?.name === "shadowRoot" ||
    callee.property?.name === "attachShadow" ||
    callee.property?.name === "innerText" ||
    callee.property?.name === "offsetHeight" ||
    callee.property?.name === "offsetWidth" ||
    callee.property?.name === "scrollHeight" ||
    callee.property?.name === "scrollWidth" ||
    callee.property?.name === "setProperty" ||
    callee.property?.name === "removeProperty" ||
    callee.property?.name === "getComputedStyle" ||
    callee.property?.name === "animate"
  );
}

function isAjaxCall(callee) {
  return (
    callee.name === "fetch" ||
    callee.property?.name === "ajax" ||
    callee.property?.name === "axios" ||
    callee.property?.name === "get" ||
    callee.property?.name === "post" ||
    callee.property?.name === "put" ||
    callee.property?.name === "delete" ||
    callee.property?.name === "patch" ||
    callee.property?.name === "head" ||
    callee.property?.name === "options" ||
    callee.property?.name === "request" ||
    callee.property?.name === "send" ||
    callee.property?.name === "open" ||
    callee.property?.name === "setRequestHeader" ||
    callee.property?.name === "getResponseHeader" ||
    callee.property?.name === "XMLHttpRequest" ||
    callee.property?.name === "ActiveXObject" ||
    callee.property?.name === "jsonp" ||
    callee.property?.name === "then" ||
    callee.property?.name === "catch" ||
    callee.property?.name === "finally" ||
    callee.property?.name === "subscribe" ||
    callee.property?.name === "pipe" ||
    callee.property?.name === "toPromise" ||
    callee.property?.name === "fromFetch" ||
    callee.property?.name === "createHttpLink" ||
    callee.property?.name === "useQuery" ||
    callee.property?.name === "useMutation" ||
    callee.property?.name === "gql" ||
    callee.property?.name === "GraphQLClient" ||
    callee.property?.name === "createClient" ||
    callee.property?.name === "httpClient" ||
    callee.property?.name === "http" ||
    callee.property?.name === "https" ||
    callee.property?.name === "superagent" ||
    callee.property?.name === "ky" ||
    callee.property?.name === "got" ||
    callee.property?.name === "needle" ||
    callee.property?.name === "nodeFetch" ||
    callee.property?.name === "makeRequest" ||
    callee.property?.name === "sendRequest" ||
    callee.property?.name === "invoke" ||
    callee.property?.name === "callApi" ||
    callee.property?.name === "apiCall" ||
    callee.property?.name === "getJSON" ||
    callee.property?.name === "load" ||
    callee.property?.name === "retrieve" ||
    callee.property?.name === "submit" ||
    callee.property?.name === "upload" ||
    callee.property?.name === "download" ||
    callee.property?.name === "WebSocket" ||
    callee.property?.name === "socket" ||
    callee.property?.name === "emit" ||
    callee.property?.name === "onmessage" ||
    callee.property?.name === "sendBeacon" ||
    callee.property?.name === "navigator.sendBeacon"
  );
}

function isAnimationCall(callee) {
  return (
    callee.property?.name === "animate" ||
    callee.property?.name === "requestAnimationFrame" ||
    callee.property?.name === "transition" ||
    callee.property?.name === "startAnimation" ||
    callee.property?.name === "stopAnimation" ||
    callee.property?.name === "pauseAnimation" ||
    callee.property?.name === "resumeAnimation" ||
    callee.property?.name === "cancelAnimation" ||
    callee.property?.name === "playAnimation" ||
    callee.property?.name === "reverseAnimation" ||
    callee.property?.name === "loopAnimation" ||
    callee.property?.name === "fadeIn" ||
    callee.property?.name === "fadeOut" ||
    callee.property?.name === "slideIn" ||
    callee.property?.name === "slideOut" ||
    callee.property?.name === "zoomIn" ||
    callee.property?.name === "zoomOut" ||
    callee.property?.name === "scaleUp" ||
    callee.property?.name === "scaleDown" ||
    callee.property?.name === "rotate" ||
    callee.property?.name === "spin" ||
    callee.property?.name === "bounce" ||
    callee.property?.name === "shake" ||
    callee.property?.name === "flash" ||
    callee.property?.name === "wiggle" ||
    callee.property?.name === "flip" ||
    callee.property?.name === "scrollAnimation" ||
    callee.property?.name === "motion" ||
    callee.property?.name === "transitionTo" ||
    callee.property?.name === "transitionFrom" ||
    callee.property?.name === "transitionIn" ||
    callee.property?.name === "transitionOut" ||
    callee.property?.name === "applyTransition" ||
    callee.property?.name === "setTransition" ||
    callee.property?.name === "clearTransition" ||
    callee.property?.name === "addAnimation" ||
    callee.property?.name === "removeAnimation" ||
    callee.property?.name === "updateAnimation" ||
    callee.property?.name === "triggerAnimation" ||
    callee.property?.name === "runAnimation" ||
    callee.property?.name === "createAnimation" ||
    callee.property?.name === "destroyAnimation" ||
    callee.property?.name === "registerAnimation" ||
    callee.property?.name === "unregisterAnimation" ||
    callee.property?.name === "timeline" ||
    callee.property?.name === "keyframes" ||
    callee.property?.name === "setKeyframes" ||
    callee.property?.name === "getKeyframes" ||
    callee.property?.name === "animateElement" ||
    callee.property?.name === "animateStyle" ||
    callee.property?.name === "animateProperty" ||
    callee.property?.name === "animateTransform" ||
    callee.property?.name === "animateOpacity" ||
    callee.property?.name === "animatePosition" ||
    callee.property?.name === "animateScale" ||
    callee.property?.name === "animateRotation" ||
    callee.property?.name === "animateVisibility" ||
    callee.property?.name === "animateClass"
  );
}
function isValidationCall(callee) {
  return (
    callee.property?.name === "validate" ||
    callee.property?.name === "test" ||
    callee.property?.name === "isValid" ||
    callee.property?.name === "isInvalid" ||
    callee.property?.name === "check" ||
    callee.property?.name === "verify" ||
    callee.property?.name === "assert" ||
    callee.property?.name === "validateSync" ||
    callee.property?.name === "validateAsync" ||
    callee.property?.name === "validateSchema" ||
    callee.property?.name === "validateField" ||
    callee.property?.name === "validateForm" ||
    callee.property?.name === "validateInput" ||
    callee.property?.name === "validateData" ||
    callee.property?.name === "validateValues" ||
    callee.property?.name === "validateRequest" ||
    callee.property?.name === "validateResponse" ||
    callee.property?.name === "validatePayload" ||
    callee.property?.name === "validateParams" ||
    callee.property?.name === "validateQuery" ||
    callee.property?.name === "validateBody" ||
    callee.property?.name === "validateEmail" ||
    callee.property?.name === "validatePassword" ||
    callee.property?.name === "validateUsername" ||
    callee.property?.name === "validatePhone" ||
    callee.property?.name === "validateAddress" ||
    callee.property?.name === "validateToken" ||
    callee.property?.name === "checkValidity" ||
    callee.property?.name === "checkInput" ||
    callee.property?.name === "checkForm" ||
    callee.property?.name === "checkField" ||
    callee.property?.name === "checkData" ||
    callee.property?.name === "assertValid" ||
    callee.property?.name === "assertInput" ||
    callee.property?.name === "assertField" ||
    callee.property?.name === "assertSchema" ||
    callee.property?.name === "assertType" ||
    callee.property?.name === "isEmail" ||
    callee.property?.name === "isURL" ||
    callee.property?.name === "isUUID" ||
    callee.property?.name === "isEmpty" ||
    callee.property?.name === "isLength" ||
    callee.property?.name === "isAlpha" ||
    callee.property?.name === "isAlphanumeric" ||
    callee.property?.name === "isNumeric" ||
    callee.property?.name === "isInt" ||
    callee.property?.name === "isFloat" ||
    callee.property?.name === "isBoolean" ||
    callee.property?.name === "isDate" ||
    callee.property?.name === "isAfter" ||
    callee.property?.name === "isBefore" ||
    callee.property?.name === "isMobilePhone" ||
    callee.property?.name === "isPostalCode" ||
    callee.property?.name === "isStrongPassword" ||
    callee.property?.name === "isCreditCard" ||
    callee.property?.name === "isJSON" ||
    callee.property?.name === "isBase64" ||
    callee.property?.name === "isHexColor"
  );
}

function isRoutingCall(callee) {
  return (
    callee.property?.name === "push" ||
    callee.property?.name === "navigate" ||
    callee.property?.name === "replace" ||
    callee.property?.name === "go" ||
    callee.property?.name === "goBack" ||
    callee.property?.name === "goForward" ||
    callee.property?.name === "reload" ||
    callee.property?.name === "redirect" ||
    callee.property?.name === "transitionTo" ||
    callee.property?.name === "setRoute" ||
    callee.property?.name === "changeRoute" ||
    callee.property?.name === "updateRoute" ||
    callee.property?.name === "routeTo" ||
    callee.property?.name === "navigateTo" ||
    callee.property?.name === "switchRoute" ||
    callee.property?.name === "loadRoute" ||
    callee.property?.name === "openRoute" ||
    callee.property?.name === "closeRoute" ||
    callee.property?.name === "moveTo" ||
    callee.property?.name === "jumpTo" ||
    callee.property?.name === "linkTo" ||
    callee.property?.name === "followLink" ||
    callee.property?.name === "handleRoute" ||
    callee.property?.name === "handleNavigation" ||
    callee.property?.name === "triggerNavigation" ||
    callee.property?.name === "startNavigation" ||
    callee.property?.name === "endNavigation" ||
    callee.property?.name === "navigateBack" ||
    callee.property?.name === "navigateForward" ||
    callee.property?.name === "navigateHome" ||
    callee.property?.name === "navigateUp" ||
    callee.property?.name === "navigateDown" ||
    callee.property?.name === "navigateLeft" ||
    callee.property?.name === "navigateRight" ||
    callee.property?.name === "navigateToPage" ||
    callee.property?.name === "navigateToView" ||
    callee.property?.name === "navigateToScreen" ||
    callee.property?.name === "navigateToRoute" ||
    callee.property?.name === "navigateToPath" ||
    callee.property?.name === "navigateToUrl" ||
    callee.property?.name === "navigateToLocation" ||
    callee.property?.name === "navigateToComponent" ||
    callee.property?.name === "navigateToSection" ||
    callee.property?.name === "navigateToTab" ||
    callee.property?.name === "navigateToStep" ||
    callee.property?.name === "navigateToAnchor" ||
    callee.property?.name === "navigateToFragment" ||
    callee.property?.name === "navigateToHash" ||
    callee.property?.name === "navigateToQuery" ||
    callee.property?.name === "navigateToParams" ||
    callee.property?.name === "navigateToId" ||
    callee.property?.name === "navigateToSlug" ||
    callee.property?.name === "navigateToResource" ||
    callee.property?.name === "navigateToEntity" ||
    callee.property?.name === "navigateToTarget" ||
    callee.property?.name === "navigateToDestination" ||
    callee.property?.name === "navigateToNext"
  );
}

function isStorageAccess(callee) {
  return (
    callee.object?.name === "localStorage" ||
    callee.object?.name === "sessionStorage" ||
    callee.property?.name === "getItem" ||
    callee.property?.name === "setItem" ||
    callee.property?.name === "removeItem" ||
    callee.property?.name === "clear" ||
    callee.property?.name === "key" ||
    callee.object?.name === "Storage" ||
    callee.object?.name === "window.localStorage" ||
    callee.object?.name === "window.sessionStorage" ||
    callee.property?.name === "cookie" ||
    callee.property?.name === "document.cookie" ||
    callee.property?.name === "setCookie" ||
    callee.property?.name === "getCookie" ||
    callee.property?.name === "deleteCookie" ||
    callee.property?.name === "hasCookie" ||
    callee.property?.name === "indexedDB" ||
    callee.property?.name === "open" ||
    callee.property?.name === "deleteDatabase" ||
    callee.property?.name === "createObjectStore" ||
    callee.property?.name === "transaction" ||
    callee.property?.name === "put" ||
    callee.property?.name === "get" ||
    callee.property?.name === "delete" ||
    callee.property?.name === "getAll" ||
    callee.property?.name === "getAllKeys" ||
    callee.property?.name === "add" ||
    callee.property?.name === "count" ||
    callee.property?.name === "objectStoreNames" ||
    callee.property?.name === "onsuccess" ||
    callee.property?.name === "onerror" ||
    callee.property?.name === "result" ||
    callee.property?.name === "request" ||
    callee.property?.name === "Cache" ||
    callee.property?.name === "caches" ||
    callee.property?.name === "openCache" ||
    callee.property?.name === "match" ||
    callee.property?.name === "putCache" ||
    callee.property?.name === "deleteCache" ||
    callee.property?.name === "keys" ||
    callee.property?.name === "addAll" ||
    callee.property?.name === "FileSystem" ||
    callee.property?.name === "requestFileSystem" ||
    callee.property?.name === "resolveLocalFileSystemURL" ||
    callee.property?.name === "write" ||
    callee.property?.name === "read" ||
    callee.property?.name === "remove" ||
    callee.property?.name === "getDirectory" ||
    callee.property?.name === "getFile" ||
    callee.property?.name === "createWriter" ||
    callee.property?.name === "createReader" ||
    callee.property?.name === "Blob" ||
    callee.property?.name === "FileReader" ||
    callee.property?.name === "readAsText" ||
    callee.property?.name === "readAsDataURL" ||
    callee.property?.name === "readAsArrayBuffer"
  );
}

function isLoggingCall(callee) {
  return (
    callee.property?.name === "log" ||
    callee.property?.name === "debug" ||
    callee.property?.name === "error" ||
    callee.property?.name === "warn" ||
    callee.property?.name === "info" ||
    callee.property?.name === "trace" ||
    callee.property?.name === "table" ||
    callee.property?.name === "dir" ||
    callee.property?.name === "dirxml" ||
    callee.property?.name === "group" ||
    callee.property?.name === "groupCollapsed" ||
    callee.property?.name === "groupEnd" ||
    callee.property?.name === "count" ||
    callee.property?.name === "countReset" ||
    callee.property?.name === "time" ||
    callee.property?.name === "timeLog" ||
    callee.property?.name === "timeEnd" ||
    callee.property?.name === "profile" ||
    callee.property?.name === "profileEnd" ||
    callee.property?.name === "clear" ||
    callee.property?.name === "assert" ||
    callee.property?.name === "markTimeline" ||
    callee.property?.name === "timeline" ||
    callee.property?.name === "timelineEnd" ||
    callee.property?.name === "memory" ||
    callee.property?.name === "stdout" ||
    callee.property?.name === "stderr" ||
    callee.property?.name === "fatal" ||
    callee.property?.name === "verbose" ||
    callee.property?.name === "notice" ||
    callee.property?.name === "critical" ||
    callee.property?.name === "alert" ||
    callee.property?.name === "emergency" ||
    callee.property?.name === "write" ||
    callee.property?.name === "record" ||
    callee.property?.name === "capture" ||
    callee.property?.name === "report" ||
    callee.property?.name === "track" ||
    callee.property?.name === "event" ||
    callee.property?.name === "message" ||
    callee.property?.name === "output" ||
    callee.property?.name === "print" ||
    callee.property?.name === "dump" ||
    callee.property?.name === "snapshot" ||
    callee.property?.name === "logEvent" ||
    callee.property?.name === "logError" ||
    callee.property?.name === "logWarning" ||
    callee.property?.name === "logInfo" ||
    callee.property?.name === "logDebug" ||
    callee.property?.name === "logTrace" ||
    callee.property?.name === "logFatal" ||
    callee.property?.name === "logMessage" ||
    callee.property?.name === "logOutput" ||
    callee.property?.name === "logRecord" ||
    callee.property?.name === "logReport" ||
    callee.property?.name === "logWrite" ||
    callee.property?.name === "logCapture"
  );
}

function isHookUsage(callee) {
  return (
    callee.name?.startsWith("use") ||
    callee.name === "useState" ||
    callee.name === "useEffect" ||
    callee.name === "useContext" ||
    callee.name === "useReducer" ||
    callee.name === "useCallback" ||
    callee.name === "useMemo" ||
    callee.name === "useRef" ||
    callee.name === "useImperativeHandle" ||
    callee.name === "useLayoutEffect" ||
    callee.name === "useInsertionEffect" ||
    callee.name === "useDebugValue" ||
    callee.name === "useSyncExternalStore" ||
    callee.name === "useId" ||
    callee.name === "useTransition" ||
    callee.name === "useDeferredValue" ||
    callee.name === "useFetch" ||
    callee.name === "useQuery" ||
    callee.name === "useMutation" ||
    callee.name === "useInfiniteQuery" ||
    callee.name === "useForm" ||
    callee.name === "useField" ||
    callee.name === "useController" ||
    callee.name === "useWatch" ||
    callee.name === "useFormContext" ||
    callee.name === "useNavigate" ||
    callee.name === "useLocation" ||
    callee.name === "useParams" ||
    callee.name === "useSearchParams" ||
    callee.name === "useHistory" ||
    callee.name === "useRouteMatch" ||
    callee.name === "useMediaQuery" ||
    callee.name === "useTheme" ||
    callee.name === "useBreakpoint" ||
    callee.name === "useToggle" ||
    callee.name === "useBoolean" ||
    callee.name === "usePrevious" ||
    callee.name === "useInterval" ||
    callee.name === "useTimeout" ||
    callee.name === "useMount" ||
    callee.name === "useUnmount" ||
    callee.name === "useUpdate" ||
    callee.name === "useEventListener" ||
    callee.name === "useWindowSize" ||
    callee.name === "useLocalStorage" ||
    callee.name === "useSessionStorage" ||
    callee.name === "useClipboard" ||
    callee.name === "useOnlineStatus" ||
    callee.name === "useHover" ||
    callee.name === "useScroll" ||
    callee.name === "useFocus" ||
    callee.name === "useIdle" ||
    callee.name === "useDarkMode" ||
    callee.name === "useGeolocation" ||
    callee.name === "useSpeechRecognition" ||
    callee.name === "useBattery" ||
    callee.name === "useNetwork" ||
    callee.name === "usePermission" ||
    callee.name === "useVisibilityChange"
  );
}

function isReduxDispatch(callee) {
  return (
    callee.property?.name === "dispatch" ||
    callee.property?.name === "getState" ||
    callee.property?.name === "subscribe" ||
    callee.property?.name === "replaceReducer" ||
    callee.property?.name === "combineReducers" ||
    callee.property?.name === "createStore" ||
    callee.property?.name === "applyMiddleware" ||
    callee.property?.name === "compose" ||
    callee.property?.name === "configureStore" ||
    callee.property?.name === "createSlice" ||
    callee.property?.name === "createAsyncThunk" ||
    callee.property?.name === "createReducer" ||
    callee.property?.name === "createAction" ||
    callee.property?.name === "createEntityAdapter" ||
    callee.property?.name === "createListenerMiddleware" ||
    callee.property?.name === "createSelector" ||
    callee.property?.name === "createFeatureSelector" ||
    callee.property?.name === "thunk" ||
    callee.property?.name === "reduxThunk" ||
    callee.property?.name === "withThunk" ||
    callee.property?.name === "dispatchThunk" ||
    callee.property?.name === "asyncDispatch" ||
    callee.property?.name === "takeEvery" ||
    callee.property?.name === "takeLatest" ||
    callee.property?.name === "put" ||
    callee.property?.name === "call" ||
    callee.property?.name === "fork" ||
    callee.property?.name === "cancel" ||
    callee.property?.name === "select" ||
    callee.property?.name === "take" ||
    callee.property?.name === "delay" ||
    callee.property?.name === "race" ||
    callee.property?.name === "all" ||
    callee.property?.name === "spawn" ||
    callee.property?.name === "join" ||
    callee.property?.name === "effect" ||
    callee.property?.name === "runSaga" ||
    callee.property?.name === "middleware" ||
    callee.property?.name === "loggerMiddleware" ||
    callee.property?.name === "apiMiddleware" ||
    callee.property?.name === "authMiddleware" ||
    callee.property?.name === "errorMiddleware" ||
    callee.property?.name === "customMiddleware" ||
    callee.property?.name === "eventMiddleware" ||
    callee.property?.name === "store" ||
    callee.property?.name === "state" ||
    callee.property?.name === "reducer" ||
    callee.property?.name === "action" ||
    callee.property?.name === "actions" ||
    callee.property?.name === "actionCreator" ||
    callee.property?.name === "mapDispatchToProps" ||
    callee.property?.name === "mapStateToProps" ||
    callee.property?.name === "bindActionCreators" ||
    callee.property?.name === "dispatchAction" ||
    callee.property?.name === "dispatchEvent" ||
    callee.property?.name === "dispatchRequest" ||
    callee.property?.name === "dispatchUpdate" ||
    callee.property?.name === "dispatchSuccess" ||
    callee.property?.name === "dispatchFailure" ||
    callee.property?.name === "dispatchError"
  );
}

function isCryptoUsage(callee) {
  return (
    callee.object?.name === "crypto" ||
    callee.name === "encrypt" ||
    callee.name === "decrypt" ||
    callee.name === "sign" ||
    callee.name === "verify" ||
    callee.name === "hash" ||
    callee.name === "digest" ||
    callee.name === "generateKey" ||
    callee.name === "deriveKey" ||
    callee.name === "deriveBits" ||
    callee.name === "importKey" ||
    callee.name === "exportKey" ||
    callee.name === "wrapKey" ||
    callee.name === "unwrapKey" ||
    callee.name === "getRandomValues" ||
    callee.name === "subtle" ||
    callee.name === "createHash" ||
    callee.name === "createHmac" ||
    callee.name === "createCipher" ||
    callee.name === "createDecipher" ||
    callee.name === "createSign" ||
    callee.name === "createVerify" ||
    callee.name === "randomBytes" ||
    callee.name === "pbkdf2" ||
    callee.name === "pbkdf2Sync" ||
    callee.name === "scrypt" ||
    callee.name === "scryptSync" ||
    callee.name === "generateKeyPair" ||
    callee.name === "generateKeyPairSync" ||
    callee.name === "privateEncrypt" ||
    callee.name === "publicDecrypt" ||
    callee.name === "privateDecrypt" ||
    callee.name === "publicEncrypt" ||
    callee.name === "Cipher" ||
    callee.name === "Decipher" ||
    callee.name === "Hmac" ||
    callee.name === "KeyObject" ||
    callee.name === "WebCrypto" ||
    callee.name === "CryptoKey" ||
    callee.name === "CryptoJS" ||
    callee.name === "AES" ||
    callee.name === "DES" ||
    callee.name === "TripleDES" ||
    callee.name === "RC4" ||
    callee.name === "SHA1" ||
    callee.name === "SHA256" ||
    callee.name === "SHA512" ||
    callee.name === "MD5" ||
    callee.name === "RIPEMD160" ||
    callee.name === "bcrypt" ||
    callee.name === "bcryptjs" ||
    callee.name === "argon2" ||
    callee.name === "jwt" ||
    callee.name === "jsonwebtoken" ||
    callee.name === "signToken" ||
    callee.name === "verifyToken" ||
    callee.name === "encode" ||
    callee.name === "decode" ||
    callee.name === "base64Encode" ||
    callee.name === "base64Decode" ||
    callee.name === "keccak256" ||
    callee.name === "ethers" ||
    callee.name === "web3"
  );
}

function isMathOperation(callee) {
  return (
    callee.property?.name === "abs" ||
    callee.property?.name === "acos" ||
    callee.property?.name === "acosh" ||
    callee.property?.name === "asin" ||
    callee.property?.name === "asinh" ||
    callee.property?.name === "atan" ||
    callee.property?.name === "atan2" ||
    callee.property?.name === "atanh" ||
    callee.property?.name === "cbrt" ||
    callee.property?.name === "ceil" ||
    callee.property?.name === "clz32" ||
    callee.property?.name === "cos" ||
    callee.property?.name === "cosh" ||
    callee.property?.name === "exp" ||
    callee.property?.name === "expm1" ||
    callee.property?.name === "floor" ||
    callee.property?.name === "fround" ||
    callee.property?.name === "hypot" ||
    callee.property?.name === "imul" ||
    callee.property?.name === "log" ||
    callee.property?.name === "log10" ||
    callee.property?.name === "log1p" ||
    callee.property?.name === "log2" ||
    callee.property?.name === "max" ||
    callee.property?.name === "min" ||
    callee.property?.name === "pow" ||
    callee.property?.name === "random" ||
    callee.property?.name === "round" ||
    callee.property?.name === "sign" ||
    callee.property?.name === "sin" ||
    callee.property?.name === "sinh" ||
    callee.property?.name === "sqrt" ||
    callee.property?.name === "tan" ||
    callee.property?.name === "tanh" ||
    callee.property?.name === "trunc" ||
    callee.property?.name === "add" ||
    callee.property?.name === "subtract" ||
    callee.property?.name === "multiply" ||
    callee.property?.name === "divide" ||
    callee.property?.name === "mod" ||
    callee.property?.name === "modulo" ||
    callee.property?.name === "remainder" ||
    callee.property?.name === "sum" ||
    callee.property?.name === "average" ||
    callee.property?.name === "mean" ||
    callee.property?.name === "median" ||
    callee.property?.name === "mode" ||
    callee.property?.name === "variance" ||
    callee.property?.name === "stddev" ||
    callee.property?.name === "normalize" ||
    callee.property?.name === "scale" ||
    callee.property?.name === "clamp" ||
    callee.property?.name === "roundTo" ||
    callee.property?.name === "floorTo" ||
    callee.property?.name === "ceilTo" ||
    callee.property?.name === "inRange" ||
    callee.property?.name === "isFinite" ||
    callee.property?.name === "isNaN" ||
    callee.property?.name === "toNumber"
  );
}

function isTimerCall(callee) {
  return (
    callee.name === "setTimeout" ||
    callee.name === "setInterval" ||
    callee.name === "clearTimeout" ||
    callee.name === "clearInterval" ||
    callee.name === "setImmediate" ||
    callee.name === "clearImmediate" ||
    callee.name === "requestAnimationFrame" ||
    callee.name === "cancelAnimationFrame" ||
    callee.name === "queueMicrotask" ||
    callee.name === "process.nextTick" ||
    callee.name === "setTimeoutAsync" ||
    callee.name === "setIntervalAsync" ||
    callee.name === "setTimer" ||
    callee.name === "clearTimer" ||
    callee.name === "scheduleTask" ||
    callee.name === "cancelTask" ||
    callee.name === "scheduleTimeout" ||
    callee.name === "cancelTimeout" ||
    callee.name === "scheduleInterval" ||
    callee.name === "cancelInterval" ||
    callee.name === "startTimer" ||
    callee.name === "stopTimer" ||
    callee.name === "startInterval" ||
    callee.name === "stopInterval" ||
    callee.name === "startTimeout" ||
    callee.name === "stopTimeout" ||
    callee.name === "runAfterDelay" ||
    callee.name === "runAfter" ||
    callee.name === "runLater" ||
    callee.name === "runSoon" ||
    callee.name === "runNextTick" ||
    callee.name === "runAsync" ||
    callee.name === "delay" ||
    callee.name === "debounce" ||
    callee.name === "throttle" ||
    callee.name === "wait" ||
    callee.name === "sleep" ||
    callee.name === "pause" ||
    callee.name === "timeout" ||
    callee.name === "interval" ||
    callee.name === "defer" ||
    callee.name === "nextTick" ||
    callee.name === "later" ||
    callee.name === "after" ||
    callee.name === "every" ||
    callee.name === "repeat" ||
    callee.name === "loop" ||
    callee.name === "tick" ||
    callee.name === "frame" ||
    callee.name === "raf" ||
    callee.name === "cancelRaf" ||
    callee.name === "schedule" ||
    callee.name === "unschedule" ||
    callee.name === "enqueue" ||
    callee.name === "flush" ||
    callee.name === "timeoutId" ||
    callee.name === "intervalId" ||
    callee.name === "animationId" ||
    callee.name === "timerId"
  );
}

function isFileUpload(callee) {
  return (
    callee.property?.name === "upload" ||
    callee.property?.name === "readFile" ||
    callee.name === "FileReader" ||
    callee.property?.name === "writeFile" ||
    callee.property?.name === "appendFile" ||
    callee.property?.name === "unlink" ||
    callee.property?.name === "createReadStream" ||
    callee.property?.name === "createWriteStream" ||
    callee.property?.name === "open" ||
    callee.property?.name === "close" ||
    callee.property?.name === "stat" ||
    callee.property?.name === "readdir" ||
    callee.property?.name === "mkdir" ||
    callee.property?.name === "rmdir" ||
    callee.property?.name === "copyFile" ||
    callee.property?.name === "rename" ||
    callee.property?.name === "access" ||
    callee.property?.name === "exists" ||
    callee.property?.name === "fstat" ||
    callee.property?.name === "ftruncate" ||
    callee.property?.name === "fsync" ||
    callee.property?.name === "read" ||
    callee.property?.name === "write" ||
    callee.property?.name === "Blob" ||
    callee.property?.name === "File" ||
    callee.property?.name === "FileList" ||
    callee.property?.name === "DataTransfer" ||
    callee.property?.name === "dragenter" ||
    callee.property?.name === "drop" ||
    callee.property?.name === "change" ||
    callee.property?.name === "input" ||
    callee.property?.name === "files" ||
    callee.property?.name === "accept" ||
    callee.property?.name === "multiple" ||
    callee.property?.name === "capture" ||
    callee.property?.name === "type" ||
    callee.property?.name === "size" ||
    callee.property?.name === "name" ||
    callee.property?.name === "lastModified" ||
    callee.property?.name === "readAsText" ||
    callee.property?.name === "readAsDataURL" ||
    callee.property?.name === "readAsArrayBuffer" ||
    callee.property?.name === "readAsBinaryString" ||
    callee.property?.name === "onload" ||
    callee.property?.name === "onerror" ||
    callee.property?.name === "onprogress" ||
    callee.property?.name === "XMLHttpRequest" ||
    callee.property?.name === "FormData" ||
    callee.property?.name === "append" ||
    callee.property?.name === "set" ||
    callee.property?.name === "get" ||
    callee.property?.name === "delete" ||
    callee.property?.name === "send" ||
    callee.property?.name === "uploadFile" ||
    callee.property?.name === "handleUpload" ||
    callee.property?.name === "processFile" ||
    callee.property?.name === "dropzone"
  );
}

function isFormSubmission(callee) {
  return (
    callee.property?.name === "submit" ||
    callee.property?.name === "handleSubmit" ||
    callee.property?.name === "onSubmit" ||
    callee.property?.name === "triggerSubmit" ||
    callee.property?.name === "processSubmit" ||
    callee.property?.name === "sendForm" ||
    callee.property?.name === "submitForm" ||
    callee.property?.name === "submitHandler" ||
    callee.property?.name === "submitData" ||
    callee.property?.name === "submitRequest" ||
    callee.property?.name === "submitAction" ||
    callee.property?.name === "submitEvent" ||
    callee.property?.name === "submitPayload" ||
    callee.property?.name === "submitValues" ||
    callee.property?.name === "submitFields" ||
    callee.property?.name === "submitToServer" ||
    callee.property?.name === "submitFormData" ||
    callee.property?.name === "submitFormHandler" ||
    callee.property?.name === "submitFormValues" ||
    callee.property?.name === "submitFormRequest" ||
    callee.property?.name === "submitFormAction" ||
    callee.property?.name === "submitFormEvent" ||
    callee.property?.name === "submitFormPayload" ||
    callee.property?.name === "submitFormFields" ||
    callee.property?.name === "submitFormToServer" ||
    callee.property?.name === "submitDataToServer" ||
    callee.property?.name === "submitDataHandler" ||
    callee.property?.name === "submitDataRequest" ||
    callee.property?.name === "submitDataAction" ||
    callee.property?.name === "submitDataEvent" ||
    callee.property?.name === "submitDataPayload" ||
    callee.property?.name === "submitDataFields" ||
    callee.property?.name === "submitDataValues" ||
    callee.property?.name === "submitRequestHandler" ||
    callee.property?.name === "submitRequestAction" ||
    callee.property?.name === "submitRequestEvent" ||
    callee.property?.name === "submitRequestPayload" ||
    callee.property?.name === "submitRequestFields" ||
    callee.property?.name === "submitRequestValues" ||
    callee.property?.name === "submitActionHandler" ||
    callee.property?.name === "submitActionEvent" ||
    callee.property?.name === "submitActionPayload" ||
    callee.property?.name === "submitActionFields" ||
    callee.property?.name === "submitActionValues" ||
    callee.property?.name === "submitEventHandler" ||
    callee.property?.name === "submitEventPayload" ||
    callee.property?.name === "submitEventFields" ||
    callee.property?.name === "submitEventValues" ||
    callee.property?.name === "submitPayloadHandler" ||
    callee.property?.name === "submitPayloadFields" ||
    callee.property?.name === "submitPayloadValues" ||
    callee.property?.name === "submitFieldsHandler" ||
    callee.property?.name === "submitFieldsValues" ||
    callee.property?.name === "submitValuesHandler" ||
    callee.property?.name === "submitToServerHandler" ||
    callee.property?.name === "submitToServerRequest" ||
    callee.property?.name === "submitToServerAction" ||
    callee.property?.name === "submitToServerEvent"
  );
}

function isThirdPartyAPI(callee) {
  // Add specific third-party API calls you want to detect
  return (
    callee.object?.name === "axios" ||
    callee.object?.name === "firebase" ||
    callee.object?.name === "stripe" ||
    callee.object?.name === "twilio" ||
    callee.object?.name === "sendGrid" ||
    callee.object?.name === "paypal" ||
    callee.object?.name === "razorpay" ||
    callee.object?.name === "square" ||
    callee.object?.name === "braintree" ||
    callee.object?.name === "algolia" ||
    callee.object?.name === "contentful" ||
    callee.object?.name === "sanity" ||
    callee.object?.name === "prismic" ||
    callee.object?.name === "cloudinary" ||
    callee.object?.name === "imgix" ||
    callee.object?.name === "mapbox" ||
    callee.object?.name === "leaflet" ||
    callee.object?.name === "googleMaps" ||
    callee.object?.name === "openWeather" ||
    callee.object?.name === "weatherAPI" ||
    callee.object?.name === "newsAPI" ||
    callee.object?.name === "graphql" ||
    callee.object?.name === "apolloClient" ||
    callee.object?.name === "urql" ||
    callee.object?.name === "swr" ||
    callee.object?.name === "reactQuery" ||
    callee.object?.name === "tanstackQuery" ||
    callee.object?.name === "auth0" ||
    callee.object?.name === "clerk" ||
    callee.object?.name === "supabase" ||
    callee.object?.name === "hasura" ||
    callee.object?.name === "fauna" ||
    callee.object?.name === "mongodb" ||
    callee.object?.name === "mongoose" ||
    callee.object?.name === "mysql" ||
    callee.object?.name === "pg" ||
    callee.object?.name === "sequelize" ||
    callee.object?.name === "typeorm" ||
    callee.object?.name === "airtable" ||
    callee.object?.name === "notion" ||
    callee.object?.name === "slack" ||
    callee.object?.name === "discord" ||
    callee.object?.name === "telegram" ||
    callee.object?.name === "whatsapp" ||
    callee.object?.name === "intercom" ||
    callee.object?.name === "drift" ||
    callee.object?.name === "segment" ||
    callee.object?.name === "mixpanel" ||
    callee.object?.name === "amplitude" ||
    callee.object?.name === "googleAnalytics" ||
    callee.object?.name === "gtag" ||
    callee.object?.name === "facebookPixel" ||
    callee.object?.name === "hotjar" ||
    callee.object?.name === "fullstory" ||
    callee.object?.name === "newRelic" ||
    callee.object?.name === "datadog" ||
    callee.object?.name === "logRocket" ||
    callee.object?.name === "bugsnag" ||
    callee.object?.name === "sentry"
  );
}

function isIntlUsage(callee) {
  return (
    callee.object?.name === "Intl" ||
    callee.name === "formatMessage" ||
    callee.property?.name === "format" ||
    callee.property?.name === "formatDate" ||
    callee.property?.name === "formatTime" ||
    callee.property?.name === "formatNumber" ||
    callee.property?.name === "formatRelativeTime" ||
    callee.property?.name === "formatPlural" ||
    callee.property?.name === "formatDisplayName" ||
    callee.property?.name === "formatList" ||
    callee.property?.name === "formatCurrency" ||
    callee.property?.name === "formatUnit" ||
    callee.property?.name === "formatRange" ||
    callee.property?.name === "formatRangeToParts" ||
    callee.property?.name === "formatParts" ||
    callee.property?.name === "formatHTMLMessage" ||
    callee.property?.name === "formatText" ||
    callee.property?.name === "translate" ||
    callee.property?.name === "t" ||
    callee.property?.name === "i18n" ||
    callee.property?.name === "i18next" ||
    callee.property?.name === "useTranslation" ||
    callee.property?.name === "getTranslation" ||
    callee.property?.name === "getLocale" ||
    callee.property?.name === "setLocale" ||
    callee.property?.name === "changeLanguage" ||
    callee.property?.name === "detectLanguage" ||
    callee.property?.name === "loadLocaleData" ||
    callee.property?.name === "locale" ||
    callee.property?.name === "localize" ||
    callee.property?.name === "localization" ||
    callee.property?.name === "useIntl" ||
    callee.property?.name === "intl" ||
    callee.property?.name === "IntlProvider" ||
    callee.property?.name === "FormattedMessage" ||
    callee.property?.name === "FormattedDate" ||
    callee.property?.name === "FormattedTime" ||
    callee.property?.name === "FormattedNumber" ||
    callee.property?.name === "FormattedPlural" ||
    callee.property?.name === "FormattedRelativeTime" ||
    callee.property?.name === "FormattedDisplayName" ||
    callee.property?.name === "FormattedList" ||
    callee.property?.name === "getMessages" ||
    callee.property?.name === "getIntlMessage" ||
    callee.property?.name === "getIntlValue" ||
    callee.property?.name === "getIntlText" ||
    callee.property?.name === "getIntlString" ||
    callee.property?.name === "getIntlLabel" ||
    callee.property?.name === "getIntlDate" ||
    callee.property?.name === "getIntlTime" ||
    callee.property?.name === "getIntlNumber" ||
    callee.property?.name === "getIntlCurrency" ||
    callee.property?.name === "getIntlUnit" ||
    callee.property?.name === "getIntlRange" ||
    callee.property?.name === "getIntlParts" ||
    callee.property?.name === "getIntlFormat"
  );
}

function isComponentRender(callee) {
  return (
    callee.name === "render" ||
    callee.property?.name === "createElement" ||
    callee.name === "React.createElement" ||
    callee.property?.name === "ReactDOM.render" ||
    callee.property?.name === "hydrate" ||
    callee.property?.name === "ReactDOM.hydrate" ||
    callee.property?.name === "ReactDOM.createRoot" ||
    callee.property?.name === "ReactDOM.unstable_renderSubtreeIntoContainer" ||
    callee.property?.name === "ReactDOMServer.renderToString" ||
    callee.property?.name === "ReactDOMServer.renderToStaticMarkup" ||
    callee.property?.name === "ReactDOMServer.renderToPipeableStream" ||
    callee.property?.name === "ReactDOMServer.renderToReadableStream" ||
    callee.property?.name === "createRoot" ||
    callee.property?.name === "root.render" ||
    callee.property?.name === "jsx" ||
    callee.property?.name === "jsxs" ||
    callee.property?.name === "Fragment" ||
    callee.property?.name === "StrictMode" ||
    callee.property?.name === "Suspense" ||
    callee.property?.name === "lazy" ||
    callee.property?.name === "forwardRef" ||
    callee.property?.name === "memo" ||
    callee.property?.name === "cloneElement" ||
    callee.property?.name === "isValidElement" ||
    callee.property?.name === "createPortal" ||
    callee.property?.name === "mount" ||
    callee.property?.name === "unmount" ||
    callee.property?.name === "Vue.createApp" ||
    callee.property?.name === "app.mount" ||
    callee.property?.name === "app.unmount" ||
    callee.property?.name === "h" ||
    callee.property?.name === "defineComponent" ||
    callee.property?.name === "setup" ||
    callee.property?.name === "template" ||
    callee.property?.name === "renderComponent" ||
    callee.property?.name === "renderTemplate" ||
    callee.property?.name === "renderView" ||
    callee.property?.name === "renderUI" ||
    callee.property?.name === "renderElement" ||
    callee.property?.name === "renderNode" ||
    callee.property?.name === "renderLayout" ||
    callee.property?.name === "renderPage" ||
    callee.property?.name === "renderScene" ||
    callee.property?.name === "renderSlot" ||
    callee.property?.name === "renderFragment" ||
    callee.property?.name === "renderTree" ||
    callee.property?.name === "renderShell" ||
    callee.property?.name === "renderContainer" ||
    callee.property?.name === "renderOutlet" ||
    callee.property?.name === "renderWrapper" ||
    callee.property?.name === "renderRoot" ||
    callee.property?.name === "renderApp" ||
    callee.property?.name === "renderModule" ||
    callee.property?.name === "renderComponentTree" ||
    callee.property?.name === "renderComponentNode" ||
    callee.property?.name === "renderComponentView" ||
    callee.property?.name === "renderComponentLayout" ||
    callee.property?.name === "renderComponentShell"
  );
}

function isDependencyInjection(callee) {
  return (
    callee.name === "inject" ||
    callee.name === "provide" ||
    callee.property?.name === "inject" ||
    callee.name === "Injectable" ||
    callee.name === "Injector" ||
    callee.name === "ReflectiveInjector" ||
    callee.name === "forwardRef" ||
    callee.name === "resolveForwardRef" ||
    callee.name === "InjectionToken" ||
    callee.name === "Optional" ||
    callee.name === "SkipSelf" ||
    callee.name === "Self" ||
    callee.name === "Host" ||
    callee.name === "NgModule" ||
    callee.name === "platformBrowserDynamic" ||
    callee.name === "bootstrapModule" ||
    callee.name === "useClass" ||
    callee.name === "useValue" ||
    callee.name === "useExisting" ||
    callee.name === "useFactory" ||
    callee.name === "deps" ||
    callee.name === "provideIn" ||
    callee.name === "rootInjector" ||
    callee.name === "createInjector" ||
    callee.name === "resolveInjector" ||
    callee.name === "injector.get" ||
    callee.name === "injector.resolve" ||
    callee.name === "injector.create" ||
    callee.name === "injector.has" ||
    callee.name === "injector.set" ||
    callee.name === "injector.delete" ||
    callee.name === "injector.register" ||
    callee.name === "injector.provide" ||
    callee.name === "injector.inject" ||
    callee.name === "injector.bind" ||
    callee.name === "injector.unbind" ||
    callee.name === "injector.load" ||
    callee.name === "injector.dispose" ||
    callee.name === "Container" ||
    callee.name === "container.bind" ||
    callee.name === "container.get" ||
    callee.name === "container.unbind" ||
    callee.name === "container.resolve" ||
    callee.name === "container.register" ||
    callee.name === "container.inject" ||
    callee.name === "container.provide" ||
    callee.name === "container.has" ||
    callee.name === "container.create" ||
    callee.name === "container.dispose" ||
    callee.name === "container.load" ||
    callee.name === "container.use" ||
    callee.name === "container.map"
  );
}

function isMemoization(callee) {
  return (
    callee.name === "useMemo" ||
    callee.name === "useCallback" ||
    callee.name === "memo" ||
    callee.name === "useComputed" ||
    callee.name === "useSelector" ||
    callee.name === "createSelector" ||
    callee.name === "createMemo" ||
    callee.name === "computed" ||
    callee.name === "watchEffect" ||
    callee.name === "watchMemo" ||
    callee.name === "watchComputed" ||
    callee.name === "useSignal" ||
    callee.name === "useStoreMemo" ||
    callee.name === "useDerivedValue" ||
    callee.name === "useRefMemo" ||
    callee.name === "useStableMemo" ||
    callee.name === "useDeepMemo" ||
    callee.name === "useShallowMemo" ||
    callee.name === "useMemoizedFn" ||
    callee.name === "useMemoizedCallback" ||
    callee.name === "useMemoizedValue" ||
    callee.name === "useMemoCache" ||
    callee.name === "useMemoSelector" ||
    callee.name === "useMemoSignal" ||
    callee.name === "useMemoStore" ||
    callee.name === "useMemoEffect" ||
    callee.name === "useMemoHook" ||
    callee.name === "useMemoResult" ||
    callee.name === "useMemoState" ||
    callee.name === "useMemoContext" ||
    callee.name === "useMemoProps" ||
    callee.name === "useMemoRender" ||
    callee.name === "useMemoComponent" ||
    callee.name === "useMemoFunction" ||
    callee.name === "useMemoSelectorFn" ||
    callee.name === "useMemoizedSelector" ||
    callee.name === "useMemoizedStore" ||
    callee.name === "useMemoizedSignal" ||
    callee.name === "useMemoizedEffect" ||
    callee.name === "useMemoizedContext" ||
    callee.name === "useMemoizedState" ||
    callee.name === "useMemoizedProps" ||
    callee.name === "useMemoizedRender" ||
    callee.name === "useMemoizedComponent" ||
    callee.name === "useMemoizedFunction" ||
    callee.name === "memoize" ||
    callee.name === "memoizeOne" ||
    callee.name === "memoizeWith" ||
    callee.name === "memoizeFn" ||
    callee.name === "memoizeSelector" ||
    callee.name === "memoizeStore" ||
    callee.name === "memoizeSignal" ||
    callee.name === "memoizeEffect" ||
    callee.name === "memoizeContext" ||
    callee.name === "memoizeState" ||
    callee.name === "memoizeProps" ||
    callee.name === "memoizeRender" ||
    callee.name === "memoizeComponent" ||
    callee.name === "memoizeFunction"
  );
}

function isCustomEvent(callee) {
  return (
    callee.property?.name === "dispatchEvent" ||
    callee.property?.name === "emit" ||
    callee.name === "CustomEvent" ||
    callee.property?.name === "fireEvent" ||
    callee.property?.name === "triggerEvent" ||
    callee.property?.name === "sendEvent" ||
    callee.property?.name === "raiseEvent" ||
    callee.property?.name === "broadcast" ||
    callee.property?.name === "publish" ||
    callee.property?.name === "notify" ||
    callee.property?.name === "trigger" ||
    callee.property?.name === "fire" ||
    callee.property?.name === "emitEvent" ||
    callee.property?.name === "dispatch" ||
    callee.property?.name === "send" ||
    callee.property?.name === "invokeEvent" ||
    callee.property?.name === "createEvent" ||
    callee.property?.name === "EventEmitter" ||
    callee.property?.name === "Subject" ||
    callee.property?.name === "BehaviorSubject" ||
    callee.property?.name === "ReplaySubject" ||
    callee.property?.name === "AsyncSubject" ||
    callee.property?.name === "Observable" ||
    callee.property?.name === "next" ||
    callee.property?.name === "subscribe" ||
    callee.property?.name === "unsubscribe" ||
    callee.property?.name === "on" ||
    callee.property?.name === "off" ||
    callee.property?.name === "once" ||
    callee.property?.name === "addListener" ||
    callee.property?.name === "removeListener" ||
    callee.property?.name === "onEvent" ||
    callee.property?.name === "handleEvent" ||
    callee.property?.name === "eventHandler" ||
    callee.property?.name === "eventBus" ||
    callee.property?.name === "eventStream" ||
    callee.property?.name === "eventDispatcher" ||
    callee.property?.name === "eventEmitter" ||
    callee.property?.name === "eventManager" ||
    callee.property?.name === "eventBroker" ||
    callee.property?.name === "eventChannel" ||
    callee.property?.name === "eventService" ||
    callee.property?.name === "eventSystem" ||
    callee.property?.name === "eventAPI" ||
    callee.property?.name === "eventTransport" ||
    callee.property?.name === "eventTrigger" ||
    callee.property?.name === "eventSender" ||
    callee.property?.name === "eventPublisher" ||
    callee.property?.name === "eventNotifier" ||
    callee.property?.name === "eventRelay"
  );
}

function isNavigationCall(callee) {
  return (
    (callee.object?.name === "window" &&
      (callee.property?.name === "location" ||
        callee.property?.name === "history")) ||
    callee.property?.name === "assign" ||
    callee.property?.name === "replace" ||
    callee.property?.name === "reload" ||
    callee.property?.name === "href" ||
    callee.property?.name === "pathname" ||
    callee.property?.name === "search" ||
    callee.property?.name === "hash" ||
    callee.property?.name === "pushState" ||
    callee.property?.name === "replaceState" ||
    callee.property?.name === "go" ||
    callee.property?.name === "back" ||
    callee.property?.name === "forward" ||
    callee.property?.name === "navigate" ||
    callee.property?.name === "useNavigate" ||
    callee.property?.name === "useHistory" ||
    callee.property?.name === "useLocation" ||
    callee.property?.name === "useParams" ||
    callee.property?.name === "useRouter" ||
    callee.property?.name === "router.push" ||
    callee.property?.name === "router.replace" ||
    callee.property?.name === "router.go" ||
    callee.property?.name === "router.back" ||
    callee.property?.name === "router.forward" ||
    callee.property?.name === "router.navigate" ||
    callee.property?.name === "router.resolve" ||
    callee.property?.name === "router.currentRoute" ||
    callee.property?.name === "router.beforeEach" ||
    callee.property?.name === "router.afterEach" ||
    callee.property?.name === "router.addRoute" ||
    callee.property?.name === "router.removeRoute" ||
    callee.property?.name === "router.getRoutes" ||
    callee.property?.name === "router.isReady" ||
    callee.property?.name === "router.onReady" ||
    callee.property?.name === "router.onError" ||
    callee.property?.name === "router.scrollBehavior" ||
    callee.property?.name === "navigateTo" ||
    callee.property?.name === "redirectTo" ||
    callee.property?.name === "changeRoute" ||
    callee.property?.name === "transitionTo" ||
    callee.property?.name === "loadPage" ||
    callee.property?.name === "openPage" ||
    callee.property?.name === "goTo" ||
    callee.property?.name === "moveTo" ||
    callee.property?.name === "switchTo" ||
    callee.property?.name === "routeTo" ||
    callee.property?.name === "jumpTo" ||
    callee.property?.name === "navigateBack" ||
    callee.property?.name === "navigateForward" ||
    callee.property?.name === "navigateReplace" ||
    callee.property?.name === "navigateReload" ||
    callee.property?.name === "navigateAssign" ||
    callee.property?.name === "navigateHref" ||
    callee.property?.name === "navigateHash" ||
    callee.property?.name === "navigateSearch"
  );
}

function isDataTransformation(callee) {
  return (
    callee.property?.name === "map" ||
    callee.property?.name === "filter" ||
    callee.property?.name === "reduce" ||
    callee.property?.name === "transform" ||
    callee.property?.name === "flatMap" ||
    callee.property?.name === "sort" ||
    callee.property?.name === "reverse" ||
    callee.property?.name === "slice" ||
    callee.property?.name === "splice" ||
    callee.property?.name === "concat" ||
    callee.property?.name === "join" ||
    callee.property?.name === "split" ||
    callee.property?.name === "groupBy" ||
    callee.property?.name === "partition" ||
    callee.property?.name === "pluck" ||
    callee.property?.name === "zip" ||
    callee.property?.name === "unzip" ||
    callee.property?.name === "merge" ||
    callee.property?.name === "assign" ||
    callee.property?.name === "pick" ||
    callee.property?.name === "omit" ||
    callee.property?.name === "entries" ||
    callee.property?.name === "values" ||
    callee.property?.name === "keys" ||
    callee.property?.name === "fromEntries" ||
    callee.property?.name === "toPairs" ||
    callee.property?.name === "flatten" ||
    callee.property?.name === "compact" ||
    callee.property?.name === "uniq" ||
    callee.property?.name === "uniqBy" ||
    callee.property?.name === "intersection" ||
    callee.property?.name === "difference" ||
    callee.property?.name === "union" ||
    callee.property?.name === "countBy" ||
    callee.property?.name === "shuffle" ||
    callee.property?.name === "sample" ||
    callee.property?.name === "sortBy" ||
    callee.property?.name === "orderBy" ||
    callee.property?.name === "chunk" ||
    callee.property?.name === "range" ||
    callee.property?.name === "fill" ||
    callee.property?.name === "repeat" ||
    callee.property?.name === "padStart" ||
    callee.property?.name === "padEnd" ||
    callee.property?.name === "startsWith" ||
    callee.property?.name === "endsWith" ||
    callee.property?.name === "replace" ||
    callee.property?.name === "normalize" ||
    callee.property?.name === "trim" ||
    callee.property?.name === "trimStart" ||
    callee.property?.name === "trimEnd" ||
    callee.property?.name === "toLowerCase" ||
    callee.property?.name === "toUpperCase" ||
    callee.property?.name === "toLocaleLowerCase" ||
    callee.property?.name === "toLocaleUpperCase" ||
    callee.property?.name === "parse" ||
    callee.property?.name === "stringify" ||
    callee.property?.name === "cast" ||
    callee.property?.name === "remap"
  );
}

function isRegexUsage(callee) {
  return (
    callee.object?.name === "RegExp" ||
    callee.property?.name === "test" ||
    callee.property?.name === "match" ||
    callee.property?.name === "exec" ||
    callee.property?.name === "search" ||
    callee.property?.name === "replace" ||
    callee.property?.name === "split" ||
    callee.property?.name === "matchAll" ||
    callee.property?.name === "compile" ||
    callee.property?.name === "flags" ||
    callee.property?.name === "source" ||
    callee.property?.name === "lastIndex" ||
    callee.property?.name === "global" ||
    callee.property?.name === "ignoreCase" ||
    callee.property?.name === "multiline" ||
    callee.property?.name === "dotAll" ||
    callee.property?.name === "unicode" ||
    callee.property?.name === "sticky" ||
    callee.property?.name === "pattern" ||
    callee.property?.name === "regex" ||
    callee.property?.name === "regexp" ||
    callee.property?.name === "isRegex" ||
    callee.property?.name === "validateRegex" ||
    callee.property?.name === "parseRegex" ||
    callee.property?.name === "regexMatch" ||
    callee.property?.name === "regexTest" ||
    callee.property?.name === "regexExec" ||
    callee.property?.name === "regexSearch" ||
    callee.property?.name === "regexReplace" ||
    callee.property?.name === "regexSplit" ||
    callee.property?.name === "regexEscape" ||
    callee.property?.name === "regexUnescape" ||
    callee.property?.name === "regexBuilder" ||
    callee.property?.name === "regexParser" ||
    callee.property?.name === "regexEngine" ||
    callee.property?.name === "regexUtils" ||
    callee.property?.name === "regexHelper" ||
    callee.property?.name === "regexProcessor" ||
    callee.property?.name === "regexHandler" ||
    callee.property?.name === "regexEvaluator" ||
    callee.property?.name === "regexTester" ||
    callee.property?.name === "regexValidator" ||
    callee.property?.name === "regexGenerator" ||
    callee.property?.name === "regexCompiler" ||
    callee.property?.name === "regexInterpreter" ||
    callee.property?.name === "regexConstructor" ||
    callee.property?.name === "regexFormatter" ||
    callee.property?.name === "regexSanitizer" ||
    callee.property?.name === "regexTransformer" ||
    callee.property?.name === "regexAnalyzer" ||
    callee.property?.name === "regexInspector" ||
    callee.property?.name === "regexScanner" ||
    callee.property?.name === "regexFilter" ||
    callee.property?.name === "regexExtractor" ||
    callee.property?.name === "regexResolver" ||
    callee.property?.name === "regexApplier" ||
    callee.property?.name === "regexCleaner" ||
    callee.property?.name === "regexComposer"
  );
}
function isModuleImport(callee) {
  return (
    callee.name === "require" ||
    callee.name === "import" ||
    callee.property?.name === "import" ||
    callee.name === "require.resolve" ||
    callee.name === "require.ensure" ||
    callee.name === "require.context" ||
    callee.name === "requireAsync" ||
    callee.name === "requireModule" ||
    callee.name === "requireLib" ||
    callee.name === "requireComponent" ||
    callee.name === "requirePlugin" ||
    callee.name === "requirePackage" ||
    callee.name === "requireDependency" ||
    callee.name === "requireDynamic" ||
    callee.name === "requireFunction" ||
    callee.name === "requireFile" ||
    callee.name === "requireAsset" ||
    callee.name === "requireScript" ||
    callee.name === "requireBundle" ||
    callee.name === "requireShim" ||
    callee.name === "define" ||
    callee.name === "defineModule" ||
    callee.name === "defineComponent" ||
    callee.name === "definePlugin" ||
    callee.name === "definePackage" ||
    callee.name === "defineDependency" ||
    callee.name === "defineFunction" ||
    callee.name === "defineFile" ||
    callee.name === "defineAsset" ||
    callee.name === "defineScript" ||
    callee.name === "defineBundle" ||
    callee.name === "defineShim" ||
    callee.name === "System.import" ||
    callee.name === "importModule" ||
    callee.name === "importComponent" ||
    callee.name === "importPlugin" ||
    callee.name === "importPackage" ||
    callee.name === "importDependency" ||
    callee.name === "importFunction" ||
    callee.name === "importFile" ||
    callee.name === "importAsset" ||
    callee.name === "importScript" ||
    callee.name === "importBundle" ||
    callee.name === "importShim" ||
    callee.name === "loadModule" ||
    callee.name === "loadComponent" ||
    callee.name === "loadPlugin" ||
    callee.name === "loadPackage" ||
    callee.name === "loadDependency" ||
    callee.name === "loadFunction" ||
    callee.name === "loadFile" ||
    callee.name === "loadAsset" ||
    callee.name === "loadScript" ||
    callee.name === "loadBundle" ||
    callee.name === "loadShim" ||
    callee.name === "fetchModule" ||
    callee.name === "fetchDependency" ||
    callee.name === "resolveModule" ||
    callee.name === "resolveDependency"
  );
}

function isAnalyticsCall(callee) {
  return (
    callee.object?.name === "gtag" ||
    callee.object?.name === "analytics" ||
    callee.property?.name === "track" ||
    callee.property?.name === "logEvent" ||
    callee.property?.name === "sendEvent" ||
    callee.property?.name === "recordEvent" ||
    callee.property?.name === "fireEvent" ||
    callee.property?.name === "captureEvent" ||
    callee.property?.name === "pushEvent" ||
    callee.property?.name === "event" ||
    callee.property?.name === "eventTracker" ||
    callee.property?.name === "trackEvent" ||
    callee.property?.name === "trackPage" ||
    callee.property?.name === "trackPageView" ||
    callee.property?.name === "trackConversion" ||
    callee.property?.name === "trackGoal" ||
    callee.property?.name === "trackClick" ||
    callee.property?.name === "trackInteraction" ||
    callee.property?.name === "trackTiming" ||
    callee.property?.name === "trackMetric" ||
    callee.property?.name === "trackCustom" ||
    callee.property?.name === "trackUser" ||
    callee.property?.name === "trackSession" ||
    callee.property?.name === "trackBehavior" ||
    callee.property?.name === "trackEngagement" ||
    callee.property?.name === "trackScroll" ||
    callee.property?.name === "trackForm" ||
    callee.property?.name === "trackError" ||
    callee.property?.name === "trackDownload" ||
    callee.property?.name === "trackOutbound" ||
    callee.property?.name === "trackVideo" ||
    callee.property?.name === "trackAd" ||
    callee.property?.name === "trackRevenue" ||
    callee.property?.name === "trackPurchase" ||
    callee.property?.name === "trackTransaction" ||
    callee.property?.name === "trackSignup" ||
    callee.property?.name === "trackLogin" ||
    callee.property?.name === "trackLogout" ||
    callee.property?.name === "trackProfile" ||
    callee.property?.name === "trackIdentity" ||
    callee.property?.name === "trackRetention" ||
    callee.property?.name === "trackFunnel" ||
    callee.property?.name === "trackFlow" ||
    callee.property?.name === "trackStep" ||
    callee.property?.name === "trackStage" ||
    callee.property?.name === "trackPath" ||
    callee.property?.name === "trackJourney" ||
    callee.property?.name === "trackSource" ||
    callee.property?.name === "trackCampaign" ||
    callee.property?.name === "trackReferrer" ||
    callee.property?.name === "trackDevice" ||
    callee.property?.name === "trackPlatform" ||
    callee.property?.name === "trackBrowser" ||
    callee.property?.name === "trackLocation" ||
    callee.property?.name === "trackGeo" ||
    callee.property?.name === "trackDemographics" ||
    callee.property?.name === "trackSegment"
  );
}

function isWebSocketUsage(callee) {
  return (
    callee.name === "WebSocket" ||
    callee.property?.name === "send" ||
    callee.property?.name === "onmessage" ||
    callee.property?.name === "onopen" ||
    callee.property?.name === "onclose" ||
    callee.property?.name === "onerror" ||
    callee.property?.name === "close" ||
    callee.property?.name === "readyState" ||
    callee.property?.name === "CONNECTING" ||
    callee.property?.name === "OPEN" ||
    callee.property?.name === "CLOSING" ||
    callee.property?.name === "CLOSED" ||
    callee.property?.name === "binaryType" ||
    callee.property?.name === "protocol" ||
    callee.property?.name === "url" ||
    callee.property?.name === "bufferedAmount" ||
    callee.property?.name === "extensions" ||
    callee.property?.name === "ping" ||
    callee.property?.name === "pong" ||
    callee.property?.name === "emit" ||
    callee.property?.name === "broadcast" ||
    callee.property?.name === "subscribe" ||
    callee.property?.name === "unsubscribe" ||
    callee.property?.name === "connect" ||
    callee.property?.name === "disconnect" ||
    callee.property?.name === "reconnect" ||
    callee.property?.name === "socket" ||
    callee.property?.name === "io" ||
    callee.property?.name === "Socket" ||
    callee.property?.name === "SocketIO" ||
    callee.property?.name === "ws" ||
    callee.property?.name === "wsServer" ||
    callee.property?.name === "wsClient" ||
    callee.property?.name === "wsConnect" ||
    callee.property?.name === "wsDisconnect" ||
    callee.property?.name === "wsSend" ||
    callee.property?.name === "wsReceive" ||
    callee.property?.name === "wsMessage" ||
    callee.property?.name === "wsError" ||
    callee.property?.name === "wsClose" ||
    callee.property?.name === "wsOpen" ||
    callee.property?.name === "wsPing" ||
    callee.property?.name === "wsPong" ||
    callee.property?.name === "wsReady" ||
    callee.property?.name === "wsReconnect" ||
    callee.property?.name === "wsSubscribe" ||
    callee.property?.name === "wsUnsubscribe" ||
    callee.property?.name === "wsEmit" ||
    callee.property?.name === "wsBroadcast" ||
    callee.property?.name === "wsHandler" ||
    callee.property?.name === "wsTransport" ||
    callee.property?.name === "wsChannel" ||
    callee.property?.name === "wsStream" ||
    callee.property?.name === "wsEvent" ||
    callee.property?.name === "wsHook" ||
    callee.property?.name === "wsAPI" ||
    callee.property?.name === "wsWrapper"
  );
}

function isClipboardAccess(callee) {
  return (
    (callee.object?.name === "navigator" &&
      callee.property?.name === "clipboard") ||
    callee.property?.name === "writeText" ||
    callee.property?.name === "readText" ||
    callee.property?.name === "write" ||
    callee.property?.name === "read" ||
    callee.property?.name === "copy" ||
    callee.property?.name === "cut" ||
    callee.property?.name === "paste" ||
    callee.property?.name === "execCommand" ||
    callee.property?.name === "clipboardData" ||
    callee.property?.name === "setData" ||
    callee.property?.name === "getData" ||
    callee.property?.name === "clearData" ||
    callee.property?.name === "oncopy" ||
    callee.property?.name === "oncut" ||
    callee.property?.name === "onpaste" ||
    callee.property?.name === "document.execCommand" ||
    callee.property?.name === "window.clipboardData" ||
    callee.property?.name === "clipboard.writeText" ||
    callee.property?.name === "clipboard.readText" ||
    callee.property?.name === "clipboard.write" ||
    callee.property?.name === "clipboard.read" ||
    callee.property?.name === "clipboard.copy" ||
    callee.property?.name === "clipboard.cut" ||
    callee.property?.name === "clipboard.paste" ||
    callee.property?.name === "clipboard.setData" ||
    callee.property?.name === "clipboard.getData" ||
    callee.property?.name === "clipboard.clearData" ||
    callee.property?.name === "clipboard.oncopy" ||
    callee.property?.name === "clipboard.oncut" ||
    callee.property?.name === "clipboard.onpaste" ||
    callee.property?.name === "ClipboardJS" ||
    callee.property?.name === "clipboard.writeHTML" ||
    callee.property?.name === "clipboard.readHTML" ||
    callee.property?.name === "clipboard.writeImage" ||
    callee.property?.name === "clipboard.readImage" ||
    callee.property?.name === "clipboard.writeFiles" ||
    callee.property?.name === "clipboard.readFiles" ||
    callee.property?.name === "clipboardInterceptor" ||
    callee.property?.name === "clipboardHandler" ||
    callee.property?.name === "clipboardUtils"
  );
}

function isDragDrop(callee) {
  return (
    callee.property?.name === "dragstart" ||
    callee.property?.name === "drop" ||
    callee.property?.name === "ondrag" ||
    callee.property?.name === "drag" ||
    callee.property?.name === "dragend" ||
    callee.property?.name === "dragenter" ||
    callee.property?.name === "dragleave" ||
    callee.property?.name === "dragover" ||
    callee.property?.name === "ondragstart" ||
    callee.property?.name === "ondragend" ||
    callee.property?.name === "ondragenter" ||
    callee.property?.name === "ondragleave" ||
    callee.property?.name === "ondragover" ||
    callee.property?.name === "ondrop" ||
    callee.property?.name === "dataTransfer" ||
    callee.property?.name === "setData" ||
    callee.property?.name === "getData" ||
    callee.property?.name === "clearData" ||
    callee.property?.name === "effectAllowed" ||
    callee.property?.name === "dropEffect" ||
    callee.property?.name === "files" ||
    callee.property?.name === "items" ||
    callee.property?.name === "types" ||
    callee.property?.name === "addEventListener" ||
    callee.property?.name === "removeEventListener" ||
    callee.property?.name === "preventDefault" ||
    callee.property?.name === "stopPropagation" ||
    callee.property?.name === "handleDragStart" ||
    callee.property?.name === "handleDragEnd" ||
    callee.property?.name === "handleDragEnter" ||
    callee.property?.name === "handleDragLeave" ||
    callee.property?.name === "handleDragOver" ||
    callee.property?.name === "handleDrop" ||
    callee.property?.name === "dragHandler" ||
    callee.property?.name === "dropHandler" ||
    callee.property?.name === "dragDropHandler" ||
    callee.property?.name === "dragDropManager" ||
    callee.property?.name === "dragDropService" ||
    callee.property?.name === "dragDropContext" ||
    callee.property?.name === "dragDropZone" ||
    callee.property?.name === "dragDropArea" ||
    callee.property?.name === "dragDropTarget" ||
    callee.property?.name === "dragDropSource" ||
    callee.property?.name === "dragDropPayload" ||
    callee.property?.name === "dragDropEvent" ||
    callee.property?.name === "dragDropListener" ||
    callee.property?.name === "dragDropBinder" ||
    callee.property?.name === "dragDropAdapter" ||
    callee.property?.name === "dragDropHook" ||
    callee.property?.name === "dragDropDirective" ||
    callee.property?.name === "dragDropPlugin" ||
    callee.property?.name === "dragDropUtil" ||
    callee.property?.name === "dragDropBridge" ||
    callee.property?.name === "dragDropEngine" ||
    callee.property?.name === "dragDropCore" ||
    callee.property?.name === "dragDropAPI" ||
    callee.property?.name === "dragDropComponent" ||
    callee.property?.name === "dragDropContainer"
  );
}

function isMutationObserver(callee) {
  return (
    callee.name === "MutationObserver" ||
    callee.property?.name === "observe" ||
    callee.property?.name === "disconnect" ||
    callee.property?.name === "takeRecords" ||
    callee.property?.name === "mutationCallback" ||
    callee.property?.name === "mutationHandler" ||
    callee.property?.name === "mutationObserver" ||
    callee.property?.name === "mutationTarget" ||
    callee.property?.name === "mutationEvents" ||
    callee.property?.name === "mutationRecords" ||
    callee.property?.name === "mutationStream" ||
    callee.property?.name === "mutationWatcher" ||
    callee.property?.name === "mutationMonitor" ||
    callee.property?.name === "mutationListener" ||
    callee.property?.name === "mutationTracker" ||
    callee.property?.name === "mutationBinder" ||
    callee.property?.name === "mutationScope" ||
    callee.property?.name === "mutationNode" ||
    callee.property?.name === "mutationTree" ||
    callee.property?.name === "mutationScan" ||
    callee.property?.name === "mutationScanNode" ||
    callee.property?.name === "mutationScanTree" ||
    callee.property?.name === "mutationWatch" ||
    callee.property?.name === "mutationWatchNode" ||
    callee.property?.name === "mutationWatchTree" ||
    callee.property?.name === "mutationDetect" ||
    callee.property?.name === "mutationDetectNode" ||
    callee.property?.name === "mutationDetectTree" ||
    callee.property?.name === "mutationHook" ||
    callee.property?.name === "mutationBridge" ||
    callee.property?.name === "mutationRelay" ||
    callee.property?.name === "mutationPipe" ||
    callee.property?.name === "mutationTap" ||
    callee.property?.name === "mutationTapNode" ||
    callee.property?.name === "mutationTapTree" ||
    callee.property?.name === "mutationSync" ||
    callee.property?.name === "mutationSyncNode" ||
    callee.property?.name === "mutationSyncTree" ||
    callee.property?.name === "mutationLog" ||
    callee.property?.name === "mutationLogNode" ||
    callee.property?.name === "mutationLogTree" ||
    callee.property?.name === "mutationEvent" ||
    callee.property?.name === "mutationEventNode" ||
    callee.property?.name === "mutationEventTree" ||
    callee.property?.name === "mutationTrigger" ||
    callee.property?.name === "mutationTriggerNode" ||
    callee.property?.name === "mutationTriggerTree" ||
    callee.property?.name === "mutationCapture" ||
    callee.property?.name === "mutationCaptureNode" ||
    callee.property?.name === "mutationCaptureTree" ||
    callee.property?.name === "mutationInspector" ||
    callee.property?.name === "mutationAnalyzer" ||
    callee.property?.name === "mutationReporter" ||
    callee.property?.name === "mutationCollector" ||
    callee.property?.name === "mutationDispatcher" ||
    callee.property?.name === "mutationProcessor"
  );
}

function isIntersectionObserver(callee) {
  return (
    callee.name === "IntersectionObserver" ||
    callee.property?.name === "observe" ||
    callee.property?.name === "unobserve" ||
    callee.property?.name === "disconnect" ||
    callee.property?.name === "thresholds" ||
    callee.property?.name === "root" ||
    callee.property?.name === "rootMargin" ||
    callee.property?.name === "isIntersecting" ||
    callee.property?.name === "intersectionRatio" ||
    callee.property?.name === "boundingClientRect" ||
    callee.property?.name === "intersectionRect" ||
    callee.property?.name === "target" ||
    callee.property?.name === "entry" ||
    callee.property?.name === "entries" ||
    callee.property?.name === "callback" ||
    callee.property?.name === "intersectionCallback" ||
    callee.property?.name === "intersectionHandler" ||
    callee.property?.name === "intersectionObserver" ||
    callee.property?.name === "intersectionWatcher" ||
    callee.property?.name === "intersectionMonitor" ||
    callee.property?.name === "intersectionListener" ||
    callee.property?.name === "intersectionTracker" ||
    callee.property?.name === "intersectionBinder" ||
    callee.property?.name === "intersectionScope" ||
    callee.property?.name === "intersectionNode" ||
    callee.property?.name === "intersectionTarget" ||
    callee.property?.name === "intersectionStream" ||
    callee.property?.name === "intersectionWatch" ||
    callee.property?.name === "intersectionDetect" ||
    callee.property?.name === "intersectionHook" ||
    callee.property?.name === "intersectionBridge" ||
    callee.property?.name === "intersectionRelay" ||
    callee.property?.name === "intersectionPipe" ||
    callee.property?.name === "intersectionTap" ||
    callee.property?.name === "intersectionSync" ||
    callee.property?.name === "intersectionLog" ||
    callee.property?.name === "intersectionEvent" ||
    callee.property?.name === "intersectionTrigger" ||
    callee.property?.name === "intersectionCapture" ||
    callee.property?.name === "intersectionInspector" ||
    callee.property?.name === "intersectionAnalyzer" ||
    callee.property?.name === "intersectionReporter" ||
    callee.property?.name === "intersectionCollector" ||
    callee.property?.name === "intersectionDispatcher" ||
    callee.property?.name === "intersectionProcessor" ||
    callee.property?.name === "intersectionManager" ||
    callee.property?.name === "intersectionService" ||
    callee.property?.name === "intersectionEngine" ||
    callee.property?.name === "intersectionCore" ||
    callee.property?.name === "intersectionAPI" ||
    callee.property?.name === "intersectionComponent" ||
    callee.property?.name === "intersectionContainer" ||
    callee.property?.name === "intersectionDirective" ||
    callee.property?.name === "intersectionPlugin" ||
    callee.property?.name === "intersectionUtil"
  );
}

function isMediaQuery(callee) {
  return (
    callee.property?.name === "matchMedia" ||
    callee.property?.name === "addListener" ||
    callee.property?.name === "removeListener" ||
    callee.property?.name === "media" ||
    callee.property?.name === "matches" ||
    callee.property?.name === "onchange" ||
    callee.property?.name === "mediaQueryList" ||
    callee.property?.name === "mediaQuery" ||
    callee.property?.name === "mediaQueryHook" ||
    callee.property?.name === "mediaQueryListener" ||
    callee.property?.name === "mediaQueryObserver" ||
    callee.property?.name === "mediaQueryCallback" ||
    callee.property?.name === "mediaQueryHandler" ||
    callee.property?.name === "mediaQueryTracker" ||
    callee.property?.name === "mediaQueryBinder" ||
    callee.property?.name === "mediaQueryWatcher" ||
    callee.property?.name === "mediaQueryMonitor" ||
    callee.property?.name === "mediaQueryUtil" ||
    callee.property?.name === "mediaQueryService" ||
    callee.property?.name === "mediaQueryManager" ||
    callee.property?.name === "mediaQueryEngine" ||
    callee.property?.name === "mediaQueryAPI" ||
    callee.property?.name === "mediaQueryBridge" ||
    callee.property?.name === "mediaQueryDirective" ||
    callee.property?.name === "mediaQueryPlugin" ||
    callee.property?.name === "mediaQueryComponent" ||
    callee.property?.name === "mediaQueryContainer" ||
    callee.property?.name === "mediaQueryContext" ||
    callee.property?.name === "mediaQueryProvider" ||
    callee.property?.name === "mediaQueryConsumer" ||
    callee.property?.name === "mediaQueryToggle" ||
    callee.property?.name === "mediaQuerySwitch" ||
    callee.property?.name === "mediaQueryResponsive" ||
    callee.property?.name === "mediaQueryBreakpoint" ||
    callee.property?.name === "mediaQueryLayout" ||
    callee.property?.name === "mediaQueryStyle" ||
    callee.property?.name === "mediaQueryTheme" ||
    callee.property?.name === "mediaQueryConfig" ||
    callee.property?.name === "mediaQuerySetup" ||
    callee.property?.name === "mediaQueryInit"
  );
}

function isAccessibilityFeature(callee) {
  return (
    callee.property?.name === "aria" ||
    callee.property?.name === "role" ||
    callee.property?.name === "tabIndex" ||
    callee.property?.name === "ariaLabel" ||
    callee.property?.name === "ariaLabelledBy" ||
    callee.property?.name === "ariaDescribedBy" ||
    callee.property?.name === "ariaHidden" ||
    callee.property?.name === "ariaChecked" ||
    callee.property?.name === "ariaSelected" ||
    callee.property?.name === "ariaDisabled" ||
    callee.property?.name === "ariaExpanded" ||
    callee.property?.name === "ariaPressed" ||
    callee.property?.name === "ariaRequired" ||
    callee.property?.name === "ariaInvalid" ||
    callee.property?.name === "ariaControls" ||
    callee.property?.name === "ariaOwns" ||
    callee.property?.name === "ariaHasPopup" ||
    callee.property?.name === "ariaLive" ||
    callee.property?.name === "ariaAtomic" ||
    callee.property?.name === "ariaRelevant" ||
    callee.property?.name === "ariaBusy" ||
    callee.property?.name === "ariaModal" ||
    callee.property?.name === "ariaRoleDescription" ||
    callee.property?.name === "ariaCurrent" ||
    callee.property?.name === "ariaFlowTo" ||
    callee.property?.name === "ariaGrabbed" ||
    callee.property?.name === "ariaDropEffect" ||
    callee.property?.name === "ariaMultiselectable" ||
    callee.property?.name === "ariaOrientation" ||
    callee.property?.name === "ariaReadOnly" ||
    callee.property?.name === "ariaSort" ||
    callee.property?.name === "ariaValueMin" ||
    callee.property?.name === "ariaValueMax" ||
    callee.property?.name === "ariaValueNow" ||
    callee.property?.name === "ariaValueText" ||
    callee.property?.name === "accessKey" ||
    callee.property?.name === "lang" ||
    callee.property?.name === "dir" ||
    callee.property?.name === "title" ||
    callee.property?.name === "alt" ||
    callee.property?.name === "label" ||
    callee.property?.name === "ariaSetSize" ||
    callee.property?.name === "ariaPosInSet"
  );
}

function detectLibraries(imports, requires) {
  const libs = [];
  const allDeps = [...imports, ...requires].filter(Boolean);

  const libPatterns = {
    react: ["react", "react-dom", "react-native"],
    vue: ["vue", "@vue", "nuxt"],
    angular: ["@angular", "angular"],
    state: ["redux", "mobx", "zustand", "recoil", "xstate", "jotai"],
    router: ["react-router", "vue-router", "@angular/router", "wouter"],
    ui: [
      "@mui",
      "material-ui",
      "antd",
      "element-ui",
      "bootstrap",
      "tailwindcss",
      "chakra-ui",
    ],
    http: ["axios", "fetch", "superagent", "ky", "got", "node-fetch"],
    utils: ["lodash", "underscore", "ramda", "date-fns", "moment"],
    testing: ["jest", "mocha", "chai", "@testing-library", "enzyme"],
    animation: ["framer-motion", "gsap", "animejs", "popmotion"],
    charts: ["chart.js", "d3", "recharts", "highcharts", "visx"],
    forms: ["formik", "react-hook-form", "yup", "zod"],
    graphql: ["graphql", "apollo", "urql", "@apollo"],
    websocket: ["socket.io", "ws", "sockjs"],
    i18n: ["i18next", "react-intl", "vue-i18n", "@lingui"],
    editor: ["quill", "draft-js", "slate", "monaco", "ace"],
    pdf: ["pdfjs", "jspdf", "react-pdf", "pdfmake"],
    excel: ["xlsx", "exceljs", "papaparse", "sheetjs"],
    icons: ["@heroicons", "lucide-react", "font-awesome", "material-icons"],
    storage: ["localforage", "idb", "dexie", "pouchdb"],
  };

  for (const [category, patterns] of Object.entries(libPatterns)) {
    for (const dep of allDeps) {
      if (patterns.some((p) => dep.includes(p))) {
        if (!libs.includes(dep)) libs.push(dep);
      }
    }
  }

  return libs;
}

function detectSecurityPatterns(ast) {
  const patterns = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const code = path.get("callee").toString();

      // Detect eval usage
      if (code === "eval" || code === "Function") {
        patterns.push("Dangerous code execution: eval/Function");
      }

      // Detect document.write
      if (code === "document.write") {
        patterns.push("document.write usage (deprecated)");
      }

      // Detect innerHTML assignments
      if (path.parentPath?.node?.type === "AssignmentExpression") {
        const left = path.parentPath.node.left;
        if (
          left?.property?.name === "innerHTML" ||
          left?.property?.name === "outerHTML"
        ) {
          patterns.push("Dangerous innerHTML assignment");
        }
      }

      // Detect crypto usage
      if (
        callee.object?.name === "crypto" ||
        callee.property?.name === "subtle"
      ) {
        patterns.push("Web Crypto API usage");
      }
    },

    StringLiteral(path) {
      const value = path.node.value;
      // Detect potential secrets/keys
      if (/^[A-Za-z0-9+/]{32,}={0,2}$/.test(value) && !value.includes(" ")) {
        patterns.push("Possible base64 encoded secret");
      }
      if (
        /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value)
      ) {
        patterns.push("Possible JWT token");
      }
    },
  });

  return [...new Set(patterns)];
}

function detectCodeQuality(ast) {
  const issues = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      // Detect very long functions
      const body = path.get("body");
      if (body.isBlockStatement()) {
        const statements = body.node.body.length;
        if (statements > 50) {
          issues.push({
            type: "complexity",
            severity: "warning",
            message: `Large function '${
              path.node.id?.name || "anonymous"
            }' with ${statements} statements`,
            line: path.node.loc?.start?.line,
          });
        }
      }
    },

    IfStatement(path) {
      // Detect deeply nested conditionals
      let depth = 0;
      let current = path;
      while (current.parentPath) {
        if (current.parentPath.node.type === "IfStatement") {
          depth++;
        }
        current = parentPath;
      }
      if (depth > 3) {
        issues.push({
          type: "nesting",
          severity: "warning",
          message: "Deeply nested conditionals detected",
          line: path.node.loc?.start?.line,
        });
      }
    },
  });

  return issues;
}

function detectReactSpecific(ast) {
  const features = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;

      // React Hooks
      if (callee.name?.startsWith("use")) {
        features.push(`React Hook: ${callee.name}`);
      }

      // JSX
      if (path.node.arguments?.some((arg) => arg.type === "JSXElement")) {
        features.push("JSX syntax");
      }

      // React.createElement
      if (
        callee.object?.name === "React" &&
        callee.property?.name === "createElement"
      ) {
        features.push("React.createElement");
      }
    },

    VariableDeclarator(path) {
      // Detect component definitions
      if (path.node.id?.name?.match(/^[A-Z][a-zA-Z]*$/)) {
        const init = path.node.init;
        if (
          init?.type === "FunctionExpression" ||
          init?.type === "ArrowFunctionExpression"
        ) {
          features.push(`Component: ${path.node.id.name}`);
        }
      }
    },
  });

  return features;
}

function detectPerformancePatterns(ast) {
  const patterns = [];

  traverse(ast, {
    CallExpression(path) {
      const code = path.get("callee").toString();

      // Debounce/Throttle
      if (code.includes("debounce") || code.includes("throttle")) {
        patterns.push("Debounce/Throttle optimization");
      }

      // Memoization
      if (code.includes("memo") || code.includes("cache")) {
        patterns.push("Memoization/Caching");
      }

      // Lazy loading
      if (code.includes("lazy") || code.includes("dynamic")) {
        patterns.push("Lazy loading");
      }
    },

    MemberExpression(path) {
      // Array operations that could be optimized
      const code = path.toString();
      if (
        code.includes(".map(") &&
        path.parentPath?.node?.type === "ArrayExpression"
      ) {
        patterns.push("Array.map() - consider optimization");
      }
    },
  });

  return patterns;
}

// Modify the addFunctionality function to include code snippet and location
function addFunctionality(functionality, type, description, path) {
  if (!functionality.some((f) => f.type === type)) {
    functionality.push({
      type,
      description,
      codeSnippet: path.toString(), // Get the code as string
      location: {
        startLine: path.node.loc?.start?.line,
        endLine: path.node.loc?.end?.line,
      },
    });
  }
}

module.exports = {
  detectFunctionality,
  printDetectedFunctionality,
  detectLibraries,
  detectSecurityPatterns,
  detectCodeQuality,
  detectReactSpecific,
  detectPerformancePatterns,
};
