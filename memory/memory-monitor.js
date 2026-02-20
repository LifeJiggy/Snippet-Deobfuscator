class MemoryMonitor {
  constructor(options = {}) {
    this.name = "MemoryMonitor";
    this.version = "3.0.0";
    this.options = {
      interval: options.interval || 5000,
      historySize: options.historySize || 100,
      alertsEnabled: options.alertsEnabled !== false,
      warningThreshold: options.warningThreshold || 0.7,
      criticalThreshold: options.criticalThreshold || 0.9,
    };
    this._history = [];
    this._alerts = [];
    this._listeners = new Map();
    this._timer = null;
    this._running = false;
    this.statistics = {
      totalChecks: 0,
      warnings: 0,
      criticals: 0,
      peakHeapUsed: 0,
      peakHeapTotal: 0,
      peakRSS: 0,
    };
    if (options.autoStart !== false) {
      this.start();
    }
  }

  start() {
    if (this._running) return false;
    this._running = true;
    this._timer = setInterval(() => {
      this.check();
    }, this.options.interval);
    return true;
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
    return true;
  }

  check() {
    this.statistics.totalChecks++;
    const memory = this._getMemoryUsage();
    this._updateHistory(memory);
    this._checkThresholds(memory);
    this._emit("check", memory);
    return memory;
  }

  _getMemoryUsage() {
    const nodeMemory = process.memoryUsage();
    const memory = {
      timestamp: Date.now(),
      heapUsed: nodeMemory.heapUsed,
      heapTotal: nodeMemory.heapTotal,
      external: nodeMemory.external,
      rss: nodeMemory.rss,
      arrayBuffers: nodeMemory.arrayBuffers || 0,
      heapUsedMB: (nodeMemory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (nodeMemory.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (nodeMemory.rss / 1024 / 1024).toFixed(2),
      heapUsagePercentage: (
        (nodeMemory.heapUsed / nodeMemory.heapTotal) *
        100
      ).toFixed(2),
    };
    if (nodeMemory.heapUsed > this.statistics.peakHeapUsed) {
      this.statistics.peakHeapUsed = nodeMemory.heapUsed;
    }
    if (nodeMemory.heapTotal > this.statistics.peakHeapTotal) {
      this.statistics.peakHeapTotal = nodeMemory.heapTotal;
    }
    if (nodeMemory.rss > this.statistics.peakRSS) {
      this.statistics.peakRSS = nodeMemory.rss;
    }
    return memory;
  }

  _updateHistory(memory) {
    this._history.push(memory);
    if (this._history.length > this.options.historySize) {
      this._history.shift();
    }
  }

  _checkThresholds(memory) {
    const usage = memory.heapUsed / memory.heapTotal;
    if (usage >= this.options.criticalThreshold) {
      const alert = {
        type: "critical",
        level: "critical",
        usage: usage.toFixed(4),
        threshold: this.options.criticalThreshold,
        timestamp: Date.now(),
        message: `Critical memory usage: ${(usage * 100).toFixed(2)}%`,
        memory,
      };
      this._alerts.push(alert);
      this.statistics.criticals++;
      this._emit("critical", alert);
    } else if (usage >= this.options.warningThreshold) {
      const alert = {
        type: "warning",
        level: "warning",
        usage: usage.toFixed(4),
        threshold: this.options.warningThreshold,
        timestamp: Date.now(),
        message: `Warning: High memory usage: ${(usage * 100).toFixed(2)}%`,
        memory,
      };
      this._alerts.push(alert);
      this.statistics.warnings++;
      this._emit("warning", alert);
    }
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
    return () => {
      const listeners = this._listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  off(event, callback) {
    if (!this._listeners.has(event)) return;
    if (callback) {
      const listeners = this._listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this._listeners.delete(event);
    }
    return this;
  }

  _emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`MemoryMonitor listener error: ${error.message}`);
        }
      }
    }
  }

  getHistory(options = {}) {
    let history = [...this._history];
    if (options.limit) {
      history = history.slice(-options.limit);
    }
    if (options.since) {
      history = history.filter((h) => h.timestamp >= options.since);
    }
    return history;
  }

  getAlerts(options = {}) {
    let alerts = [...this._alerts];
    if (options.type) {
      alerts = alerts.filter((a) => a.type === options.type);
    }
    if (options.since) {
      alerts = alerts.filter((a) => a.timestamp >= options.since);
    }
    if (options.limit) {
      alerts = alerts.slice(-options.limit);
    }
    return alerts;
  }

  clearAlerts() {
    const count = this._alerts.length;
    this._alerts = [];
    return count;
  }

  getAverageUsage(options = {}) {
    const history = this.getHistory(options);
    if (history.length === 0) return null;
    const sum = history.reduce((acc, h) => acc + h.heapUsed, 0);
    return {
      averageHeapUsed: sum / history.length,
      averageHeapUsedMB: (sum / history.length / 1024 / 1024).toFixed(2),
      samples: history.length,
    };
  }

  getTrend(options = {}) {
    const history = this.getHistory(options);
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    const heapUsedDiff = last.heapUsed - first.heapUsed;
    const heapTotalDiff = last.heapTotal - first.heapTotal;
    const timeDiff = last.timestamp - first.timestamp;
    return {
      heapUsedDiff,
      heapTotalDiff,
      timeDiff,
      heapUsedTrend:
        heapUsedDiff > 0
          ? "increasing"
          : heapUsedDiff < 0
          ? "decreasing"
          : "stable",
      ratePerSecond: timeDiff > 0 ? heapUsedDiff / (timeDiff / 1000) : 0,
      ratePerSecondMB:
        timeDiff > 0
          ? (heapUsedDiff / (timeDiff / 1000) / 1024 / 1024).toFixed(4)
          : 0,
    };
  }

  getReport() {
    const current = this._getMemoryUsage();
    const average = this.getAverageUsage();
    const trend = this.getTrend();
    return {
      current,
      average,
      trend,
      statistics: this.getStatistics(),
      historySize: this._history.length,
      alertsCount: this._alerts.length,
    };
  }

  isRunning() {
    return this._running;
  }

  getStatistics() {
    return {
      ...this.statistics,
      peakHeapUsedMB: (this.statistics.peakHeapUsed / 1024 / 1024).toFixed(2),
      peakHeapTotalMB: (this.statistics.peakHeapTotal / 1024 / 1024).toFixed(2),
      peakRSSMB: (this.statistics.peakRSS / 1024 / 1024).toFixed(2),
      historySize: this._history.length,
      alertsSize: this._alerts.length,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._history = [];
    this._alerts = [];
    this.statistics = {
      totalChecks: 0,
      warnings: 0,
      criticals: 0,
      peakHeapUsed: 0,
      peakHeapTotal: 0,
      peakRSS: 0,
    };
    return this;
  }

  dispose() {
    this.stop();
    this.reset();
    this._listeners.clear();
    this.options = {};
    return this;
  }
}

module.exports = MemoryMonitor;
