/**
 * Tools Index
 * Main export point for all tool modules
 * Version: 3.0.0
 */

const ConfigManager = require("./config.js");
const Logger = require("./logger.js");
const Cache = require("./cache.js");
const Parser = require("./parser.js");
const Metrics = require("./metrics.js");
const Validator = require("./validators.js");
const Analyzer = require("./analyzer.js");
const Transformer = require("./transformer.js");
const Generator = require("./generator.js");
const Resolver = require("./resolver.js");
const Differ = require("./diff.js");
const Formatter = require("./formatter.js");

const toolsRegistry = {
  config: ConfigManager,
  logger: Logger,
  cache: Cache,
  parser: Parser,
  metrics: Metrics,
  validator: Validator,
  analyzer: Analyzer,
  transformer: Transformer,
  generator: Generator,
  resolver: Resolver,
  differ: Differ,
  formatter: Formatter,
};

function getTool(name) {
  return toolsRegistry[name.toLowerCase()] || null;
}

function getToolNames() {
  return Object.keys(toolsRegistry);
}

function createTool(name, options = {}) {
  const ToolClass = getTool(name);
  if (!ToolClass) {
    return null;
  }
  return new ToolClass(options);
}

function initializeTools(options = {}) {
  const tools = {};
  for (const [name, ToolClass] of Object.entries(toolsRegistry)) {
    tools[name] = new ToolClass(options[name] || {});
  }
  return tools;
}

function configureTools(config = {}) {
  for (const [name, options] of Object.entries(config)) {
    const tool = getTool(name);
    if (tool && tool.configure) {
      tool.configure(options);
    }
  }
}

function disposeTools(tools) {
  for (const tool of Object.values(tools)) {
    if (tool.dispose) {
      tool.dispose();
    }
  }
}

function resetTools(tools) {
  for (const tool of Object.values(tools)) {
    if (tool.reset) {
      tool.reset();
    }
  }
}

function getToolStatistics(tools) {
  const stats = {};
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.getStatistics) {
      stats[name] = tool.getStatistics();
    }
  }
  return stats;
}

module.exports = {
  ConfigManager,
  Logger,
  Cache,
  Parser,
  Metrics,
  Validator,
  Analyzer,
  Transformer,
  Generator,
  Resolver,
  Differ,
  Formatter,

  getTool,
  getToolNames,
  createTool,

  initializeTools,
  configureTools,
  disposeTools,
  resetTools,
  getToolStatistics,

  toolsRegistry,
  VERSION: "3.0.0",
};
