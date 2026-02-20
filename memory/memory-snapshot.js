class MemorySnapshot {
  constructor(options = {}) {
    this.name = "MemorySnapshot";
    this.version = "3.0.0";
    this.options = {
      includeData: options.includeData || false,
      maxDepth: options.maxDepth || 10,
    };
    this._heap = options.heap || null;
    this._stack = options.stack || null;
    this._pool = options.pool || null;
    this._snapshots = new Map();
    this.statistics = {
      totalSnapshots: 0,
      totalComparisons: 0,
      totalRestores: 0,
    };
  }

  setHeap(heap) {
    this._heap = heap;
    return this;
  }

  setStack(stack) {
    this._stack = stack;
    return this;
  }

  setPool(pool) {
    this._pool = pool;
    return this;
  }

  capture(options = {}) {
    this.statistics.totalSnapshots++;
    const snapshot = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      timestamp: Date.now(),
      process: this._captureProcessMemory(),
      heap: this._heap ? this._captureHeap(options) : null,
      stack: this._stack ? this._captureStack(options) : null,
      pool: this._pool ? this._capturePool(options) : null,
      metadata: options.metadata || {},
    };
    if (options.save !== false) {
      this._snapshots.set(snapshot.id, snapshot);
    }
    return snapshot;
  }

  _captureProcessMemory() {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
      arrayBuffers: mem.arrayBuffers || 0,
    };
  }

  _captureHeap(options) {
    if (!this._heap) return null;
    const stats = this._heap.getStatistics();
    const usage = this._heap.getUsage();
    const result = {
      usage,
      statistics: {
        totalAllocations: stats.totalAllocations,
        totalDeallocations: stats.totalDeallocations,
        totalBytesAllocated: stats.totalBytesAllocated,
        totalBytesFreed: stats.totalBytesFreed,
        fragmentation: stats.fragmentation,
      },
    };
    if (options.includeBlocks) {
      result.blocks = this._heap.getBlocks();
    }
    if (options.includeAllocated) {
      result.allocated = this._heap.getAllocatedBlocks();
    }
    if (options.includeFree) {
      result.free = this._heap.getFreeBlocks();
    }
    return result;
  }

  _captureStack(options) {
    if (!this._stack) return null;
    const stats = this._stack.getStatistics();
    const usage = this._stack.getUsage();
    const result = {
      usage,
      statistics: {
        totalPushes: stats.totalPushes,
        totalPops: stats.totalPops,
        currentDepth: stats.currentDepth,
        maxDepth: stats.maxDepth,
      },
    };
    if (options.includeFrames) {
      result.frames = this._stack.getFrames();
    }
    if (options.includeData) {
      result.data = this._stack.getData();
    }
    return result;
  }

  _capturePool(options) {
    if (!this._pool) return null;
    const stats = this._pool.getStatistics();
    const usage = this._pool.getUsage();
    const result = {
      usage,
      statistics: {
        totalAllocations: stats.totalAllocations,
        totalDeallocations: stats.totalDeallocations,
        chunksCreated: stats.chunksCreated,
        chunksReused: stats.chunksReused,
        peakUsage: stats.peakUsage,
      },
    };
    if (options.includeChunks) {
      result.chunks = this._pool.getChunks();
    }
    if (options.includeAllocations) {
      result.allocations = this._pool.getAllocations();
    }
    return result;
  }

  get(id) {
    return this._snapshots.get(id);
  }

  getAll() {
    return Array.from(this._snapshots.values());
  }

  delete(id) {
    return this._snapshots.delete(id);
  }

  clear() {
    this._snapshots.clear();
    return true;
  }

  compare(snapshot1, snapshot2, options = {}) {
    this.statistics.totalComparisons++;
    const s1 =
      typeof snapshot1 === "string"
        ? this._snapshots.get(snapshot1)
        : snapshot1;
    const s2 =
      typeof snapshot2 === "string"
        ? this._snapshots.get(snapshot2)
        : snapshot2;
    if (!s1 || !s2) {
      throw new Error("One or both snapshots not found");
    }
    const result = {
      snapshot1: { id: s1.id, timestamp: s1.timestamp },
      snapshot2: { id: s2.id, timestamp: s2.timestamp },
      timeDiff: s2.timestamp - s1.timestamp,
      process: this._compareProcessMemory(s1.process, s2.process),
      heap: s1.heap && s2.heap ? this._compareHeap(s1.heap, s2.heap) : null,
      stack:
        s1.stack && s2.stack ? this._compareStack(s1.stack, s2.stack) : null,
      pool: s1.pool && s2.pool ? this._comparePool(s1.pool, s2.pool) : null,
    };
    result.summary = this._generateSummary(result);
    return result;
  }

  _compareProcessMemory(p1, p2) {
    return {
      heapUsedDiff: p2.heapUsed - p1.heapUsed,
      heapTotalDiff: p2.heapTotal - p1.heapTotal,
      externalDiff: p2.external - p1.external,
      rssDiff: p2.rss - p1.rss,
      heapUsedPercentage: (
        ((p2.heapUsed - p1.heapUsed) / p1.heapUsed) *
        100
      ).toFixed(2),
      trend:
        p2.heapUsed > p1.heapUsed
          ? "increasing"
          : p2.heapUsed < p1.heapUsed
          ? "decreasing"
          : "stable",
    };
  }

  _compareHeap(h1, h2) {
    return {
      usageDiff: {
        used: h2.usage.used - h1.usage.used,
        free: h2.usage.free - h1.usage.free,
      },
      statsDiff: {
        allocations:
          (h2.statistics?.totalAllocations || 0) -
          (h1.statistics?.totalAllocations || 0),
        deallocations:
          (h2.statistics?.totalDeallocations || 0) -
          (h1.statistics?.totalDeallocations || 0),
      },
      fragmentationDiff:
        (h2.statistics?.fragmentation || 0) -
        (h1.statistics?.fragmentation || 0),
    };
  }

  _compareStack(s1, s2) {
    return {
      usageDiff: {
        used: s2.usage.used - s1.usage.used,
        free: s2.usage.free - s1.usage.free,
      },
      depthDiff:
        (s2.statistics?.currentDepth || 0) - (s1.statistics?.currentDepth || 0),
      pushesDiff:
        (s2.statistics?.totalPushes || 0) - (s1.statistics?.totalPushes || 0),
      popsDiff:
        (s2.statistics?.totalPops || 0) - (s1.statistics?.totalPops || 0),
    };
  }

  _comparePool(p1, p2) {
    return {
      usageDiff: {
        used: p2.usage.used - p1.usage.used,
        free: p2.usage.free - p1.usage.free,
      },
      chunksDiff:
        (p2.statistics?.totalChunks || 0) - (p1.statistics?.totalChunks || 0),
      allocationsDiff:
        (p2.statistics?.activeAllocations || 0) -
        (p1.statistics?.activeAllocations || 0),
    };
  }

  _generateSummary(result) {
    const lines = [];
    lines.push(`Time difference: ${result.timeDiff}ms`);
    if (result.process) {
      const heapDiffMB = (result.process.heapUsedDiff / 1024 / 1024).toFixed(2);
      lines.push(
        `Heap: ${heapDiffMB}MB (${result.process.heapUsedPercentage}% ${result.process.trend})`
      );
    }
    if (result.heap) {
      lines.push(`Heap usage diff: ${result.heap.usageDiff.used} bytes`);
    }
    if (result.stack) {
      lines.push(`Stack depth diff: ${result.stack.depthDiff}`);
    }
    return lines.join("\n");
  }

  restore(snapshotId, options = {}) {
    this.statistics.totalRestores++;
    const snapshot =
      typeof snapshotId === "string"
        ? this._snapshots.get(snapshotId)
        : snapshotId;
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }
    const results = {
      heap: null,
      stack: null,
      pool: null,
    };
    if (options.restoreHeap && this._heap && snapshot.heap) {
      this._heap.clear();
      results.heap = true;
    }
    if (options.restoreStack && this._stack && snapshot.stack) {
      this._stack.clear();
      results.stack = true;
    }
    if (options.restorePool && this._pool && snapshot.pool) {
      this._pool.clear();
      results.pool = true;
    }
    return results;
  }

  export(snapshotId) {
    const snapshot =
      typeof snapshotId === "string"
        ? this._snapshots.get(snapshotId)
        : snapshotId;
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }
    return JSON.stringify(snapshot, null, 2);
  }

  import(jsonString) {
    const snapshot = JSON.parse(jsonString);
    this._snapshots.set(snapshot.id, snapshot);
    this.statistics.totalSnapshots++;
    return snapshot;
  }

  exportAll() {
    const snapshots = this.getAll();
    return JSON.stringify(snapshots, null, 2);
  }

  importAll(jsonString) {
    const snapshots = JSON.parse(jsonString);
    for (const snapshot of snapshots) {
      this._snapshots.set(snapshot.id, snapshot);
      this.statistics.totalSnapshots++;
    }
    return snapshots.length;
  }

  getStatistics() {
    return {
      ...this.statistics,
      savedSnapshots: this._snapshots.size,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this._snapshots.clear();
    this.statistics = {
      totalSnapshots: 0,
      totalComparisons: 0,
      totalRestores: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this._heap = null;
    this._stack = null;
    this._pool = null;
    this.options = {};
    return this;
  }
}

module.exports = MemorySnapshot;
