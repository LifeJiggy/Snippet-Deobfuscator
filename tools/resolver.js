/**
 * Resolver Utilities
 * Production-grade module/dependency resolution utilities
 * Version: 3.0.0
 */
const path = require("path");
const fs = require("fs");

class Resolver {
  constructor(options = {}) {
    this.name = "resolver";
    this.version = "3.0.0";
    this.options = {
      extensions: options.extensions || [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
        ".json",
      ],
      alias: options.alias || {},
      modules: options.modules || ["node_modules"],
      mainFields: options.mainFields || ["module", "main"],
      conditions: options.conditions || ["import", "require", "default"],
      symlinks: options.symlinks !== false,
      cache: options.cache !== false,
    };
    this.stats = {
      resolved: 0,
      failed: 0,
      cached: 0,
      nodeModules: 0,
      local: 0,
      circular: 0,
    };
    this.cache = new Map();
    this.dependencyTree = new Map();
  }

  resolve(moduleName, fromPath) {
    try {
      const cacheKey = `${moduleName}:${fromPath}`;

      if (this.options.cache && this.cache.has(cacheKey)) {
        this.stats.cached++;
        return this.cache.get(cacheKey);
      }

      let resolved;

      if (this._isLocalPath(moduleName)) {
        resolved = this.resolveLocal(moduleName, fromPath);
        this.stats.local++;
      } else if (this._isNodeBuiltin(moduleName)) {
        resolved = {
          success: true,
          path: moduleName,
          type: "builtin",
          resolved: moduleName,
        };
      } else {
        resolved = this.resolveNodeModules(moduleName, fromPath);
        this.stats.nodeModules++;
      }

      if (resolved.success && this.options.cache) {
        this.cache.set(cacheKey, resolved);
      }

      this.stats.resolved++;
      return resolved;
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message, module: moduleName };
    }
  }

  resolveLocal(importPath, fromPath) {
    try {
      const dir = path.dirname(fromPath);
      let resolvedPath = path.resolve(dir, importPath);

      const result = this._resolveFile(resolvedPath);

      if (result) {
        return {
          success: true,
          path: result,
          type: "local",
          resolved: result,
          relative: path.relative(process.cwd(), result),
        };
      }

      for (const ext of this.options.extensions) {
        const withExt = resolvedPath + ext;
        const fileResult = this._resolveFile(withExt);
        if (fileResult) {
          return {
            success: true,
            path: fileResult,
            type: "local",
            resolved: fileResult,
            relative: path.relative(process.cwd(), fileResult),
          };
        }
      }

      const indexResult = this._resolveIndex(resolvedPath);
      if (indexResult) {
        return {
          success: true,
          path: indexResult,
          type: "local",
          resolved: indexResult,
          relative: path.relative(process.cwd(), indexResult),
        };
      }

      this.stats.failed++;
      return { success: false, error: "Local module not found", importPath };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message, importPath };
    }
  }

  resolveNodeModules(moduleName, fromPath) {
    try {
      const alias = this.options.alias[moduleName];
      if (alias) {
        moduleName = alias;
      }

      const startDir = fromPath ? path.dirname(fromPath) : process.cwd();
      const modulePath = this._findNodeModule(moduleName, startDir);

      if (modulePath) {
        return {
          success: true,
          path: modulePath,
          type: "node_modules",
          resolved: modulePath,
          name: moduleName,
        };
      }

      this.stats.failed++;
      return { success: false, error: "Module not found", module: moduleName };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message, module: moduleName };
    }
  }

  _findNodeModule(moduleName, startDir) {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      for (const modulesDir of this.options.modules) {
        const modulePath = path.join(currentDir, modulesDir, moduleName);

        const directFile = this._resolveFile(modulePath);
        if (directFile) {
          return directFile;
        }

        const packageJsonPath = path.join(modulePath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          const pkg = this._readPackageJson(packageJsonPath);
          if (pkg) {
            const entryPoint = this._findEntryPoint(pkg, modulePath);
            if (entryPoint) {
              return entryPoint;
            }
          }
        }

        const indexFile = this._resolveIndex(modulePath);
        if (indexFile) {
          return indexFile;
        }
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  _findEntryPoint(pkg, modulePath) {
    for (const field of this.options.mainFields) {
      const entry = pkg[field];
      if (entry) {
        const entryPath = path.join(modulePath, entry);
        const resolved = this._resolveFile(entryPath);
        if (resolved) {
          return resolved;
        }
      }
    }

    if (pkg.exports) {
      const exports = pkg.exports;
      for (const condition of this.options.conditions) {
        if (exports[condition]) {
          const entryPath = path.join(modulePath, exports[condition]);
          const resolved = this._resolveFile(entryPath);
          if (resolved) {
            return resolved;
          }
        }
      }

      if (exports["."]) {
        const dotExport = exports["."];
        for (const condition of this.options.conditions) {
          if (dotExport[condition]) {
            const entryPath = path.join(modulePath, dotExport[condition]);
            const resolved = this._resolveFile(entryPath);
            if (resolved) {
              return resolved;
            }
          }
        }
      }
    }

    return null;
  }

  _readPackageJson(packageJsonPath) {
    try {
      const content = fs.readFileSync(packageJsonPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  _resolveFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          if (this.options.symlinks) {
            return fs.realpathSync(filePath);
          }
          return filePath;
        }
      }

      for (const ext of this.options.extensions) {
        const withExt = filePath + ext;
        if (fs.existsSync(withExt)) {
          if (this.options.symlinks) {
            return fs.realpathSync(withExt);
          }
          return withExt;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  _resolveIndex(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        return null;
      }

      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return null;
      }

      for (const ext of this.options.extensions) {
        const indexPath = path.join(dirPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          if (this.options.symlinks) {
            return fs.realpathSync(indexPath);
          }
          return indexPath;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  _isLocalPath(importPath) {
    return (
      importPath.startsWith("./") ||
      importPath.startsWith("../") ||
      importPath.startsWith("/") ||
      importPath.startsWith(".\\") ||
      importPath.startsWith("..\\")
    );
  }

  _isNodeBuiltin(moduleName) {
    const builtins = [
      "assert",
      "buffer",
      "child_process",
      "cluster",
      "console",
      "constants",
      "crypto",
      "dgram",
      "dns",
      "domain",
      "events",
      "fs",
      "http",
      "https",
      "module",
      "net",
      "os",
      "path",
      "perf_hooks",
      "process",
      "punycode",
      "querystring",
      "readline",
      "repl",
      "stream",
      "string_decoder",
      "sys",
      "timers",
      "tls",
      "tty",
      "url",
      "util",
      "v8",
      "vm",
      "worker_threads",
      "zlib",
      "node:assert",
      "node:buffer",
      "node:child_process",
      "node:cluster",
      "node:console",
      "node:constants",
      "node:crypto",
      "node:dgram",
      "node:dns",
      "node:domain",
      "node:events",
      "node:fs",
      "node:http",
      "node:https",
      "node:module",
      "node:net",
      "node:os",
      "node:path",
      "node:perf_hooks",
      "node:process",
      "node:punycode",
      "node:querystring",
      "node:readline",
      "node:repl",
      "node:stream",
      "node:string_decoder",
      "node:sys",
      "node:timers",
      "node:tls",
      "node:tty",
      "node:url",
      "node:util",
      "node:v8",
      "node:vm",
      "node:worker_threads",
      "node:zlib",
    ];
    return builtins.includes(moduleName);
  }

  getDependencyTree(entry) {
    try {
      const tree = {
        entry,
        dependencies: [],
        depth: 0,
      };

      this.dependencyTree.set(entry, tree);
      this._buildDependencyTree(entry, tree, new Set(), 0);

      return {
        success: true,
        tree,
        flat: this._flattenTree(tree),
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _buildDependencyTree(filePath, parentNode, visited, depth) {
    if (visited.has(filePath) || depth > 10) {
      return;
    }

    visited.add(filePath);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const imports = this._extractImports(content);

      for (const imp of imports) {
        const resolved = this.resolve(imp.source, filePath);

        if (resolved.success && resolved.type !== "builtin") {
          const childNode = {
            module: imp.source,
            path: resolved.path,
            type: resolved.type,
            dependencies: [],
            depth: depth + 1,
          };

          parentNode.dependencies.push(childNode);

          if (!visited.has(resolved.path)) {
            this._buildDependencyTree(
              resolved.path,
              childNode,
              visited,
              depth + 1
            );
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  _extractImports(content) {
    const imports = [];
    const importRegex =
      /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({ source: match[1], type: "import" });
    }

    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({ source: match[1], type: "require" });
    }

    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push({ source: match[1], type: "dynamic" });
    }

    return imports;
  }

  _flattenTree(tree) {
    const flat = [];

    function traverse(node) {
      flat.push({
        module: node.module || node.entry,
        path: node.path,
        type: node.type,
        depth: node.depth,
      });

      for (const dep of node.dependencies || []) {
        traverse(dep);
      }
    }

    traverse(tree);
    return flat;
  }

  detectCircular(entry) {
    try {
      const circular = [];
      const visited = new Set();
      const stack = new Set();

      this._detectCircularDfs(entry, null, visited, stack, circular, []);

      this.stats.circular += circular.length;

      return {
        success: true,
        hasCircular: circular.length > 0,
        circular,
        count: circular.length,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _detectCircularDfs(filePath, fromPath, visited, stack, circular, path) {
    const resolved = this.resolve(filePath, fromPath);

    if (!resolved.success || resolved.type === "builtin") {
      return;
    }

    const resolvedPath = resolved.path;

    if (stack.has(resolvedPath)) {
      const cycleStart = path.indexOf(resolvedPath);
      if (cycleStart !== -1) {
        circular.push({
          path: [...path.slice(cycleStart), resolvedPath],
          entry: resolvedPath,
        });
      }
      return;
    }

    if (visited.has(resolvedPath)) {
      return;
    }

    visited.add(resolvedPath);
    stack.add(resolvedPath);
    path.push(resolvedPath);

    try {
      const content = fs.readFileSync(resolvedPath, "utf-8");
      const imports = this._extractImports(content);

      for (const imp of imports) {
        this._detectCircularDfs(
          imp.source,
          resolvedPath,
          visited,
          stack,
          circular,
          path
        );
      }
    } catch {
      // Skip unreadable files
    }

    stack.delete(resolvedPath);
    path.pop();
  }

  resolveAll(modules, fromPath) {
    const results = [];

    for (const moduleName of modules) {
      const resolved = this.resolve(moduleName, fromPath);
      results.push({
        module: moduleName,
        ...resolved,
      });
    }

    return {
      success: true,
      results,
      resolved: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  getModuleInfo(modulePath) {
    try {
      const resolved = this.resolve(modulePath, process.cwd());

      if (!resolved.success) {
        return resolved;
      }

      const packageJsonPath = this._findPackageJson(resolved.path);
      let pkg = null;

      if (packageJsonPath) {
        pkg = this._readPackageJson(packageJsonPath);
      }

      return {
        success: true,
        path: resolved.path,
        type: resolved.type,
        package: pkg,
        packagePath: packageJsonPath,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _findPackageJson(filePath) {
    let currentDir = path.dirname(filePath);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const packageJsonPath = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        return packageJsonPath;
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  clearCache() {
    this.cache.clear();
    this.dependencyTree.clear();
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      resolved: 0,
      failed: 0,
      cached: 0,
      nodeModules: 0,
      local: 0,
      circular: 0,
    };
    this.clearCache();
  }

  dispose() {
    this.reset();
  }
}

module.exports = Resolver;
