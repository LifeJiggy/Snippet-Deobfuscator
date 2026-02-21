/**
 * Proxy Function Removal Skill
 * Detects and eliminates wrapper/proxy functions in obfuscated JavaScript
 * Version: 3.0.0
 */

class ProxyFunctionSkill {
  constructor() {
    this.name = "proxy-function";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      proxiesDetected: 0,
      proxiesRemoved: 0,
      chainsResolved: 0,
      failures: 0,
    };
    this.patterns = this.initializePatterns();
  }

  execute(code, options = {}) {
    return this.analyze(code, options);
  }

  initializePatterns() {
    return {
      simpleProxy:
        /function\s+(\w+)\s*\(([^)]*)\)\s*\{\s*return\s+(\w+)\s*\(\s*\2\s*\)\s*;?\s*\}/g,
      callApplyProxy:
        /function\s+(\w+)\s*\([^)]*\)\s*\{\s*return\s+(\w+)\.(call|apply)\s*\(/g,
      propertyAccessor:
        /function\s+(\w+)\s*\((\w+)\)\s*\{\s*return\s+\2\.(\w+)\s*;?\s*\}/g,
      bindProxy: /var\s+(\w+)\s*=\s*(\w+)\.bind\s*\(/g,
    };
  }

  analyze(code, options = {}) {
    const result = {
      deobfuscated: code,
      proxies: [],
      chains: [],
      replacements: [],
      warnings: [],
      errors: [],
    };

    try {
      const functions = this.extractAllFunctions(code);
      const proxyMap = this.buildProxyMap(functions);
      const chains = this.detectProxyChains(proxyMap);

      result.chains = chains;
      this.stats.chainsResolved = chains.length;

      let workingCode = code;

      for (const chain of chains) {
        const simplified = this.simplifyChain(chain);
        if (simplified) {
          workingCode = this.applyChainSimplification(workingCode, simplified);
        }
      }

      const simpleProxies = this.detectSimpleProxies(workingCode);
      for (const proxy of simpleProxies) {
        const removed = this.removeProxy(workingCode, proxy);
        if (removed) {
          workingCode = removed.code;
          result.proxies.push(proxy);
          result.replacements.push(...removed.replacements);
          this.stats.proxiesRemoved++;
        }
      }

      const callApplyProxies = this.detectCallApplyProxies(workingCode);
      for (const proxy of callApplyProxies) {
        const removed = this.removeCallApplyProxy(workingCode, proxy);
        if (removed) {
          workingCode = removed.code;
          result.proxies.push(proxy);
          this.stats.proxiesRemoved++;
        }
      }

      const bindProxies = this.detectBindProxies(workingCode);
      for (const proxy of bindProxies) {
        const removed = this.removeBindProxy(workingCode, proxy);
        if (removed) {
          workingCode = removed.code;
          result.proxies.push(proxy);
          this.stats.proxiesRemoved++;
        }
      }

      workingCode = this.removeUnusedFunctions(workingCode, result.proxies);

      result.deobfuscated = workingCode;
    } catch (error) {
      result.errors.push(error.message);
      this.stats.failures++;
    }

    return result;
  }

  extractAllFunctions(code) {
    const functions = [];
    const funcPattern =
      /(?:function\s+(\w+)|(?:var|let|const)\s+(\w+)\s*=\s*function)\s*\(([^)]*)\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;

    let match;
    while ((match = funcPattern.exec(code)) !== null) {
      const name = match[1] || match[2];
      const params = match[3];
      const body = match[4];

      functions.push({
        name,
        params: params
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        body: body.trim(),
        full: match[0],
        index: match.index,
      });
    }

    return functions;
  }

  buildProxyMap(functions) {
    const proxyMap = new Map();

    for (const func of functions) {
      const proxyInfo = this.analyzeProxyFunction(func);
      if (proxyInfo) {
        proxyMap.set(func.name, proxyInfo);
        this.stats.proxiesDetected++;
      }
    }

    return proxyMap;
  }

  analyzeProxyFunction(func) {
    const body = func.body.trim();

    if (!body.startsWith("return ")) {
      return null;
    }

    const returnMatch = body.match(/^return\s+(.+);?$/);
    if (!returnMatch) {
      return null;
    }

    const returnValue = returnMatch[1].trim();

    const callMatch = returnValue.match(/^(\w+)\(([^)]*)\)$/);
    if (callMatch) {
      const targetFunc = callMatch[1];
      const args = callMatch[2];

      if (args === func.params.join(", ")) {
        return {
          type: "simple",
          target: targetFunc,
          params: func.params,
        };
      }

      return {
        type: "partial",
        target: targetFunc,
        args: args,
        params: func.params,
      };
    }

    const methodMatch = returnValue.match(/^(\w+)\.(call|apply)\(([^)]+)\)$/);
    if (methodMatch) {
      return {
        type: "callApply",
        target: methodMatch[1],
        method: methodMatch[2],
        args: methodMatch[3],
      };
    }

    const propMatch = returnValue.match(/^(\w+)\.(\w+)$/);
    if (propMatch && propMatch[1] === func.params[0]) {
      return {
        type: "propertyAccessor",
        object: propMatch[1],
        property: propMatch[2],
      };
    }

    return null;
  }

  detectProxyChains(proxyMap) {
    const chains = [];
    const visited = new Set();

    for (const [name, info] of proxyMap) {
      if (visited.has(name)) continue;

      const chain = this.traceChain(name, proxyMap, visited);
      if (chain.length > 1) {
        chains.push(chain);
      }
    }

    return chains;
  }

  traceChain(startName, proxyMap, visited) {
    const chain = [startName];
    let current = startName;
    visited.add(current);

    while (true) {
      const info = proxyMap.get(current);
      if (!info || info.type !== "simple") break;

      const target = info.target;
      if (visited.has(target)) break;

      if (proxyMap.has(target)) {
        chain.push(target);
        visited.add(target);
        current = target;
      } else {
        break;
      }
    }

    return chain;
  }

  simplifyChain(chain) {
    if (chain.length < 2) return null;

    return {
      proxies: chain.slice(0, -1),
      finalTarget: chain[chain.length - 1],
    };
  }

  applyChainSimplification(code, simplified) {
    let workingCode = code;

    for (const proxy of simplified.proxies) {
      const pattern = new RegExp(`\\b${proxy}\\b`, "g");
      workingCode = workingCode.replace(pattern, simplified.finalTarget);
    }

    return workingCode;
  }

  detectSimpleProxies(code) {
    const proxies = [];
    const pattern =
      /function\s+(\w+)\s*\(([^)]*)\)\s*\{\s*return\s+(\w+)\s*\(\s*\2\s*\)\s*;?\s*\}/g;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      proxies.push({
        name: match[1],
        params: match[2],
        target: match[3],
        full: match[0],
        type: "simple",
      });
    }

    return proxies;
  }

  detectCallApplyProxies(code) {
    const proxies = [];
    const pattern =
      /function\s+(\w+)\s*\(([^)]*)\)\s*\{\s*return\s+(\w+)\.(call|apply)\s*\(\s*this\s*,\s*([^)]+)\)\s*;?\s*\}/g;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      proxies.push({
        name: match[1],
        params: match[2],
        target: match[3],
        method: match[4],
        args: match[5],
        full: match[0],
        type: "callApply",
      });
    }

    return proxies;
  }

  detectBindProxies(code) {
    const proxies = [];
    const pattern = /var\s+(\w+)\s*=\s*(\w+)\.bind\s*\(\s*([^)]+)\s*\)\s*;?/g;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      proxies.push({
        name: match[1],
        target: match[2],
        context: match[3],
        full: match[0],
        type: "bind",
      });
    }

    return proxies;
  }

  removeProxy(code, proxy) {
    const result = {
      code,
      replacements: [],
    };

    let workingCode = code;
    const callPattern = new RegExp(`${proxy.name}\\s*\\(([^)]*)\\)`, "g");

    let match;
    while ((match = callPattern.exec(code)) !== null) {
      const fullCall = match[0];
      const args = match[1];

      const replacement = `${proxy.target}(${args})`;
      workingCode = workingCode.replace(fullCall, replacement);
      result.replacements.push({
        original: fullCall,
        replacement: replacement,
      });
    }

    const funcDefPattern = new RegExp(
      `function\\s+${proxy.name}\\s*\\([^)]*\\)\\s*\\{[^}]*return\\s+${proxy.target}\\s*\\([^)]*\\)[^}]*\\}`,
      "g"
    );
    workingCode = workingCode.replace(funcDefPattern, "");

    result.code = workingCode;
    return result;
  }

  removeCallApplyProxy(code, proxy) {
    let workingCode = code;

    if (proxy.args === "arguments") {
      const callPattern = new RegExp(`${proxy.name}\\s*\\(([^)]*)\\)`, "g");
      workingCode = workingCode.replace(callPattern, `${proxy.target}($1)`);
    }

    const funcDefPattern = new RegExp(
      `function\\s+${proxy.name}\\s*\\([^)]*\\)\\s*\\{[^}]*return\\s+${proxy.target}\\.(call|apply)\\s*\\([^)]+\\)[^}]*\\}`,
      "g"
    );
    workingCode = workingCode.replace(funcDefPattern, "");

    return { code: workingCode };
  }

  removeBindProxy(code, proxy) {
    let workingCode = code;

    const callPattern = new RegExp(`${proxy.name}\\s*\\(([^)]*)\\)`, "g");
    workingCode = workingCode.replace(
      callPattern,
      `${proxy.target}.call(${proxy.context}, $1)`
    );

    const bindPattern = new RegExp(
      `var\\s+${proxy.name}\\s*=\\s*${proxy.target}\\.bind\\s*\\([^)]+\\)\\s*;?`,
      "g"
    );
    workingCode = workingCode.replace(bindPattern, "");

    return { code: workingCode };
  }

  removeUnusedFunctions(code, proxies) {
    let workingCode = code;

    for (const proxy of proxies) {
      const usagePattern = new RegExp(`\\b${proxy.name}\\s*\\(`, "g");
      if (!usagePattern.test(workingCode.replace(proxy.full, ""))) {
        workingCode = workingCode.replace(proxy.full, "");
      }
    }

    return workingCode;
  }

  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.proxiesDetected > 0
          ? (
              (this.stats.proxiesRemoved / this.stats.proxiesDetected) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.patterns = {};
  }
}

module.exports = ProxyFunctionSkill;
