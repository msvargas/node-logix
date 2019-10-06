var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import os from "os";
import { isIP } from "net";
import { createSocket } from "dgram";
import Bluebird from "bluebird";
import EIPSocketPool, { EIPSocket } from "./eip-pool";
import LGXDevice from "./lgxDevice";
import { _replacePin as replacePin, flatten, parseIdentityResponse, unpackFrom } from "./utils";
import { ValueError, LogixError, ConnectionError, DisconnectedError, RegisterSessionError, ConnectionLostError, ConnectionTimeoutError, ForwarOpenError, PinMappingError } from "./errors";
import pinMapping from "../resources/pin-mapping.json";
var TimeoutError = require("generic-pool/lib/errors").TimeoutError;
var Pin = (function () {
    function Pin(tagName, value) {
        this.tagName = tagName;
        this.value = value;
    }
    Pin.prototype.valueOf = function () {
        return this.value;
    };
    return Pin;
}());
export { Pin };
export var CIPTypesValues;
(function (CIPTypesValues) {
    CIPTypesValues[CIPTypesValues["STRUCT"] = 160] = "STRUCT";
    CIPTypesValues[CIPTypesValues["BOOL"] = 193] = "BOOL";
    CIPTypesValues[CIPTypesValues["SINT"] = 194] = "SINT";
    CIPTypesValues[CIPTypesValues["INT"] = 195] = "INT";
    CIPTypesValues[CIPTypesValues["DINT"] = 196] = "DINT";
    CIPTypesValues[CIPTypesValues["LINT"] = 197] = "LINT";
    CIPTypesValues[CIPTypesValues["USINT"] = 198] = "USINT";
    CIPTypesValues[CIPTypesValues["UINT"] = 199] = "UINT";
    CIPTypesValues[CIPTypesValues["UDINT"] = 200] = "UDINT";
    CIPTypesValues[CIPTypesValues["LWORD"] = 201] = "LWORD";
    CIPTypesValues[CIPTypesValues["REAL"] = 202] = "REAL";
    CIPTypesValues[CIPTypesValues["LREAL"] = 203] = "LREAL";
    CIPTypesValues[CIPTypesValues["DWORD"] = 211] = "DWORD";
    CIPTypesValues[CIPTypesValues["STRING"] = 218] = "STRING";
})(CIPTypesValues || (CIPTypesValues = {}));
var PLC = (function (_super) {
    __extends(PLC, _super);
    function PLC(host, options) {
        var _this = _super.call(this, typeof host === "string"
            ? Object.assign(PLC.defaultOptions, options, { host: host })
            : Object.assign(PLC.defaultOptions, options, host)) || this;
        _this.autoClose = true;
        _this._closing = false;
        try {
            if (typeof host === "object" && "autoClose" in host) {
                _this.autoClose = host.autoClose;
                _this.arduinoMode = host.arduinoMode;
            }
            else if (typeof options === "object") {
                _this.autoClose = options.autoClose;
                _this.arduinoMode = options.arduinoMode;
            }
        }
        catch (_a) { }
        if (typeof host === "string" && !host.length)
            throw new Error("Check empty IPAddress");
        else if (typeof host === "string" && !isIP(host))
            throw new Error("IP Address no valid, check IP: " + host);
        if (_this.Micro800 && _this.arduinoMode) {
            _this._pingMapping = pinMapping["Micro800"];
            _this.replacePin = replacePin;
        }
        if (_this._pool) {
            _this._pool.on("factoryCreateError", function (err) {
                if (_this._connected && !_this.available) {
                    _this._connected = false;
                    _this.emit("disconnect", err);
                }
            });
        }
        if (!!_this.autoClose) {
            var onExit = function () {
                _this.close();
            };
            process.once("SIGINT", onExit);
            process.once("SIGKILL", onExit);
            process.once("beforeExit", onExit);
        }
        return _this;
    }
    Object.defineProperty(PLC.prototype, "connected", {
        get: function () {
            return this._connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PLC.prototype, "disconnected", {
        get: function () {
            return !this._connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PLC.prototype, "connecting", {
        get: function () {
            return this._connecting;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PLC.prototype, "closing", {
        get: function () {
            return this._closing;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PLC.prototype, "pingMapping", {
        get: function () {
            return this._pingMapping;
        },
        set: function (pinout) {
            this._pingMapping = pinout;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PLC.prototype, "replacePin", {
        get: function () {
            return this._replacePin && this._replacePin.bind(this);
        },
        set: function (newReplacePin) {
            this._replacePin = newReplacePin;
        },
        enumerable: true,
        configurable: true
    });
    PLC.prototype.connect = function (ignoreIdentity) {
        var _this = this;
        return new Bluebird(function (resolve, reject) {
            if (_this._connected)
                return resolve(true);
            var onError = function (e) {
                reject(e);
                _this._connected = false;
                _this.emit("connect_error", e);
            };
            _this._pool && _this._pool.once("factoryCreateError", onError);
            return _this.acquire("connect").then(function (socket) { return __awaiter(_this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this._pool && this._pool.off("factoryCreateError", onError);
                            if (!!ignoreIdentity) return [3, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4, socket.getIdentity(this)];
                        case 2:
                            _a.sent();
                            return [3, 4];
                        case 3:
                            error_1 = _a.sent();
                            return [2, onError(error_1)];
                        case 4:
                            this._connected = true;
                            this.emit("connect");
                            resolve(true);
                            return [2];
                    }
                });
            }); });
        });
    };
    PLC.prototype.close = function () {
        var _this = this;
        return Bluebird.try(function () {
            if (_this.disconnected || _this._closing)
                return true;
            _this._closing = true;
            _this._pool && _this._pool.removeAllListeners("factoryCreateError");
            return (_this._pool &&
                _this._pool.drain().then(function () {
                    _this.emit("closing");
                    return (_this._pool &&
                        _this._pool.clear().then(function () {
                            _this._connected = _this._closing = false;
                            _this.emit("disconnect", "close connection");
                        }));
                }));
        });
    };
    PLC.prototype.read = function (tag, options) {
        var _this = this;
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) {
                if (Array.isArray(tag)) {
                    if (tag.length === 1)
                        return [socket.readTag(tag[0], options)];
                    if (options.dataType)
                        throw new TypeError("Datatype should be set to None when reading lists");
                    return socket.multiReadTag(tag);
                }
                else {
                    return socket.readTag(tag, options);
                }
            })
                .catch(function (err) {
                if (err instanceof TimeoutError) {
                    err = new TimeoutError("Failed to read tag " + tag + " timeout at " + _this.connectTimeout + "ms");
                }
                throw err;
            });
        });
    };
    PLC.prototype.write = function (tag, value, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.writeTag(tag, value, options); })
                .catch(function (err) {
                if (err instanceof TimeoutError) {
                    err = new TimeoutError("Failed to write tag " + tag + " timeout at " + _this.connectTimeout + "ms");
                }
                throw err;
            });
        });
    };
    PLC.prototype.digitalWrite = function (pin, value, options) {
        var _this = this;
        if (options === void 0) { options = {
            dataType: CIPTypesValues.BOOL
        }; }
        return Bluebird.try(function () {
            _this._checkPin(pin, value);
            _this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["digital"]["output"], String(pin)).then(function (tag) {
                    return tag
                        ? _this.write(tag, Number(value), options).then(function (_) { return new Pin(tag, value); })
                        : undefined;
                });
        });
    };
    PLC.prototype.digitalOutRead = function (pin, options) {
        var _this = this;
        if (options === void 0) { options = { dataType: CIPTypesValues.BOOL }; }
        return Bluebird.try(function () {
            _this._checkPin(pin);
            return (_this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["digital"]["output"], String(pin)).then(function (tag) {
                    return tag
                        ? _this.read(tag, options).then(function (value) { return new Pin(tag, value); })
                        : undefined;
                }));
        });
    };
    PLC.prototype.digitalRead = function (pin, options) {
        var _this = this;
        if (options === void 0) { options = { dataType: CIPTypesValues.BOOL }; }
        return Bluebird.try(function () {
            _this._checkPin(pin);
            return (_this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["digital"]["input"], String(pin)).then(function (tag) {
                    return !tag
                        ? undefined
                        : _this.read(tag, options).then(function (value) { return new Pin(tag, value); });
                }));
        });
    };
    PLC.prototype.analogWrite = function (pin, value, options) {
        var _this = this;
        if (options === void 0) { options = { dataType: CIPTypesValues.UINT }; }
        return Bluebird.try(function () {
            _this._checkPin(pin, value);
            return (_this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["analog"]["output"], String(pin)).then(function (tag) {
                    return !tag
                        ? undefined
                        : _this.write(tag, Number(value), options).then(function (_) { return new Pin(tag, value); });
                }));
        });
    };
    PLC.prototype.analogOutRead = function (pin, options) {
        var _this = this;
        if (options === void 0) { options = { dataType: CIPTypesValues.UINT }; }
        return Bluebird.try(function () {
            _this._checkPin(pin);
            return (_this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["analog"]["output"], String(pin)).then(function (tag) {
                    return !tag
                        ? undefined
                        : _this.read(tag, options).then(function (value) { return new Pin(tag, value); });
                }));
        });
    };
    PLC.prototype.analogRead = function (pin, options) {
        var _this = this;
        if (options === void 0) { options = { dataType: CIPTypesValues.UINT }; }
        return Bluebird.try(function () {
            _this._checkPin(pin);
            return (_this._pingMapping &&
                _this._getPinMapping(_this._pingMapping["analog"]["input"], String(pin)).then(function (tag) {
                    return !tag
                        ? undefined
                        : _this.read(tag, options).then(function (value) { return new Pin(tag, value); });
                }));
        });
    };
    PLC.prototype.multiRead = function (tags) {
        var _this = this;
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.multiReadTag(tags); });
        });
    };
    PLC.prototype.getTagList = function () {
        var _this = this;
        return Bluebird.try(function () { return _super.prototype.acquire.call(_this, function (socket) { return socket.getTagList(); }); });
    };
    PLC.prototype.getProgramTagList = function (programName) {
        var _this = this;
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.getProgramTagList(programName); });
        });
    };
    PLC.prototype.getProgramList = function () {
        var _this = this;
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.getProgramsList(); });
        });
    };
    PLC.prototype.getModuleProperties = function (slot) {
        var _this = this;
        if (slot === void 0) { slot = 0; }
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.getModuleProperties(slot); });
        });
    };
    PLC.prototype.getWallClockTime = function (raw) {
        var _this = this;
        return Bluebird.try(function () {
            return _super.prototype.acquire.call(_this, function (socket) { return socket.getWallClockTime(raw); });
        });
    };
    PLC.prototype.setWallClockTime = function (date) {
        return _super.prototype.acquire.call(this, function (socket) {
            return Bluebird.try(function () { return socket.setWallClockTime(date); });
        });
    };
    PLC.discover = function (timeout, options) {
        if (timeout === void 0) { timeout = 200; }
        var _a = options || {}, _b = _a.family, family = _b === void 0 ? "IPv4" : _b, onFound = _a.onFound, onError = _a.onError, socketOptions = __rest(_a, ["family", "onFound", "onError"]);
        if (family !== "IPv4" && family !== "IPv6")
            throw new EvalError("Incorrect ip family, must be IPv4 or IPv6");
        var devices = [];
        var clients = new Set();
        var platform = os.platform();
        return new Bluebird(function (resolve, reject) {
            var request = EIPSocket.buildListIdentity();
            var port = PLC.defaultOptions.port || 44818;
            var addresses = flatten(Object.values(os.networkInterfaces()))
                .filter(function (i) { return i.family === family && !i.internal; })
                .map(function (i) { return i.address; });
            var _loop_1 = function (ip) {
                var socket = createSocket(__assign({ type: "udp" + family[3] }, socketOptions));
                if (platform !== "linux")
                    socket.bind(0, ip);
                var waitRecv = function () {
                    socket.idTimeout = setTimeout(function () {
                        socket.removeAllListeners();
                        socket.unref();
                        socket.close();
                        clients.delete(socket);
                        clients.size === 0 && resolve(devices);
                    }, timeout);
                };
                socket.once("listening", function () {
                    socket.setBroadcast(true);
                    socket.setMulticastTTL(1);
                    waitRecv();
                    socket.send(request, port, family === "IPv4" ? "255.255.255.255" : "FFFF:FFFF:FFFF", function (err, bytes) {
                        if (err) {
                            socket.close();
                            return reject(err);
                        }
                        clients.add(socket);
                        socket.on("message", function (msg, rinfo) {
                            socket.idTimeout && clearTimeout(socket.idTimeout);
                            socket.idTimeout = undefined;
                            var context = unpackFrom("<Q", msg, true, 14)[0];
                            if (context.toString() === "470018779464") {
                                delete rinfo.size;
                                var device = parseIdentityResponse(msg, rinfo);
                                if (device instanceof LGXDevice && device.IPAddress) {
                                    devices.push(device);
                                    onFound && onFound(device, devices.length);
                                }
                                else {
                                    onError && onError(msg, rinfo);
                                }
                            }
                            waitRecv();
                        });
                    });
                });
            };
            for (var _i = 0, addresses_1 = addresses; _i < addresses_1.length; _i++) {
                var ip = addresses_1[_i];
                _loop_1(ip);
            }
        });
    };
    PLC.prototype.discover = function (timeout, options) {
        var _this = this;
        return PLC.discover(timeout, __assign({ onFound: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.emit.apply(_this, __spreadArrays(["found"], args));
            }, onError: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.emit.apply(_this, __spreadArrays(["found_error"], args));
            } }, options));
    };
    PLC.prototype._checkPin = function (pin, value) {
        if (pin === null || typeof pin === "undefined") {
            throw new TypeError("Invalid pin, must be different undefined or null");
        }
        if (arguments.length == 2 && typeof value === "undefined") {
            var err = new ValueError("Must be pass value to write (false or true) invalid: " + value);
            throw err;
        }
    };
    PLC.prototype._getPinMapping = function (str, pin) {
        var _this = this;
        return Bluebird.try(function () {
            if (!_this._replacePin || !_this._pingMapping)
                throw new PinMappingError("invalid replacePin or pingMaping, please check, this.replacePin or this.pinMapping");
            try {
                return _this.replacePin && _this.replacePin(str, pin);
            }
            catch (error) {
                throw error;
            }
        });
    };
    PLC.prototype.toString = function () {
        return "[Object PLC " + this.host + "]";
    };
    PLC.prototype.toJSON = function () {
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
    };
    PLC.TimeoutError = TimeoutError;
    PLC.LogixError = LogixError;
    PLC.ValueError = ValueError;
    PLC.ConnectionError = ConnectionError;
    PLC.ConnectionTimeoutError = ConnectionTimeoutError;
    PLC.ConnectionLostError = ConnectionLostError;
    PLC.ForwarOpenError = ForwarOpenError;
    PLC.RegisterSessionError = RegisterSessionError;
    PLC.DisconnectedError = DisconnectedError;
    PLC.CIPTypes = CIPTypesValues;
    PLC.defaultOptions = {
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
    return PLC;
}(EIPSocketPool));
export default PLC;
//# sourceMappingURL=PLC.js.map