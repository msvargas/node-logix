"use strict";
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
const os = require("os");
const dgram = require("dgram");
const { isIP } = require("net");
const Promise = require("bluebird");
const { TimeoutError } = require("generic-pool/lib/errors");

const EIPSocketPool = require("./eip-pool");
const {
  _replacePin,
  flatten,
  _parseIdentityResponse,
  pack,
  LGXDevice,
  unpackFrom
} = require("./utils");
const pinMapping = require("../assets/pin-mapping.json"); // ping mapping to use digitalWrite... as Arduino
const {
  ValueError,
  LogixError,
  ConnectionError,
  DisconnectedError,
  RegisterSessionError,
  ConnectionLostError,
  ConnectionTimeoutError,
  ForwarOpenError,
  PinMappingError
} = require("./errors");

function Pin(tagName, value) {
  this.tagName = tagName;
  this.value = value;
}

Pin.prototype.valueOf = function() {
  return this.value;
};

class PLC extends EIPSocketPool {
  /**
   * @description Create instace of PLC using EIP (EthernetIP) protocol
   * @param {String|Object} IPAddress IP Address of PLC alternative pass Object with all options
   * @param {Object} options Options to set if IPAddress typeof string
   */
  constructor(host, options = {}) {
    if (typeof host === "object") Object.assign(options, host);
    else if (typeof host !== "string") return super();
    else if (!host.length) throw new Error("Check empty IPAddress");
    else if (!isIP(host))
      throw new Error("IP Address no valid, check IP: " + host);
    else Object.assign(options, { host });
    options = Object.assign(PLC.defaultOptions, options);
    const id = options.id;
    delete options.id;
    super(options);
    this.id = id;
    this.arduinoMode = false;
    if (this.Micro800 && this.arduinoMode) {
      this._pingMapping = pinMapping["Micro800"];
      this.replacePin = _replacePin;
    }
    this.knownPins = {};
    this._pool.on("factoryCreateError", err => {
      if (this._connected && !this.available) {
        this._connected = false;
        this.emit("disconnect", "lost connection");
      }
    });
  }
  get connected() {
    return this._connected;
  }
  get disconnected() {
    return !this._connected;
  }
  get connecting() {
    return this._connecting;
  }
  get closing() {
    return this._closing;
  }
  /**
   * @description custom pin mapping to use with digitalWrite, digitalRead, analogWrite and analogRead functions
   * @property set
   * @param {Object} pinout
   * @example if Micro800 == true use pin mapping =>
   * {
    "digital" : {
        "output": "_IO_EM_DO_{dd}",
        "input": "_IO_EM_DI_{dd}"
    },
    "analog" : {
        "input" : "_IO_EM_AI_{dd}",
        "output" : "_IO_EM_AO_{dd}"
    }
  }`
   */
  set pingMapping(pinout) {
    this._pingMapping = pinout;
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
    return this._replacePin.bind(this);
  }
  /**
   * @property set function to replace pin, with parameters : (inputMapping,pin)
   */
  set replacePin(newReplacePin) {
    this._replacePin = newReplacePin;
  }
  /**
   * Connect with PLC
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this._connected) return resolve(true);
      const onError = e => {
        reject(e);
        this._connected = false;
        this.emit("connect_error", e);
      };
      this._pool.once("factoryCreateError", onError);
      return this.acquire("connect").then(() => {
        this._pool.off("factoryCreateError", onError);
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
    return Promise.try(() => {
      if (this.disconnected || this._closing) return true;
      this._closing = true;
      this._pool.removeAllListeners("factoryCreateError");
      return this._pool.drain().then(() => {
        this.emit("closing");
        return this._pool.clear().then(() => {
          this._connected = this._closing = false;
          this.emit("disconnect", "close connection");
        });
      });
    });
  }
  /**
   * @description Read tag in PLC
   * @param {String} tag Tag name to read
   * @param {Object} options { `count` : Num elements of value,  `dataType` : Data Type check `this.CIPDataType`}
   */
  read(tag, options) {
    /**
 *  We have two options for reading depending on
  the arguments, read a single tag, or read an array
 */
    return Promise.try(() => {
      return super
        .acquire(socket => {
          if (Array.isArray(tag)) {
          } else {
            return socket.readTag(tag, options);
          }
        })
        .catch(err => {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              `Failed to read tag ${tag} timeout at ${this.connectTimeout}ms`
            );
            err.tag = tag;
            err.timeout = this.connectTimeout;
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
  write(tag, value, options = {}) {
    /*  We have two options for writing depending on
    the arguments, write a single tag, or write an array */
    return Promise.try(() => {
      return super
        .acquire(socket => {
          if (Array.isArray(tag)) {
          } else {
            return socket.writeTag(tag, value, options);
          }
        })
        .catch(err => {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              `Failed to write tag ${tag} timeout at ${this.connectTimeout}ms`
            );
            err.value = value;
            err.tag = tag;
            err.timeout = this.connectTimeout;
          }
          throw err;
        });
    });
  }
  /**
   * @description write to output using pin mapping
   * @param {Number} pin
   * @param {Number|Boolean}} value
   */
  digitalWrite(pin, value, options) {
    return Promise.try(() => {
      this._checkPin(pin, value);
      return this._getPinMapping(
        this._pingMapping["digital"]["output"],
        String(pin)
      ).then(tag => {
        return this.write(tag, Number(value), options).then(
          () => new Pin(tag, value)
        );
      });
    });
  }
  /**
   * @description read digital output using pin mapping
   * @param {Number} pin
   */
  digitalOutRead(pin, options) {
    return Promise.try(() => {
      this._checkPin(pin);
      return this._getPinMapping(
        this._pingMapping["digital"]["output"],
        String(pin)
      ).then(tag => {
        return this.read(tag, options);
      });
    });
  }
  /**
   * @description read digital input using pin mapping
   * @param {Number} pin
   */
  digitalRead(pin, options) {
    return Promise.try(() => {
      this._checkPin(pin);
      return this._getPinMapping(
        this._pingMapping["digital"]["input"],
        String(pin)
      ).then(tag => {
        return this.read(tag, options).then(value =>
          this._returnMapping(tag, value)
        );
      });
    });
  }
  /**
   * @description write analog output pin using pin mapping
   * @param {Number} pin
   * @param {Number} value
   */
  analogWrite(pin, value, options) {
    return Promise.try(() => {
      this._checkPin(pin, value);
      return this._getPinMapping(
        this._pingMapping["analog"]["output"],
        String(pin)
      ).then(tag => {
        return this.write(tag, Number(value), options);
      });
    });
  }
  /**
   * @description read analog output pin using pin mapping
   * @param {Number} pin
   */
  analogOutRead(pin, options) {
    return Promise.try(() => {
      this._checkPin(pin);
      return this._getPinMapping(
        this._pingMapping["analog"]["output"],
        String(pin)
      ).then(tag => {
        return this.read(tag, options);
      });
    });
  }
  /**
   * @description read analog input pin using pin mapping
   * @param {Number} pin
   */
  analogRead(pin, options) {
    return Promise.try(() => {
      this._checkPin(pin);
      return this._getPinMapping(
        this._pingMapping["analog"]["input"],
        String(pin)
      ).then(tag => {
        return this._readTag(tag, options);
      });
    });
  }
  /**
   * @description Build the list identity request for discovering Ethernet I/P
   *     devices on the network
   */
  static buildListIdentity() {
    return pack(
      "<HHIIHHHHI",
      0x63, // ListService
      0x00, // ListLength
      0x00, // ListSessionHandle
      0x00, // ListStatus
      0xfa, // ListResponse
      0x6948, // ListContext1
      0x6f4d, // ListContext2
      0x006d, // ListContext3
      0x00 // ListOptions
    );
  }
  /**
   * @param {Number} timeout
   * @param {Object} options
   * @description Query all the EIP devices on the network
   * @returns {Promise<Array<LGXDevice>>} devices
   */
  static discover(timeout = 10000, options) {
    const { family = "IPv4", waitTime = 2000, onFound, ...socketOptions } =
      options || {};
    if (family !== "IPv4" && family !== "IPv6")
      throw new EvalError("Incorrect ip family, must be IPv4 or IPv6");
    const devices = [];
    const clients = new Set();
    const platform = os.platform();
    return new Promise((resolve, reject) => {
      const request = PLC.buildListIdentity();
      const port = PLC.defaultOptions.port || 44818;
      //get available ip addresses
      const addresses = flatten(Object.values(os.networkInterfaces()))
        .filter(i => i.family === family && !i.internal)
        .map(i => i.address);
      // we're going to send a request for all available ipv4
      //  addresses and build a list of all the devices that reply
      setTimeout(() => {
        for (const client of clients.values()) {
          client.idTimeout && clearInterval(client.idTimeout);
          client.close();
          clients.delete(client);
        }
        resolve(devices);
      }, timeout);

      for (const ip of addresses) {
        let socket = dgram.createSocket({
          type: `udp${family[3]}`,
          ...socketOptions
        });
        if (platform !== "linux") socket.bind(0, ip);
        const checkResolve = () => clients.size === 0 && resolve(devices);
        const waitRecv = () => {
          socket.idTimeout = setTimeout(() => {
            socket.off("message", onMessage);
            socket.removeAllListeners();
            socket.unref();
            socket.close();
            clients.delete(socket);
            checkResolve();
          }, waitTime);
        };
        const onMessage = msg => {
          socket.idTimeout && clearTimeout(socket.idTimeout);
          socket.idTimeout = undefined;
          const context = unpackFrom("<Q", msg, true, 14)[0];
          if (context.toString() === "470018779464") {
            delete rinfo.size;
            const device = _parseIdentityResponse(msg, rinfo);
            if (device.IPAddress) {
              devices.push(device);
              onFound && onFound(device, devices.length);
            }
          } else waitRecv();
        };
        socket.once("listening", () => {
          //socket.setMulticastInterface("255.255.255.255");
          socket.setBroadcast(true);
          socket.setMulticastTTL(1);
          socket.send(request, port, "255.255.255.255", (err, bytes) => {
            if (err) {
              socket.close();
              return reject(err);
            }
            clients.add(socket);
            socket.on("message", onMessage);
            checkResolve();
            waitRecv();
          });
        });
      }
    });
  }
  /**
   *
   * @param {Number} timeout @default 3000
   * @param {Object} options
   */
  discover(timeout, options) {
    return PLC.discover(timeout, {
      onFound: (...args) => this.emit("found", ...args),
      ...options
    });
  }
  /**
   *
   * @param {Number|String} pin
   * @param {*} value
   */
  _checkPin(pin, value) {
    if (pin === null || typeof pin === "undefined") {
      throw new TypeError("Invalid pin, must be different undefined or null");
    }
    if (arguments.length == 2 && typeof value === "undefined") {
      const err = new ValueError(
        `Must be pass value to write (false or true) invalid: ${value}`
      );
      err.pin = pin;
      err.value = value;
      throw err;
    }
  }
  /**
   * @returns {Pin}
   * @param {String} tagName
   * @param {*} value
   */
  _returnMapping(tagName, value) {
    return new Pin(tagName, value);
  }
  /**
   * @prinvate
   * @description check valid mapping
   */
  _getPinMapping(str, pin) {
    return Promise.try(() => {
      if (!this._replacePin || !this._pingMapping)
        throw new PinMappingError(
          "invalid replacePin or pingMaping, please check, this.replacePin or this.pinMapping"
        );
      try {
        return this.replacePin(str, pin);
      } catch (error) {
        throw error;
      }
    });
  }
}

PLC.defaultOptions = {
  allowHalfOpen: true,
  Micro800: true,
  port: 44818,
  connectTimeout: 3000,
  arduinoMode: true,
  pool: {
    min: 0,
    max: 3,
    Promise,
    priorityRange: 2,
    fifo: false,
    testOnBorrow: true,
    evictionRunIntervalMillis: 17000,
    idleTimeoutMillis: 30000
  }
};

/**
 * @description get CIPTypes number foreach avaible dataType
 */
PLC.CIPTypes = Object.keys(EIPSocketPool.CIPTypes)
  .map(key => ({ [EIPSocketPool.CIPTypes[key][1]]: key }))
  .reduce(function(result, item) {
    const key = Object.keys(item)[0];
    result[key] = parseInt(item[key]);
    return result;
  }, {});
/**
 * @description Instance Errors
 */
PLC.TimeoutError = TimeoutError;
PLC.LogixError = LogixError;
PLC.ValueError = ValueError;
PLC.ConnectionError = ConnectionError;
PLC.ConnectionTimeoutError = ConnectionTimeoutError;
PLC.ConnectionLostError = ConnectionLostError;
PLC.ForwarOpenError = ForwarOpenError;
PLC.RegisterSessionError = RegisterSessionError;
PLC.DisconnectedError = DisconnectedError;

module.exports = PLC;
exports.default = PLC;
