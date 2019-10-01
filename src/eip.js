"use strict";
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __rest =
  (this && this.__rest) ||
  function(s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
  };
Object.defineProperty(exports, "__esModule", { value: true });
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
// import Bluebird from "bluebird";
var os_1 = __importDefault(require("os"));
var net_1 = require("net");
var dgram_1 = __importDefault(require("dgram"));
var eip_pool_1 = __importStar(require("./eip-pool"));
var bluebird_1 = __importDefault(require("bluebird"));
var utils_1 = require("./utils");
var pin_mapping_json_1 = __importDefault(
  require("../resources/pin-mapping.json")
); // ping mapping to use digitalWrite... as Arduino
var errors_1 = require("./errors");
var TimeoutError = require("generic-pool/lib/errors").TimeoutError;
var Pin = /** @class */ (function() {
  function Pin(tagName, value) {
    this.tagName = tagName;
    this.value = value;
  }
  Pin.prototype.valueOf = function() {
    return this.value;
  };
  return Pin;
})();
var PLC = /** @class */ (function(_super) {
  __extends(PLC, _super);
  /**
   * @description Create instace of PLC using EIP (EthernetIP) protocol
   * @param {String|Object} IPAddress IP Address of PLC alternative pass Object with all options
   * @param {IEIPContextOptions} options Options to set if IPAddress typeof string
   */
  function PLC(host, options) {
    var _this =
      _super.call(
        this,
        typeof host === "object"
          ? Object.assign(PLC.defaultOptions, options, { host: host })
          : Object.assign(PLC.defaultOptions, options)
      ) || this;
    _this.id = "";
    _this.arduinoMode = false;
    _this._closing = false;
    if (typeof host === "string" && !host.length)
      throw new Error("Check empty IPAddress");
    else if (!net_1.isIP(host))
      throw new Error("IP Address no valid, check IP: " + host);
    if (_this.Micro800 && _this.arduinoMode) {
      _this._pingMapping = pin_mapping_json_1.default["Micro800"];
      _this.replacePin = utils_1._replacePin;
    }
    if (_this._pool) {
      _this._pool.on("factoryCreateError", function(err) {
        if (_this._connected && !_this.available) {
          _this._connected = false;
          _this.emit("disconnect", "lost connection");
        }
      });
    }
    return _this;
  }
  Object.defineProperty(PLC.prototype, "connected", {
    get: function() {
      return this._connected;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(PLC.prototype, "disconnected", {
    get: function() {
      return !this._connected;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(PLC.prototype, "connecting", {
    get: function() {
      return this._connecting;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(PLC.prototype, "pingMapping", {
    /**
     * @property get current pin mapping
     */
    get: function() {
      return this._pingMapping;
    },
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
    set: function(pinout) {
      this._pingMapping = pinout;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(PLC.prototype, "replacePin", {
    /**
     * @property get function to replace pin
     */
    get: function() {
      return this._replacePin && this._replacePin.bind(this);
    },
    /**
     * @property set function to replace pin, with parameters : (inputMapping,pin)
     */
    set: function(newReplacePin) {
      this._replacePin = newReplacePin;
    },
    enumerable: true,
    configurable: true
  });
  /**
   * Connect with PLC
   */
  PLC.prototype.connect = function() {
    var _this = this;
    return new bluebird_1.default(function(resolve, reject) {
      if (_this._connected) return resolve(true);
      var onError = function(e) {
        reject(e);
        _this._connected = false;
        _this.emit("connect_error", e);
      };
      _this._pool && _this._pool.once("factoryCreateError", onError);
      return _this.acquire("connect").then(function() {
        _this._pool && _this._pool.off("factoryCreateError", onError);
        _this._connected = true;
        _this.emit("connect");
        resolve(true);
      });
    });
  };
  /**
   * Disconet to PLC and delete sockets
   */
  PLC.prototype.close = function() {
    var _this = this;
    return bluebird_1.default.try(function() {
      if (_this.disconnected || _this._closing) return true;
      _this._closing = true;
      _this._pool && _this._pool.removeAllListeners("factoryCreateError");
      return (
        _this._pool &&
        _this._pool.drain().then(function() {
          _this.emit("closing");
          return (
            _this._pool &&
            _this._pool.clear().then(function() {
              _this._connected = _this._closing = false;
              _this.emit("disconnect", "close connection");
            })
          );
        })
      );
    });
  };
  /**
   * @description Read tag in PLC
   * @param {String} tag Tag name to read
   * @param {Object} options { `count` : Num elements of value,  `dataType` : Data Type check `this.CIPDataType`}
   */
  PLC.prototype.read = function(tag, options) {
    var _this = this;
    /**
     *  We have two options for reading depending on
      the arguments, read a single tag, or read an array
     */
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire
        .call(_this, function(socket) {
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
        .catch(function(err) {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              "Failed to read tag " +
                tag +
                " timeout at " +
                _this.connectTimeout +
                "ms"
            );
          }
          throw err;
        });
    });
  };
  /**
   *
   * @param {String} tag Tag name to set value
   * @param {Boolean|String|Number|Array} value value to write in scope
   * @param {Object} options Options to change ex: timeout, dataType
   */
  PLC.prototype.write = function(tag, value, options) {
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    /*  We have two options for writing depending on
        the arguments, write a single tag, or write an array */
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire
        .call(_this, function(socket) {
          return socket.writeTag(tag, value, options);
        })
        .catch(function(err) {
          if (err instanceof TimeoutError) {
            err = new TimeoutError(
              "Failed to write tag " +
                tag +
                " timeout at " +
                _this.connectTimeout +
                "ms"
            );
            /*  err.value = value;
                    err.tag = tag;
                    err.timeout = this.connectTimeout; */
          }
          throw err;
        });
    });
  };
  /**
   * @description write to output using pin mapping
   * @param {Number} pin
   * @param {Number|Boolean}} value
   */
  PLC.prototype.digitalWrite = function(pin, value, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin, value);
      _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["digital"]["output"], String(pin))
          .then(function(tag) {
            return tag
              ? _this.write(tag, Number(value), options).then(function(value) {
                  return new Pin(tag, value);
                })
              : undefined;
          });
    });
  };
  /**
   * @description read digital output using pin mapping
   * @param {Number} pin
   */
  PLC.prototype.digitalOutRead = function(pin, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin);
      return (
        _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["digital"]["output"], String(pin))
          .then(function(tag) {
            return tag
              ? _this.read(tag, options).then(function(value) {
                  return new Pin(tag, value);
                })
              : undefined;
          })
      );
    });
  };
  /**
   * @description read digital input using pin mapping
   * @param {Number} pin
   */
  PLC.prototype.digitalRead = function(pin, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin);
      return (
        _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["digital"]["input"], String(pin))
          .then(function(tag) {
            return !tag
              ? undefined
              : _this.read(tag, options).then(function(value) {
                  return new Pin(tag, value);
                });
          })
      );
    });
  };
  /**
   * @description write analog output pin using pin mapping
   * @param {Number} pin
   * @param {Number} value
   */
  PLC.prototype.analogWrite = function(pin, value, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin, value);
      return (
        _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["analog"]["output"], String(pin))
          .then(function(tag) {
            return !tag
              ? undefined
              : _this.write(tag, Number(value), options).then(function(value) {
                  return new Pin(tag, value);
                });
          })
      );
    });
  };
  /**
   * @description read analog output pin using pin mapping
   * @param {Number} pin
   */
  PLC.prototype.analogOutRead = function(pin, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin);
      return (
        _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["analog"]["output"], String(pin))
          .then(function(tag) {
            return !tag
              ? undefined
              : _this.read(tag, options).then(function(value) {
                  return new Pin(tag, value);
                });
          })
      );
    });
  };
  /**
   * @description read analog input pin using pin mapping
   * @param {Number} pin
   */
  PLC.prototype.analogRead = function(pin, options) {
    var _this = this;
    return bluebird_1.default.try(function() {
      _this._checkPin(pin);
      return (
        _this._pingMapping &&
        _this
          ._getPinMapping(_this._pingMapping["analog"]["input"], String(pin))
          .then(function(tag) {
            return !tag
              ? undefined
              : _this.read(tag, options).then(function(value) {
                  return new Pin(tag, value);
                });
          })
      );
    });
  };
  /**
   * @description Read multiple tags in one request
   * @param {Array} tags
   */
  PLC.prototype.multiRead = function(tags) {
    var _this = this;
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire.call(_this, function(socket) {
        return socket.multiReadTag(tags);
      });
    });
  };
  /**
   * @description Retrieves the tag list from the PLC
   *     Optional parameter allTags set to True
   *     If is set to False, it will return only controller
   *     otherwise controller tags and program tags.
   */
  PLC.prototype.getTagList = function() {
    var _this = this;
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire.call(_this, function(socket) {
        return socket.getTagList();
      });
    });
  };
  /**
   * @descriptionRetrieves a program tag list from the PLC
   *    programName = "Program:ExampleProgram"
   */
  PLC.prototype.getProgramTagList = function(programName) {
    var _this = this;
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire.call(_this, function(socket) {
        return socket.getProgramTagList(programName);
      });
    });
  };
  /**
   * @description Retrieves a program names list from the PLC
   *    Sanity check: checks if programNames is empty
   *     and runs _getTagList
   */
  PLC.prototype.getProgramList = function() {
    var _this = this;
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire.call(_this, function(socket) {
        return socket.getProgramsList();
      });
    });
  };
  /**
   * @description  Get the properties of module in specified slot
   * @param {Number} slot
   */
  PLC.prototype.getModuleProperties = function(slot) {
    var _this = this;
    if (slot === void 0) {
      slot = 0;
    }
    return bluebird_1.default.try(function() {
      return _super.prototype.acquire.call(_this, function(socket) {
        return socket.getModuleProperties(slot);
      });
    });
  };
  /**
   * @description get current time
   * @param {Boolean} raw get microseconds
   * @return {Date|Number}
   */
  PLC.prototype.getTime = function(raw) {
    return _super.prototype.acquire.call(this, function(socket) {
      return bluebird_1.default.try(function() {
        return socket.getTime(raw);
      });
    });
  };
  /**
   * @description Set current time
   */
  PLC.prototype.setTime = function() {
    return _super.prototype.acquire.call(this, function(socket) {
      return bluebird_1.default.try(function() {
        return socket.setTime();
      });
    });
  };
  /**
   * @description Build the list identity request for discovering Ethernet I/P
   *     devices on the network
   */
  PLC.buildListIdentity = function() {
    return utils_1.pack(
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
  };
  /**
   * @description Query all the EIP devices on the network
   * @param {Number} timeout
   * @param {Object} options
   * @returns {Bluebird<Array<LGXDevice>>} devices
   */
  PLC.discover = function(timeout, options) {
    if (timeout === void 0) {
      timeout = 200;
    }
    var _a = options || {},
      _b = _a.family,
      family = _b === void 0 ? "IPv4" : _b,
      onFound = _a.onFound,
      socketOptions = __rest(_a, ["family", "onFound"]);
    if (family !== "IPv4" && family !== "IPv6")
      throw new EvalError("Incorrect ip family, must be IPv4 or IPv6");
    var devices = [];
    var clients = new Set();
    var platform = os_1.default.platform();
    return new bluebird_1.default(function(resolve, reject) {
      var request = PLC.buildListIdentity();
      var port = PLC.defaultOptions.port || 44818;
      //get available ip addresses
      var addresses = utils_1
        .flatten(Object.values(os_1.default.networkInterfaces()))
        .filter(function(i) {
          return i.family === family && !i.internal;
        })
        .map(function(i) {
          return i.address;
        });
      var _loop_1 = function(ip) {
        var socket = dgram_1.default.createSocket(
          __assign({ type: "udp" + family[3] }, socketOptions)
        );
        if (platform !== "linux") socket.bind(0, ip);
        var waitRecv = function() {
          socket.idTimeout = setTimeout(function() {
            socket.removeAllListeners();
            socket.unref();
            socket.close();
            clients.delete(socket);
            clients.size === 0 && resolve(devices);
          }, timeout);
        };
        socket.once("listening", function() {
          //socket.setMulticastInterface("255.255.255.255");
          socket.setBroadcast(true);
          socket.setMulticastTTL(1);
          waitRecv();
          socket.send(request, port, "255.255.255.255", function(err, bytes) {
            if (err) {
              socket.close();
              return reject(err);
            }
            clients.add(socket);
            socket.on("message", function(msg, rinfo) {
              socket.idTimeout && clearTimeout(socket.idTimeout);
              socket.idTimeout = undefined;
              var context = utils_1.unpackFrom("<Q", msg, true, 14)[0];
              if (context.toString() === "470018779464") {
                delete rinfo.size;
                var device = utils_1._parseIdentityResponse(msg, rinfo);
                if (device && device.IPAddress) {
                  devices.push(device);
                  onFound && onFound(device, devices.length);
                }
              }
              waitRecv();
            });
          });
        });
      };
      // we're going to send a request for all available ipv4
      //  addresses and build a list of all the devices that reply
      for (var _i = 0, addresses_1 = addresses; _i < addresses_1.length; _i++) {
        var ip = addresses_1[_i];
        _loop_1(ip);
      }
    });
  };
  /**
   *
   * @param {Number} timeout @default 3000
   * @param {Object} options
   */
  PLC.prototype.discover = function(timeout, options) {
    var _this = this;
    return PLC.discover(
      timeout,
      __assign(
        {
          onFound: function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return _this.emit.apply(_this, __spreadArrays(["found"], args));
          }
        },
        options
      )
    );
  };
  /**
   *
   * @param {Number|String} pin
   * @param {*} value
   */
  PLC.prototype._checkPin = function(pin, value) {
    if (pin === null || typeof pin === "undefined") {
      throw new TypeError("Invalid pin, must be different undefined or null");
    }
    if (arguments.length == 2 && typeof value === "undefined") {
      var err = new errors_1.ValueError(
        "Must be pass value to write (false or true) invalid: " + value
      );
      throw err;
    }
  };
  /**
   * @prinvate
   * @description check valid mapping
   */
  PLC.prototype._getPinMapping = function(str, pin) {
    var _this = this;
    return bluebird_1.default.try(function() {
      if (!_this._replacePin || !_this._pingMapping)
        throw new errors_1.PinMappingError(
          "invalid replacePin or pingMaping, please check, this.replacePin or this.pinMapping"
        );
      try {
        return _this.replacePin && _this.replacePin(str, pin);
      } catch (error) {
        throw error;
      }
    });
  };
  /**
   * @description get CIPTypes number foreach avaible dataType
   */
  PLC.CIPTypes = Object.keys(eip_pool_1.CIPTypes)
    .map(function(key) {
      var _a;
      return (_a = {}), (_a[eip_pool_1.CIPTypes[key][1]] = key), _a;
    })
    .reduce(function(result, item) {
      var key = Object.keys(item)[0];
      result[key] = parseInt(item[key]);
      return result;
    }, {});
  PLC.defaultOptions = {
    allowHalfOpen: true,
    Micro800: true,
    port: 44818,
    connectTimeout: 3000,
    arduinoMode: true,
    pool: {
      min: 0,
      max: 3,
      Bluebird: bluebird_1.default,
      priorityRange: 2,
      fifo: false,
      testOnBorrow: true,
      evictionRunIntervalMillis: 17000,
      idleTimeoutMillis: 30000
    }
  };
  return PLC;
})(eip_pool_1.default);
exports.default = PLC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ2I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0gsbUNBQW1DO0FBQ25DLDBDQUFvQjtBQUNwQiwyQkFBMkI7QUFDM0IsZ0RBQTZDO0FBQzdDLHFEQUFxRDtBQUNyRCxzREFBZ0M7QUFDaEMsaUNBTWlCO0FBQ2pCLG1GQUF1RCxDQUFDLGlEQUFpRDtBQUN6RyxtQ0FVa0I7QUFTVixJQUFBLDhEQUFZLENBQXdDO0FBRTVEO0lBQ0UsYUFBbUIsT0FBZSxFQUFTLEtBQVU7UUFBbEMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUFTLFVBQUssR0FBTCxLQUFLLENBQUs7SUFBRyxDQUFDO0lBQ3pELHFCQUFPLEdBQVA7UUFDRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNILFVBQUM7QUFBRCxDQUFDLEFBTEQsSUFLQztBQTZCRDtJQUFpQyx1QkFBYTtJQWtDNUM7Ozs7T0FJRztJQUNILGFBQ0UsSUFBb0MsRUFDcEMsT0FBc0M7UUFGeEMsWUFJRSxrQkFDRSxPQUFPLElBQUksS0FBSyxRQUFRO1lBQ3RCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxNQUFBLEVBQUUsQ0FBQztZQUN0RCxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUMvQyxTQWtCRjtRQWhFRCxRQUFFLEdBQVcsRUFBRSxDQUFDO1FBQ2hCLGlCQUFXLEdBQVksS0FBSyxDQUFDO1FBQ3JCLGNBQVEsR0FBWSxLQUFLLENBQUM7UUE2Q2hDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJ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
