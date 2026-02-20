const crypto = require("crypto");

class SessionStorage {
  constructor(options = {}) {
    this.name = "SessionStorage";
    this.version = "3.0.0";
    this.options = {
      defaultTTL: options.defaultTTL || 1800000,
      maxSessions: options.maxSessions || 10000,
      cleanupInterval: options.cleanupInterval || 300000,
      secure: options.secure !== false,
      secret: options.secret || crypto.randomBytes(32).toString("hex"),
    };
    this._sessions = new Map();
    this._cleanupTimer = null;
    this.statistics = {
      totalOperations: 0,
      sessionsCreated: 0,
      sessionsAccessed: 0,
      sessionsDestroyed: 0,
      expiredSessions: 0,
    };
    if (this.options.cleanupInterval > 0) {
      this._startCleanup();
    }
  }

  async create(sessionId, data = {}, options = {}) {
    this.statistics.totalOperations++;
    this.statistics.sessionsCreated++;
    const id = sessionId || this._generateId();
    const ttl = options.ttl || this.options.defaultTTL;
    const session = {
      id,
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      ttl,
      ip: options.ip || null,
      userAgent: options.userAgent || null,
      secure: this.options.secure,
    };
    if (this._sessions.size >= this.options.maxSessions) {
      this._evictOldest();
    }
    this._sessions.set(id, session);
    return { id, session };
  }

  async get(sessionId) {
    this.statistics.totalOperations++;
    const session = this._sessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (this._isExpired(session)) {
      await this.destroy(sessionId);
      return null;
    }
    session.updatedAt = Date.now();
    this.statistics.sessionsAccessed++;
    return session;
  }

  async getData(sessionId, key) {
    const session = await this.get(sessionId);
    if (!session) return undefined;
    return key ? session.data[key] : session.data;
  }

  async setData(sessionId, key, value) {
    this.statistics.totalOperations++;
    const session = this._sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    if (this._isExpired(session)) {
      await this.destroy(sessionId);
      throw new Error(`Session "${sessionId}" has expired`);
    }
    if (typeof key === "string") {
      session.data[key] = value;
    } else if (typeof key === "object") {
      Object.assign(session.data, key);
    }
    session.updatedAt = Date.now();
    return session;
  }

  async touch(sessionId) {
    this.statistics.totalOperations++;
    const session = this._sessions.get(sessionId);
    if (!session) return false;
    if (this._isExpired(session)) {
      await this.destroy(sessionId);
      return false;
    }
    session.updatedAt = Date.now();
    session.expiresAt = Date.now() + session.ttl;
    return true;
  }

  async refresh(sessionId, options = {}) {
    this.statistics.totalOperations++;
    const session = this._sessions.get(sessionId);
    if (!session) return false;
    if (this._isExpired(session)) {
      await this.destroy(sessionId);
      return false;
    }
    const ttl = options.ttl || session.ttl;
    session.ttl = ttl;
    session.expiresAt = Date.now() + ttl;
    session.updatedAt = Date.now();
    return true;
  }

  async destroy(sessionId) {
    this.statistics.totalOperations++;
    this.statistics.sessionsDestroyed++;
    return this._sessions.delete(sessionId);
  }

  async has(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return false;
    if (this._isExpired(session)) {
      await this.destroy(sessionId);
      return false;
    }
    return true;
  }

  async clear() {
    this.statistics.totalOperations++;
    this._sessions.clear();
    return true;
  }

  async size() {
    return this._sessions.size;
  }

  async list(options = {}) {
    this.statistics.totalOperations++;
    const sessions = [];
    for (const [id, session] of this._sessions) {
      if (!this._isExpired(session)) {
        if (options.includeData) {
          sessions.push({ id, ...session });
        } else {
          sessions.push({
            id,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            expiresAt: session.expiresAt,
          });
        }
      }
    }
    return sessions;
  }

  async getActiveCount() {
    let count = 0;
    for (const session of this._sessions.values()) {
      if (!this._isExpired(session)) {
        count++;
      }
    }
    return count;
  }

  async destroyByUser(userId) {
    this.statistics.totalOperations++;
    let count = 0;
    for (const [id, session] of this._sessions) {
      if (session.data.userId === userId) {
        this._sessions.delete(id);
        count++;
      }
    }
    this.statistics.sessionsDestroyed += count;
    return count;
  }

  async destroyByIP(ip) {
    this.statistics.totalOperations++;
    let count = 0;
    for (const [id, session] of this._sessions) {
      if (session.ip === ip) {
        this._sessions.delete(id);
        count++;
      }
    }
    this.statistics.sessionsDestroyed += count;
    return count;
  }

  async destroyExpired() {
    this.statistics.totalOperations++;
    let count = 0;
    for (const [id, session] of this._sessions) {
      if (this._isExpired(session)) {
        this._sessions.delete(id);
        count++;
      }
    }
    this.statistics.expiredSessions += count;
    return count;
  }

  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .createHmac("sha256", this.options.secret)
      .update(`${timestamp}:${random}`)
      .digest("hex")
      .substring(0, 16);
    return `${timestamp}_${random}_${hash}`;
  }

  _isExpired(session) {
    return Date.now() > session.expiresAt;
  }

  _evictOldest() {
    let oldestId = null;
    let oldestTime = Infinity;
    for (const [id, session] of this._sessions) {
      if (session.updatedAt < oldestTime) {
        oldestTime = session.updatedAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      this._sessions.delete(oldestId);
    }
  }

  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      this.destroyExpired();
    }, this.options.cleanupInterval);
  }

  _stopCleanup() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  createMiddleware() {
    const self = this;
    return async (req, res, next) => {
      const sessionId = req.headers["x-session-id"] || req.cookies?.sessionId;
      if (sessionId) {
        const session = await self.get(sessionId);
        if (session) {
          req.session = session;
          res.setHeader("X-Session-Id", sessionId);
        }
      }
      if (!req.session) {
        const { id, session } = await self.create(
          null,
          {},
          {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          }
        );
        req.session = session;
        res.setHeader("X-Session-Id", id);
      }
      if (next) next();
    };
  }

  getStatistics() {
    return {
      ...this.statistics,
      activeSessions: this._sessions.size,
      maxSessions: this.options.maxSessions,
    };
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  async reset() {
    await this.clear();
    this.statistics = {
      totalOperations: 0,
      sessionsCreated: 0,
      sessionsAccessed: 0,
      sessionsDestroyed: 0,
      expiredSessions: 0,
    };
    return this;
  }

  async dispose() {
    this._stopCleanup();
    await this.reset();
    this.options = {};
    return this;
  }
}

module.exports = SessionStorage;
