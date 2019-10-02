import genericPool from "generic-pool";
import Bluebird from "bluebird";
import EIPSocket, {
  EIPContext,
  IEIPContextOptions,
  CIPTypes
} from "./eip-socket";
export { EIPSocket, CIPTypes };

class EIPSocketPool extends EIPContext {
  constructor({ pool, ...options }: IEIPContextOptions) {
    super(options);
    const opts = Object.assign(
      {
        acquireTimeoutMillis: this.connectTimeout
      },
      pool
    );
    this._pool = genericPool.createPool(
      {
        create: () => {
          return EIPSocket.createClient(this);
        },
        destroy: async socket => {
          await socket.destroy();
        },
        validate: async socket => {
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
  get size(): number {
    return this._pool ? this._pool.size : 0;
  }
  /**
   * @description returns number of maxixmum number of connections allowed by pool
   * @property
   */
  get max(): number {
    return this._pool ? this._pool.max : 0;
  }
  /**
   * @description returns number of minimum number of connections allowed by pool
   * @property
   */
  get min(): number {
    return this._pool ? this._pool.min : 0;
  }
  /**
   * @description returns number of callers waiting to acquire a connection
   * @property
   */
  get pending(): number {
    return this._pool ? this._pool.pending : 0;
  }
  /**
   * @description  Number of connections that are currently acquired by userland code
   * @property
   */
  get borrowed() {
    return this._pool ? this._pool.borrowed : 0;
  }
  /**
   * @description  returns number of unused connections in the pool
   * @property
   */
  get available() {
    return this._pool ? this._pool.available : 0;
  }
  /**
   * @description How many many more resources can the pool manage/create
   * @property
   */
  get spareResourceCapacity() {
    return this._pool ? this._pool.spareResourceCapacity : 0;
  }
  /**
   * @override
   * @description This function is for when you want to "borrow" a connection from the pool
   * @param {Number|Function} priority if a Number return only socket if a function release socket on resolve o destroy on reject
   * @returns {Promise<EIPCSocket>}
   */
  acquire(
    priority: number | string | ((socket: EIPSocket) => Bluebird<any> | any)
  ): Bluebird<any> | any {
    if (typeof priority === "function" && this._pool)
      return this._pool.use(priority);
    return new Bluebird((resolve, reject) => {
      if (!this._pool) return;
      (this._pool.acquire(
        typeof priority === "number"
          ? priority
          : priority === "connect"
          ? 0
          : undefined
      ) as Bluebird<EIPSocket>)
        .then(socket => {
          this._pool && socket.connected && this._pool.release(socket);
          resolve(socket);
        })
        .catch((err: Error) => {
          if (priority !== "connect") reject(err);
        });
    });
  }
}

export default EIPSocketPool;
