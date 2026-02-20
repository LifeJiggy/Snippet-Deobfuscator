class HeapMemory {
  constructor(options = {}) {
    this.name = "HeapMemory";
    this.version = "3.0.0";
    this.options = {
      maxSize: options.maxSize || 512 * 1024 * 1024,
      blockSize: options.blockSize || 64,
      compactThreshold: options.compactThreshold || 0.3,
    };
    this._blocks = new Map();
    this._freeList = [];
    this._allocatedList = [];
    this._nextAddress = 0x1000;
    this._totalAllocated = 0;
    this._totalFreed = 0;
    this.statistics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      totalBytesAllocated: 0,
      totalBytesFreed: 0,
      compactions: 0,
      fragmentation: 0,
      errors: 0,
    };
  }

  allocate(size, options = {}) {
    this.statistics.totalAllocations++;
    if (size <= 0) {
      throw new Error("Allocation size must be positive");
    }
    const alignedSize = this._alignSize(size);
    if (this._totalAllocated + alignedSize > this.options.maxSize) {
      if (this._canCompact()) {
        this.compact();
      }
      if (this._totalAllocated + alignedSize > this.options.maxSize) {
        this.statistics.errors++;
        throw new Error(
          `Out of memory: requested ${alignedSize}, available ${
            this.options.maxSize - this._totalAllocated
          }`
        );
      }
    }
    let block = this._findFreeBlock(alignedSize);
    if (!block) {
      block = this._createBlock(alignedSize);
    } else {
      this._removeFromFreeList(block);
    }
    block.allocated = true;
    block.timestamp = Date.now();
    block.tag = options.tag || null;
    block.type = options.dataType || "unknown";
    this._allocatedList.push(block);
    this._totalAllocated += block.size;
    this.statistics.totalBytesAllocated += block.size;
    this._updateFragmentation();
    return {
      address: block.address,
      size: block.size,
      actualSize: size,
    };
  }

  deallocate(address) {
    this.statistics.totalDeallocations++;
    const blockIndex = this._allocatedList.findIndex(
      (b) => b.address === address
    );
    if (blockIndex === -1) {
      this.statistics.errors++;
      throw new Error(`Invalid address: ${address}`);
    }
    const block = this._allocatedList[blockIndex];
    block.allocated = false;
    block.freedAt = Date.now();
    this._allocatedList.splice(blockIndex, 1);
    this._freeList.push(block);
    this._totalAllocated -= block.size;
    this._totalFreed += block.size;
    this.statistics.totalBytesFreed += block.size;
    this._mergeAdjacentFreeBlocks();
    this._updateFragmentation();
    return true;
  }

  read(address, size) {
    const block = this._blocks.get(address);
    if (!block) {
      throw new Error(`Invalid address: ${address}`);
    }
    if (!block.allocated) {
      throw new Error(`Block at ${address} is not allocated`);
    }
    const readSize = size || block.size;
    if (readSize > block.size) {
      throw new Error(`Read size ${readSize} exceeds block size ${block.size}`);
    }
    return {
      data: block.data ? block.data.slice(0, readSize) : null,
      size: readSize,
      address,
    };
  }

  write(address, data) {
    const block = this._blocks.get(address);
    if (!block) {
      throw new Error(`Invalid address: ${address}`);
    }
    if (!block.allocated) {
      throw new Error(`Block at ${address} is not allocated`);
    }
    const dataSize = Buffer.byteLength(data);
    if (dataSize > block.size) {
      throw new Error(`Data size ${dataSize} exceeds block size ${block.size}`);
    }
    block.data = Buffer.isBuffer(data) ? data : Buffer.from(data);
    block.modifiedAt = Date.now();
    return true;
  }

  _alignSize(size) {
    const alignment = this.options.blockSize;
    return Math.ceil(size / alignment) * alignment;
  }

  _createBlock(size) {
    const block = {
      address: this._nextAddress,
      size,
      allocated: false,
      data: null,
      timestamp: null,
      tag: null,
      type: null,
    };
    this._blocks.set(this._nextAddress, block);
    this._nextAddress += size;
    return block;
  }

  _findFreeBlock(size) {
    for (const block of this._freeList) {
      if (block.size >= size) {
        if (block.size > size + this.options.blockSize) {
          return this._splitBlock(block, size);
        }
        return block;
      }
    }
    return null;
  }

  _splitBlock(block, size) {
    const remainingSize = block.size - size;
    const newBlock = {
      address: block.address + size,
      size: remainingSize,
      allocated: false,
      data: null,
      timestamp: null,
      tag: null,
      type: null,
    };
    block.size = size;
    this._blocks.set(newBlock.address, newBlock);
    this._freeList.push(newBlock);
    return block;
  }

  _removeFromFreeList(block) {
    const index = this._freeList.indexOf(block);
    if (index > -1) {
      this._freeList.splice(index, 1);
    }
  }

  _mergeAdjacentFreeBlocks() {
    this._freeList.sort((a, b) => a.address - b.address);
    for (let i = 0; i < this._freeList.length - 1; i++) {
      const current = this._freeList[i];
      const next = this._freeList[i + 1];
      if (current.address + current.size === next.address) {
        current.size += next.size;
        this._blocks.delete(next.address);
        this._freeList.splice(i + 1, 1);
        i--;
      }
    }
  }

  _canCompact() {
    const freeRatio =
      this._freeList.reduce((sum, b) => sum + b.size, 0) / this.options.maxSize;
    return freeRatio > this.options.compactThreshold;
  }

  compact() {
    this.statistics.compactions++;
    const allocated = [...this._allocatedList].sort(
      (a, b) => a.address - b.address
    );
    this._blocks.clear();
    this._freeList = [];
    this._allocatedList = [];
    this._nextAddress = 0x1000;
    for (const block of allocated) {
      const newBlock = {
        address: this._nextAddress,
        size: block.size,
        allocated: true,
        data: block.data,
        timestamp: block.timestamp,
        tag: block.tag,
        type: block.type,
      };
      this._blocks.set(this._nextAddress, newBlock);
      this._allocatedList.push(newBlock);
      this._nextAddress += block.size;
    }
    const remainingSpace = this.options.maxSize - this._totalAllocated;
    if (remainingSpace > 0) {
      const freeBlock = {
        address: this._nextAddress,
        size: remainingSpace,
        allocated: false,
        data: null,
        timestamp: null,
        tag: null,
        type: null,
      };
      this._blocks.set(this._nextAddress, freeBlock);
      this._freeList.push(freeBlock);
    }
    this._updateFragmentation();
    return true;
  }

  _updateFragmentation() {
    const totalFree = this._freeList.reduce((sum, b) => sum + b.size, 0);
    const numFragments = this._freeList.length;
    if (totalFree === 0 || numFragments <= 1) {
      this.statistics.fragmentation = 0;
    } else {
      const avgFragmentSize = totalFree / numFragments;
      const maxFragmentSize = Math.max(...this._freeList.map((b) => b.size));
      this.statistics.fragmentation = 1 - avgFragmentSize / maxFragmentSize;
    }
  }

  getBlock(address) {
    return this._blocks.get(address);
  }

  getBlocks() {
    return Array.from(this._blocks.values());
  }

  getAllocatedBlocks() {
    return [...this._allocatedList];
  }

  getFreeBlocks() {
    return [...this._freeList];
  }

  getUsage() {
    return {
      used: this._totalAllocated,
      total: this.options.maxSize,
      free: this.options.maxSize - this._totalAllocated,
      percentage: ((this._totalAllocated / this.options.maxSize) * 100).toFixed(
        2
      ),
    };
  }

  clear() {
    this._blocks.clear();
    this._freeList = [];
    this._allocatedList = [];
    this._nextAddress = 0x1000;
    this._totalAllocated = 0;
    this._totalFreed = 0;
    return true;
  }

  getStatistics() {
    return {
      ...this.statistics,
      usage: this.getUsage(),
      totalBlocks: this._blocks.size,
      allocatedBlocks: this._allocatedList.length,
      freeBlocks: this._freeList.length,
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
      totalBytesAllocated: 0,
      totalBytesFreed: 0,
      compactions: 0,
      fragmentation: 0,
      errors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = HeapMemory;
