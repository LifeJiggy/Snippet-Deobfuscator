/**
 * Cache
 * Production-grade in-memory caching system with TTL and LRU eviction
 * Version: 3.0.0
 */

class Cache {
  constructor(options = {}) {
    this.name = "cache";
    this.version = "3.0.0";

    this.options = {
      ttl: options.ttl || 300000, // 5 minutes default
      maxSize: options.maxSize || 1000,
      eviction: options.eviction || "lru",
      onEvict: options.onEvict || null,
    };

    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      errors: 0,
    };

    // Cleanup interval
    this.cleanupInterval = null;
    if (options.autoCleanup !== false) {
      this.startCleanup();
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, options = {}) {
    try {
      const ttl = options.ttl || this.options.ttl;
      const expiresAt = ttl ? Date.now() + ttl : null;

      // Check size limit
      if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
        this.evict();
      }

      this.cache.set(key, {
        value,
        expiresAt,
        createdAt: Date.now(),
        accessCount: 0,
      });

      // Update access order
      this.updateAccessOrder(key);

      this.stats.sets++;

      return true;
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        this.stats.misses++;
        return null;
      }

      // Update access info
      entry.accessCount++;
      this.updateAccessOrder(key);

      this.stats.hits++;
      return entry.value;
    } catch (error) {
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Check if key exists (without updating stats)
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    const result = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    return result;
  }

  /**
   * Clear all cache
   */
  clear() {
    const count = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];

    if (this.options.onEvict) {
      // Notify about eviction
    }

    return count;
  }

  /**
   * Update access order for LRU
   */
  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict oldest entry
   */
  evict() {
    if (this.accessOrder.length === 0) return false;

    const key = this.accessOrder.shift();
    const entry = this.cache.get(key);

    if (entry && this.options.onEvict) {
      this.options.onEvict(key, entry.value);
    }

    this.cache.delete(key);
    this.stats.evictions++;

    return true;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }

    return toDelete.length;
  }

  /**
   * Start automatic cleanup
   */
  startCleanup(interval = 60000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values() {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Get entries
   */
  entries() {
    return Array.from(this.cache.entries()).map(([key, entry]) => [
      key,
      entry.value,
    ]);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: `${hitRate}%`,
      ttl: this.options.ttl,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      errors: 0,
    };
  }

  /**
   * Get or set (atomic)
   */
  getOrSet(key, factory, options = {}) {
    let value = this.get(key);

    if (value === null) {
      value = typeof factory === "function" ? factory() : factory;
      this.set(key, value, options);
    }

    return value;
  }

  /**
   * Get multiple keys
   */
  getMany(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Set multiple keys
   */
  setMany(entries, options = {}) {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, options);
    }
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage() {
    let size = 0;

    for (const [key, entry] of this.cache) {
      size += key.length * 2;
      size += JSON.stringify(entry.value).length * 2;
      size += 100; // overhead
    }

    return size;
  }

  /**
   * Dispose
   */
  dispose() {
    this.stopCleanup();
    this.clear();
  }
}

module.exports = Cache;
