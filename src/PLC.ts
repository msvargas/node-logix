/**
 *
 * @author Michael Vargas - node-logix
 * (msvargas97@gmail.com)
 * 
 * @copyright
 * partial source code written in python 
 * lincese:
   Originally base code written in python created by Burt Peterson
   Updated and maintained by Dustin Roeder (dmroeder@gmail.com) 
   Copyright 2019 Dustin Roeder
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import os from "os";
import { isIP } from "net";
import { SocketOptions, createSocket, Socket, RemoteInfo } from "dgram";
import Bluebird from "bluebird";
import EIPSocketPool, { CIPTypes, EIPSocket } from "./eip-pool";
import LGXDevice from "./lgxDevice";
import {
  _replacePin as replacePin,
  flatten,
  parseIdentityResponse,
  unpackFrom,
  ILGXDevice
} from "./utils";
import {
  ValueError,
  LogixError,
  ConnectionError,
  DisconnectedError,
  RegisterSessionError,
  ConnectionLostError,
  ConnectionTimeoutError,
  ForwarOpenError,
  PinMappingError
} from "./errors";
import {
  IEIPContextOptions,
  ITagReadOptions,
  ITagWriteOptions,
  LgxResponse
} from "./eip-socket";
import pinMapping from "../resources/pin-mapping.json"; // ping mapping to use digitalWrite... as Arduino

const { TimeoutError } = require("generic-pool/lib/errors");

export class Pin {
  constructor(public tagName: string, public value: any) {}
  valueOf() {
    return this.value;
  }
}

type IPAddress = string;

export interface IOptions {
  arduinoMode?: boolean;
  autoClose?: boolean;
}

export interface IPingMappings {
  digital: {
    output: string;
    input: string;
  };
  analog: {
    input: string;
    output: string;
  };
}

export interface IDiscoverOptions extends SocketOptions {
  onFound?: (device: LGXDevice, length: number) => void;
  onError?: (msg: Buffer, rinfo: RemoteInfo) => void;
  family?: "IPv4" | "IPv6";
  port?: number;
}

export interface ICustomSocket {
  idTimeout?: NodeJS.Timeout;
}

export interface IDeviceProps extends ILGXDevice, IOptions {}

export enum CIPTypesValues {
  STRUCT = 160,
  BOOL = 193,
  SINT = 194,
  INT = 195,
  DINT = 196,
  LINT = 197,
  USINT = 198,
  UINT = 199,
  UDINT = 200,
  LWORD = 201,
  REAL = 202,
  LREAL = 203,
  DWORD = 211,
  STRING = 218
}

declare interface PLC {
  on(event: "connect", listener: () => void): this;
  on(event: "disconnect", listener: (reason: string | Error) => void): this;
  on(event: "found", listener: (device: LGXDevice, pos: number) => void): this;
  on(event: "closing", listener: () => void): this;

  on(event: "connect_error", listener: (error: Error) => void): this;
  on(
    event: "found_error",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void
  ): this;

  once(event: "connect", listener: () => void): this;
  once(event: "disconnect", listener: (reason: string | Error) => void): this;
  once(
    event: "found",
    listener: (device: LGXDevice, pos: number) => void
  ): this;

  once(event: "connect_error", listener: (error: Error) => void): this;
  once(
    event: "found_error",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void
  ): this;
  once(event: "closing", listener: () => void): this;

  on(event: string, listener: Function): this;
  once(event: string, listener: Function): this;
}

class PLC extends EIPSocketPool implements IDeviceProps {
  arduinoMode?: boolean;
  vendor?: string;
  deviceType?: number;
  device?: string;
  productCode?: number;
  revision?: string | number;
  status?: number;
  serialNumber?: string | number;
  productName?: string;
  state?: number;
  autoClose?: boolean = true;

  protected _closing: boolean = false;
  protected _pingMapping?: IPingMappings;
  protected _replacePin?: (tagRegex: string, pin: string) => string;
  /**
   * Errors
   */
  static TimeoutError = TimeoutError;
  static LogixError = LogixError;
  static ValueError = ValueError;
  static ConnectionError = ConnectionError;
  static ConnectionTimeoutError = ConnectionTimeoutError;
  static ConnectionLostError = ConnectionLostError;
  static ForwarOpenError = ForwarOpenError;
  static RegisterSessionError = RegisterSessionError;
  static DisconnectedError = DisconnectedError;
  /**
   * @description get CIPTypes number foreach avaible dataType
   */
  public static CIPTypes = CIPTypesValues;

  public static defaultOptions = {
    allowHalfOpen: true,
    Micro800: false,
    port: 44818,
    connectTimeout: 3000,
    arduinoMode: true,
    pool: {
      min: 0,
      max: 3,
      Bluebird: Bluebird,
      priorityRange: 2,
      fifo: false,
      testOnBorrow: true,
      evictionRunIntervalMillis: 17000,
      idleTimeoutMillis: 30000
    }
  };
  /**
   * @description Create instace of PLC using EIP (EthernetIP) protocol
   * @param {String|Object} IPAddress IP Address of PLC alternative pass Object with all options
   * @param {IEIPContextOptions} options Options to set if IPAddress typeof string
   */
  constructor(
    host: IPAddress | (IEIPContextOptions & IOptions),
    options: IEIPContextOptions & IOptions
  ) {
    super(
      typeof host === "string"
        ? Object.assign(PLC.defaultOptions, options, { host })
        : Object.assign(PLC.defaultOptions, options, host)
    );
    try {
      if (typeof host === "object" && "autoClose" in host) {
        this.autoClose = host.autoClose;
        this.arduinoMode = host.arduinoMode;
      } else if (typeof options === "object") {
        this.autoClose = options.autoClose;
        this.arduinoMode = options.arduinoMode;
      }
    } catch {}
    if (typeof host === "string" && !host.length)
      throw new Error("Check empty IPAddress");
    else if (typeof host === "string" && !isIP(host))
      throw new Error("IP Address no valid, check IP: " + host);

    if (this.Micro800 && this.arduinoMode) {
      this._pingMapping = pinMapping["Micro800"];
      this.replacePin = replacePin;
    }
    if (this._pool) {
      this._pool.on("factoryCreateError", (err: Error) => {
        if (this._connected && !this.available) {
          this._connected = false;
          this.emit("disconnect", err);
        }
      });
    }
    if (!!this.autoClose) {
      const onExit = () => {
        this.close();
      };
      process.once("beforeExit", onExit); // on process.exit
      process.once("SIGINT", onExit); // Ctrl + C
      if (parseInt(process.versions.node) >= 10) {
        process.once("SIGKILL", onExit); // kill process
      }
    }
  }
  /**
   * @property check if socket is connected
   */
  get connected() {
    return this._connected;
  }
  /**
   * @property check if socket is disconnected
   */
  get disconnected() {
    return !this._connected;
  }
  /**
   * @property check if socket try connecting
   */
  get connecting() {
    return this._connecting;
  }
  /**
   * @property check if socket try closing
   */
  get closing() {
    return this._closing;
  }
  /**
   * @property get current pin mapping
   */
  get pingMapping() {
    return this._pingMapping;
  }
  /**
   * @property get function to replace pin
   */
  get replacePin() {
    return this._replacePin && this._replacePin.bind(this);
  }
  /**
   * @description custom pin mapping to use with digitalWrite, digitalRead, analogWrite and analogRead functions
   * @property set
   * @param {Object} pinout
   * @example if Micro800 == true use pin mapping =>
   * {
   * "digital" : {
   *    "output": "_IO_EM_DO_{dd}",
   *    "input": "_IO_EM_DI_{dd}"
   * },
   * "analog" : {
   *   "input" : "_IO_EM_AI_{dd}",
   *    "output" : "_IO_EM_AO_{dd}"
   * }
   *
   */
  set pingMapping(pinout) {
    this._pingMapping = pinout;
  }
  /**
   * @property set function to replace pin, with parameters : (inputMapping,pin)
   */
  set replacePin(newReplacePin) {
    this._replacePin = newReplacePin;
  }
  /**
   * @description Connect with PLC
   */
  connect(ignoreIdentity?: boolean): Bluebird<boolean> {
    return new Bluebird((resolve, reject) => {
      if (this._connected) return resolve(true);
      const onError = (e: Error) => {
        reject(e);
        this._connected = false;
        this.emit("connect_error", e);
      };
      this._pool && this._pool.once("factoryCreateError", onError);
      return this.acquire("connect").then(async (socket: EIPSocket) => {
        this._pool && this._pool.off("factoryCreateError", onError);
        if (!ignoreIdentity) {
          try {
            await socket.getIdentity(this);
          } catch (error) {
            return onError(error);
          }
        }
        this._connected = true;
        this.emit("connect");
        resolve(true);
      });
    });
  }
  /**
   * Disconet to PLC and delete sockets
   */
  close() {
    return Bluebird.try<boolean>((): any => {
      if (this.disconnected || this._closing) return true;
      this._closing = true;
      this._pool && this._pool.removeAllListeners("factoryCreateError");
      return (
        this._pool &&
        this._pool.drain().then(() => {
          this.emit("closing");
          return (
            this._pool &&
            this._pool.clear().then(() => {
              this._connected = this._closing = false;
              this.emit("disconnect", "close connection");
            })
          );
        })
      );
    });
  }
  /**
   * @description Read tag in PLC
   * @param {String} tag Tag name to read
   * @param {Object} options { `count` : Num elements of value,  `dataType` : Data Type check `this.CIPDataType`}
   */
  read(tag: string, options: ITagReadOptions) {
    /**
 *  We have two options for reading depending on
  the arguments, read a single tag, or read an array
 */
    return Bluebird.try(() => {
      return super
        .acquire(socket => {
          if (Array.isArray(tag)) {
            if (tag.length === 1) return [socket.readTag(tag[0], options)];
            if (options.dataType)
              throw new TypeError(
                "Datatype should be set to None when reading lists"
              );
            return socket.multiReadTag(tag);
          } else {
            return socket.readTag(tag, options);
          }
        })
        .catch((err: Error) => {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              `Failed to read tag ${tag} timeout at ${this.connectTimeout}ms`
            );
          }
          throw err;
        });
    });
  }
  /**
   *
   * @param {String} tag Tag name to set value
   * @param {Boolean|String|Number|Array} value value to write in scope
   * @param {Object} options Options to change ex: timeout, dataType
   */
  write(
    tag: string,
    value: boolean | string | number | Array<number>,
    options = {}
  ) {
    /*  We have two options for writing depending on
    the arguments, write a single tag, or write an array */
    return Bluebird.try(() => {
      return super
        .acquire(socket => socket.writeTag(tag, value, options))
        .catch((err: Error) => {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              `Failed to write tag ${tag} timeout at ${this.connectTimeout}ms`
            );
            /*  err.value = value;
            err.tag = tag;
            err.timeout = this.connectTimeout; */
          }
          throw err;
        });
    });
  }
  /**
   * @description write to output using pin mapping
   * @param {Number|String} pin
   * @param {Number|Boolean}} value
   */
  digitalWrite(
    pin: number | string,
    value: boolean | number,
    options: ITagWriteOptions = {
      dataType: CIPTypesValues.BOOL
    }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin, value);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["digital"]["output"],
          pin.toString()
        ).then(async tag => {
          return this.write(tag, Number(value), options).then(
            () => new Pin(tag, value)
          );
        })
      );
    });
  }
  /**
   * @description read digital output using pin mapping
   * @param {Number} pin
   */
  digitalOutRead(
    pin: number | string,
    options: ITagReadOptions = { dataType: CIPTypesValues.BOOL }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["digital"]["output"],
          pin.toString()
        ).then(async tag => {
          return this.read(tag, options).then(value => new Pin(tag, value));
        })
      );
    });
  }
  /**
   * @description read digital input using pin mapping
   * @param {Number} pin
   */
  digitalRead(
    pin: number | string,
    options: ITagReadOptions = { dataType: CIPTypesValues.BOOL }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["digital"]["input"],
          pin.toString()
        ).then(async tag => {
          return this.read(tag, options).then(value => new Pin(tag, value));
        })
      );
    });
  }
  /**
   * @description write analog output pin using pin mapping
   * @param {Number} pin
   * @param {Number} value
   */
  analogWrite(
    pin: number | string,
    value: number,
    options: ITagWriteOptions = { dataType: CIPTypesValues.UINT }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin, value);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["analog"]["output"],
          pin.toString()
        ).then(async tag => {
          return this.write(tag, Number(value), options).then(
            _ => new Pin(tag, value)
          );
        })
      );
    });
  }
  /**
   * @description read analog output pin using pin mapping
   * @param {Number} pin
   */
  analogOutRead(
    pin: number | string,
    options: ITagReadOptions = { dataType: CIPTypesValues.UINT }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["analog"]["output"],
          pin.toString()
        ).then(async tag => {
          return this.read(tag, options).then(value => new Pin(tag, value));
        })
      );
    });
  }
  /**
   * @description read analog input pin using pin mapping
   * @param {Number} pin
   */
  analogRead(
    pin: number | string,
    options: ITagReadOptions = { dataType: CIPTypesValues.UINT }
  ): Bluebird<Pin | undefined> {
    return Bluebird.try<Pin | undefined>(() => {
      this._checkPin(pin);
      return (
        this._pingMapping &&
        this._getPinMapping(
          this._pingMapping["analog"]["input"],
          pin.toString()
        ).then(async tag => {
          return this.read(tag, options).then(value => new Pin(tag, value));
        })
      );
    });
  }
  /**
   * @description Read multiple tags in one request
   * @param {Array} tags
   */
  multiRead(tags: Array<string>): Bluebird<LgxResponse[]> {
    return Bluebird.try(() =>
      super.acquire(socket => socket.multiReadTag(tags))
    );
  }
  /**
   * @description Retrieves the tag list from the PLC
   *     Optional parameter allTags set to True
   *     If is set to False, it will return only controller
   *     otherwise controller tags and program tags.
   */
  getTagList() {
    return Bluebird.try(() => super.acquire(socket => socket.getTagList()));
  }
  /**
   * @descriptionRetrieves a program tag list from the PLC
   *    programName = "Program:ExampleProgram"
   */
  getProgramTagList(programName: string) {
    return Bluebird.try(() =>
      super.acquire(socket => socket.getProgramTagList(programName))
    );
  }
  /**
   * @description Retrieves a program names list from the PLC
   *    Sanity check: checks if programNames is empty
   *     and runs _getTagList
   */
  getProgramList(): Promise<string[]> {
    return Bluebird.try(() =>
      super.acquire(socket => socket.getProgramsList())
    );
  }
  /**
   * @description  Get the properties of module in specified slot
   * @param {Number} slot
   */
  getModuleProperties(slot: number = 0) {
    return Bluebird.try<LGXDevice>(() =>
      super.acquire(socket => socket.getModuleProperties(slot))
    );
  }
  /**
   * @description get current time
   * @param {Boolean} raw get microseconds
   * @return {Date|Number}
   */
  getWallClockTime(raw: boolean) {
    return Bluebird.try<number | Date>(() =>
      super.acquire(socket => socket.getWallClockTime(raw))
    );
  }
  /**
   * @description Set current time
   */
  setWallClockTime(date?: Date) {
    return super.acquire(socket => {
      return Bluebird.try(() => socket.setWallClockTime(date));
    });
  }

  /**
   * @description Query all the EIP devices on the network
   * @param {Number} timeout
   * @param {Object} options
   * @returns {Bluebird<Array<LGXDevice>>} devices
   */
  static discover(
    timeout: number = 200,
    options?: IDiscoverOptions
  ): Bluebird<Array<LGXDevice>> {
    const {
      family = "IPv4",
      port = 44818,
      onFound,
      onError,
      ...socketOptions
    } = options || ({} as IDiscoverOptions);
    if (family !== "IPv4" && family !== "IPv6")
      throw new EvalError("Incorrect ip family, must be IPv4 or IPv6");
    const devices: Array<LGXDevice> = [];
    const clients = new Set();
    const platform = os.platform();
    return new Bluebird((resolve, reject) => {
      const request = EIPSocket.buildListIdentity();
      //get available ip addresses
      const addresses = flatten(Object.values(os.networkInterfaces()))
        .filter(
          (i: os.NetworkInterfaceInfo) => i.family === family && !i.internal
        )
        .map((i: os.NetworkInterfaceInfo) => i.address);
      // we're going to send a request for all available ipv4
      //  addresses and build a list of all the devices that reply
      for (const ip of addresses) {
        const socket: Socket & ICustomSocket = createSocket({
          type: `udp${family[3]}`,
          ...socketOptions
        });
        if (platform !== "linux") socket.bind(0, ip);

        const waitRecv = () => {
          socket.idTimeout = setTimeout(() => {
            socket.removeAllListeners();
            socket.unref();
            socket.close();
            clients.delete(socket);
            clients.size === 0 && resolve(devices);
          }, timeout);
        };

        socket.once("listening", () => {
          socket.setBroadcast(true);
          socket.setMulticastTTL(1);
          waitRecv();
          socket.send(
            request,
            port,
            family === "IPv4" ? "255.255.255.255" : "FFFF:FFFF:FFFF",
            (err, bytes) => {
              if (err) {
                socket.close();
                return reject(err);
              }
              clients.add(socket);
              socket.on("message", (msg, rinfo) => {
                socket.idTimeout && clearTimeout(socket.idTimeout);
                socket.idTimeout = undefined;
                const context = unpackFrom("<Q", msg, true, 14)[0];
                if (context.toString() === "470018779464") {
                  delete rinfo.size;
                  const device = parseIdentityResponse(msg, rinfo);
                  if (device instanceof LGXDevice && device.IPAddress) {
                    devices.push(device);
                    onFound && onFound(device, devices.length);
                  } else {
                    onError && onError(msg, rinfo);
                  }
                }
                waitRecv();
              });
            }
          );
        });
      }
    });
  }
  /**
   *
   * @param {Number} timeout @default 3000
   * @param {Object} options
   */
  discover(timeout: number, options: IDiscoverOptions) {
    return PLC.discover(timeout, {
      onFound: (...args: any[]) => this.emit("found", ...args),
      onError: (...args: any[]) => this.emit("found_error", ...args),
      ...options
    });
  }
  /**
   *
   * @param {Number|String} pin
   * @param {*} value
   */
  private _checkPin(pin: string | number, value?: any): void | never {
    if (pin === null || typeof pin === "undefined") {
      throw new TypeError("Invalid pin, must be different undefined or null");
    }
    if (arguments.length == 2 && typeof value === "undefined") {
      const err = new ValueError(
        `Must be pass value to write (false or true) invalid: ${value}`
      );
      throw err;
    }
  }
  /**
   * @prinvate
   * @description check valid mapping
   */
  private _getPinMapping(str: string, pin: string) {
    return Bluebird.try<string>(() => {
      if (!this.replacePin || !this._pingMapping)
        throw new PinMappingError(
          "invalid replacePin or pingMaping, please check, this.replacePin or this.pinMapping"
        );
      else if (!!this.replacePin) {
        try {
          return this.replacePin(str, pin);
        } catch (error) {
          throw error;
        }
      } else {
        throw new PinMappingError(
          "invalid replacePin or pingMaping, please check, this.replacePin"
        );
      }
    });
  }
  /**
   * @override Override toSTting method
   */
  toString() {
    return `[Object PLC ${this.host}]`;
  }
  /**
   * @override Override toJSON method
   */
  toJSON() {
    return {
      host: this.host,
      vendor: this.vendor,
      vendorId: this.vendorId,
      deviceType: this.deviceType,
      device: this.device,
      productCode: this.productCode,
      productName: this.productName,
      revision: this.revision,
      status: this.status,
      state: this.state,
      serialNumber: this.serialNumber,
      Micro800: this.Micro800
    };
  }
}

export default PLC;
