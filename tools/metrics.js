/**
 * Metrics
 * Production-grade performance and usage metrics tracking
 * Version: 3.0.0
 */

class Metrics {
  constructor(options = {}) {
    this.name = "metrics";
    this.version = "3.0.0";

    this.options = {
      enabled: options.enabled !== false,
      interval: options.interval || 1000,
      maxTimers: options.maxTimers || 100,
      exportInterval: options.exportInterval || 60000,
    };

    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timers = new Map();
    this.startTimes = new Map();

    this.interval = null;
    this.exportInterval = null;

    // Auto-start if enabled
    if (this.options.enabled) {
      this.start();
    }
  }

  /**
   * Increment counter
   */
  increment(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    return this;
  }

  /**
   * Decrement counter
   */
  decrement(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current - value);
    return this;
  }

  /**
   * Set gauge value
   */
  gauge(name, value) {
    this.gauges.set(name, {
      value,
      timestamp: Date.now(),
    });
    return this;
  }

  /**
   * Record histogram value
   */
  histogram(name, value) {
    let hist = this.histograms.get(name);

    if (!hist) {
      hist = {
        count: 0,
        sum: 0,
        min: value,
        max: value,
        values: [],
        percentiles: {},
      };
      this.histograms.set(name, hist);
    }

    hist.count++;
    hist.sum += value;
    hist.min = Math.min(hist.min, value);
    hist.max = Math.max(hist.max, value);
    hist.values.push(value);

    // Keep only last 1000 values
    if (hist.values.length > 1000) {
      hist.values.shift();
    }

    // Calculate percentiles
    this.calculatePercentiles(name);

    return this;
  }

  /**
   * Calculate percentiles
   */
  calculatePercentiles(name) {
    const hist = this.histograms.get(name);
    if (!hist || hist.values.length < 10) return;

    const sorted = [...hist.values].sort((a, b) => a - b);

    const percentiles = [0.5, 0.75, 0.9, 0.95, 0.99];

    for (const p of percentiles) {
      const index = Math.floor(sorted.length * p);
      hist.percentiles[`p${p * 100}`] = sorted[index];
    }
  }

  /**
   * Start timer
   */
  startTimer(name) {
    this.startTimes.set(name, Date.now());
    return this;
  }

  /**
   * End timer and record
   */
  endTimer(name) {
    const start = this.startTimes.get(name);
    if (!start) return null;

    const duration = Date.now() - start;
    this.histogram(name, duration);
    this.startTimes.delete(name);

    return duration;
  }

  /**
   * Time a function
   */
  time(name, fn) {
    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  /**
   * Time async function
   */
  async timeAsync(name, fn) {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  /**
   * Get counter value
   */
  getCounter(name) {
    return this.counters.get(name) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name) {
    return this.gauges.get(name);
  }

  /**
   * Get histogram stats
   */
  getHistogram(name) {
    const hist = this.histograms.get(name);
    if (!hist) return null;

    return {
      count: hist.count,
      sum: hist.sum,
      min: hist.min,
      max: hist.max,
      avg: hist.count > 0 ? hist.sum / hist.count : 0,
      percentiles: hist.percentiles,
    };
  }

  /**
   * Get all metrics
   */
  getAll() {
    const metrics = {
      counters: {},
      gauges: {},
      histograms: {},
    };

    for (const [name, value] of this.counters) {
      metrics.counters[name] = value;
    }

    for (const [name, gauge] of this.gauges) {
      metrics.gauges[name] = gauge.value;
    }

    for (const [name] of this.histograms) {
      metrics.histograms[name] = this.getHistogram(name);
    }

    return metrics;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      memory: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
      },
      uptime: process.uptime(),
      pid: process.pid,
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    this.startTimes.clear();
  }

  /**
   * Reset specific metric
   */
  resetMetric(name) {
    this.counters.delete(name);
    this.gauges.delete(name);
    this.histograms.delete(name);
  }

  /**
   * Export metrics
   */
  export() {
    return {
      timestamp: Date.now(),
      metrics: this.getAll(),
      system: this.getSystemMetrics(),
    };
  }

  /**
   * Start metrics collection
   */
  start() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      // Collect system metrics
      const sys = this.getSystemMetrics();

      this.gauge("system.memory.heapUsed", sys.memory.heapUsed);
      this.gauge("system.memory.heapTotal", sys.memory.heapTotal);
      this.gauge("system.memory.rss", sys.memory.rss);
      this.gauge("system.uptime", sys.uptime);
    }, this.options.interval);

    // Export interval
    if (this.options.exportInterval) {
      this.exportInterval = setInterval(() => {
        this.emit("export", this.export());
      }, this.options.exportInterval);
    }
  }

  /**
   * Stop metrics collection
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.exportInterval) {
      clearInterval(this.exportInterval);
      this.exportInterval = null;
    }
  }

  /**
   * Get stats summary
   */
  getStats() {
    return {
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      activeTimers: this.startTimes.size,
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.stop();
    this.reset();
  }
}

// Add EventEmitter
const EventEmitter = require("events").EventEmitter;
Object.assign(Metrics.prototype, EventEmitter.prototype);

module.exports = Metrics;
