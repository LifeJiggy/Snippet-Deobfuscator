class MemoryPool {
  constructor(options = {}) {
    this.name = "MemoryPool";
    this.version = "3.0.0";
    this.options = {
      initialSize: options.initialSize || 10,
      chunkSize: options.chunkSize || 4096,
      maxChunks: options.maxChunks || 1000,
      growthFactor: options.growthFactor || 2,
      enableReuse: options.enableReuse !== false,
    };
    this._chunks = [];
    this._freeChunks = [];
    this._allocatedChunks = new Map();
    this._nextChunkId = 0;
    this._totalSize = 0;
    this._usedSize = 0;
    this.statistics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      chunksCreated: 0,
      chunksReused: 0,
      peakUsage: 0,
      defragmentations: 0,
    };
    this._initialize();
  }

  _initialize() {
    for (let i = 0; i < this.options.initialSize; i++) {
      this._createChunk();
    }
  }

  _createChunk() {
    if (this._chunks.length >= this.options.maxChunks) {
      throw new Error(`Maximum chunks reached: ${this.options.maxChunks}`);
    }
    const chunk = {
      id: this._nextChunkId++,
      size: this.options.chunkSize,
      used: 0,
      data: Buffer.alloc(this.options.chunkSize),
      free: true,
      timestamp: Date.now(),
      allocations: [],
    };
    this._chunks.push(chunk);
    this._freeChunks.push(chunk);
    this._totalSize += chunk.size;
    this.statistics.chunksCreated++;
    return chunk;
  }

  allocate(size, options = {}) {
    this.statistics.totalAllocations++;
    const alignedSize = this._alignSize(size);
    let chunk = this._findSuitableChunk(alignedSize);
    if (!chunk) {
      chunk = this._createChunk();
    }
    const offset = chunk.used;
    const allocation = {
      id: `${chunk.id}_${offset}`,
      chunkId: chunk.id,
      offset,
      size: alignedSize,
      actualSize: size,
      tag: options.tag || null,
      timestamp: Date.now(),
    };
    chunk.allocations.push(allocation);
    chunk.used += alignedSize;
    chunk.free = chunk.used < chunk.size;
    if (chunk.free) {
      const freeIndex = this._freeChunks.indexOf(chunk);
      if (freeIndex === -1) {
        this._freeChunks.push(chunk);
      }
    } else {
      const freeIndex = this._freeChunks.indexOf(chunk);
      if (freeIndex > -1) {
        this._freeChunks.splice(freeIndex, 1);
      }
    }
    this._allocatedChunks.set(allocation.id, { chunk, allocation });
    this._usedSize += alignedSize;
    if (this._usedSize > this.statistics.peakUsage) {
      this.statistics.peakUsage = this._usedSize;
    }
    return {
      id: allocation.id,
      address: chunk.id * this.options.chunkSize + offset,
      size: alignedSize,
    };
  }

  release(allocationId) {
    this.statistics.totalDeallocations++;
    const entry = this._allocatedChunks.get(allocationId);
    if (!entry) {
      throw new Error(`Invalid allocation ID: ${allocationId}`);
    }
    const { chunk, allocation } = entry;
    const allocIndex = chunk.allocations.findIndex(
      (a) => a.id === allocationId
    );
    if (allocIndex > -1) {
      chunk.allocations.splice(allocIndex, 1);
    }
    chunk.used -= allocation.size;
    this._usedSize -= allocation.size;
    chunk.free = true;
    if (!this._freeChunks.includes(chunk)) {
      this._freeChunks.push(chunk);
    }
    this._allocatedChunks.delete(allocationId);
    if (this.options.enableReuse && chunk.allocations.length === 0) {
      chunk.used = 0;
      chunk.data.fill(0);
    }
    return true;
  }

  read(allocationId, size) {
    const entry = this._allocatedChunks.get(allocationId);
    if (!entry) {
      throw new Error(`Invalid allocation ID: ${allocationId}`);
    }
    const { chunk, allocation } = entry;
    const readSize = size || allocation.size;
    if (readSize > allocation.size) {
      throw new Error(
        `Read size ${readSize} exceeds allocation size ${allocation.size}`
      );
    }
    return chunk.data.slice(allocation.offset, allocation.offset + readSize);
  }

  write(allocationId, data) {
    const entry = this._allocatedChunks.get(allocationId);
    if (!entry) {
      throw new Error(`Invalid allocation ID: ${allocationId}`);
    }
    const { chunk, allocation } = entry;
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (buffer.length > allocation.size) {
      throw new Error(
        `Data size ${buffer.length} exceeds allocation size ${allocation.size}`
      );
    }
    buffer.copy(chunk.data, allocation.offset);
    return true;
  }

  _alignSize(size) {
    const alignment = 8;
    return Math.ceil(size / alignment) * alignment;
  }

  _findSuitableChunk(size) {
    if (size > this.options.chunkSize) {
      return null;
    }
    let bestChunk = null;
    let bestFit = Infinity;
    for (const chunk of this._freeChunks) {
      const available = chunk.size - chunk.used;
      if (available >= size && available < bestFit) {
        bestFit = available;
        bestChunk = chunk;
      }
    }
    if (bestChunk) {
      this.statistics.chunksReused++;
    }
    return bestChunk;
  }

  defragment() {
    this.statistics.defragmentations++;
    const activeChunks = this._chunks.filter((c) => c.used > 0);
    let compactedSize = 0;
    for (const chunk of activeChunks) {
      if (chunk.allocations.length > 0) {
        const newData = Buffer.alloc(this.options.chunkSize);
        let newOffset = 0;
        for (const alloc of chunk.allocations) {
          const oldData = chunk.data.slice(
            alloc.offset,
            alloc.offset + alloc.size
          );
          oldData.copy(newData, newOffset);
          alloc.offset = newOffset;
          newOffset += alloc.size;
        }
        chunk.data = newData;
        chunk.used = newOffset;
        chunk.free = newOffset < chunk.size;
        compactedSize += chunk.size - newOffset;
      }
    }
    this._updateFreeChunksList();
    return {
      compactedSize,
      chunks: activeChunks.length,
    };
  }

  _updateFreeChunksList() {
    this._freeChunks = this._chunks.filter((c) => c.free);
  }

  shrink() {
    const emptyChunks = this._chunks.filter(
      (c) => c.used === 0 && c.allocations.length === 0
    );
    for (const chunk of emptyChunks) {
      const index = this._chunks.indexOf(chunk);
      if (index > this.options.initialSize - 1) {
        this._chunks.splice(index, 1);
        this._totalSize -= chunk.size;
        const freeIndex = this._freeChunks.indexOf(chunk);
        if (freeIndex > -1) {
          this._freeChunks.splice(freeIndex, 1);
        }
      }
    }
    return emptyChunks.length;
  }

  grow(count = 1) {
    for (let i = 0; i < count; i++) {
      this._createChunk();
    }
    return count;
  }

  getChunk(chunkId) {
    return this._chunks.find((c) => c.id === chunkId);
  }

  getChunks() {
    return [...this._chunks];
  }

  getFreeChunks() {
    return [...this._freeChunks];
  }

  getAllocation(allocationId) {
    return this._allocatedChunks.get(allocationId);
  }

  getAllocations() {
    return Array.from(this._allocatedChunks.values()).map((e) => e.allocation);
  }

  getUsage() {
    return {
      used: this._usedSize,
      total: this._totalSize,
      free: this._totalSize - this._usedSize,
      percentage: ((this._usedSize / this._totalSize) * 100).toFixed(2),
    };
  }

  clear() {
    this._chunks = [];
    this._freeChunks = [];
    this._allocatedChunks.clear();
    this._nextChunkId = 0;
    this._totalSize = 0;
    this._usedSize = 0;
    this._initialize();
    return true;
  }

  getStatistics() {
    return {
      ...this.statistics,
      usage: this.getUsage(),
      totalChunks: this._chunks.length,
      freeChunks: this._freeChunks.length,
      activeAllocations: this._allocatedChunks.size,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.clear();
    this.statistics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      chunksCreated: 0,
      chunksReused: 0,
      peakUsage: 0,
      defragmentations: 0,
    };
    return this;
  }

  dispose() {
    this._chunks = [];
    this._freeChunks = [];
    this._allocatedChunks.clear();
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = MemoryPool;
