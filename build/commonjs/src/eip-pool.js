"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var generic_pool_1 = __importDefault(require("generic-pool"));
var bluebird_1 = __importDefault(require("bluebird"));
var eip_socket_1 = __importStar(require("./eip-socket"));
exports.EIPSocket = eip_socket_1.default;
exports.CIPTypes = eip_socket_1.CIPTypes;
var EIPSocketPool = (function (_super) {
    __extends(EIPSocketPool, _super);
    function EIPSocketPool(_a) {
        var pool = _a.pool, options = __rest(_a, ["pool"]);
        var _this = _super.call(this, options) || this;
        var opts = Object.assign({
            acquireTimeoutMillis: _this.connectTimeout
        }, pool);
        _this._pool = generic_pool_1.default.createPool({
            create: function () {
                return eip_socket_1.default.createClient(_this);
            },
            destroy: function (socket) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, socket.destroy()];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); },
            validate: function (socket) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2, socket.connected];
                });
            }); }
        }, opts);
        return _this;
    }
    Object.defineProperty(EIPSocketPool.prototype, "size", {
        get: function () {
            return this._pool ? this._pool.size : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "max", {
        get: function () {
            return this._pool ? this._pool.max : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "min", {
        get: function () {
            return this._pool ? this._pool.min : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "pending", {
        get: function () {
            return this._pool ? this._pool.pending : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "borrowed", {
        get: function () {
            return this._pool ? this._pool.borrowed : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "available", {
        get: function () {
            return this._pool ? this._pool.available : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocketPool.prototype, "spareResourceCapacity", {
        get: function () {
            return this._pool ? this._pool.spareResourceCapacity : 0;
        },
        enumerable: true,
        configurable: true
    });
    EIPSocketPool.prototype.acquire = function (priority) {
        var _this = this;
        if (typeof priority === "function" && this._pool)
            return this._pool.use(priority);
        return new bluebird_1.default(function (resolve, reject) {
            if (!_this._pool)
                return;
            _this._pool.acquire(typeof priority === "number"
                ? priority
                : priority === "connect"
                    ? 0
                    : undefined)
                .then(function (socket) {
                _this._pool && socket.connected && _this._pool.release(socket);
                resolve(socket);
            })
                .catch(function (err) {
                if (priority !== "connect")
                    reject(err);
            });
        });
    };
    return EIPSocketPool;
}(eip_socket_1.EIPContext));
exports.default = EIPSocketPool;
//# sourceMappingURL=eip-pool.js.map