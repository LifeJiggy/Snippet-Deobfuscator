class StackMemory {
  constructor(options = {}) {
    this.name = "StackMemory";
    this.version = "3.0.0";
    this.options = {
      maxSize: options.maxSize || 8 * 1024 * 1024,
      frameSize: options.frameSize || 1024,
      maxDepth: options.maxDepth || 1000,
    };
    this._frames = [];
    this._pointer = 0;
    this._basePointer = 0;
    this._data = [];
    this._currentFrame = null;
    this.statistics = {
      totalPushes: 0,
      totalPops: 0,
      totalFrames: 0,
      maxDepth: 0,
      overflowErrors: 0,
      underflowErrors: 0,
    };
  }

  allocate(size, options = {}) {
    if (this._pointer + size > this.options.maxSize) {
      this.statistics.overflowErrors++;
      throw new Error(
        `Stack overflow: requested ${size}, available ${
          this.options.maxSize - this._pointer
        }`
      );
    }
    const address = this._pointer;
    this._pointer += size;
    const entry = {
      address,
      size,
      value: options.value || null,
      type: options.type || "unknown",
      frame: this._currentFrame ? this._currentFrame.id : null,
      timestamp: Date.now(),
    };
    this._data.push(entry);
    this.statistics.totalPushes++;
    this._updateMaxDepth();
    return {
      address,
      size,
    };
  }

  push(value, options = {}) {
    const size = this._calculateSize(value);
    const result = this.allocate(size, { ...options, value });
    return result;
  }

  pop() {
    if (this._data.length === 0) {
      this.statistics.underflowErrors++;
      throw new Error("Stack underflow");
    }
    const entry = this._data.pop();
    this._pointer -= entry.size;
    this.statistics.totalPops++;
    return entry;
  }

  peek() {
    if (this._data.length === 0) {
      return null;
    }
    return this._data[this._data.length - 1];
  }

  read(address, size) {
    const entries = this._data.filter((e) => {
      return e.address >= address && e.address < address + size;
    });
    if (entries.length === 0) {
      throw new Error(`Invalid stack address: ${address}`);
    }
    return entries;
  }

  write(address, data) {
    const entry = this._data.find((e) => e.address === address);
    if (!entry) {
      throw new Error(`Invalid stack address: ${address}`);
    }
    entry.value = data;
    entry.modifiedAt = Date.now();
    return true;
  }

  pushFrame(name, options = {}) {
    if (this._frames.length >= this.options.maxDepth) {
      this.statistics.overflowErrors++;
      throw new Error(`Maximum stack depth exceeded: ${this.options.maxDepth}`);
    }
    const frame = {
      id: this._frames.length,
      name: name || `frame_${this._frames.length}`,
      basePointer: this._pointer,
      returnAddress: options.returnAddress || null,
      locals: new Map(),
      args: options.args || [],
      timestamp: Date.now(),
    };
    this._frames.push(frame);
    this._currentFrame = frame;
    this._basePointer = this._pointer;
    this.statistics.totalFrames++;
    this._updateMaxDepth();
    return frame;
  }

  popFrame() {
    if (this._frames.length === 0) {
      this.statistics.underflowErrors++;
      throw new Error("No frames to pop");
    }
    const frame = this._frames.pop();
    this._pointer = frame.basePointer;
    this._data = this._data.filter((e) => e.address < frame.basePointer);
    this._currentFrame =
      this._frames.length > 0 ? this._frames[this._frames.length - 1] : null;
    this._basePointer = this._currentFrame ? this._currentFrame.basePointer : 0;
    return frame;
  }

  getCurrentFrame() {
    return this._currentFrame;
  }

  getFrame(id) {
    return this._frames.find((f) => f.id === id);
  }

  getFrames() {
    return [...this._frames];
  }

  setLocal(name, value) {
    if (!this._currentFrame) {
      throw new Error("No active frame");
    }
    this._currentFrame.locals.set(name, {
      value,
      address: this._pointer,
      timestamp: Date.now(),
    });
    return this.push(value, { type: "local", name });
  }

  getLocal(name) {
    if (!this._currentFrame) {
      throw new Error("No active frame");
    }
    return this._currentFrame.locals.get(name);
  }

  hasLocal(name) {
    if (!this._currentFrame) return false;
    return this._currentFrame.locals.has(name);
  }

  deleteLocal(name) {
    if (!this._currentFrame) return false;
    return this._currentFrame.locals.delete(name);
  }

  _calculateSize(value) {
    if (value === null || value === undefined) return 8;
    switch (typeof value) {
      case "number":
        return 8;
      case "boolean":
        return 4;
      case "string":
        return value.length * 2 + 8;
      case "object":
        try {
          return Buffer.byteLength(JSON.stringify(value)) + 8;
        } catch {
          return 64;
        }
      default:
        return 16;
    }
  }

  _updateMaxDepth() {
    if (this._frames.length > this.statistics.maxDepth) {
      this.statistics.maxDepth = this._frames.length;
    }
  }

  getPointer() {
    return this._pointer;
  }

  getBasePointer() {
    return this._basePointer;
  }

  getSize() {
    return this._pointer;
  }

  getUsage() {
    return {
      used: this._pointer,
      total: this.options.maxSize,
      free: this.options.maxSize - this._pointer,
      percentage: ((this._pointer / this.options.maxSize) * 100).toFixed(2),
    };
  }

  isEmpty() {
    return this._data.length === 0;
  }

  getDepth() {
    return this._frames.length;
  }

  getData() {
    return [...this._data];
  }

  clear() {
    this._frames = [];
    this._data = [];
    this._pointer = 0;
    this._basePointer = 0;
    this._currentFrame = null;
    return true;
  }

  getStatistics() {
    return {
      ...this.statistics,
      usage: this.getUsage(),
      currentDepth: this._frames.length,
      dataSize: this._data.length,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  reset() {
    this.clear();
    this.statistics = {
      totalPushes: 0,
      totalPops: 0,
      totalFrames: 0,
      maxDepth: 0,
      overflowErrors: 0,
      underflowErrors: 0,
    };
    return this;
  }

  dispose() {
    this.reset();
    this.options = {};
    return this;
  }
}

module.exports = StackMemory;
