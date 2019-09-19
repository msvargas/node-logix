"use-strict";
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const genericPool = require("generic-pool");
const EIPSocket = require("./eip-socket");
const CIPTypes = require("../assets/CIPTypes.json");

/**
 * Helper to return dynamic name function
 * @param {String} name
 * @param {Function} body
 */

function nameFunction(name, body) {
  return {
    [name]() {
      return body();
    }
  }[name];
}

class EIPContext extends EventEmitter {
  constructor(props) {
    super();
    const {
      Micro800,
      vendorId,
      processorSlot,
      connectionSize,
      port,
      host,
      connectTimeout,
      allowHalfOpen
    } = props || {};
    this.port = port || 44818;
    this.host = host;
    this.allowHalfOpen = allowHalfOpen || true;
    this.Micro800 = !!Micro800;
    this.connectionSize = connectionSize || 508;
    this.vendorId = vendorId || 0x1337;
    this.processorSlot = processorSlot || 0;
    this.CIPTypes = CIPTypes;
    this.connectionPath = Micro800
      ? [0x20, 0x02, 0x24, 0x01]
      : [0x01, processorSlot, 0x20, 0x02, 0x24, 0x01];
    this.connectionPathSize = Micro800 ? 2 : 3;
    this.structIdentifier = 0x0fce;
    this.knownTags = {};
    this.connectTimeout = connectTimeout || 5000;
    this._connected = false;
    this._connecting = false;
    this.tagList = [];
    this.programNames = [];
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  on(event, listener) {
    super.on(event, listener);
    return nameFunction(`off_${event}`, () => {
      super.off(event, listener);
    });
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  once(event, listener) {
    super.once(event, listener);
    return nameFunction(`off_${event}`, () => {
      super.off(event, listener);
    });
  }
}

class EIPSocketPool extends EIPContext {
  constructor(props) {
    if (typeof props !== "object") return super();
    const { pool, ...options } = props;
    super(options);
    const opts = {
      acquireTimeoutMillis: this.connectTimeout,
      ...pool
    };
    this._pool = genericPool.createPool(
      {
        create: () => {
          return EIPSocket.createClient(this);
        },
        destroy: socket => {
          return socket.destroy();
        },
        validate: socket => {
          return socket.connected;
        }
      },
      opts
    );
    /* this._pool.on("factoryDestroyError", err => {
      console.log("error al destruir", err);
      this.emit("error", err);
    }); */
  }

  /**
   * @description  returns number of connections in the pool regardless of whether they are free or in use
   * @property
   */
  get size() {
    return this._pool.size;
  }
  /**
   * @description returns number of maxixmum number of connections allowed by pool
   * @property
   */
  get max() {
    return this._pool.max;
  }
  /**
   * @description returns number of minimum number of connections allowed by pool
   * @property
   */
  get min() {
    return this._pool.min;
  }
  /**
   * @description returns number of callers waiting to acquire a connection
   * @property
   */
  get pending() {
    return this._pool.pending;
  }
  /**
   * @description  Number of connections that are currently acquired by userland code
   * @property
   */
  get borrowed() {
    return this._pool.borrowed;
  }
  /**
   * @description  returns number of unused connections in the pool
   * @property
   */
  get available() {
    return this._pool.available;
  }
  /**
   * @description How many many more resources can the pool manage/create
   * @property
   */
  get spareResourceCapacity() {
    return this._pool.spareResourceCapacity;
  }
  /**
   * @override
   * @description This function is for when you want to "borrow" a connection from the pool
   * @param {Number|Function} priority if a Number return only socket if a function release socket on resolve o destroy on reject
   */
  acquire(priority) {
    if (typeof priority === "function") return this._pool.use(priority);
    return new Promise((resolve, reject) => {
      this._pool
        .acquire(
          typeof priority === "number"
            ? priority
            : priority === "connect"
            ? 0
            : undefined
        )
        .then(socket => socket.connected && this._pool.release(socket))
        .then(resolve)
        .catch(err => {
          if (priority !== "connect") reject(err);
        });
    });
  }
}

EIPSocketPool.CIPTypes = CIPTypes;
module.exports = EIPSocketPool;
