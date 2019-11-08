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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = require("net");
var events_1 = require("events");
var bluebird_1 = __importDefault(require("bluebird"));
var utils_1 = require("./utils");
var errors_1 = require("./errors");
var lgxDevice_1 = __importDefault(require("./lgxDevice"));
var CIPTypes_json_1 = __importDefault(require("../resources/CIPTypes.json"));
exports.CIPTypes = CIPTypes_json_1.default;
var CIPContext_json_1 = __importDefault(require("../resources/CIPContext.json"));
var EIPContext = (function (_super) {
    __extends(EIPContext, _super);
    function EIPContext(options) {
        var _this = _super.call(this) || this;
        _this.port = 44818;
        _this.Micro800 = false;
        _this.vendorId = 0x1337;
        _this.processorSlot = 0;
        _this.connectionSize = 508;
        _this.host = "";
        _this.connectTimeout = 5000;
        _this.allowHalfOpen = true;
        _this.connectionPath = [0x20, 0x02, 0x24, 0x01];
        _this.CIPTypes = CIPTypes_json_1.default;
        _this.connectionPathSize = 3;
        _this.structIdentifier = 0x0fce;
        _this.knownTags = {};
        _this._connected = false;
        _this._connecting = false;
        _this.timeoutReceive = 15000;
        if (options.connectionSize &&
            (options.connectionSize < 500 || options.connectionSize > 4000)) {
            throw new EvalError("ConnectionSize must be an integer between 500 and 4000");
        }
        Object.assign(_this, options);
        if (_this.Micro800) {
            _this.connectionPathSize = 2;
            _this.vendorId = 0x01;
        }
        else
            _this.connectionPath = [0x01, _this.processorSlot, 0x20, 0x02, 0x24, 0x01];
        return _this;
    }
    EIPContext.prototype.on = function (event, listener) {
        var _this = this;
        _super.prototype.on.call(this, event, listener);
        return utils_1.nameFunction("off_" + event, function () {
            _super.prototype.off.call(_this, event, listener);
        });
    };
    EIPContext.prototype.once = function (event, listener) {
        var _this = this;
        _super.prototype.once.call(this, event, listener);
        return utils_1.nameFunction("off_" + event, function () {
            _super.prototype.off.call(_this, event, listener);
        });
    };
    return EIPContext;
}(events_1.EventEmitter));
exports.EIPContext = EIPContext;
var EIPSocket = (function (_super) {
    __extends(EIPSocket, _super);
    function EIPSocket(context) {
        var _this = _super.call(this, { allowHalfOpen: context && context.allowHalfOpen }) || this;
        _this.context = context;
        _this._connected = false;
        _this._context = 0;
        _this.contextPointer = 0;
        _this.sessionHandle = 0x0000;
        _this.originatorSerialNumber = 42;
        _this.sequenceCounter = 1;
        _this.offset = 0;
        _this.serialNumber = 0;
        _this.id = 0;
        _this._closing = false;
        return _this;
    }
    Object.defineProperty(EIPSocket.prototype, "connected", {
        get: function () {
            return this._connected && !this.destroyed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocket.prototype, "disconnected", {
        get: function () {
            return !this.connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocket.prototype, "closing", {
        get: function () {
            return this._closing;
        },
        enumerable: true,
        configurable: true
    });
    EIPSocket.prototype.buildRegisterSession = function () {
        return utils_1.pack("<HHIIQIHH", 0x0065, 0x0004, this.sessionHandle, 0x0000, this._context, 0x0000, 0x01, 0x00);
    };
    EIPSocket.prototype.buildUnregisterSession = function () {
        return utils_1.pack("<HHIIQI", 0x66, 0x0, this.sessionHandle, 0x0000, this._context, 0x0000);
    };
    EIPSocket.prototype.buildForwardOpenPacket = function () {
        var forwardOpen = this.buildCIPForwardOpen();
        var rrDataHeader = this.buildEIPSendRRDataHeader(forwardOpen.length);
        return Buffer.concat([rrDataHeader, forwardOpen], forwardOpen.length + rrDataHeader.length);
    };
    EIPSocket.prototype.buildForwardClosePacket = function () {
        var forwardClose = this.buildForwardClose();
        var rrDataHeader = this.buildEIPSendRRDataHeader(forwardClose.length);
        return Buffer.concat([rrDataHeader, forwardClose], forwardClose.length + rrDataHeader.length);
    };
    EIPSocket.prototype.buildCIPForwardOpen = function () {
        if (!this.context)
            throw new Error("Please must be assing context");
        this.serialNumber = ~~(Math.random() * 65001);
        var CIPService, pack_format, CIPConnectionParameters = 0x4200;
        if (this.context.connectionSize <= 511) {
            CIPService = 0x54;
            CIPConnectionParameters += this.context.connectionSize;
            pack_format = "<BBBBBBBBIIHHIIIHIHB";
        }
        else {
            CIPService = 0x5b;
            CIPConnectionParameters = CIPConnectionParameters << 16;
            CIPConnectionParameters += this.context.connectionSize;
            pack_format = "<BBBBBBBBIIHHIIIIIIB";
        }
        var ForwardOpen = utils_1.pack(pack_format, CIPService, 0x02, 0x20, 0x06, 0x24, 0x01, 0x0a, 0x0e, 0x20000002, 0x20000001, this.serialNumber, this.context.vendorId, this.originatorSerialNumber, 0x03, 0x00201234, CIPConnectionParameters, 0x00204001, CIPConnectionParameters, 0xa3);
        pack_format = "<B" + this.context.connectionPath.length + "B";
        var data = utils_1.pack.apply(void 0, __spreadArrays([pack_format,
            this.context.connectionPathSize], this.context.connectionPath));
        return Buffer.concat([ForwardOpen, data], ForwardOpen.length + data.length);
    };
    EIPSocket.prototype.buildForwardClose = function () {
        var ForwardClose = utils_1.pack("<BBBBBBBBHHI", 0x4e, 0x02, 0x20, 0x06, 0x24, 0x01, 0x0a, 0x0e, this.serialNumber, this.context.vendorId, this.originatorSerialNumber);
        var pack_format = "<H" + this.context.connectionPath.length + "B";
        var CIPConnectionPath = utils_1.pack.apply(void 0, __spreadArrays([pack_format,
            this.context.connectionPathSize], this.context.connectionPath));
        return Buffer.concat([ForwardClose, CIPConnectionPath], ForwardClose.length + CIPConnectionPath.length);
    };
    EIPSocket.prototype.buildEIPSendRRDataHeader = function (frameLen) {
        return utils_1.pack("<HHIIQIIHHHHHH", 0x6f, 16 + frameLen, this.sessionHandle, 0x00, this._context, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0xb2, frameLen);
    };
    EIPSocket.prototype.buildEIPHeader = function (tagIOI) {
        if (this.contextPointer === 155)
            this.contextPointer = 0;
        this.contextPointer += 1;
        var EIPHeaderFrame = utils_1.pack("<HHIIQIIHHHHIHHH", 0x70, 22 + tagIOI.length, this.sessionHandle, 0x00, CIPContext_json_1.default[this.contextPointer], 0x0000, 0x00, 0x00, 0x02, 0xa1, 0x04, this.id, 0xb1, tagIOI.length + 2, this.sequenceCounter);
        this.sequenceCounter += 1;
        this.sequenceCounter = this.sequenceCounter % 0x10000;
        return Buffer.concat([EIPHeaderFrame, tagIOI], EIPHeaderFrame.length + tagIOI.length);
    };
    EIPSocket.prototype.buildMultiServiceHeader = function () {
        return utils_1.pack("<BBBBBB", 0x0a, 0x02, 0x20, 0x02, 0x24, 0x01);
    };
    EIPSocket.prototype.buildTagListRequest = function (programName) {
        var PathSegment = Buffer.from([]);
        if (programName) {
            PathSegment = utils_1.pack("<BB", 0x91, programName.length, programName);
            if (programName.length % 2) {
                var data_1 = utils_1.pack("<B", 0x00);
                PathSegment = Buffer.concat([PathSegment, data_1], PathSegment.length + data_1.length);
            }
        }
        var data = utils_1.pack("<H", 0x6b20);
        PathSegment = Buffer.concat([PathSegment, data], PathSegment.length + data.length);
        if (this.offset < 256)
            data = utils_1.pack("<BB", 0x24, this.offset);
        else
            data = utils_1.pack("<HH", 0x25, this.offset);
        PathSegment = Buffer.concat([PathSegment, data], PathSegment.length + data.length);
        var Attributes = utils_1.pack("<HHHH", 0x03, 0x01, 0x02, 0x08);
        data = utils_1.pack("<BB", 0x55, ~~(PathSegment.length / 2));
        return Buffer.concat([data, PathSegment, Attributes], data.length + PathSegment.length + Attributes.length);
    };
    EIPSocket.prototype.addPartialReadIOI = function (tagIOI, elements) {
        var data1 = utils_1.pack("<BB", 0x52, ~~(tagIOI.length / 2));
        var data2 = utils_1.pack("<H", elements);
        var data3 = utils_1.pack("<I", this.offset);
        return Buffer.concat([data1, tagIOI, data2, data3], data1.length + data2.length + data3.length + tagIOI.length);
    };
    EIPSocket.prototype.addReadIOI = function (tagIOI, elements) {
        var data1 = utils_1.pack("<BB", 0x4c, ~~(tagIOI.length / 2));
        var data2 = utils_1.pack("<H", elements);
        return Buffer.concat([data1, tagIOI, data2], data1.length + data2.length + tagIOI.length);
    };
    EIPSocket.prototype.buildTagIOI = function (tagName, isBoolArray) {
        var RequestTagData = Buffer.from([]);
        var tagArray = tagName.split(".");
        tagArray.forEach(function (_tag, i) {
            if (_tag.endsWith("]")) {
                var _a = utils_1.parseTagName(_tag, 0), _ = _a[0], basetag = _a[1], index = _a[2];
                var BaseTagLenBytes = basetag.length;
                if (isBoolArray &&
                    i === tagArray.length - 1 &&
                    typeof index === "number")
                    index = ~~(index / 32);
                var data1 = utils_1.pack("<BB", 0x91, BaseTagLenBytes);
                RequestTagData = Buffer.concat([RequestTagData, data1, Buffer.from(basetag, "utf8")], RequestTagData.length + data1.length + BaseTagLenBytes);
                if (BaseTagLenBytes % 2) {
                    BaseTagLenBytes += 1;
                    var data = utils_1.pack("<B", 0x00);
                    RequestTagData = Buffer.concat([RequestTagData, data], RequestTagData.length + data.length);
                }
                if (i < tagArray.length) {
                    if (!Array.isArray(index)) {
                        if (index < 256) {
                            var data = utils_1.pack("<BB", 0x28, index);
                            RequestTagData = Buffer.concat([RequestTagData, data], data.length + RequestTagData.length);
                        }
                        if (65536 > index && index > 255) {
                            var data = utils_1.pack("<HH", 0x29, index);
                            RequestTagData = Buffer.concat([RequestTagData, data], RequestTagData.length + data.length);
                        }
                        if (index > 65535) {
                            var data = utils_1.pack("<HI", 0x2a, index);
                            RequestTagData = Buffer.concat([RequestTagData, data], data.length + RequestTagData.length);
                        }
                    }
                    else {
                        index.forEach(function (element) {
                            if (element < 256) {
                                var data = utils_1.pack("<BB", 0x28, element);
                                RequestTagData = Buffer.concat([RequestTagData, data], data.length + RequestTagData.length);
                            }
                            if (65536 > element && element > 255) {
                                var data = utils_1.pack("<HH", 0x29, element);
                                RequestTagData = Buffer.concat([RequestTagData, data], data.length + RequestTagData.length);
                            }
                            if (element > 65535) {
                                var data = utils_1.pack("<HI", 0x2a, element);
                                RequestTagData = Buffer.concat([RequestTagData, data], data.length + RequestTagData.length);
                            }
                        });
                    }
                }
            }
            else if (!/^d+$/.test(_tag)) {
                var BaseTagLenBytes = _tag.length;
                var data = utils_1.pack("<BB", 0x91, BaseTagLenBytes);
                RequestTagData = Buffer.concat([RequestTagData, data, Buffer.from(_tag, "utf8")], data.length + RequestTagData.length + BaseTagLenBytes);
                if (BaseTagLenBytes % 2) {
                    var data_2 = utils_1.pack("<B", 0x00);
                    BaseTagLenBytes += 1;
                    RequestTagData = Buffer.concat([RequestTagData, data_2], data_2.length + RequestTagData.length);
                }
            }
        });
        return RequestTagData;
    };
    EIPSocket.prototype.buildCIPUnconnectedSend = function () {
        return utils_1.pack("<BBBBBBBBH", 0x52, 0x02, 0x20, 0x06, 0x24, 0x01, 0x0a, 0x0e, 0x06);
    };
    EIPSocket.prototype.parseReply = function (tag, elements, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _, basetag, index, datatype, bitCount, vals, split_tag, bitPos, wordCount, words, wordCount, words;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = utils_1.parseTagName(tag, 0), _ = _a[0], basetag = _a[1], index = _a[2];
                        datatype = this.context.knownTags[basetag][0], bitCount = this.context.CIPTypes[datatype][0] * 8;
                        if (!utils_1.BitofWord(tag)) return [3, 2];
                        split_tag = tag.split("."), bitPos = parseInt(split_tag[split_tag.length - 1]);
                        wordCount = utils_1.getWordCount(bitPos, elements, bitCount);
                        return [4, this.getReplyValues(tag, wordCount, data)];
                    case 1:
                        words = _b.sent();
                        vals = this.wordsToBits(tag, words, elements);
                        return [3, 6];
                    case 2:
                        if (!(datatype === 211)) return [3, 4];
                        wordCount = utils_1.getWordCount(index, elements, bitCount);
                        return [4, this.getReplyValues(tag, wordCount, data)];
                    case 3:
                        words = _b.sent();
                        vals = this.wordsToBits(tag, words, elements);
                        return [3, 6];
                    case 4: return [4, this.getReplyValues(tag, elements, data)];
                    case 5:
                        vals = _b.sent();
                        _b.label = 6;
                    case 6: return [2, vals.length === 1 ? vals[0] : vals];
                }
            });
        });
    };
    EIPSocket.prototype.getReplyValues = function (tag, elements, data) {
        return __awaiter(this, void 0, void 0, function () {
            var status, basetag, datatype, CIPFormat, vals, dataSize, numbytes, counter, i, index, tmp, NameLength, s, d, NameLength, s, returnvalue, tagIOI, readIOI, eipHeader, data_3, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = utils_1.unpackFrom("<B", data, true, 48)[0];
                        if (!(status == 0 || status == 6)) return [3, 6];
                        basetag = utils_1.parseTagName(tag, 0)[1];
                        datatype = this.context.knownTags[basetag][0], CIPFormat = this.context.CIPTypes[datatype][2];
                        vals = [];
                        dataSize = this.context.CIPTypes[datatype][0];
                        numbytes = data.length - dataSize, counter = 0;
                        this.offset = 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < elements)) return [3, 5];
                        index = 52 + counter * dataSize;
                        if (datatype === 160) {
                            tmp = utils_1.unpackFrom("<h", data, true, 52)[0];
                            if (tmp == this.context.structIdentifier) {
                                index = 54 + counter * dataSize;
                                NameLength = utils_1.unpackFrom("<L", data, true, index)[0];
                                s = data.slice(index + 4, index + 4 + NameLength);
                                vals.push(s.toString("utf8"));
                            }
                            else {
                                d = data.slice(index, index + data.length);
                                vals.push(d);
                            }
                        }
                        else if (datatype === 218) {
                            index = 52 + counter * dataSize;
                            NameLength = utils_1.unpackFrom("<B", data, true, index)[0];
                            s = data.slice(index + 1, index + 1 + NameLength);
                            vals.push(s.toString("utf8"));
                        }
                        else {
                            returnvalue = utils_1.unpackFrom(CIPFormat, data, false, index)[0];
                            vals.push(returnvalue);
                        }
                        this.offset += dataSize;
                        counter += 1;
                        if (!(index == numbytes && status == 6)) return [3, 4];
                        index = 0;
                        counter = 0;
                        tagIOI = this.buildTagIOI(tag, false);
                        readIOI = this.addPartialReadIOI(tagIOI, elements);
                        eipHeader = this.buildEIPHeader(readIOI);
                        return [4, this.send(eipHeader)];
                    case 2:
                        _a.sent();
                        return [4, this.recv_data()];
                    case 3:
                        data_3 = (_a.sent());
                        status = utils_1.unpackFrom("<B", data_3, true, 48)[0];
                        numbytes = data_3.length - dataSize;
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3, 1];
                    case 5: return [2, vals];
                    case 6:
                        err = errors_1.getErrorCode(status);
                        throw new errors_1.LogixError("Failed to read tag-" + tag + " - " + err, status);
                }
            });
        });
    };
    EIPSocket.prototype.wordsToBits = function (tag, value, count) {
        if (count === void 0) { count = 0; }
        var _a = utils_1.parseTagName(tag, 0), _ = _a[0], basetag = _a[1], index = _a[2], datatype = this.context.knownTags[basetag][0], bitCount = this.context.CIPTypes[datatype][0] * 8;
        var bitPos;
        if (datatype == 211) {
            bitPos = index % 32;
        }
        else {
            var split_tag = tag.split(".");
            bitPos = split_tag[split_tag.length - 1];
            bitPos = parseInt(bitPos);
        }
        var ret = [];
        for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
            var v = value_1[_i];
            for (var i = 0; i < bitCount; i++) {
                ret.push(Boolean(utils_1.BitValue(v, i)));
            }
        }
        return ret.slice(bitPos, bitPos + count);
    };
    EIPSocket.prototype.multiParser = function (tags, data) {
        var stripped = data.slice(50);
        var reply = [];
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (Array.isArray(tag))
                tag = tag[0];
            var loc = 2 + i * 2;
            var offset = utils_1.unpackFrom("<H", stripped, true, loc)[0];
            var replyStatus = utils_1.unpackFrom("<b", stripped, true, offset + 2)[0];
            var replyExtended = utils_1.unpackFrom("<b", stripped, true, offset + 3)[0];
            var response = void 0;
            if (replyStatus == 0 && replyExtended == 0) {
                var dataTypeValue = utils_1.unpackFrom("<B", stripped, true, offset + 4)[0];
                if (utils_1.BitofWord(tag)) {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    var val = utils_1.unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
                    var bitState = utils_1.getBitOfWord(tag, val);
                    response = new LgxResponse(tag, bitState, replyStatus);
                }
                else if (dataTypeValue == 211) {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    var val = utils_1.unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
                    var bitState = utils_1.getBitOfWord(tag, val);
                    response = new LgxResponse(tag, bitState, replyStatus);
                }
                else if (dataTypeValue == 160) {
                    var strlen = utils_1.unpackFrom("<B", stripped, true, offset + 8)[0];
                    var s = stripped.slice(offset + 12, offset + 12 + strlen);
                    var value = s.toString("utf8");
                    response = new LgxResponse(tag, value, replyStatus);
                }
                else {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    var value = utils_1.unpackFrom(dataTypeFormat, stripped, false, offset + 6)[0];
                    response = new LgxResponse(tag, value, replyStatus);
                }
            }
            else {
                response = new LgxResponse(tag, undefined, replyStatus);
            }
            reply.push(response);
        }
        return reply;
    };
    EIPSocket.prototype.extractTagPacket = function (data, programName) {
        var packetStart = 50;
        if (!this.context.tagList)
            this.context.tagList = [];
        if (!this.context.programNames)
            this.context.programNames = [];
        while (packetStart < data.length) {
            var tagLen = utils_1.unpackFrom("<H", data, true, packetStart + 4)[0];
            var packet = data.slice(packetStart, packetStart + tagLen + 20);
            this.offset = utils_1.unpackFrom("<H", packet, true, 0)[0];
            var tag = parseLgxTag(packet, programName);
            if (tag.tagName.indexOf("__DEFVAL_") > -1) {
            }
            else if (tag.tagName.indexOf("Routine:") > -1) {
            }
            else if (tag.tagName.indexOf("Map:") > -1) {
            }
            else if (tag.tagName.indexOf("Task:") > -1) {
            }
            else {
                this.context.tagList.push(tag);
            }
            if (!programName) {
                if (tag.tagName.indexOf("Program:") > -1)
                    this.context.programNames.push(tag.tagName);
            }
            packetStart = packetStart + tagLen + 20;
        }
    };
    EIPSocket.prototype._initial_read = function (baseTag, dt) {
        var _this = this;
        return bluebird_1.default.try(function () {
            if (baseTag in _this.context.knownTags)
                return true;
            if (dt) {
                _this.context.knownTags[baseTag] = [dt, 0];
                return true;
            }
            var tagData = _this.buildTagIOI(baseTag, false), readRequest = _this.addPartialReadIOI(tagData, 1);
            var eipHeader = _this.buildEIPHeader(readRequest);
            return _this.getBytes(eipHeader).spread(function (status, retData) {
                if (status == 0 || status == 6) {
                    var dataType = utils_1.unpackFrom("<B", retData, true, 50)[0];
                    var dataLen = utils_1.unpackFrom("<H", retData, true, 2)[0];
                    _this.context.knownTags[baseTag] = [dataType, dataLen];
                    return true;
                }
                else {
                    var err = errors_1.getErrorCode(status);
                    if (status === 7) {
                        err = new errors_1.ConnectionLostError();
                        _this.destroy();
                    }
                    else if (status === 1) {
                        err = new errors_1.ConnectionError(err);
                    }
                    else {
                        err = new errors_1.LogixError("Failed to read tag-" + err, status);
                    }
                    err.code = status;
                    throw err;
                }
            });
        });
    };
    EIPSocket.prototype.addWriteBitIOI = function (tag, tagIOI, writeData, dataType) {
        var NumberOfBytes = this.context.CIPTypes[dataType][0] * writeData.length;
        var data = utils_1.pack("<BB", 0x4e, ~~(tagIOI.length / 2));
        var writeIOI = Buffer.concat([data, tagIOI], data.length + tagIOI.length);
        var fmt = this.context.CIPTypes[dataType][2].toUpperCase();
        var s = tag.split(".");
        var bit;
        if (dataType == 211) {
            bit = utils_1.parseTagName(s[s.length - 1], 0)[2] % 32;
        }
        else {
            bit = parseInt(s[s.length - 1]);
        }
        data = utils_1.pack("<h", NumberOfBytes);
        writeIOI = Buffer.concat([writeIOI, data], writeIOI.length + data.length);
        var byte = Math.pow(2, NumberOfBytes * 8 - 1);
        var bits = Math.pow(2, bit);
        if (writeData[0]) {
            var data1 = utils_1.pack(fmt, bits);
            var data2 = utils_1.pack(fmt, byte);
            writeIOI = Buffer.concat([writeIOI, data1, data2], writeIOI.length + data1.length + data2.length);
        }
        else {
            var data1 = utils_1.pack(fmt, 0x00);
            var data2 = utils_1.pack(fmt, byte - bits);
            writeIOI = Buffer.concat([writeIOI, data1, data2], writeIOI.length + data1.length + data2.length);
        }
        return writeIOI;
    };
    EIPSocket.prototype.addWriteIOI = function (tagIOI, writeData, dataType) {
        var data = utils_1.pack("<BB", 0x4d, ~~(tagIOI.length / 2));
        var CIPWriteRequest = Buffer.concat([data, tagIOI], data.length + tagIOI.length), RequestNumberOfElements = writeData.length, TypeCodeLen;
        if (dataType == 160) {
            RequestNumberOfElements = this.context.structIdentifier;
            TypeCodeLen = 0x02;
            data = utils_1.pack("<BBHH", dataType, TypeCodeLen, RequestNumberOfElements, writeData.length);
            CIPWriteRequest = Buffer.concat([CIPWriteRequest, data], CIPWriteRequest.length + data.length);
        }
        else {
            TypeCodeLen = 0x00;
            data = utils_1.pack("<BBH", dataType, TypeCodeLen, RequestNumberOfElements);
            CIPWriteRequest = Buffer.concat([CIPWriteRequest, data], CIPWriteRequest.length + data.length);
        }
        for (var _i = 0, writeData_1 = writeData; _i < writeData_1.length; _i++) {
            var v = writeData_1[_i];
            if (Array.isArray(v) || typeof v === "string") {
                for (var i = 0; i < v.length; i++) {
                    var el = v[i];
                    data = utils_1.pack(this.context.CIPTypes[dataType][2], el);
                    CIPWriteRequest = Buffer.concat([CIPWriteRequest, data], CIPWriteRequest.length + data.length);
                }
            }
            else {
                data = utils_1.pack(this.context.CIPTypes[dataType][2], v);
                CIPWriteRequest = Buffer.concat([CIPWriteRequest, data], data.length + CIPWriteRequest.length);
            }
        }
        return CIPWriteRequest;
    };
    EIPSocket.prototype.writeTag = function (tag, value, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var dt = options.dataType;
        return bluebird_1.default.try(function () {
            _this.offset = 0;
            var writeData = [];
            var _a = utils_1.parseTagName(tag, 0), t = _a[0], b = _a[1], i = _a[2];
            return _this._initial_read(b, dt)
                .then(function () { return b; })
                .then(function (b) {
                var dataType = _this.context.knownTags[b][0];
                if (Array.isArray(value)) {
                }
                else {
                    value = [value];
                }
                for (var _i = 0, value_2 = value; _i < value_2.length; _i++) {
                    var v = value_2[_i];
                    if (dataType == 202 || dataType == 203) {
                        writeData.push(Number(v));
                    }
                    else if (dataType == 160 || dataType == 218) {
                        writeData.push(_this._makeString(v));
                    }
                    else {
                        writeData.push(Number(v));
                    }
                }
                var tagData, writeRequest;
                if (utils_1.BitofWord(tag)) {
                    tagData = _this.buildTagIOI(tag, false);
                    writeRequest = _this.addWriteBitIOI(tag, tagData, writeData, dataType);
                }
                else if (dataType == 211) {
                    tagData = _this.buildTagIOI(tag, true);
                    writeRequest = _this.addWriteBitIOI(tag, tagData, writeData, dataType);
                }
                else {
                    tagData = _this.buildTagIOI(tag, false);
                    writeRequest = _this.addWriteIOI(tagData, writeData, dataType);
                }
                return _this.getBytes(_this.buildEIPHeader(writeRequest));
            })
                .spread(function (status) {
                if (status != 0) {
                    var err = errors_1.getErrorCode(status);
                    throw new errors_1.LogixError("Write failed -" + err, status);
                }
                return true;
            });
        });
    };
    EIPSocket.prototype.readTag = function (tag, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a = options.count, elements = _a === void 0 ? 1 : _a, dt = options.dataType;
        return bluebird_1.default.try(function () {
            _this.offset = 0;
            var _a = utils_1.parseTagName(tag, 0), t = _a[0], b = _a[1], i = _a[2];
            return _this._initial_read(b, dt)
                .then(function () { return [t, b, i]; })
                .spread(function (t, b, i) {
                var datatype = _this.context.knownTags[b][0];
                var bitCount = _this.context.CIPTypes[datatype][0] * 8;
                var tagData, words, readRequest;
                if (datatype == 211) {
                    tagData = _this.buildTagIOI(tag, true);
                    words = utils_1.getWordCount(i, elements, bitCount);
                    readRequest = _this.addReadIOI(tagData, words);
                }
                else if (utils_1.BitofWord(t)) {
                    var split_tag = tag.split(".");
                    var bitPos = parseInt(split_tag[split_tag.length - 1]);
                    tagData = _this.buildTagIOI(tag, false);
                    words = utils_1.getWordCount(bitPos, elements, bitCount);
                    readRequest = _this.addReadIOI(tagData, words);
                }
                else {
                    tagData = _this.buildTagIOI(tag, false);
                    readRequest = _this.addReadIOI(tagData, elements);
                }
                var eipHeader = _this.buildEIPHeader(readRequest);
                return _this.getBytes(eipHeader);
            })
                .spread(function (status, retData) {
                if (status == 0 || status == 6)
                    return _this.parseReply(tag, elements, retData);
                else {
                    var err = errors_1.getErrorCode(status);
                    throw new errors_1.LogixError("Read failed-" + err, status);
                }
            });
        });
    };
    EIPSocket.prototype.multiReadTag = function (tags) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var serviceSegments, segments, tagCount, index, tag, tag_name, base, result, result, dataType, tagIOI, header, segmentCount, temp, offsets, i, i, data, readRequest, eipHeader, _a, status, retData, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        serviceSegments = [];
                        segments = [];
                        tagCount = tags.length;
                        this.offset = 0;
                        index = 0;
                        _b.label = 1;
                    case 1:
                        if (!(index < tags.length)) return [3, 7];
                        tag = tags[index];
                        tag_name = void 0, base = void 0;
                        if (!Array.isArray(tag)) return [3, 3];
                        result = utils_1.parseTagName(tag[0], 0);
                        base = result[1];
                        tag_name = result[0];
                        return [4, this._initial_read(base, tag[1])];
                    case 2:
                        _b.sent();
                        return [3, 5];
                    case 3:
                        result = utils_1.parseTagName(tag, 0);
                        base = result[1];
                        tag_name = result[0];
                        return [4, this._initial_read(base, null)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        dataType = this.context.knownTags[base][0];
                        tagIOI = this.buildTagIOI(tag_name, dataType == 211);
                        serviceSegments.push(this.addReadIOI(tagIOI, 1));
                        _b.label = 6;
                    case 6:
                        index++;
                        return [3, 1];
                    case 7:
                        header = this.buildMultiServiceHeader();
                        segmentCount = utils_1.pack("<H", tagCount);
                        temp = header.length;
                        if (tagCount > 2)
                            temp += (tagCount - 2) * 2;
                        offsets = utils_1.pack("<H", temp);
                        for (i = 0; i < tagCount; i++)
                            segments.push.apply(segments, Array.from(serviceSegments[i]));
                        for (i = 0; i < tagCount - 1; i++) {
                            temp += serviceSegments[i].length;
                            data = utils_1.pack("<H", temp);
                            offsets = Buffer.concat([offsets, data], data.length + offsets.length);
                        }
                        readRequest = Buffer.concat([header, segmentCount, offsets, Buffer.from(segments)], header.length + segmentCount.length + offsets.length + segments.length);
                        eipHeader = this.buildEIPHeader(readRequest);
                        return [4, this.getBytes(eipHeader)];
                    case 8:
                        _a = _b.sent(), status = _a[0], retData = _a[1];
                        if (status == 0) {
                            return [2, this.multiParser(tags, retData)];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Multi-read failed-" + tags.toString() + " - " + err, status);
                        }
                        return [2];
                }
            });
        }); });
    };
    EIPSocket.prototype.getWallClockTime = function (raw) {
        return __awaiter(this, void 0, void 0, function () {
            var AttributePacket, eipHeader, _a, status, retData, us, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        AttributePacket = utils_1.pack("<BBBBBBH1H", 0x03, 0x02, 0x20, 0x8b, 0x24, 0x01, 0x01, 0x0b);
                        eipHeader = this.buildEIPHeader(AttributePacket);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), status = _a[0], retData = _a[1];
                        if (status == 0) {
                            us = Number(utils_1.unpackFrom("<Q", retData, true, 56)[0].toString());
                            return [2, raw
                                    ? us
                                    : new Date(new Date(1970, 1, 1).getTime() * 0.001 + us / 1000)];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed get PLC time " + err, status);
                        }
                        return [2];
                }
            });
        });
    };
    EIPSocket.prototype.setWallClockTime = function (date) {
        if (date === void 0) { date = new Date(); }
        return __awaiter(this, void 0, void 0, function () {
            var AttributePacket, eipHeader, _a, status, _, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        AttributePacket = utils_1.pack("<BBBBBBHHQ", 0x04, 0x02, 0x20, 0x8b, 0x24, 0x01, 0x01, 0x06, date.getTime() * 1000);
                        eipHeader = this.buildEIPHeader(AttributePacket);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), status = _a[0], _ = _a[1];
                        if (status == 0) {
                            return [2, true];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed set PLC time " + err, status);
                        }
                        return [2];
                }
            });
        });
    };
    EIPSocket.prototype.getTagList = function (allTags) {
        if (allTags === void 0) { allTags = true; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!allTags) return [3, 3];
                        return [4, this._getTagList()];
                    case 1:
                        _a.sent();
                        return [4, this._getAllProgramsTags()];
                    case 2:
                        _a.sent();
                        return [3, 5];
                    case 3: return [4, this._getTagList()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4, this._getUDT()];
                    case 6:
                        _a.sent();
                        return [2, this.context.tagList];
                }
            });
        });
    };
    EIPSocket.prototype.getProgramTagList = function (programName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.context.programNames) return [3, 2];
                        return [4, this._getTagList()];
                    case 1:
                        _a.sent();
                        return [3, 3];
                    case 2:
                        this.context.programNames = [];
                        _a.label = 3;
                    case 3:
                        if (!this.context.programNames.includes(programName)) return [3, 6];
                        return [4, this._getProgramTagList(programName)];
                    case 4:
                        _a.sent();
                        return [4, this._getUDT()];
                    case 5:
                        _a.sent();
                        return [2, this.context.tagList];
                    case 6: return [2, new Error("Program not found, please check name!")];
                }
            });
        });
    };
    EIPSocket.prototype.getProgramsList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.context.programNames || !this.context.programNames.length)) return [3, 2];
                        return [4, this._getTagList()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2, this.context.programNames];
                }
            });
        });
    };
    EIPSocket.prototype._getTagList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var request, eipHeader, _a, status, retData, err, err;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.offset = 0;
                        delete this.context.programNames;
                        delete this.context.tagList;
                        request = this.buildTagListRequest();
                        eipHeader = this.buildEIPHeader(request);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _c.sent(), status = _a[0], retData = _a[1];
                        if (status === 0 || status === 6) {
                            this.extractTagPacket(retData);
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed to get tag list " + err, status);
                        }
                        _c.label = 2;
                    case 2:
                        if (!(status == 6)) return [3, 4];
                        this.offset += 1;
                        request = this.buildTagListRequest();
                        eipHeader = this.buildEIPHeader(request);
                        return [4, this.getBytes(eipHeader)];
                    case 3:
                        _b = _c.sent(), status = _b[0], retData = _b[1];
                        if (status == 0 || status == 6)
                            this.extractTagPacket(retData);
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed to get tag list-" + err, status);
                        }
                        return [3, 2];
                    case 4: return [2];
                }
            });
        });
    };
    EIPSocket.prototype._getAllProgramsTags = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, programName, request, eipHeader, _b, status_1, retData, err, request_1, eipHeader_1, _c, status_2, retData_1, err;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.offset = 0;
                        if (!this.context.programNames)
                            return [2];
                        _i = 0, _a = this.context.programNames;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 6];
                        programName = _a[_i];
                        this.offset = 0;
                        request = this.buildTagListRequest(programName);
                        eipHeader = this.buildEIPHeader(request);
                        return [4, this.getBytes(eipHeader)];
                    case 2:
                        _b = _d.sent(), status_1 = _b[0], retData = _b[1];
                        if (status_1 == 0 || status_1 == 6)
                            this.extractTagPacket(retData, programName);
                        else {
                            err = errors_1.getErrorCode(status_1);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status_1);
                        }
                        _d.label = 3;
                    case 3:
                        if (!(status_1 == 6)) return [3, 5];
                        this.offset += 1;
                        request_1 = this.buildTagListRequest(programName);
                        eipHeader_1 = this.buildEIPHeader(request_1);
                        return [4, this.getBytes(eipHeader_1)];
                    case 4:
                        _c = _d.sent(), status_2 = _c[0], retData_1 = _c[1];
                        if (status_2 == 0 || status_2 == 6)
                            this.extractTagPacket(retData_1, programName);
                        else {
                            err = errors_1.getErrorCode(status_2);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status_2);
                        }
                        return [3, 3];
                    case 5:
                        _i++;
                        return [3, 1];
                    case 6: return [2];
                }
            });
        });
    };
    EIPSocket.prototype._getProgramTagList = function (programName) {
        return __awaiter(this, void 0, void 0, function () {
            var request, eipHeader, _a, status, retData, err, request_2, eipHeader_2, _b, status_3, retData_2, err;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.offset = 0;
                        delete this.context.tagList;
                        request = this.buildTagListRequest(programName);
                        eipHeader = this.buildEIPHeader(request);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _c.sent(), status = _a[0], retData = _a[1];
                        if (status == 0 || status == 6)
                            this.extractTagPacket(retData, programName);
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status);
                        }
                        _c.label = 2;
                    case 2:
                        if (!(status == 6)) return [3, 4];
                        this.offset += 1;
                        request_2 = this.buildTagListRequest(programName);
                        eipHeader_2 = this.buildEIPHeader(request_2);
                        return [4, this.getBytes(eipHeader_2)];
                    case 3:
                        _b = _c.sent(), status_3 = _b[0], retData_2 = _b[1];
                        if (status_3 == 0 || status_3 == 6)
                            this.extractTagPacket(retData_2, programName);
                        else {
                            err = errors_1.getErrorCode(status_3);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status_3);
                        }
                        return [3, 2];
                    case 4: return [2];
                }
            });
        });
    };
    EIPSocket.prototype._getUDT = function () {
        return __awaiter(this, void 0, void 0, function () {
            var struct_tags, seen, unique, template, _i, unique_1, u, temp, data, val, words, member_count, _a, _b, _c, key, value, t, size, p, member_bytes, split_char, members, name_1, _d, _e, tag;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!this.context.tagList)
                            return [2];
                        struct_tags = this.context.tagList.filter(function (x) { return x.struct; });
                        seen = new Set();
                        unique = struct_tags.filter(function (obj) {
                            if (obj.dataTypeValue && !seen.has(obj.dataTypeValue)) {
                                seen.add(obj.dataTypeValue);
                                return true;
                            }
                            return false;
                        });
                        template = {};
                        _i = 0, unique_1 = unique;
                        _f.label = 1;
                    case 1:
                        if (!(_i < unique_1.length)) return [3, 4];
                        u = unique_1[_i];
                        return [4, this.getTemplateAttribute(u.dataTypeValue)];
                    case 2:
                        temp = _f.sent();
                        data = temp.slice(46);
                        val = utils_1.unpackFrom("<I", data, true, 10)[0];
                        words = val * 4 - 23;
                        member_count = utils_1.unpackFrom("<H", data, true, 24)[0];
                        template[u.dataTypeValue] = [words, "", member_count];
                        _f.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4:
                        _a = 0, _b = Object.entries(template);
                        _f.label = 5;
                    case 5:
                        if (!(_a < _b.length)) return [3, 8];
                        _c = _b[_a], key = _c[0], value = _c[1];
                        return [4, this.getTemplate(parseInt(key), value[0])];
                    case 6:
                        t = _f.sent();
                        size = value[2] * 8;
                        p = t.slice(50);
                        member_bytes = p.slice(size);
                        split_char = utils_1.pack("<b", 0x00).toString();
                        members = member_bytes.toString().split(split_char);
                        split_char = utils_1.pack("<b", 0x3b).toString();
                        name_1 = members[0].split(split_char)[0];
                        template[key][1] = String(name_1.toString());
                        _f.label = 7;
                    case 7:
                        _a++;
                        return [3, 5];
                    case 8:
                        for (_d = 0, _e = this.context.tagList; _d < _e.length; _d++) {
                            tag = _e[_d];
                            if (tag.dataTypeValue in template) {
                                tag.dataType = template[tag.dataTypeValue][1];
                            }
                            else if (tag.symbolType in this.context.CIPTypes) {
                                tag.dataType = this.context.CIPTypes[tag.symbolType][1];
                            }
                        }
                        return [2];
                }
            });
        });
    };
    EIPSocket.prototype.getTemplateAttribute = function (instance) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var readRequest, eipHeader, _a, _, retData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        readRequest = this.buildTemplateAttributes(instance);
                        eipHeader = this.buildEIPHeader(readRequest);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), _ = _a[0], retData = _a[1];
                        return [2, retData];
                }
            });
        }); });
    };
    EIPSocket.prototype.getTemplate = function (instance, dataLen) {
        return __awaiter(this, void 0, void 0, function () {
            var readRequest, eipHeader, _a, _, retData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        readRequest = this.readTemplateService(instance, dataLen);
                        eipHeader = this.buildEIPHeader(readRequest);
                        return [4, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), _ = _a[0], retData = _a[1];
                        return [2, retData];
                }
            });
        });
    };
    EIPSocket.prototype.buildTemplateAttributes = function (instance) {
        return utils_1.pack("<BBBBHHHHHHH", 0x03, 0x03, 0x20, 0x6c, 0x25, instance, 0x04, 0x04, 0x03, 0x02, 0x01);
    };
    EIPSocket.prototype.readTemplateService = function (instance, dataLen) {
        return utils_1.pack("<BBBBHHIH", 0x4c, 0x03, 0x20, 0x6c, 0x25, instance, 0x00, dataLen);
    };
    EIPSocket.prototype.getIdentity = function (resp) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var request, _a, _, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        request = EIPSocket.buildListIdentity();
                        return [4, this.getBytes(request)];
                    case 1:
                        _a = _b.sent(), _ = _a[0], data = _a[1];
                        return [2, utils_1.parseIdentityResponse(data, undefined, resp)];
                }
            });
        }); });
    };
    EIPSocket.prototype.getModuleProperties = function (slot) {
        var _this = this;
        if (slot === void 0) { slot = 0; }
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var AttributePacket, frame, eipHeader, pad, retData, status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        AttributePacket = utils_1.pack("<10B", 0x01, 0x02, 0x20, 0x01, 0x24, 0x01, 0x01, 0x00, 0x01, slot);
                        frame = this.buildCIPUnconnectedSend();
                        eipHeader = this.buildEIPSendRRDataHeader(frame.length);
                        eipHeader = Buffer.concat([eipHeader, frame, AttributePacket], eipHeader.length + frame.length + AttributePacket.length);
                        pad = utils_1.pack("<I", 0x00);
                        this.send(eipHeader);
                        return [4, this.recv_data()];
                    case 1:
                        retData = _a.sent();
                        retData = Buffer.concat([pad, retData], pad.length + retData.length);
                        status = utils_1.unpackFrom("<B", retData, true, 46)[0];
                        return [2, status == 0
                                ? new LgxResponse(undefined, utils_1.parseIdentityResponse(retData), status)
                                : new LgxResponse(undefined, new lgxDevice_1.default(), status)];
                }
            });
        }); });
    };
    EIPSocket.prototype._makeString = function (string) {
        var work = [];
        var temp = "";
        if (this.context.Micro800) {
            temp = utils_1.pack("<B", string.length).toString("utf8");
        }
        else {
            temp = utils_1.pack("<I", string.length).toString("utf8");
        }
        for (var i = 0; i < temp.length; i++)
            work.push(temp.charCodeAt(i));
        for (var i = 0; i < string.length; i++)
            work.push(string.charCodeAt(i));
        if (!this.context.Micro800)
            for (var i = string.length; i < 84; i++)
                work.push(0x00);
        return work;
    };
    EIPSocket.prototype.send = function (data) {
        var _this = this;
        return new bluebird_1.default(function (resolve, reject) {
            _this.setNoDelay(true);
            _this.write(data, function (error) {
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    };
    EIPSocket.prototype.recv_data = function () {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, new bluebird_1.default(function (resolve) {
                                _this.once("data", resolve);
                            }).timeout(this.context.timeoutReceive, "timeout-recv-data")];
                    case 1: return [2, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1 instanceof bluebird_1.default.TimeoutError)
                            this.removeAllListeners("data");
                        throw error_1;
                    case 3: return [2];
                }
            });
        }); });
    };
    EIPSocket.prototype.getBytes = function (data) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var retData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.resume();
                        return [4, this.send(data)];
                    case 1:
                        _a.sent();
                        return [4, this.recv_data()];
                    case 2:
                        retData = _a.sent();
                        this.pause();
                        if (retData) {
                            return [2, [utils_1.unpackFrom("<B", retData, true, 48)[0], retData]];
                        }
                        else {
                            throw [1, undefined];
                        }
                        return [3, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw error_2;
                    case 4: return [2];
                }
            });
        }); });
    };
    EIPSocket.prototype.connect = function () {
        var _this = this;
        return new bluebird_1.default(function (resolve, reject) {
            if (!_this.context.host)
                return reject(new TypeError("host option must be assigned"));
            var onError = function () {
                _super.prototype.destroy.call(_this);
                reject(new errors_1.ConnectionTimeoutError(_this.context.host, _this.context.connectTimeout));
            };
            _super.prototype.setTimeout.call(_this, _this.context.connectTimeout);
            _super.prototype.once.call(_this, "timeout", onError);
            _super.prototype.once.call(_this, "error", onError);
            _super.prototype.connect.call(_this, _this.context.port, _this.context.host, function () {
                _super.prototype.setTimeout.call(_this, 0);
                _super.prototype.removeAllListeners.call(_this);
                resolve();
            });
        })
            .then(function () { return _this.send(_this.buildRegisterSession()); })
            .then(function () { return _this.recv_data(); })
            .then(function (retData) {
            return bluebird_1.default.try(function () {
                if (retData) {
                    _this.sequenceCounter = 1;
                    _this.sessionHandle = utils_1.unpackFrom("<I", retData, false, 4)[0];
                    return true;
                }
                else {
                    throw new errors_1.RegisterSessionError();
                }
            });
        })
            .then(function () { return _this.send(_this.buildForwardOpenPacket()); })
            .then(function () { return _this.recv_data(); })
            .then(function (retData) { return [retData, utils_1.unpackFrom("<b", retData, false, 42)[0]]; })
            .spread(function (retData, sts) {
            _super.prototype.removeAllListeners.call(_this);
            if (!sts) {
                _super.prototype.once.call(_this, "timeout", function () {
                    _this.end();
                });
                _super.prototype.once.call(_this, "error", function () {
                    _this.disconnect();
                });
                _this.id = utils_1.unpackFrom("<I", retData, true, 44)[0];
                _this._connected = true;
                _this.pause();
                return _this;
            }
            else {
                _this.destroy();
                _this._connected = false;
                throw new errors_1.ForwarOpenError();
            }
        });
    };
    EIPSocket.prototype.disconnect = function () {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var close_packet, unreg_packet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.disconnected || this._closing)
                            return [2];
                        this._closing = true;
                        if (!(this.connected &&
                            this.context._pool &&
                            !this.context._pool.isBorrowedResource(this))) return [3, 3];
                        this.removeAllListeners();
                        close_packet = this.buildForwardClosePacket();
                        unreg_packet = this.buildUnregisterSession();
                        return [4, this.send(close_packet)];
                    case 1:
                        _a.sent();
                        return [4, this.send(unreg_packet)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _super.prototype.destroy.call(this);
                        this._closing = false;
                        this._connected = false;
                        return [2];
                }
            });
        }); });
    };
    EIPSocket.prototype.destroy = function () {
        var _this = this;
        return bluebird_1.default.resolve(function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.disconnect()];
                    case 1:
                        _b.sent();
                        _a = this.context._pool;
                        if (!_a) return [3, 3];
                        return [4, this.context._pool.destroy(this)];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        _a;
                        _super.prototype.destroy.call(this);
                        return [2];
                }
            });
        }); });
    };
    EIPSocket.createClient = function (context) {
        var socket = new EIPSocket(context);
        return bluebird_1.default.try(function () {
            return socket.connect();
        });
    };
    EIPSocket.buildListIdentity = function () {
        return utils_1.pack("<HHIIHHHHI", 0x63, 0x00, 0x00, 0x00, 0xfa, 0x6948, 0x6f4d, 0x006d, 0x00);
    };
    EIPSocket.prototype.toString = function () {
        return "[Object EIPSocket]";
    };
    return EIPSocket;
}(net_1.Socket));
exports.default = EIPSocket;
function parseLgxTag(packet, programName) {
    var t = new LgxTag();
    var length = utils_1.unpackFrom("<H", packet, true, 4)[0];
    var name = packet.slice(6, length + 6).toString("utf8");
    if (programName)
        t.tagName = String(programName + "." + name);
    else
        t.tagName = String(name);
    t.instanceId = utils_1.unpackFrom("<H", packet, true, 0)[0];
    var val = utils_1.unpackFrom("<H", packet, true, length + 6)[0];
    t.symbolType = val & 0xff;
    t.dataTypeValue = val & 0xfff;
    t.array = Boolean((val & 0x6000) >> 13);
    t.struct = Boolean((val & 0x8000) >> 15);
    if (t.array)
        t.size = utils_1.unpackFrom("<H", packet, true, length + 8)[0];
    else
        t.size = 0;
    return t;
}
var LgxTag = (function () {
    function LgxTag() {
        this.tagName = "";
        this.instanceId = 0x00;
        this.symbolType = 0x00;
        this.dataTypeValue = 0x00;
        this.dataType = "";
        this.array = false;
        this.struct = false;
        this.size = 0x00;
    }
    LgxTag.prototype.toString = function () {
        return "[Object LgxTag]";
    };
    return LgxTag;
}());
exports.LgxTag = LgxTag;
var LgxResponse = (function () {
    function LgxResponse(tag_name, value, status) {
        this.tag_name = tag_name;
        this.value = value;
        this.status = status;
        if (status)
            this.message = errors_1.getErrorCode(status);
    }
    LgxResponse.prototype.toString = function () {
        return "[Object LgxResponse]";
    };
    return LgxResponse;
}());
exports.LgxResponse = LgxResponse;
//# sourceMappingURL=eip-socket.js.map