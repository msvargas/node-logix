"use strict";
/**
 *
 * @author Michael Vargas - node-logix
 * (msvargas97@gmail.com)
 * @copyright
 * source python code and lincese:
   Originally created by Burt Peterson
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
const { isIP } = require("net");
const Promise = require("bluebird");
const { unpackFrom, pack } = require("python-struct");

const { GetDevice, GetVendor, LGXDevice } = require("./lgxDevice");
const EIPSocketPool = require("./eip-pool");
const CIPTypes = require("./CIPTypes");
const { inet_ntoa, _replacePin } = require("./utils");
const pinMapping = require("./pin-mapping.json"); // ping mapping to use digitalWrite... as Arduino
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

class PLC extends EIPSocketPool {
  /**
   * @description Create instace of PLC using EIP (EthernetIP) protocol
   * @param {String|Object} IPAddress IP Address of PLC alternative pass Object with all options
   * @param {Object} options Options to set if IPAddress typeof string
   */
  constructor(host, options = {}) {
    if (typeof host === "object") Object.assign(options, host);
    else if (typeof host !== "string")
      throw new TypeError(
        `constructor only pass string (IP) or object with options, not accept '${typeof IPAddress}'`
      );
    else if (!host.length) throw new Error("Check empty IPAddress");
    else if (!isIP(host))
      throw new Error("IP Address no valid, check IP: " + host);
    else Object.assign(options, { host });
    options = Object.assign(PLC.defaultOptions, options);
    const id = options.id;
    delete options.id;
    super(options);
    this.id = id;
    if (this.Micro800) {
      this._pingMapping = pinMapping["Micro800"];
      this.replacePin = _replacePin;
    }
  }
  get connected() {
    return this._connected;
  }
  get disconnected() {
    return !this._connected;
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
      return this.acquire("connect")
        .then(release => {
          this._pool.off("factoryCreateError", onError);
          this._connected = true;
          return release && release();
        })
        .then(() => this.emit("connect"))
        .then(resolve);
    });
  }
  /**
   * Disconet to PLC and delete sockets
   */
  close() {
    return Promise.try(async () => {
      if (this.disconnected || this._closing) return true;
      this._closing = true;
      return this._pool.drain().then(() => {
        this.emit("draining");
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
      return super.acquire(socket => {
        if (Array.isArray(tag)) {
        } else {
          //console.log(socket)
          return socket.readTag(tag, options);
        }
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
      return super.acquire("write").spread((socket, release) => {
        if (Array.isArray(tag)) {
        } else {
          return socket
            .writeTag(tag, value, options)
            .finally(() => release && release());
        }
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
      return this._getPinMapping(
        this._pingMapping["digital"]["output"],
        String(pin)
      ).then(tag => {
        return this.write(tag, Number(value), options);
      });
    });
  }
  /**
   * @description read digital output using pin mapping
   * @param {Number} pin
   */
  digitalOutRead(pin, options) {
    return Promise.try(() => {
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
      return this._getPinMapping(
        this._pingMapping["digital"]["input"],
        String(pin)
      ).then(tag => {
        return this.read(tag, options);
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
      return this._getPinMapping(
        this._pingMapping["analog"]["input"],
        String(pin)
      ).then(tag => {
        return this._readTag(tag, options);
      });
    });
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

/**
 * @description we're going to take the packet and parse all the data that is in it.
 * @param {Buffer|Array} data
 */
function _parseIdentityResponse(data) {
  const resp = new LGXDevice();
  resp.Length = unpackFrom("<H", data, true, 28)[0];
  resp.EncapsulationVersion = unpackFrom("<H", data, true, 30)[0];

  const longIP = unpackFrom("<I", data, true, 36)[0];
  resp.IPAddress = inet_ntoa(parseInt(pack("<L", longIP).toString("hex"), 16));

  resp.VendorID = unpackFrom("<H", data, true, 48)[0];
  resp.Vendor = GetVendor(resp.VendorID);

  resp.DeviceID = unpackFrom("<H", data, true, 50)[0];
  resp.Device = GetDevice(resp.DeviceID);

  resp.ProductCode = unpackFrom("<H", data, true, 52)[0];
  const major = unpackFrom("<B", data, true, 54)[0];
  const minor = unpackFrom("<B", data, true, 55)[0];
  resp.Revision = major + "." + minor;

  resp.Status = unpackFrom("<H", data, true, 56)[0];
  resp.SerialNumber = hex(unpackFrom("<I", data, true, 58)[0]);
  resp.ProductNameLength = unpackFrom("<B", data, true, 62)[0];
  resp.ProductName = data
    .slice(63, 63 + resp.ProductNameLength)
    .toString("utf8");

  const state = data.slice(-1);
  resp.State = unpackFrom("<B", state, true, 0)[0];

  return resp;
}

function parseLgxTag(packet, programName) {}

function LgxTag() {
  this.TagName = "";
  this.InstanceID = 0x00;
  this.SymbolType = 0x00;
  this.DataTypeValue = 0x00;
  this.DataType = "";
  this.Array = 0x00;
  this.Struct = 0x00;
  this.Size = 0x00;
}

PLC.defaultOptions = {
  Micro800: true,
  port: 44818,
  connectTimeout: 3000,
  pool: {
    min: 0,
    max: 3
  }
};

/**
 * @description get CIPTypes number foreach avaible dataType
 */
PLC.CIPTypes = Object.keys(CIPTypes)
  .map(key => ({ [CIPTypes[key][1]]: key }))
  .reduce(function(result, item) {
    const key = Object.keys(item)[0];
    result[key] = parseInt(item[key]);
    return result;
  }, {});
/**
 * @description Instance Errors
 */
PLC.TimeoutError = Promise.TimeoutError;
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
