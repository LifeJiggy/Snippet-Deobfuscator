class AsyncUtils {
  constructor(options = {}) {
    this.name = "AsyncUtils";
    this.version = "3.0.0";
    this.options = {
      concurrency: options.concurrency || 10,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
    };
    this.statistics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      retries: 0,
      timeouts: 0,
    };
  }

  async parallel(tasks, options = {}) {
    this.statistics.totalTasks += tasks.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const results = [];
    const errors = [];
    const executing = new Set();
    let index = 0;
    const runTask = async (task, i) => {
      try {
        const result = await this._executeTask(task, options);
        results[i] = { status: "fulfilled", value: result };
        this.statistics.completedTasks++;
      } catch (error) {
        results[i] = { status: "rejected", reason: error };
        errors.push({ index: i, error });
        this.statistics.failedTasks++;
      }
    };
    while (index < tasks.length) {
      while (executing.size < concurrency && index < tasks.length) {
        const taskIndex = index;
        const task = tasks[taskIndex];
        const promise = runTask(task, taskIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    if (options.failFast && errors.length > 0) {
      throw new AggregateError(
        errors.map((e) => e.error),
        "Tasks failed"
      );
    }
    return results;
  }

  async series(tasks, options = {}) {
    this.statistics.totalTasks += tasks.length;
    const results = [];
    for (let i = 0; i < tasks.length; i++) {
      try {
        const result = await this._executeTask(tasks[i], options);
        results[i] = { status: "fulfilled", value: result };
        this.statistics.completedTasks++;
      } catch (error) {
        results[i] = { status: "rejected", reason: error };
        this.statistics.failedTasks++;
        if (options.failFast !== false) {
          throw error;
        }
      }
    }
    return results;
  }

  async each(items, iterator, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const executing = new Set();
    let index = 0;
    const runItem = async (item, i) => {
      try {
        await iterator(item, i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runItem(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return items;
  }

  async eachSeries(items, iterator, options = {}) {
    this.statistics.totalTasks += items.length;
    for (let i = 0; i < items.length; i++) {
      try {
        await iterator(items[i], i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        if (options.failFast !== false) {
          throw error;
        }
      }
    }
    return items;
  }

  async map(items, mapper, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const results = new Array(items.length);
    const executing = new Set();
    let index = 0;
    const runMap = async (item, i) => {
      try {
        results[i] = await mapper(item, i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runMap(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return results;
  }

  async mapSeries(items, mapper, options = {}) {
    this.statistics.totalTasks += items.length;
    const results = [];
    for (let i = 0; i < items.length; i++) {
      try {
        results[i] = await mapper(items[i], i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        if (options.failFast !== false) {
          throw error;
        }
      }
    }
    return results;
  }

  async filter(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const results = [];
    const executing = new Set();
    let index = 0;
    const runFilter = async (item, i) => {
      try {
        const passes = await predicate(item, i, items);
        if (passes) {
          results.push(item);
        }
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runFilter(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return results;
  }

  async filterSeries(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    const results = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const passes = await predicate(items[i], i, items);
        if (passes) {
          results.push(items[i]);
        }
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        if (options.failFast !== false) {
          throw error;
        }
      }
    }
    return results;
  }

  async reduce(items, reducer, initialValue, options = {}) {
    this.statistics.totalTasks += items.length;
    let accumulator = initialValue;
    for (let i = 0; i < items.length; i++) {
      try {
        accumulator = await reducer(accumulator, items[i], i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return accumulator;
  }

  async reduceRight(items, reducer, initialValue, options = {}) {
    this.statistics.totalTasks += items.length;
    let accumulator = initialValue;
    for (let i = items.length - 1; i >= 0; i--) {
      try {
        accumulator = await reducer(accumulator, items[i], i, items);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return accumulator;
  }

  async find(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const executing = new Set();
    let index = 0;
    let result = undefined;
    const runFind = async (item, i) => {
      try {
        const matches = await predicate(item, i, items);
        if (matches && result === undefined) {
          result = item;
        }
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length && result === undefined) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runFind(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return result;
  }

  async findSeries(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    for (let i = 0; i < items.length; i++) {
      try {
        const matches = await predicate(items[i], i, items);
        this.statistics.completedTasks++;
        if (matches) {
          return items[i];
        }
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return undefined;
  }

  async some(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const executing = new Set();
    let index = 0;
    let found = false;
    const runSome = async (item, i) => {
      try {
        const matches = await predicate(item, i, items);
        if (matches) {
          found = true;
        }
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length && !found) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runSome(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return found;
  }

  async every(items, predicate, options = {}) {
    this.statistics.totalTasks += items.length;
    const concurrency = options.concurrency || this.options.concurrency;
    const executing = new Set();
    let index = 0;
    let allMatch = true;
    const runEvery = async (item, i) => {
      try {
        const matches = await predicate(item, i, items);
        if (!matches) {
          allMatch = false;
        }
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    };
    while (index < items.length && allMatch) {
      while (executing.size < concurrency && index < items.length) {
        const itemIndex = index;
        const promise = runEvery(items[itemIndex], itemIndex);
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
        index++;
      }
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return allMatch;
  }

  async retry(fn, options = {}) {
    const attempts = options.attempts || this.options.retryAttempts;
    const delay = options.delay || this.options.retryDelay;
    const backoff = options.backoff || 1;
    let lastError;
    let currentDelay = delay;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn(i);
      } catch (error) {
        lastError = error;
        this.statistics.retries++;
        if (i < attempts - 1) {
          await this.delay(currentDelay);
          currentDelay =
            typeof backoff === "function"
              ? backoff(currentDelay)
              : currentDelay * backoff;
        }
      }
    }
    throw lastError;
  }

  async timeout(promise, ms, message) {
    const timeoutMs = ms || this.options.timeout;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        this.statistics.timeouts++;
        reject(
          new Error(message || `Operation timed out after ${timeoutMs}ms`)
        );
      }, timeoutMs);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async delay(ms, value) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(value), ms);
    });
  }

  async delayReject(ms, error) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(error), ms);
    });
  }

  async race(promises) {
    this.statistics.totalTasks += promises.length;
    try {
      const result = await Promise.race(promises);
      this.statistics.completedTasks++;
      return result;
    } catch (error) {
      this.statistics.failedTasks++;
      throw error;
    }
  }

  async all(promises) {
    this.statistics.totalTasks += promises.length;
    try {
      const results = await Promise.all(promises);
      this.statistics.completedTasks += promises.length;
      return results;
    } catch (error) {
      this.statistics.failedTasks++;
      throw error;
    }
  }

  async allSettled(promises) {
    this.statistics.totalTasks += promises.length;
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === "fulfilled") {
        this.statistics.completedTasks++;
      } else {
        this.statistics.failedTasks++;
      }
    }
    return results;
  }

  async any(promises) {
    this.statistics.totalTasks += promises.length;
    try {
      const result = await Promise.any(promises);
      this.statistics.completedTasks++;
      return result;
    } catch (error) {
      this.statistics.failedTasks += promises.length;
      throw error;
    }
  }

  async waterfall(tasks, initial) {
    this.statistics.totalTasks += tasks.length;
    let result = initial;
    for (let i = 0; i < tasks.length; i++) {
      try {
        result = await tasks[i](result);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return result;
  }

  async whilst(test, fn) {
    this.statistics.totalTasks++;
    const results = [];
    while (await test()) {
      try {
        results.push(await fn());
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return results;
  }

  async until(test, fn) {
    this.statistics.totalTasks++;
    const results = [];
    while (!(await test())) {
      try {
        results.push(await fn());
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
    return results;
  }

  async forever(fn) {
    while (true) {
      try {
        await fn();
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        throw error;
      }
    }
  }

  async cargo(tasks, processor, options = {}) {
    const concurrency = options.concurrency || this.options.concurrency;
    const results = [];
    const queue = [...tasks];
    const executing = new Set();
    while (queue.length > 0 || executing.size > 0) {
      while (executing.size < concurrency && queue.length > 0) {
        const task = queue.shift();
        const promise = processor(task)
          .then((result) => {
            results.push(result);
            this.statistics.completedTasks++;
          })
          .catch((error) => {
            this.statistics.failedTasks++;
            throw error;
          });
        executing.add(promise);
        promise.finally(() => executing.delete(promise));
      }
      if (executing.size > 0) {
        await Promise.race(executing);
      }
    }
    this.statistics.totalTasks += tasks.length;
    return results;
  }

  async queue(tasks, processor, options = {}) {
    const concurrency = options.concurrency || this.options.concurrency;
    const results = [];
    const queue = [...tasks];
    const executing = new Map();
    const runNext = async () => {
      if (queue.length === 0) return;
      const task = queue.shift();
      const id = Symbol();
      try {
        const result = await processor(task);
        results.push(result);
        this.statistics.completedTasks++;
      } catch (error) {
        this.statistics.failedTasks++;
        if (options.failFast) {
          throw error;
        }
      } finally {
        executing.delete(id);
        if (queue.length > 0 && executing.size < concurrency) {
          executing.set(id, runNext());
        }
      }
    };
    this.statistics.totalTasks += tasks.length;
    const initial = Math.min(concurrency, tasks.length);
    for (let i = 0; i < initial; i++) {
      const id = Symbol();
      executing.set(id, runNext());
    }
    await Promise.all(executing.values());
    return results;
  }

  memoize(fn, options = {}) {
    const cache = new Map();
    const pending = new Map();
    const self = this;
    return async function (...args) {
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      if (pending.has(key)) {
        return pending.get(key);
      }
      const promise = (async () => {
        try {
          const result = await fn.apply(this, args);
          cache.set(key, result);
          if (options.ttl) {
            setTimeout(() => cache.delete(key), options.ttl);
          }
          return result;
        } finally {
          pending.delete(key);
        }
      })();
      pending.set(key, promise);
      return promise;
    };
  }

  debounce(fn, delay) {
    let timeoutId = null;
    let lastArgs = null;
    return async function (...args) {
      lastArgs = args;
      clearTimeout(timeoutId);
      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await fn.apply(this, lastArgs);
          resolve(result);
        }, delay);
      });
    };
  }

  throttle(fn, limit) {
    let inThrottle = false;
    let lastResult;
    return async function (...args) {
      if (!inThrottle) {
        inThrottle = true;
        try {
          lastResult = await fn.apply(this, args);
        } finally {
          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      }
      return lastResult;
    };
  }

  async _executeTask(task, options) {
    const fn = typeof task === "function" ? task : task.fn || task.run;
    const args = task.args || [];
    const timeout = options.timeout || this.options.timeout;
    if (timeout) {
      return this.timeout(fn(...args), timeout);
    }
    return fn(...args);
  }

  getStatistics() {
    return { ...this.statistics };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.statistics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      retries: 0,
      timeouts: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = AsyncUtils;
