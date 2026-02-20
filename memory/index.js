const HeapMemory = require("./heap-memory");
const StackMemory = require("./stack-memory");
const MemoryPool = require("./memory-pool");
const GarbageCollector = require("./garbage-collector");
const MemoryMonitor = require("./memory-monitor");
const MemorySnapshot = require("./memory-snapshot");

class MemoryManager {
  constructor(options = {}) {
    this.name = "MemoryManager";
    this.version = "3.0.0";
    this.options = {
      maxHeapSize: options.maxHeapSize || 512 * 1024 * 1024,
      maxStackSize: options.maxStackSize || 8 * 1024 * 1024,
      gcEnabled: options.gcEnabled !== false,
      gcInterval: options.gcInterval || 60000,
      monitoringEnabled: options.monitoringEnabled !== false,
    };
    this._heap = null;
    this._stack = null;
    this._pool = null;
    this._gc = null;
    this._monitor = null;
    this._snapshots = new Map();
    this.statistics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      gcCycles: 0,
      peakUsage: 0,
      errors: 0,
    };
    this._initialize();
  }

  _initialize() {
    this._heap = new HeapMemory({
      maxSize: this.options.maxHeapSize,
    });
    this._stack = new StackMemory({
      maxSize: this.options.maxStackSize,
    });
    this._pool = new MemoryPool({
      initialSize: 10,
      chunkSize: 4096,
    });
    if (this.options.gcEnabled) {
      this._gc = new GarbageCollector({
        interval: this.options.gcInterval,
        heap: this._heap,
      });
    }
    if (this.options.monitoringEnabled) {
      this._monitor = new MemoryMonitor({
        interval: 5000,
      });
    }
  }

  allocate(size, options = {}) {
    this.statistics.totalAllocations++;
    const type = options.type || "heap";
    try {
      let result;
      switch (type) {
        case "heap":
          result = this._heap.allocate(size, options);
          break;
        case "stack":
          result = this._stack.allocate(size, options);
          break;
        case "pool":
          result = this._pool.allocate(size, options);
          break;
        default:
          throw new Error(`Unknown allocation type: ${type}`);
      }
      const currentUsage = this.getUsage();
      if (currentUsage.total > this.statistics.peakUsage) {
        this.statistics.peakUsage = currentUsage.total;
      }
      return result;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  deallocate(address, options = {}) {
    this.statistics.totalDeallocations++;
    const type = options.type || "heap";
    try {
      switch (type) {
        case "heap":
          return this._heap.deallocate(address);
        case "stack":
          return this._stack.pop();
        case "pool":
          return this._pool.release(address);
        default:
          throw new Error(`Unknown deallocation type: ${type}`);
      }
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  read(address, size, options = {}) {
    const type = options.type || "heap";
    switch (type) {
      case "heap":
        return this._heap.read(address, size);
      case "stack":
        return this._stack.read(address, size);
      case "pool":
        return this._pool.read(address, size);
      default:
        throw new Error(`Unknown memory type: ${type}`);
    }
  }

  write(address, data, options = {}) {
    const type = options.type || "heap";
    switch (type) {
      case "heap":
        return this._heap.write(address, data);
      case "stack":
        return this._stack.write(address, data);
      case "pool":
        return this._pool.write(address, data);
      default:
        throw new Error(`Unknown memory type: ${type}`);
    }
  }

  getHeap() {
    return this._heap;
  }

  getStack() {
    return this._stack;
  }

  getPool() {
    return this._pool;
  }

  getGC() {
    return this._gc;
  }

  getMonitor() {
    return this._monitor;
  }

  getUsage() {
    const heapUsage = this._heap
      ? this._heap.getUsage()
      : { used: 0, total: 0 };
    const stackUsage = this._stack
      ? this._stack.getUsage()
      : { used: 0, total: 0 };
    const poolUsage = this._pool
      ? this._pool.getUsage()
      : { used: 0, total: 0 };
    return {
      heap: heapUsage,
      stack: stackUsage,
      pool: poolUsage,
      total: heapUsage.used + stackUsage.used + poolUsage.used,
      maxTotal: heapUsage.total + stackUsage.total + poolUsage.total,
      percentage: (
        ((heapUsage.used + stackUsage.used + poolUsage.used) /
          (heapUsage.total + stackUsage.total + poolUsage.total)) *
        100
      ).toFixed(2),
    };
  }

  createSnapshot(name) {
    const snapshot = new MemorySnapshot({
      heap: this._heap,
      stack: this._stack,
      pool: this._pool,
    });
    const data = snapshot.capture();
    this._snapshots.set(name, {
      data,
      timestamp: Date.now(),
    });
    return data;
  }

  getSnapshot(name) {
    return this._snapshots.get(name);
  }

  compareSnapshots(name1, name2) {
    const snap1 = this._snapshots.get(name1);
    const snap2 = this._snapshots.get(name2);
    if (!snap1 || !snap2) {
      throw new Error("One or both snapshots not found");
    }
    const snapshot = new MemorySnapshot();
    return snapshot.compare(snap1.data, snap2.data);
  }

  deleteSnapshot(name) {
    return this._snapshots.delete(name);
  }

  listSnapshots() {
    const list = [];
    for (const [name, snap] of this._snapshots) {
      list.push({
        name,
        timestamp: snap.timestamp,
        date: new Date(snap.timestamp).toISOString(),
      });
    }
    return list;
  }

  runGC(options = {}) {
    if (!this._gc) {
      throw new Error("Garbage collector is not enabled");
    }
    const result = this._gc.collect(options);
    this.statistics.gcCycles++;
    return result;
  }

  compact() {
    if (this._heap) {
      this._heap.compact();
    }
    if (this._pool) {
      this._pool.defragment();
    }
    return true;
  }

  reset() {
    if (this._heap) this._heap.clear();
    if (this._stack) this._stack.clear();
    if (this._pool) this._pool.clear();
    if (this._gc) this._gc.reset();
    if (this._monitor) this._monitor.reset();
    this._snapshots.clear();
    this.statistics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      gcCycles: 0,
      peakUsage: 0,
      errors: 0,
    };
    return this;
  }

  getStatistics() {
    return {
      ...this.statistics,
      usage: this.getUsage(),
      heap: this._heap ? this._heap.getStatistics() : {},
      stack: this._stack ? this._stack.getStatistics() : {},
      pool: this._pool ? this._pool.getStatistics() : {},
      gc: this._gc ? this._gc.getStatistics() : {},
      snapshots: this._snapshots.size,
    };
  }

  dispose() {
    if (this._heap) this._heap.dispose();
    if (this._stack) this._stack.dispose();
    if (this._pool) this._pool.dispose();
    if (this._gc) this._gc.dispose();
    if (this._monitor) this._monitor.dispose();
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = MemoryManager;
module.exports.HeapMemory = HeapMemory;
module.exports.StackMemory = StackMemory;
module.exports.MemoryPool = MemoryPool;
module.exports.GarbageCollector = GarbageCollector;
module.exports.MemoryMonitor = MemoryMonitor;
module.exports.MemorySnapshot = MemorySnapshot;
