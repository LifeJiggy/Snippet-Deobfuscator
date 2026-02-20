const EventEmitter = require("events");

class TaskManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = "TaskManager";
    this.version = "3.0.0";
    this.tasks = new Map();
    this.scheduledTasks = new Map();
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    this.failedTasks = new Map();
    this.taskQueue = [];
    this.maxConcurrent = options.maxConcurrent || 5;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.statistics = {
      totalRegistered: 0,
      totalExecuted: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalRetries: 0,
      averageExecutionTime: 0,
      peakConcurrency: 0,
    };
    this._executionTimes = [];
    this._isProcessing = false;
    this._schedulerInterval = null;
  }

  register(name, taskFn, options = {}) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Task name must be a non-empty string");
    }
    if (typeof taskFn !== "function") {
      throw new Error("Task must be a function");
    }
    if (this.tasks.has(name)) {
      throw new Error(`Task "${name}" is already registered`);
    }
    const task = {
      name,
      fn: taskFn,
      priority: options.priority || 0,
      timeout: options.timeout || 30000,
      retries: options.retries ?? this.retryAttempts,
      dependencies: options.dependencies || [],
      description: options.description || "",
      metadata: options.metadata || {},
      createdAt: Date.now(),
      executions: 0,
      successes: 0,
      failures: 0,
    };
    this.tasks.set(name, task);
    this.statistics.totalRegistered++;
    this.emit("registered", { name, task });
    return this;
  }

  unregister(name) {
    if (!this.tasks.has(name)) {
      throw new Error(`Task "${name}" is not registered`);
    }
    if (this.runningTasks.has(name)) {
      throw new Error(`Cannot unregister running task "${name}"`);
    }
    this.tasks.delete(name);
    this.scheduledTasks.delete(name);
    this.emit("unregistered", { name });
    return this;
  }

  getTask(name) {
    if (!this.tasks.has(name)) {
      return null;
    }
    return { ...this.tasks.get(name) };
  }

  hasTask(name) {
    return this.tasks.has(name);
  }

  listTasks() {
    return Array.from(this.tasks.keys());
  }

  async run(name, ...args) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    const startTime = Date.now();
    const executionId = `${name}-${startTime}`;
    this.runningTasks.set(executionId, {
      name,
      startTime,
      args,
    });
    this._updatePeakConcurrency();
    this.emit("start", { name, executionId, args });
    let lastError = null;
    let attempts = 0;
    const maxAttempts = task.retries + 1;
    while (attempts < maxAttempts) {
      try {
        const result = await this._executeWithTimeout(task, args);
        const duration = Date.now() - startTime;
        this._recordSuccess(name, duration, executionId);
        return result;
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts < maxAttempts) {
          this.statistics.totalRetries++;
          this.emit("retry", { name, attempt: attempts, error });
          await this._delay(this.retryDelay * attempts);
        }
      }
    }
    const duration = Date.now() - startTime;
    this._recordFailure(name, duration, executionId, lastError);
    throw lastError;
  }

  async runAsync(name, ...args) {
    return this.run(name, ...args);
  }

  async runParallel(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error("Tasks must be an array");
    }
    const concurrency = options.concurrency || this.maxConcurrent;
    const results = new Map();
    const errors = new Map();
    const batches = this._createBatches(tasks, concurrency);
    for (const batch of batches) {
      const promises = batch.map(async ({ name, args = [] }) => {
        try {
          const result = await this.run(name, ...args);
          results.set(name, result);
        } catch (error) {
          errors.set(name, error);
          if (options.failFast) {
            throw error;
          }
        }
      });
      await Promise.all(promises);
    }
    return { results, errors };
  }

  async runSeries(tasks) {
    if (!Array.isArray(tasks)) {
      throw new Error("Tasks must be an array");
    }
    const results = new Map();
    const errors = new Map();
    for (const { name, args = [] } of tasks) {
      try {
        const result = await this.run(name, ...args);
        results.set(name, result);
      } catch (error) {
        errors.set(name, error);
      }
    }
    return { results, errors };
  }

  async runWithDependencies(name, ...args) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    const executionOrder = this._resolveDependencies(name);
    const results = new Map();
    for (const depName of executionOrder) {
      if (!results.has(depName)) {
        const result = await this.run(depName, ...args);
        results.set(depName, result);
      }
    }
    return results.get(name);
  }

  schedule(name, cronExpression, args = []) {
    if (!this.tasks.has(name)) {
      throw new Error(`Task "${name}" is not registered`);
    }
    const scheduleId = `${name}-schedule-${Date.now()}`;
    const parsedCron = this._parseCron(cronExpression);
    const scheduledTask = {
      id: scheduleId,
      name,
      cronExpression,
      parsedCron,
      args,
      nextRun: this._getNextRun(parsedCron),
      isActive: true,
      runs: 0,
      createdAt: Date.now(),
    };
    this.scheduledTasks.set(scheduleId, scheduledTask);
    this._startScheduler();
    this.emit("scheduled", { scheduleId, name, cronExpression });
    return scheduleId;
  }

  cancel(scheduleId) {
    if (!this.scheduledTasks.has(scheduleId)) {
      throw new Error(`Schedule "${scheduleId}" not found`);
    }
    const scheduled = this.scheduledTasks.get(scheduleId);
    scheduled.isActive = false;
    this.scheduledTasks.delete(scheduleId);
    this.emit("cancelled", { scheduleId });
    if (this.scheduledTasks.size === 0) {
      this._stopScheduler();
    }
    return true;
  }

  getScheduledTasks() {
    return Array.from(this.scheduledTasks.values());
  }

  getRunningTasks() {
    return Array.from(this.runningTasks.values());
  }

  getStatistics() {
    return { ...this.statistics };
  }

  getTaskStatistics(name) {
    const task = this.tasks.get(name);
    if (!task) {
      return null;
    }
    return {
      executions: task.executions,
      successes: task.successes,
      failures: task.failures,
      successRate:
        task.executions > 0
          ? ((task.successes / task.executions) * 100).toFixed(2)
          : 0,
    };
  }

  setMaxConcurrent(max) {
    if (typeof max !== "number" || max < 1) {
      throw new Error("Max concurrent must be a positive number");
    }
    this.maxConcurrent = max;
    return this;
  }

  setRetryOptions(attempts, delay) {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
    return this;
  }

  clearCompleted() {
    const count = this.completedTasks.size;
    this.completedTasks.clear();
    return count;
  }

  clearFailed() {
    const count = this.failedTasks.size;
    this.failedTasks.clear();
    return count;
  }

  pause(name) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    task.paused = true;
    this.emit("paused", { name });
    return this;
  }

  resume(name) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    task.paused = false;
    this.emit("resumed", { name });
    return this;
  }

  setPriority(name, priority) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    task.priority = priority;
    return this;
  }

  setDependencies(name, dependencies) {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task "${name}" is not registered`);
    }
    for (const dep of dependencies) {
      if (!this.tasks.has(dep)) {
        throw new Error(`Dependency "${dep}" is not registered`);
      }
    }
    task.dependencies = dependencies;
    return this;
  }

  validateDependencies(name, visited = new Set()) {
    const task = this.tasks.get(name);
    if (!task) {
      return { valid: false, error: `Task "${name}" not found` };
    }
    if (visited.has(name)) {
      return {
        valid: false,
        error: `Circular dependency detected at "${name}"`,
      };
    }
    visited.add(name);
    for (const dep of task.dependencies) {
      const result = this.validateDependencies(dep, visited);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }

  getExecutionOrder(name) {
    return this._resolveDependencies(name);
  }

  async _executeWithTimeout(task, args) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Task "${task.name}" timed out after ${task.timeout}ms`)
        );
      }, task.timeout);
      try {
        const result = await task.fn(...args);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  _recordSuccess(name, duration, executionId) {
    const task = this.tasks.get(name);
    task.executions++;
    task.successes++;
    this.runningTasks.delete(executionId);
    this.completedTasks.set(executionId, {
      name,
      duration,
      completedAt: Date.now(),
    });
    this.statistics.totalExecuted++;
    this.statistics.totalSucceeded++;
    this._executionTimes.push(duration);
    this._updateAverageExecutionTime();
    this.emit("complete", { name, duration, executionId });
  }

  _recordFailure(name, duration, executionId, error) {
    const task = this.tasks.get(name);
    task.executions++;
    task.failures++;
    this.runningTasks.delete(executionId);
    this.failedTasks.set(executionId, {
      name,
      duration,
      error,
      failedAt: Date.now(),
    });
    this.statistics.totalExecuted++;
    this.statistics.totalFailed++;
    this.emit("error", { name, error, duration, executionId });
  }

  _updatePeakConcurrency() {
    const current = this.runningTasks.size;
    if (current > this.statistics.peakConcurrency) {
      this.statistics.peakConcurrency = current;
    }
  }

  _updateAverageExecutionTime() {
    if (this._executionTimes.length > 100) {
      this._executionTimes = this._executionTimes.slice(-100);
    }
    const sum = this._executionTimes.reduce((a, b) => a + b, 0);
    this.statistics.averageExecutionTime = sum / this._executionTimes.length;
  }

  _resolveDependencies(name, visited = new Set(), order = []) {
    if (visited.has(name)) {
      throw new Error(`Circular dependency detected at "${name}"`);
    }
    visited.add(name);
    const task = this.tasks.get(name);
    if (task) {
      for (const dep of task.dependencies) {
        this._resolveDependencies(dep, visited, order);
      }
    }
    if (!order.includes(name)) {
      order.push(name);
    }
    return order;
  }

  _createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _parseCron(expression) {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error("Invalid cron expression");
    }
    return {
      minute: this._parseCronPart(parts[0], 0, 59),
      hour: this._parseCronPart(parts[1], 0, 23),
      dayOfMonth: this._parseCronPart(parts[2], 1, 31),
      month: this._parseCronPart(parts[3], 1, 12),
      dayOfWeek: this._parseCronPart(parts[4], 0, 6),
    };
  }

  _parseCronPart(part, min, max) {
    if (part === "*") {
      return { type: "all", values: this._range(min, max) };
    }
    if (part.includes("/")) {
      const [base, step] = part.split("/");
      const stepNum = parseInt(step, 10);
      let baseValues;
      if (base === "*") {
        baseValues = this._range(min, max);
      } else {
        baseValues = base.split(",").map((n) => parseInt(n, 10));
      }
      return {
        type: "step",
        values: baseValues.filter((_, i) => i % stepNum === 0),
      };
    }
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n, 10));
      return { type: "range", values: this._range(start, end) };
    }
    if (part.includes(",")) {
      const values = part.split(",").map((n) => parseInt(n, 10));
      return { type: "list", values };
    }
    return { type: "single", values: [parseInt(part, 10)] };
  }

  _range(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }

  _getNextRun(parsedCron) {
    const now = new Date();
    let next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    for (let i = 0; i < 366 * 24 * 60; i++) {
      next.setMinutes(next.getMinutes() + 1);
      if (this._matchesCron(next, parsedCron)) {
        return next;
      }
    }
    return null;
  }

  _matchesCron(date, parsedCron) {
    return (
      parsedCron.minute.values.includes(date.getMinutes()) &&
      parsedCron.hour.values.includes(date.getHours()) &&
      parsedCron.dayOfMonth.values.includes(date.getDate()) &&
      parsedCron.month.values.includes(date.getMonth() + 1) &&
      parsedCron.dayOfWeek.values.includes(date.getDay())
    );
  }

  _startScheduler() {
    if (this._schedulerInterval) return;
    this._schedulerInterval = setInterval(
      () => this._checkScheduledTasks(),
      60000
    );
  }

  _stopScheduler() {
    if (this._schedulerInterval) {
      clearInterval(this._schedulerInterval);
      this._schedulerInterval = null;
    }
  }

  async _checkScheduledTasks() {
    const now = new Date();
    for (const [id, scheduled] of this.scheduledTasks) {
      if (!scheduled.isActive) continue;
      if (scheduled.nextRun && scheduled.nextRun <= now) {
        try {
          await this.run(scheduled.name, ...scheduled.args);
          scheduled.runs++;
          scheduled.nextRun = this._getNextRun(scheduled.parsedCron);
          this.emit("scheduledRun", {
            id,
            name: scheduled.name,
            runs: scheduled.runs,
          });
        } catch (error) {
          this.emit("scheduledError", { id, name: scheduled.name, error });
        }
      }
    }
  }

  reset() {
    this.tasks.clear();
    this.scheduledTasks.clear();
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
    this.taskQueue = [];
    this._executionTimes = [];
    this.statistics = {
      totalRegistered: 0,
      totalExecuted: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalRetries: 0,
      averageExecutionTime: 0,
      peakConcurrency: 0,
    };
    this._stopScheduler();
    this.emit("reset");
    return this;
  }

  dispose() {
    this.reset();
    this.removeAllListeners();
    return this;
  }
}

module.exports = TaskManager;
