"use-strict";
const Promise = require("bluebird");
const genericPool = require("generic-pool");

const CIPTypes = require("../assets/CIPTypes.json");
const { EIPSocket, EIPContext } = require("./eip-socket");

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
   * @returns {Promise<EIPCSocket>}
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
