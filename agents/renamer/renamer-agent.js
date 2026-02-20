/**
 * Renamer Agent
 * Production-grade intelligent variable and function renaming system
 * Version: 3.0.0
 */
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const { parse } = require("@babel/parser");

class RenamerAgent {
  constructor() {
    this.name = "renamer";
    this.version = "3.0.0";
    this.renames = new Map();
    this.scopeChain = [];
    this.context = {};
    this.stats = {
      variablesRenamed: 0,
      functionsRenamed: 0,
      propertiesRenamed: 0,
      suggestions: 0,
    };

    // Comprehensive naming dictionaries
    this.initializeNamingDictionaries();
  }

  /**
   * Initialize comprehensive naming dictionaries
   */
  initializeNamingDictionaries() {
    // Single letter variable mappings
    this.letterMappings = {
      a: ["argument", "array", "attribute", "auth", "axios"],
      b: ["buffer", "boolean", "bound", "button", "body"],
      c: [
        "callback",
        "callbackFunction",
        "component",
        "config",
        "container",
        "context",
        "controller",
        "count",
        "current",
      ],
      d: [
        "data",
        "database",
        "debug",
        "default",
        "delay",
        "delta",
        "depth",
        "destination",
        "dispatch",
        "document",
        "driver",
        "duration",
      ],
      e: [
        "element",
        "elementRef",
        "endpoint",
        "entry",
        "error",
        "event",
        "eventHandler",
        "expression",
      ],
      f: [
        "factory",
        "false",
        "feature",
        "field",
        "file",
        "filter",
        "finally",
        "flag",
        "formatter",
        "function",
        "functionRef",
      ],
      g: ["generator", "getter", "global", "graph", "group", "guard"],
      h: [
        "handler",
        "handlerFunction",
        "hash",
        "hasher",
        "header",
        "height",
        "helper",
        "hook",
      ],
      i: [
        "id",
        "identifier",
        "index",
        "indexRef",
        "input",
        "instance",
        "intercept",
        "interval",
        "item",
        "iterator",
      ],
      j: ["json", "job", "join", "jquery", "jsonData", "jsonResponse"],
      k: ["key", "keyRef", "keyword", "kind"],
      l: [
        "label",
        "lambda",
        "last",
        "layout",
        "left",
        "length",
        "limit",
        "listener",
        "listRef",
        "loader",
        "local",
        "logger",
      ],
      m: [
        "map",
        "match",
        "matrix",
        "max",
        "member",
        "memo",
        "message",
        "method",
        "min",
        "model",
        "module",
        "modifier",
      ],
      n: [
        "name",
        "namespace",
        "navigator",
        "negotiator",
        "network",
        "next",
        "node",
        "nodeRef",
        "normalize",
        "notifier",
        "null",
        "number",
        "navigatorRef",
      ],
      o: [
        "object",
        "observer",
        "offset",
        "old",
        "onComplete",
        "onError",
        "onSuccess",
        "opacity",
        "operation",
        "option",
        "options",
        "order",
        "origin",
        "output",
        "overflow",
        "owner",
      ],
      p: [
        "package",
        "page",
        "pageRef",
        "palette",
        "param",
        "parameter",
        "parent",
        "parse",
        "part",
        "password",
        "path",
        "pattern",
        "payload",
        "pending",
        "percent",
        "position",
        "post",
        "previous",
        "primary",
        "printer",
        "priority",
        "processing",
        "producer",
        "product",
        "profile",
        "program",
        "project",
        "promise",
        "property",
        "prototype",
        "proxy",
        "publisher",
      ],
      q: ["query", "queryRef", "queue", "quota"],
      r: [
        "range",
        "rate",
        "ratio",
        "react",
        "reader",
        "receiver",
        "record",
        "rect",
        "reducer",
        "ref",
        "reference",
        "referrer",
        "refinery",
        "reflection",
        "region",
        "register",
        "registry",
        "reject",
        "relation",
        "relative",
        "relay",
        "render",
        "renderer",
        "repository",
        "request",
        "required",
        "reserve",
        "resolver",
        "resource",
        "response",
        "result",
        "retriever",
        "return",
        "reverse",
        "review",
        "reward",
        "root",
        "router",
        "routine",
        "row",
        "rule",
      ],
      s: [
        "saga",
        "sample",
        "sandbox",
        "save",
        "scaler",
        "scene",
        "scope",
        "screen",
        "script",
        "scroll",
        "sealed",
        "search",
        "season",
        "secret",
        "section",
        "sector",
        "secure",
        "segment",
        "selector",
        "semaphore",
        "sender",
        "sense",
        "sensor",
        "sequence",
        "serial",
        "series",
        "server",
        "service",
        "session",
        "setter",
        "setting",
        "setup",
        "shard",
        "share",
        "sheet",
        "shell",
        "shield",
        "shortcut",
        "should",
        "show",
        "signal",
        "signer",
        "site",
        "size",
        "sketch",
        "slice",
        "slider",
        "slot",
        "snap",
        "snippet",
        "socket",
        "soft",
        "solver",
        "some",
        "sonar",
        "source",
        "space",
        "spare",
        "spark",
        "spawn",
        "speaker",
        "spec",
        "spectator",
        "speech",
        "speed",
        "spender",
        "sphere",
        "spider",
        "spinner",
        "spirit",
        "splitter",
        "sponsor",
        "spot",
        "spray",
        "sprinter",
        "squad",
        "stack",
        "staff",
        "stage",
        "stair",
        "stamp",
        "standard",
        "star",
        "starter",
        "state",
        "statement",
        "station",
        "status",
        "stay",
        "stealer",
        "step",
        "sticker",
        "stopper",
        "storage",
        "store",
        "story",
        "strainer",
        "stream",
        "street",
        "strength",
        "stress",
        "stretcher",
        "strict",
        "stride",
        "striker",
        "string",
        "strip",
        "strive",
        "stroke",
        "strong",
        "struct",
        "structure",
        "studio",
        "stump",
        "style",
        "subject",
        "submit",
        "subscriber",
        "subscription",
        "subtle",
        "subtractor",
        "suburb",
        "success",
        "successor",
        "sufferer",
        "summarizer",
        "summer",
        "summit",
        "sunglass",
        "supplier",
        "supply",
        "support",
        "supporter",
        "surface",
        "surfer",
        "surplus",
        "surprise",
        "surveyor",
        "suspect",
        "suspender",
        "sweeper",
        "swift",
        "swimmer",
        "swing",
        "switch",
        "sword",
        "symbol",
        "synthesizer",
      ],
      t: [
        "table",
        "tablet",
        "tag",
        "tagRef",
        "tail",
        "tale",
        "talker",
        "tall",
        "tanker",
        "target",
        "targetRef",
        "task",
        "taste",
        "taxi",
        "teacher",
        "team",
        "tear",
        "teaser",
        "tech",
        "technique",
        "technology",
        "teen",
        "telephone",
        "teller",
        "temp",
        "template",
        "temporary",
        "tender",
        "tennis",
        "terminal",
        "terminate",
        "territory",
        "test",
        "tester",
        "text",
        "texture",
        "thank",
        "theater",
        "theme",
        "theory",
        "therapist",
        "thief",
        "thing",
        "thinker",
        "third",
        "thorough",
        "thread",
        "threat",
        "threshold",
        "thrill",
        "thrower",
        "thumb",
        "thunder",
        "ticket",
        "tide",
        "tiger",
        "tightener",
        "timer",
        "timestamp",
        "tiny",
        "title",
        "toast",
        "toddler",
        "token",
        "tokenizer",
        "toll",
        "tonal",
        "tone",
        "toner",
        "tool",
        "toolkit",
        "tooth",
        "topic",
        "torch",
        "total",
        "toucher",
        "tour",
        "tourist",
        "towel",
        "tower",
        "town",
        "toxic",
        "tracker",
        "trade",
        "trader",
        "traffic",
        "train",
        "trainer",
        "trait",
        "tramp",
        "trance",
        "transfer",
        "transformer",
        "transit",
        "transport",
        "trap",
        "trapper",
        "trash",
        "traveler",
        "traversal",
        "traverser",
        "treasure",
        "treasurer",
        "tree",
        "trekker",
        "trend",
        "triangle",
        "tribe",
        "trick",
        "trip",
        "triple",
        "trooper",
        "trophy",
        "trouble",
        "troubleshooter",
        "trouper",
        "truck",
        "trumpeter",
        "trunk",
        "trust",
        "trustee",
        "truth",
        "try",
        "tuber",
        "tugboat",
        "tuner",
        "tunnel",
        "turbo",
        "turner",
        "turntable",
        "tutor",
        "tweed",
        "tweet",
        "twelve",
        "twenty",
        "twin",
        "twist",
        "twitter",
        "type",
        "typewriter",
      ],
      u: [
        "ul",
        "umbrella",
        "uncle",
        "under",
        "underscore",
        "undo",
        "unfolder",
        "unifier",
        "union",
        "unique",
        "unit",
        "universe",
        "university",
        "unknown",
        "unpacker",
        "updater",
        "upgrade",
        "uploader",
        "upper",
        "uppercase",
        "upright",
        "upstairs",
        "usher",
        "usual",
        "utterance",
      ],
      v: [
        "vacuum",
        "valid",
        "validator",
        "value",
        "valueObject",
        "variable",
        "variant",
        "variation",
        "variety",
        "various",
        "vary",
        "vase",
        "vault",
        "vector",
        "vegetable",
        "vehicle",
        "vein",
        "velvet",
        "vendor",
        "verb",
        "verdict",
        "version",
        "vertical",
        "very",
        "vessel",
        "vest",
        "veteran",
        "vibrator",
        "vice",
        "victim",
        "victor",
        "video",
        "view",
        "viewer",
        "village",
        "villain",
        "vine",
        "violin",
        "virtual",
        "virtue",
        "virus",
        "visibility",
        "visible",
        "vision",
        "visitor",
        "visual",
        "vital",
        "vitamin",
        "vivid",
        "vocal",
        "voice",
        "voicemail",
        "volcano",
        "volume",
        "volunteer",
        "voter",
        "voting",
        "vowel",
        "voyage",
      ],
      w: [
        "waiter",
        "waitress",
        "wake",
        "walker",
        "wall",
        "wallet",
        "walnut",
        "want",
        "war",
        "warden",
        "warehouse",
        "warrior",
        "washer",
        "waste",
        "watch",
        "watcher",
        "water",
        "wave",
        "weakness",
        "wealth",
        "weapon",
        "wear",
        "weasel",
        "weather",
        "weaver",
        "web",
        "website",
        "wedding",
        "weed",
        "week",
        "weekday",
        "weekend",
        "weigh",
        "weight",
        "weird",
        "welcome",
        "welfare",
        "well",
        "west",
        "western",
        "wetland",
        "whale",
        "wheat",
        "wheel",
        "wherever",
        "which",
        "while",
        "whisper",
        "whistle",
        "white",
        "whole",
        "wholesale",
        "whorl",
        "width",
        "wife",
        "wild",
        "wildlife",
        "will",
        "win",
        "wind",
        "window",
        "wine",
        "wing",
        "winner",
        "winter",
        "wire",
        "wisdom",
        "wise",
        "wish",
        "witch",
        "withdrawal",
        "witness",
        "wolf",
        "woman",
        "wonder",
        "wood",
        "woodland",
        "wool",
        "word",
        "worker",
        "workshop",
        "world",
        "worm",
        "worry",
        "worse",
        "worst",
        "worth",
        "worthy",
        "wrap",
        "wrapper",
        "wreck",
        "wrestler",
        "wrist",
        "writer",
        "wrong",
        "yacht",
        "yard",
        "yarn",
        "year",
        "yellow",
        "yes",
        "yesterday",
        "yet",
        "yield",
        "young",
        "younger",
        "youth",
        "zebra",
        "zero",
        "zest",
        "zinc",
        "zipper",
        "zodiac",
        "zone",
        "zoom",
      ],
    };

    // Two-letter combination mappings
    this.twoLetterMappings = {
      fn: ["function", "functionRef", "functionName"],
      cb: ["callback", "callbackFunction"],
      evt: ["event", "eventObject", "eventHandler"],
      req: ["request", "requestObject"],
      res: ["response", "responseObject"],
      err: ["error", "errorObject", "errorHandler"],
      val: ["value", "valueObject"],
      idx: ["index", "indexPosition"],
      acc: ["accumulator", "accumulatedValue"],
      elem: ["element", "elementRef"],
      prop: ["property", "propertyName"],
      attrs: ["attributes", "attributeMap"],
      config: ["configuration", "configObject"],
      opts: ["options", "optionsObject"],
      params: ["parameters", "parameterList"],
      args: ["arguments", "argumentList"],
      ret: ["return", "returnValue"],
      prev: ["previous", "previousValue"],
      curr: ["current", "currentValue"],
      next: ["next", "nextValue"],
      init: ["initialize", "initFunction"],
      dest: ["destination", "destinationObject"],
      src: ["source", "sourceObject"],
      dest: ["destination", "destinationObject"],
      obj: ["object", "genericObject"],
      arr: ["array", "arrayObject"],
      str: ["string", "stringValue"],
      num: ["number", "numericValue"],
      bool: ["boolean", "booleanValue"],
      func: ["function", "functionValue"],
      el: ["element", "elementRef"],
      doc: ["document", "documentRef"],
      win: ["window", "windowRef"],
      nav: ["navigator", "navigatorRef"],
      loc: ["location", "locationRef"],
      hist: ["history", "historyRef"],
      coord: ["coordinates", "coordinateObject"],
      pos: ["position", "positionObject"],
      size: ["size", "sizeObject"],
      rect: ["rectangle", "rectangleObject"],
      color: ["color", "colorValue"],
      style: ["style", "styleObject"],
      class: ["className", "classRef"],
      id: ["identifier", "idValue"],
      name: ["name", "nameValue"],
      type: ["type", "typeValue"],
      status: ["status", "statusCode"],
      code: ["code", "codeValue"],
      msg: ["message", "messageText"],
      desc: ["description", "descriptionText"],
      data: ["data", "dataObject"],
      body: ["body", "bodyContent"],
      header: ["header", "headerObject"],
      footer: ["footer", "footerContent"],
      title: ["title", "titleText"],
      icon: ["icon", "iconRef"],
      src: ["source", "sourceUrl"],
      alt: ["alternative", "alternativeText"],
      href: ["hyperlink", "hyperlinkUrl"],
      rel: ["relation", "relationType"],
      method: ["method", "httpMethod"],
      url: ["url", "urlValue"],
      path: ["path", "filePath"],
      query: ["query", "queryString"],
      param: ["parameter", "parameterValue"],
      cookie: ["cookie", "cookieObject"],
      token: ["token", "authenticationToken"],
      auth: ["auth", "authenticationObject"],
      user: ["user", "userObject"],
      role: ["role", "userRole"],
      perm: ["permission", "permissionList"],
      group: ["group", "userGroup"],
      admin: ["admin", "administrator"],
      root: ["root", "rootElement"],
      parent: ["parent", "parentElement"],
      child: ["child", "childElement"],
      sibling: ["sibling", "siblingElement"],
      scope: ["scope", "scopeObject"],
      ctx: ["context", "executionContext"],
      env: ["environment", "environmentObject"],
      prod: ["production", "productionConfig"],
      dev: ["development", "developmentConfig"],
      test: ["testing", "testConfig"],
      stage: ["stage", "stagingConfig"],
      logger: ["logger", "loggingService"],
      tracer: ["tracer", "tracingService"],
      monitor: ["monitor", "monitoringService"],
      cache: ["cache", "cacheStore"],
      store: ["store", "dataStore"],
      db: ["database", "databaseConnection"],
      conn: ["connection", "connectionObject"],
      query: ["query", "queryBuilder"],
      result: ["result", "queryResult"],
      row: ["row", "databaseRow"],
      col: ["column", "databaseColumn"],
      table: ["table", "databaseTable"],
      schema: ["schema", "databaseSchema"],
      model: ["model", "dataModel"],
      view: ["view", "databaseView"],
      proc: ["procedure", "storedProcedure"],
      trigger: ["trigger", "databaseTrigger"],
      index: ["index", "databaseIndex"],
      key: ["key", "primaryKey"],
      fk: ["foreignKey", "foreignKeyRef"],
      pk: ["primaryKey", "primaryKeyRef"],
    };

    // Framework-specific mappings
    this.frameworkMappings = {
      react: {
        s: "state",
        d: "dispatch",
        r: "reducer",
        e: "effect",
        c: "component",
        p: "props",
        ctx: "context",
        setS: "setState",
        useS: "useState",
        useE: "useEffect",
        useC: "useCallback",
        useM: "useMemo",
        useR: "useRef",
        useI: "useImperativeHandle",
        useL: "useLayoutEffect",
        useD: "useDebugValue",
      },
      vue: {
        d: "data",
        m: "methods",
        c: "computed",
        w: "watch",
        p: "props",
        em: "emits",
        refs: "ref",
        r: "reactive",
        computed: "computedValue",
        watch: "watcher",
        mounted: "onMounted",
        created: "onCreated",
      },
      angular: {
        el: "elementRef",
        cd: "changeDetector",
        zone: "ngZone",
        inj: "injector",
        route: "activatedRoute",
        router: "router",
        http: "httpClient",
        fb: "formBuilder",
        fc: "formControl",
      },
      node: {
        req: "request",
        res: "response",
        next: "nextFunction",
        app: "expressApp",
        router: "expressRouter",
        middleware: "middlewareFunction",
        err: "error",
        callback: "callbackFunction",
        promise: "promiseObject",
      },
      jquery: {
        $: "jqueryObject",
        el: "element",
        selector: "jquerySelector",
        handler: "eventHandler",
      },
    };

    // Semantic patterns for inference
    this.semanticPatterns = {
      event: /^(on|handle|addEvent|removeEvent|trigger|emit|listen|bound)/i,
      fetch: /^(get|post|put|delete|patch|fetch|load|retrieve|request)/i,
      save: /^(save|store|persist|write|set|update|put)/i,
      remove: /^(remove|delete|clear|destroy|erase|drop)/i,
      create: /^(create|new|make|build|construct|generate|produce)/i,
      find: /^(find|search|query|get|retrieve|fetch|locate)/i,
      render: /^(render|draw|paint|display|show|update|refresh)/i,
      validate: /^(validate|check|verify|test|ensure|is|has)/i,
      parse: /^(parse|decode|deserialize|read|extract)/i,
      format: /^(format|encode|serialize|write|stringify)/i,
      compute: /^(calculate|compute|evaluate|process|handle)/i,
      transform: /^(transform|convert|map|translate|convert)/i,
      toggle: /^(toggle|switch|flip|swap|change)/i,
      init: /^(init|initialize|setup|configure|boot|start)/i,
      cleanup: /^(cleanup|dispose|destroy|teardown|reset|clear)/i,
    };

    // Usage context patterns
    this.usagePatterns = {
      array: /\.(map|filter|reduce|forEach|find|some|every|sort)\(/,
      promise: /\.then|\.catch|\.finally|async\s+function/,
      callback: /\([^)]*\)\s*=>/,
      eventHandler: /addEventListener|onClick|onChange|onSubmit/,
      dom: /document\.|window\.|getElement|querySelector/,
      network: /fetch\(|axios\.|XMLHttpRequest/,
      storage: /localStorage|sessionStorage|cookies/,
      crypto: /crypto\.|Subtle\.|encrypt|decrypt/,
    };
  }

  /**
   * Main analysis method
   */
  analyze(code, context = {}) {
    this.context = context;
    this.stats = {
      variablesRenamed: 0,
      functionsRenamed: 0,
      propertiesRenamed: 0,
      suggestions: 0,
    };
    this.renames = new Map();
    this.scopeChain = [];

    const result = {
      agent: this.name,
      version: this.version,
      renames: [],
      suggestions: [],
      conflicts: [],
      statistics: {},
      warnings: [],
    };

    try {
      const ast = this.parseCode(code);

      // Build scope chain
      this.buildScopeChain(ast);

      // Analyze and rename variables
      this.analyzeVariables(ast, result, code);

      // Analyze and rename functions
      this.analyzeFunctions(ast, result, code);

      // Analyze and rename properties
      this.analyzeProperties(ast, result, code);

      // Generate suggestions
      this.generateSuggestions(result);

      // Calculate statistics
      result.statistics = this.calculateStatistics(result);
    } catch (error) {
      result.warnings.push(`Analysis error: ${error.message}`);
    }

    return result;
  }

  /**
   * Parse code into AST
   */
  parseCode(code) {
    return parse(code, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "classProperties"],
    });
  }

  /**
   * Build scope chain for context analysis
   */
  buildScopeChain(ast) {
    this.scopeChain = [];

    traverse(ast, {
      Program: {
        enter: (path) => {
          this.scopeChain.push({
            type: "global",
            bindings: new Map(),
          });
        },
      },
      FunctionDeclaration: {
        enter: (path) => {
          const scope = {
            type: "function",
            name: path.node.id?.name || "anonymous",
            bindings: new Map(),
          };

          path.get("params").forEach((param) => {
            if (param.isIdentifier()) {
              scope.bindings.set(param.node.name, {
                type: "param",
                node: param.node,
              });
            }
          });

          this.scopeChain.push(scope);
        },
        exit: () => {
          this.scopeChain.pop();
        },
      },
      ArrowFunctionExpression: {
        enter: (path) => {
          const parent = path.getFunctionParent();
          const name = parent?.node.id?.name || "arrow";

          this.scopeChain.push({
            type: "arrow",
            name,
            bindings: new Map(),
          });
        },
        exit: () => {
          this.scopeChain.pop();
        },
      },
      BlockStatement: {
        enter: (path) => {
          if (path.isFunctionBody()) return;

          this.scopeChain.push({
            type: "block",
            bindings: new Map(),
          });
        },
        exit: () => {
          const scope = this.scopeChain.pop();
          if (scope && this.scopeChain.length > 0) {
            const parent = this.scopeChain[this.scopeChain.length - 1];
            for (const [name, binding] of scope.bindings) {
              parent.bindings.set(name, binding);
            }
          }
        },
      },
    });
  }

  /**
   * Analyze and rename variables
   */
  analyzeVariables(ast, result, code) {
    const processedVars = new Set();

    traverse(ast, {
      VariableDeclarator: (path) => {
        const id = path.node.id;

        if (id.type === "Identifier") {
          const name = id.name;

          if (this.shouldRename(name) && !processedVars.has(name)) {
            processedVars.add(name);

            const suggestion = this.suggestVariableName(name, path, code);

            if (suggestion && suggestion !== name) {
              const rename = {
                type: "variable",
                original: name,
                suggested: suggestion,
                location: path.node.loc,
                reason: suggestion.reason,
                confidence: suggestion.confidence,
              };

              result.renames.push(rename);
              this.renames.set(name, suggestion.name);
              this.stats.variablesRenamed++;
            }
          }
        }

        // Handle destructuring
        if (id.type === "ObjectPattern") {
          id.properties.forEach((prop) => {
            if (prop.key && prop.key.type === "Identifier") {
              const name = prop.key.name;

              if (this.shouldRename(name) && !processedVars.has(name)) {
                processedVars.add(name);

                const suggestion = this.suggestPropertyName(name, prop, code);

                if (suggestion && suggestion !== name) {
                  result.renames.push({
                    type: "destructured",
                    original: name,
                    suggested: suggestion.name,
                    location: prop.loc,
                    reason: suggestion.reason,
                    confidence: suggestion.confidence,
                  });
                  this.stats.variablesRenamed++;
                }
              }
            }
          });
        }

        // Handle array destructuring
        if (id.type === "ArrayPattern") {
          id.elements.forEach((element, index) => {
            if (element && element.type === "Identifier") {
              const name = element.name;

              if (this.shouldRename(name) && !processedVars.has(name)) {
                processedVars.add(name);

                const suggestion = this.suggestArrayDestructuringName(
                  name,
                  index,
                  path,
                  code
                );

                if (suggestion) {
                  result.renames.push({
                    type: "arrayDestructured",
                    original: name,
                    suggested: suggestion.name,
                    location: element.loc,
                    reason: suggestion.reason,
                    confidence: suggestion.confidence,
                  });
                  this.stats.variablesRenamed++;
                }
              }
            }
          });
        }
      },
    });
  }

  /**
   * Analyze and rename functions
   */
  analyzeFunctions(ast, result, code) {
    const processedFuncs = new Set();

    traverse(ast, {
      FunctionDeclaration: (path) => {
        const name = path.node.id?.name;

        if (name && this.shouldRename(name) && !processedFuncs.has(name)) {
          processedFuncs.add(name);

          const suggestion = this.suggestFunctionName(name, path, code);

          if (suggestion && suggestion !== name) {
            result.renames.push({
              type: "function",
              original: name,
              suggested: suggestion.name,
              location: path.node.loc,
              reason: suggestion.reason,
              confidence: suggestion.confidence,
            });
            this.stats.functionsRenamed++;
          }
        }
      },

      FunctionExpression: (path) => {
        const parent = path.parent;

        if (parent.type === "VariableDeclarator" && parent.id) {
          const name = parent.id.name;

          if (name && this.shouldRename(name) && !processedFuncs.has(name)) {
            processedFuncs.add(name);

            const suggestion = this.suggestFunctionName(name, path, code);

            if (suggestion) {
              result.renames.push({
                type: "functionExpression",
                original: name,
                suggested: suggestion.name,
                location: path.node.loc,
                reason: suggestion.reason,
                confidence: suggestion.confidence,
              });
              this.stats.functionsRenamed++;
            }
          }
        }
      },

      ArrowFunctionExpression: (path) => {
        const parent = path.parent;

        if (parent.type === "VariableDeclarator" && parent.id) {
          const name = parent.id.name;

          if (name && this.shouldRename(name) && !processedFuncs.has(name)) {
            processedFuncs.add(name);

            const suggestion = this.suggestArrowFunctionName(name, path, code);

            if (suggestion) {
              result.renames.push({
                type: "arrowFunction",
                original: name,
                suggested: suggestion.name,
                location: path.node.loc,
                reason: suggestion.reason,
                confidence: suggestion.confidence,
              });
              this.stats.functionsRenamed++;
            }
          }
        }
      },
    });
  }

  /**
   * Analyze and rename properties
   */
  analyzeProperties(ast, result, code) {
    traverse(ast, {
      ObjectProperty: (path) => {
        const key = path.node.key;

        if (key.type === "Identifier" && !path.node.computed) {
          const name = key.name;

          if (this.shouldRename(name)) {
            const suggestion = this.suggestPropertyName(name, path, code);

            if (suggestion && suggestion !== name) {
              result.renames.push({
                type: "property",
                original: name,
                suggested: suggestion.name,
                location: path.node.loc,
                reason: suggestion.reason,
                confidence: suggestion.confidence,
              });
              this.stats.propertiesRenamed++;
            }
          }
        }
      },
    });
  }

  /**
   * Determine if a name should be renamed
   */
  shouldRename(name) {
    if (!name || name.length === 0) return false;
    if (name.length > 2) return false;
    if (/^[A-Z]/.test(name)) return false;
    if (/^[0-9]/.test(name)) return false;
    if (this.renames.has(name)) return false;

    return true;
  }

  /**
   * Suggest a meaningful variable name
   */
  suggestVariableName(name, path, code) {
    const framework = this.context.framework;

    // Check framework-specific mappings first
    if (framework && this.frameworkMappings[framework]) {
      const frameworkMap = this.frameworkMappings[framework];
      if (frameworkMap[name]) {
        return {
          name: frameworkMap[name],
          reason: `Framework-specific mapping (${framework})`,
          confidence: "high",
        };
      }
    }

    // Check letter mappings
    if (this.letterMappings[name]) {
      const suggestions = this.letterMappings[name];
      return {
        name: suggestions[0],
        reason: "Common single-letter mapping",
        confidence: "medium",
      };
    }

    // Check two-letter mappings
    if (this.twoLetterMappings[name]) {
      const suggestions = this.twoLetterMappings[name];
      return {
        name: suggestions[0],
        reason: "Two-letter combination mapping",
        confidence: "high",
      };
    }

    // Analyze usage context
    const contextAnalysis = this.analyzeUsageContext(name, path, code);
    if (contextAnalysis.suggestion) {
      this.stats.suggestions++;
      return {
        name: contextAnalysis.suggestion,
        reason: contextAnalysis.reason,
        confidence: "medium",
      };
    }

    return null;
  }

  /**
   * Suggest property name
   */
  suggestPropertyName(name, path, code) {
    // Check if it's a known pattern
    if (this.twoLetterMappings[name]) {
      return {
        name: this.twoLetterMappings[name][0],
        reason: "Known property name pattern",
        confidence: "high",
      };
    }

    // Analyze context
    const parent = path.parent;
    if (parent && parent.type === "ObjectExpression") {
      const index = parent.properties.indexOf(path.node);
      if (index > 0) {
        const prevProp = parent.properties[index - 1];
        if (prevProp && prevProp.key && prevProp.key.type === "Identifier") {
          const prevName = prevProp.key.name;
          if (this.renames.has(prevName)) {
            return {
              name: `related${this.capitalize(this.renames.get(prevName))}`,
              reason: "Related to previous property",
              confidence: "low",
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Suggest array destructuring name
   */
  suggestArrayDestructuringName(name, index, path, code) {
    const patterns = ["first", "second", "third", "fourth", "fifth"];

    if (index < patterns.length) {
      return {
        name: patterns[index],
        reason: `Position in array destructuring (index ${index})`,
        confidence: "medium",
      };
    }

    return { name: `item${index}`, reason: "Array element", confidence: "low" };
  }

  /**
   * Suggest function name
   */
  suggestFunctionName(name, path, code) {
    // Get function body for analysis
    const body = path.node.body;
    if (!body) return null;

    // Analyze function body
    const bodyCode = generate(body).code;

    // Check for semantic patterns
    for (const [pattern, matches] of Object.entries(this.semanticPatterns)) {
      if (matches.test(name)) {
        return {
          name: pattern + "Function",
          reason: `Semantic pattern detected: ${pattern}`,
          confidence: "high",
        };
      }
    }

    // Check for usage patterns
    if (this.usagePatterns.event.test(bodyCode)) {
      return {
        name: "handleEvent",
        reason: "Event handler pattern",
        confidence: "high",
      };
    }
    if (this.usagePatterns.fetch.test(bodyCode)) {
      return {
        name: "fetchData",
        reason: "Data fetching pattern",
        confidence: "high",
      };
    }
    if (this.usagePatterns.render.test(bodyCode)) {
      return {
        name: "renderComponent",
        reason: "Rendering pattern",
        confidence: "high",
      };
    }
    if (this.usagePatterns.validate.test(bodyCode)) {
      return {
        name: "validateInput",
        reason: "Validation pattern",
        confidence: "high",
      };
    }

    // Default function naming
    return {
      name: `handler${this.capitalize(name)}`,
      reason: "Generic function naming",
      confidence: "low",
    };
  }

  /**
   * Suggest arrow function name
   */
  suggestArrowFunctionName(name, path, code) {
    const parent = path.parent;

    // Check parent context
    if (parent && parent.type === "VariableDeclarator") {
      const init = parent.init;
      if (init && init.type === "ArrowFunctionExpression") {
        // Analyze return statement
        if (init.body && init.body.type === "BlockStatement") {
          const returnStmt = init.body.body.find(
            (s) => s.type === "ReturnStatement"
          );
          if (returnStmt && returnStmt.argument) {
            const argType = returnStmt.argument.type;
            if (argType === "ObjectExpression") {
              return {
                name: "getter",
                reason: "Returns object (getter)",
                confidence: "medium",
              };
            }
            if (argType === "ArrayExpression") {
              return {
                name: "selector",
                reason: "Returns array (selector)",
                confidence: "medium",
              };
            }
          }
        }

        // Analyze parameters
        if (init.params && init.params.length > 0) {
          const firstParam = init.params[0];
          if (firstParam && firstParam.name) {
            return {
              name: `process${this.capitalize(firstParam.name)}`,
              reason: "Parameter-based naming",
              confidence: "low",
            };
          }
        }
      }
    }

    return this.suggestFunctionName(name, path, code);
  }

  /**
   * Analyze usage context for naming
   */
  analyzeUsageContext(name, path, code) {
    let parent = path.parent;
    let suggestion = null;
    let reason = "";

    while (parent) {
      // Check parent node types
      if (parent.type === "CallExpression") {
        const callee = parent.callee;

        if (callee.type === "MemberExpression") {
          const methodName = callee.property?.name;

          if (methodName === "map") {
            suggestion = "mappedValue";
            reason = "Used in map() callback";
          } else if (methodName === "filter") {
            suggestion = "filteredValue";
            reason = "Used in filter() callback";
          } else if (methodName === "reduce") {
            suggestion = "accumulator";
            reason = "Used in reduce() callback";
          } else if (methodName === "forEach") {
            suggestion = "iteratedItem";
            reason = "Used in forEach() callback";
          } else if (methodName === "find") {
            suggestion = "foundItem";
            reason = "Used in find() callback";
          }

          if (suggestion) break;
        }

        if (callee.type === "Identifier" && callee.name === "setTimeout") {
          suggestion = "timeoutHandler";
          reason = "Used in setTimeout callback";
          break;
        }

        if (
          callee.type === "Identifier" &&
          callee.name === "addEventListener"
        ) {
          suggestion = "eventListener";
          reason = "Event listener callback";
          break;
        }
      }

      // Check for loop
      if (
        parent.type === "ForOfStatement" ||
        parent.type === "ForInStatement"
      ) {
        suggestion = "iteratedItem";
        reason = "Used in for...of/for...in loop";
        break;
      }

      // Check for condition
      if (
        parent.type === "IfStatement" ||
        parent.type === "ConditionalExpression"
      ) {
        suggestion = "conditionResult";
        reason = "Used in conditional";
        break;
      }

      // Move up the tree
      parent = parent.parent;
    }

    return { suggestion, reason };
  }

  /**
   * Generate additional suggestions
   */
  generateSuggestions(result) {
    // Generate suggestions for unprocessed short names
    const allIdentifiers = new Set();

    try {
      const ast = this.parseCode(this.context.originalCode || "");

      traverse(ast, {
        Identifier: (path) => {
          if (path.isBindingIdentifier()) {
            allIdentifiers.add(path.node.name);
          }
        },
      });
    } catch (e) {
      // Ignore parse errors
    }

    for (const name of allIdentifiers) {
      if (this.shouldRename(name) && !this.renames.has(name)) {
        const letter = name.charAt(0).toLowerCase();

        if (this.letterMappings[letter]) {
          result.suggestions.push({
            original: name,
            suggested: this.letterMappings[letter][0],
            reason: "Common letter mapping",
          });
        }
      }
    }
  }

  /**
   * Calculate final statistics
   */
  calculateStatistics(result) {
    return {
      totalRenames: result.renames.length,
      variables: this.stats.variablesRenamed,
      functions: this.stats.functionsRenamed,
      properties: this.stats.propertiesRenamed,
      suggestions: result.suggestions.length,
      highConfidence: result.renames.filter((r) => r.confidence === "high")
        .length,
      mediumConfidence: result.renames.filter((r) => r.confidence === "medium")
        .length,
      lowConfidence: result.renames.filter((r) => r.confidence === "low")
        .length,
    };
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    this.renames.clear();
    this.scopeChain = [];
  }
}

module.exports = RenamerAgent;
