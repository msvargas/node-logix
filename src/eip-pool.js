"use-strict";
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const genericPool = require("generic-pool");
const { TimeoutError } = require("generic-pool/lib/errors");
const CIPSocket = require("./eip-socket");
const CIPTypes = require("./CIPTypes");

class CIPContext extends EventEmitter {
  constructor({
    Micro800,
    vendorId,
    processorSlot,
    connectionSize,
    port,
    host,
    connectTimeout
  }) {
    super();
    this.port = port;
    this.host = host;
    this._connected = false;
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
  }
}

class CIPSocketPool extends CIPContext {
  constructor({ pool, ...options }) {
    super(options);
    const opts = {
      ...pool,
      testOnBorrow: true,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: this.connectTimeout,
      Promise,
      priorityRange: 2,
      fifo: false,
      evictionRunIntervalMillis: 17000
    };
    this._pool = genericPool.createPool(
      {
        create: () => {
          return CIPSocket.createClient(this);
        },
        destroy: socket => {
          console.log("pool destroy:", socket.id);
          return socket.destroy();
        },
        validate: socket => {
          return socket.connected;
        }
      },
      opts
    );
    /*     this._pool.once("factoryCreateError", err => {
      console.log("error al crear", err.stack);
    }); */
    /* this._pool.on("factoryDestroyError", err => {
      console.log("error al destruir", err);
      this.emit("error", err);
    }); */
  }

  get available() {
    return this._pool.available;
  }

  get size() {
    return this._pool.size;
  }

  get max() {
    return this._pool.max;
  }

  get min() {
    return this._pool.min;
  }

  get pending() {
    return this._pool.pending;
  }

  get borrowed() {
    return this._pool.borrowed;
  }

  get available() {
    return this._pool.available;
  }

  get spareResourceCapacity() {
    return this._pool.spareResourceCapacity;
  }

  acquire(type) {
    if (typeof type === "function") return this._pool.use(type);
    return new Promise((resolve, reject) => {
      this._pool
        .acquire(
          typeof type === "number" ? type : type === "connect" ? 0 : undefined
        )
        .then(socket => {
          const release = () => socket.connected && this._pool.release(socket);
          return type === "connect" ? release : [socket, release];
        })
        .then(resolve)
        .catch(err => {
          if (type !== "connect") reject(err);
        });
    });
  }
 
}

exports.CIPTypes;

module.exports = CIPSocketPool;
