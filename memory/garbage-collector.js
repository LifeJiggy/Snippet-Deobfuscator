class GarbageCollector {
  constructor(options = {}) {
    this.name = "GarbageCollector";
    this.version = "3.0.0";
    this.options = {
      interval: options.interval || 60000,
      strategy: options.strategy || "mark-sweep",
      threshold: options.threshold || 0.8,
      generations: options.generations || 3,
      enabled: options.enabled !== false,
    };
    this._heap = options.heap || null;
    this._roots = new Set();
    this._marked = new Set();
    this._generations = [];
    this._timer = null;
    this._running = false;
    this.statistics = {
      totalCollections: 0,
      totalMarked: 0,
      totalSwept: 0,
      totalReclaimed: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastCollection: null,
    };
    for (let i = 0; i < this.options.generations; i++) {
      this._generations.push(new Map());
    }
    if (this.options.enabled) {
      this.start();
    }
  }

  setHeap(heap) {
    this._heap = heap;
    return this;
  }

  addRoot(address) {
    this._roots.add(address);
    return this;
  }

  removeRoot(address) {
    this._roots.delete(address);
    return this;
  }

  getRoots() {
    return Array.from(this._roots);
  }

  addObject(address, options = {}) {
    const generation = options.generation || 0;
    if (generation < this._generations.length) {
      this._generations[generation].set(address, {
        address,
        references: options.references || [],
        size: options.size || 0,
        timestamp: Date.now(),
        promoted: 0,
      });
    }
    return this;
  }

  removeObject(address) {
    for (const gen of this._generations) {
      gen.delete(address);
    }
    return this;
  }

  start() {
    if (this._timer) return false;
    this._timer = setInterval(() => {
      if (this._heap) {
        const usage = this._heap.getUsage();
        if (usage.percentage >= this.options.threshold * 100) {
          this.collect();
        }
      }
    }, this.options.interval);
    this.options.enabled = true;
    return true;
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.options.enabled = false;
    return true;
  }

  collect(options = {}) {
    if (this._running) {
      return { status: "already-running" };
    }
    this._running = true;
    const startTime = Date.now();
    let result;
    switch (this.options.strategy) {
      case "mark-sweep":
        result = this._markSweep(options);
        break;
      case "copying":
        result = this._copyingCollector(options);
        break;
      case "generational":
        result = this._generationalCollector(options);
        break;
      default:
        result = this._markSweep(options);
    }
    const duration = Date.now() - startTime;
    this.statistics.totalCollections++;
    this.statistics.totalDuration += duration;
    this.statistics.averageDuration =
      this.statistics.totalDuration / this.statistics.totalCollections;
    this.statistics.lastCollection = new Date().toISOString();
    this._running = false;
    return { ...result, duration };
  }

  _markSweep(options) {
    this._marked.clear();
    const markStart = Date.now();
    for (const root of this._roots) {
      this._mark(root);
    }
    const markDuration = Date.now() - markStart;
    this.statistics.totalMarked = this._marked.size;
    const sweepStart = Date.now();
    const swept = this._sweep(options);
    const sweepDuration = Date.now() - sweepStart;
    this.statistics.totalSwept += swept.count;
    this.statistics.totalReclaimed += swept.reclaimed;
    return {
      strategy: "mark-sweep",
      marked: this._marked.size,
      swept: swept.count,
      reclaimed: swept.reclaimed,
      markDuration,
      sweepDuration,
    };
  }

  _mark(address) {
    if (this._marked.has(address)) return;
    this._marked.add(address);
    for (const gen of this._generations) {
      if (gen.has(address)) {
        const obj = gen.get(address);
        for (const ref of obj.references) {
          this._mark(ref);
        }
        break;
      }
    }
  }

  _sweep(options) {
    let count = 0;
    let reclaimed = 0;
    const toDelete = [];
    for (let i = 0; i < this._generations.length; i++) {
      for (const [address, obj] of this._generations[i]) {
        if (!this._marked.has(address)) {
          toDelete.push({ address, generation: i, size: obj.size });
        }
      }
    }
    for (const item of toDelete) {
      this._generations[item.generation].delete(item.address);
      if (this._heap && options.deallocate !== false) {
        try {
          this._heap.deallocate(item.address);
        } catch (e) {
          // Address may not exist in heap
        }
      }
      count++;
      reclaimed += item.size;
    }
    return { count, reclaimed };
  }

  _copyingCollector(options) {
    if (!this._heap) {
      return { strategy: "copying", error: "No heap available" };
    }
    const toSpace = new Map();
    const fromSpace = this._generations[0];
    let forwarded = 0;
    const forward = (address) => {
      if (toSpace.has(address)) {
        return address;
      }
      const obj = fromSpace.get(address);
      if (obj) {
        toSpace.set(address, { ...obj });
        forwarded++;
        for (const ref of obj.references) {
          forward(ref);
        }
      }
      return address;
    };
    for (const root of this._roots) {
      forward(root);
    }
    let reclaimed = 0;
    for (const [address, obj] of fromSpace) {
      if (!toSpace.has(address)) {
        reclaimed += obj.size;
        if (options.deallocate !== false) {
          try {
            this._heap.deallocate(address);
          } catch (e) {
            // Address may not exist
          }
        }
      }
    }
    this._generations[0] = toSpace;
    this.statistics.totalReclaimed += reclaimed;
    return {
      strategy: "copying",
      forwarded,
      reclaimed,
      remaining: toSpace.size,
    };
  }

  _generationalCollector(options) {
    const results = {
      strategy: "generational",
      generations: [],
      totalReclaimed: 0,
    };
    for (let i = 0; i < this._generations.length; i++) {
      const gen = this._generations[i];
      const genStart = Date.now();
      let reclaimed = 0;
      let promoted = 0;
      const toPromote = [];
      for (const [address, obj] of gen) {
        obj.promoted++;
        if (
          obj.promoted >= this.options.generations - 1 &&
          i < this._generations.length - 1
        ) {
          toPromote.push({ address, obj });
        }
      }
      for (const item of toPromote) {
        gen.delete(item.address);
        this._generations[i + 1].set(item.address, item.obj);
        promoted++;
      }
      const genDuration = Date.now() - genStart;
      results.generations.push({
        level: i,
        size: gen.size,
        promoted,
        duration: genDuration,
      });
    }
    const markSweepResult = this._markSweep(options);
    results.totalReclaimed = markSweepResult.reclaimed;
    this.statistics.totalReclaimed += results.totalReclaimed;
    return results;
  }

  promote(address) {
    for (let i = 0; i < this._generations.length - 1; i++) {
      if (this._generations[i].has(address)) {
        const obj = this._generations[i].get(address);
        this._generations[i].delete(address);
        this._generations[i + 1].set(address, obj);
        return true;
      }
    }
    return false;
  }

  getGeneration(address) {
    for (let i = 0; i < this._generations.length; i++) {
      if (this._generations[i].has(address)) {
        return i;
      }
    }
    return -1;
  }

  getObjects() {
    const objects = [];
    for (let i = 0; i < this._generations.length; i++) {
      for (const [address, obj] of this._generations[i]) {
        objects.push({ ...obj, generation: i });
      }
    }
    return objects;
  }

  isRunning() {
    return this._running;
  }

  isEnabled() {
    return this.options.enabled;
  }

  getStatistics() {
    return {
      ...this.statistics,
      roots: this._roots.size,
      generations: this._generations.map((g, i) => ({
        level: i,
        size: g.size,
      })),
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._marked.clear();
    this._roots.clear();
    for (let i = 0; i < this.options.generations; i++) {
      this._generations[i] = new Map();
    }
    this.statistics = {
      totalCollections: 0,
      totalMarked: 0,
      totalSwept: 0,
      totalReclaimed: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastCollection: null,
    };
    return this;
  }

  dispose() {
    this.stop();
    this.reset();
    this._heap = null;
    this.options = {};
    return this;
  }
}

module.exports = GarbageCollector;
