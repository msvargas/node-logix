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
var EIPContext = /** @class */ (function (_super) {
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
    /**
     * @override
     * @param {String} event
     * @param {Function} listener
     */
    EIPContext.prototype.on = function (event, listener) {
        var _this = this;
        _super.prototype.on.call(this, event, listener);
        return utils_1.nameFunction("off_" + event, function () {
            _super.prototype.off.call(_this, event, listener);
        });
    };
    /**
     * @override
     * @param {String} event
     * @param {Function} listener
     */
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
var EIPSocket = /** @class */ (function (_super) {
    __extends(EIPSocket, _super);
    function EIPSocket(context) {
        var _this = _super.call(this, { allowHalfOpen: context && context.allowHalfOpen }) || this;
        _this.context = context;
        /**
         * @description Create EtherNet/IP socket to read/write tags in PLC
         * @param {EIPContext} context
         */
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
        /**
         * @description check if socket is connected
         * @returns {Boolean}
         */
        get: function () {
            return this._connected && !this.destroyed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocket.prototype, "disconnected", {
        /**
         * @description Check if socket is disconnected
         * @returns {Boolean}
         */
        get: function () {
            return !this.connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EIPSocket.prototype, "closing", {
        /**
         * @description Check if closing
         */
        get: function () {
            return this._closing;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @private
     * @description Register our CIP connection
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildRegisterSession = function () {
        return utils_1.pack("<HHIIQIHH", 0x0065, 0x0004, this.sessionHandle, 0x0000, this._context, 0x0000, 0x01, 0x00);
    };
    /**
     * @private
     * @description Unregister CIP connection
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildUnregisterSession = function () {
        return utils_1.pack("<HHIIQI", 0x66, 0x0, this.sessionHandle, 0x0000, this._context, 0x0000);
    };
    /**
     * @private
     * @description  Assemble the forward open packet
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildForwardOpenPacket = function () {
        var forwardOpen = this.buildCIPForwardOpen();
        var rrDataHeader = this.buildEIPSendRRDataHeader(forwardOpen.length);
        return Buffer.concat([rrDataHeader, forwardOpen], forwardOpen.length + rrDataHeader.length);
    };
    /**
     * @private
     * @description  Assemble the forward close packet
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildForwardClosePacket = function () {
        var forwardClose = this.buildForwardClose();
        var rrDataHeader = this.buildEIPSendRRDataHeader(forwardClose.length);
        return Buffer.concat([rrDataHeader, forwardClose], forwardClose.length + rrDataHeader.length);
    };
    /**
     * @private
     * @description Forward Open happens after a connection is made,
     *    this will sequp the CIP connection parameters
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildCIPForwardOpen = function () {
        if (!this.context)
            throw new Error("Please must be assing context");
        this.serialNumber = ~~(Math.random() * 65001);
        var CIPService, pack_format, CIPConnectionParameters = 0x4200;
        //  decide whether to use the standard ForwardOpen
        // or the large format
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
        // add the connection path
        pack_format = "<B" + this.context.connectionPath.length + "B";
        var data = utils_1.pack.apply(void 0, __spreadArrays([pack_format,
            this.context.connectionPathSize], this.context.connectionPath));
        return Buffer.concat([ForwardOpen, data], ForwardOpen.length + data.length);
    };
    /**
     * @description Forward Close packet for closing the connection
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildForwardClose = function () {
        var ForwardClose = utils_1.pack("<BBBBBBBBHHI", 0x4e, 0x02, 0x20, 0x06, 0x24, 0x01, 0x0a, 0x0e, this.serialNumber, this.context.vendorId, this.originatorSerialNumber);
        var pack_format = "<H" + this.context.connectionPath.length + "B";
        var CIPConnectionPath = utils_1.pack.apply(void 0, __spreadArrays([pack_format,
            this.context.connectionPathSize], this.context.connectionPath));
        return Buffer.concat([ForwardClose, CIPConnectionPath], ForwardClose.length + CIPConnectionPath.length);
    };
    /**
     * @param {Number} frameLen
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildEIPSendRRDataHeader = function (frameLen) {
        return utils_1.pack("<HHIIQIIHHHHHH", 0x6f, 16 + frameLen, this.sessionHandle, 0x00, this._context, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0xb2, frameLen);
    };
    /**
     * @private
     * @description  The EIP Header contains the tagIOI and the
     *      commands to perform the read or write.  This request
     *     will be followed by the reply containing the data
     * @param {Buffer} tagIOI
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildEIPHeader = function (tagIOI) {
        if (this.contextPointer === 155)
            this.contextPointer = 0;
        this.contextPointer += 1;
        var EIPHeaderFrame = utils_1.pack("<HHIIQIIHHHHIHHH", 0x70, 22 + tagIOI.length, this.sessionHandle, 0x00, CIPContext_json_1.default[this.contextPointer], 0x0000, 0x00, 0x00, 0x02, 0xa1, 0x04, this.id, 0xb1, tagIOI.length + 2, this.sequenceCounter);
        this.sequenceCounter += 1;
        this.sequenceCounter = this.sequenceCounter % 0x10000;
        return Buffer.concat([EIPHeaderFrame, tagIOI], EIPHeaderFrame.length + tagIOI.length);
    };
    /**
     * @description Service header for making a multiple tag request
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildMultiServiceHeader = function () {
        return utils_1.pack("<BBBBBB", 0x0a, // MultiService
        0x02, // MultiPathSize
        0x20, // MutliClassType
        0x02, // MultiClassSegment
        0x24, // MultiInstanceType
        0x01 // MultiInstanceSegment
        );
    };
    /**
     * @description  Build the request for the PLC tags
     *     Program scoped tags will pass the program name for the request
     * @param {String} programName
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildTagListRequest = function (programName) {
        var PathSegment = Buffer.from([]);
        //If we're dealing with program scoped tags...
        if (programName) {
            PathSegment = utils_1.pack("<BB", 0x91, programName.length, programName);
            //if odd number of characters, need to add a byte to the end.
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
    /**
     * @private
     * @description  Add the partial read service to the tag IOI
     * @param {Buffer} tagIOI
     * @param {Number} elements
     * @returns {Buffer}
     */
    EIPSocket.prototype.addPartialReadIOI = function (tagIOI, elements) {
        var data1 = utils_1.pack("<BB", 0x52, ~~(tagIOI.length / 2));
        var data2 = utils_1.pack("<H", elements);
        var data3 = utils_1.pack("<I", this.offset);
        return Buffer.concat([data1, tagIOI, data2, data3], data1.length + data2.length + data3.length + tagIOI.length);
    };
    /**
     * @private
     * @description Add the read service to the tagIOI
     * @param {Buffer} tagIOI
     * @param {Number} elements
     * @returns {Buffer}
     */
    EIPSocket.prototype.addReadIOI = function (tagIOI, elements) {
        var data1 = utils_1.pack("<BB", 0x4c, ~~(tagIOI.length / 2));
        var data2 = utils_1.pack("<H", elements);
        return Buffer.concat([data1, tagIOI, data2], data1.length + data2.length + tagIOI.length);
    };
    /**
     * @private
     * @description The tag IOI is basically the tag name assembled into
     *     an array of bytes structured in a way that the PLC will
     *      understand.  It's a little crazy, but we have to consider the
     *      many variations that a tag can be:
     *      @example
     *      tagName (DINT)
     *       tagName.1 (Bit of DINT)
     *       tagName.Thing (UDT)
     *       tagName[4].Thing[2].Length (more complex UDT)
     *       We also might be reading arrays, a bool from arrays (atomic), strings.
     *           Oh and multi-dim arrays, program scope tags...
     * @param {String} tagName
     * @param {Boolean} isBoolArray
     */
    EIPSocket.prototype.buildTagIOI = function (tagName, isBoolArray) {
        var RequestTagData = Buffer.from([]);
        var tagArray = tagName.split(".");
        tagArray.forEach(function (_tag, i) {
            if (_tag.endsWith("]")) {
                var _a = utils_1._parseTagName(_tag, 0), _ = _a[0], basetag = _a[1], index = _a[2];
                var BaseTagLenBytes = basetag.length;
                if (isBoolArray &&
                    i === tagArray.length - 1 &&
                    typeof index === "number")
                    index = ~~(index / 32);
                var data1 = utils_1.pack("<BB", 0x91, BaseTagLenBytes);
                // Assemble the packet
                RequestTagData = Buffer.concat([RequestTagData, data1, Buffer.from(basetag, "utf8")], RequestTagData.length + data1.length + BaseTagLenBytes);
                if (BaseTagLenBytes % 2) {
                    BaseTagLenBytes += 1;
                    var data = utils_1.pack("<B", 0x00);
                    RequestTagData = Buffer.concat([RequestTagData, data], RequestTagData.length + data.length);
                }
                // const BaseTagLenWords = BaseTagLenBytes / 2;
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
                /**
                 *
                 * for non-array segment of tag
                 * the try might be a stupid way of doing this.  If the portion of the tag
                 * can be converted to an integer successfully then we must be just looking
                 * for a bit from a word rather than a UDT.  So we then don't want to assemble
                 * the read request as a UDT, just read the value of the DINT.  We'll figure out
                 * the individual bit in the read function.
                 */
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
    /**
     * @description build unconnected send to request tag database
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildCIPUnconnectedSend = function () {
        return utils_1.pack("<BBBBBBBBH", 0x52, //CIPService
        0x02, //CIPPathSize
        0x20, // CIPClassType
        0x06, //CIPClass
        0x24, // CIPInstanceType
        0x01, // CIPInstance
        0x0a, // CIPPriority
        0x0e, // CIPTimeoutTicks
        0x06 // ServiceSize
        );
    };
    /**
     * @private
     * @description  Gets the replies from the PLC
     *               In the case of BOOL arrays and bits of a word, we do some reformating
     * @param {String} tag
     * @param {Number} elements
     * @param {Buffer|Array} data
     * @returns {Boolean|Array|Number}
     */
    EIPSocket.prototype.parseReply = function (tag, elements, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _, basetag, index, datatype, bitCount, vals, split_tag, bitPos, wordCount, words, wordCount, words;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = utils_1._parseTagName(tag, 0), _ = _a[0], basetag = _a[1], index = _a[2];
                        datatype = this.context.knownTags[basetag][0], bitCount = this.context.CIPTypes[datatype][0] * 8;
                        if (!utils_1.BitofWord(tag)) return [3 /*break*/, 2];
                        split_tag = tag.split("."), bitPos = parseInt(split_tag[split_tag.length - 1]);
                        wordCount = utils_1._getWordCount(bitPos, elements, bitCount);
                        return [4 /*yield*/, this.getReplyValues(tag, wordCount, data)];
                    case 1:
                        words = _b.sent();
                        vals = this.wordsToBits(tag, words, elements);
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(datatype === 211)) return [3 /*break*/, 4];
                        wordCount = utils_1._getWordCount(index, elements, bitCount);
                        return [4 /*yield*/, this.getReplyValues(tag, wordCount, data)];
                    case 3:
                        words = _b.sent();
                        vals = this.wordsToBits(tag, words, elements);
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.getReplyValues(tag, elements, data)];
                    case 5:
                        vals = _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/, vals.length === 1 ? vals[0] : vals];
                }
            });
        });
    };
    /**
     * @private
     * @description Gather up all the values in the reply/replies
     * @param {String} tag
     * @param {Number} elements
     * @param {*} data
     * @returns {Array}
     */
    EIPSocket.prototype.getReplyValues = function (tag, elements, data) {
        return __awaiter(this, void 0, void 0, function () {
            var status, basetag, datatype, CIPFormat, vals, dataSize, numbytes, counter, i, index, tmp, NameLength, s, d, NameLength, s, returnvalue, tagIOI, readIOI, eipHeader, data_3, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = utils_1.unpackFrom("<B", data, true, 48)[0];
                        if (!(status == 0 || status == 6)) return [3 /*break*/, 6];
                        basetag = utils_1._parseTagName(tag, 0)[1];
                        datatype = this.context.knownTags[basetag][0], CIPFormat = this.context.CIPTypes[datatype][2];
                        vals = [];
                        dataSize = this.context.CIPTypes[datatype][0];
                        numbytes = data.length - dataSize, counter = 0;
                        this.offset = 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < elements)) return [3 /*break*/, 5];
                        index = 52 + counter * dataSize;
                        if (datatype === 160) {
                            tmp = utils_1.unpackFrom("<h", data, true, 52)[0];
                            if (tmp == this.context.structIdentifier) {
                                // gotta handle strings a little different
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
                        if (!(index == numbytes && status == 6)) return [3 /*break*/, 4];
                        index = 0;
                        counter = 0;
                        tagIOI = this.buildTagIOI(tag, false);
                        readIOI = this.addPartialReadIOI(tagIOI, elements);
                        eipHeader = this.buildEIPHeader(readIOI);
                        return [4 /*yield*/, this.send(eipHeader)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.recv_data()];
                    case 3:
                        data_3 = (_a.sent());
                        status = utils_1.unpackFrom("<B", data_3, true, 48)[0];
                        numbytes = data_3.length - dataSize;
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, vals];
                    case 6:
                        err = errors_1.getErrorCode(status);
                        throw new errors_1.LogixError("Failed to read tag-" + tag + " - " + err, status);
                }
            });
        });
    };
    /**
     * @property
     * @description Convert words to a list of true/false
     * @param {String} tag
     * @param {*} value
     * @param {Number} count
     * @returns {Array<Boolean>}
     */
    EIPSocket.prototype.wordsToBits = function (tag, value, count) {
        if (count === void 0) { count = 0; }
        var _a = utils_1._parseTagName(tag, 0), _ = _a[0], basetag = _a[1], index = _a[2], datatype = this.context.knownTags[basetag][0], bitCount = this.context.CIPTypes[datatype][0] * 8;
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
    /**
     * @description         Takes multi read reply data and returns an array of the values
     * @param {Array} tags Tags list to get read
     * @param {Buffer} data
     * @return {Array}
     */
    EIPSocket.prototype.multiParser = function (tags, data) {
        //remove the beginning of the packet because we just don't care about it
        var stripped = data.slice(50);
        //const tagCount = unpackFrom("<H", stripped, true, 0)[0];
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
            //successful reply, add the value to our list
            if (replyStatus == 0 && replyExtended == 0) {
                var dataTypeValue = utils_1.unpackFrom("<B", stripped, true, offset + 4)[0];
                // if bit of word was requested
                if (utils_1.BitofWord(tag)) {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    var val = utils_1.unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
                    var bitState = utils_1._getBitOfWord(tag, val);
                    response = new Response(tag, bitState, replyStatus);
                    //reply.push(bitState);
                }
                else if (dataTypeValue == 211) {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    var val = utils_1.unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
                    var bitState = utils_1._getBitOfWord(tag, val);
                    //reply.push(bitState);
                    response = new Response(tag, bitState, replyStatus);
                }
                else if (dataTypeValue == 160) {
                    var strlen = utils_1.unpackFrom("<B", stripped, true, offset + 8)[0];
                    var s = stripped.slice(offset + 12, offset + 12 + strlen);
                    var value = s.toString("utf8");
                    response = new Response(tag, value, replyStatus);
                    //reply.push(s.toString("utf8"));
                }
                else {
                    var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
                    //reply.push(unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0]);
                    var value = utils_1.unpackFrom(dataTypeFormat, stripped, false, offset + 6)[0];
                    response = new Response(tag, value, replyStatus);
                }
            }
            else {
                response = new Response(tag, undefined, replyStatus);
            }
            reply.push(response);
        }
        return reply;
    };
    /**
     *
     * @param {Buffer} data
     * @param {String} programName
     * @returns {void}
     */
    EIPSocket.prototype.extractTagPacket = function (data, programName) {
        // the first tag in a packet starts at byte 50
        var packetStart = 50;
        if (!this.context.tagList)
            this.context.tagList = [];
        if (!this.context.programNames)
            this.context.programNames = [];
        while (packetStart < data.length) {
            //get the length of the tag name
            var tagLen = utils_1.unpackFrom("<H", data, true, packetStart + 4)[0];
            //get a single tag from the packet
            var packet = data.slice(packetStart, packetStart + tagLen + 20);
            //extract the offset
            this.offset = utils_1.unpackFrom("<H", packet, true, 0)[0];
            //add the tag to our tag list
            var tag = parseLgxTag(packet, programName);
            //filter out garbage
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
            //increment ot the next tag in the packet
            packetStart = packetStart + tagLen + 20;
        }
    };
    /**
     * @private
     * @description Store each unique tag read in a dict so that we can retreive the
     *        data type or data length (for STRING) later
     * @param {String} baseTag
     * @param {Number} dt dataType of tag
     * @returns {Boolean}
     */
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
            // send our tag read request
            return _this.getBytes(eipHeader).spread(function (status, retData) {
                //make sure it was successful
                if (status == 0 || status == 6) {
                    var dataType = utils_1.unpackFrom("<B", retData, true, 50)[0];
                    var dataLen = utils_1.unpackFrom("<H", retData, true, 2)[0]; // this is really just used for STRING
                    _this.context.knownTags[baseTag] = [dataType, dataLen];
                    return true;
                }
                else {
                    var err = errors_1.getErrorCode(status);
                    // lost connection
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
    /**
     * @private
     * @description This will add the bit level request to the tagIOI
     *               Writing to a bit is handled in a different way than
     *               other writes
     * @param {String} tag
     * @param {Buffer} tagIOI
     * @param {Array} writeData
     * @param {Number} dataType
     * @returns {Buffer}
     */
    EIPSocket.prototype.addWriteBitIOI = function (tag, tagIOI, writeData, dataType) {
        var NumberOfBytes = this.context.CIPTypes[dataType][0] * writeData.length;
        var data = utils_1.pack("<BB", 0x4e, ~~(tagIOI.length / 2));
        var writeIOI = Buffer.concat([data, tagIOI], data.length + tagIOI.length);
        var fmt = this.context.CIPTypes[dataType][2].toUpperCase();
        var s = tag.split(".");
        var bit;
        if (dataType == 211) {
            bit = utils_1._parseTagName(s[s.length - 1], 0)[2] % 32;
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
    /**
     * @private
     * @param {Buffer} tagIOI
     * @param {Array} writeData
     * @param {Number} dataType
     * @returns {Buffer}
     */
    EIPSocket.prototype.addWriteIOI = function (tagIOI, writeData, dataType) {
        // Add the write command stuff to the tagIOI
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
    /**
     * @private write tag function low level
     * @param {String} tag
     * @param {any} value
     * @param {Object} options
     *  @param {Number} dataType
     *  @param {Boolean} emitEvent emit event if value change
     *
     */
    EIPSocket.prototype.writeTag = function (tag, value, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var dt = options.dataType;
        return bluebird_1.default.try(function () {
            _this.offset = 0;
            var writeData = [];
            var _a = utils_1._parseTagName(tag, 0), t = _a[0], b = _a[1], i = _a[2];
            return _this._initial_read(b, dt)
                .then(function () { return b; })
                .then(function (b) {
                /**
                 * Processes the write request
                 */
                var dataType = _this.context.knownTags[b][0];
                // check if values passed were a list
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
    /**
     * @description  Read tag function low level
     * @private
     * @param {String} tag tagName
     * @param {Number} elements Num elements
     * @param {Number} dt DataType
     * @returns {Array|Boolean|Number|String}}
     */
    EIPSocket.prototype.readTag = function (tag, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a = options.count, elements = _a === void 0 ? 1 : _a, dt = options.dataType;
        return bluebird_1.default.try(function () {
            _this.offset = 0;
            var _a = utils_1._parseTagName(tag, 0), t = _a[0], b = _a[1], i = _a[2];
            return _this._initial_read(b, dt)
                .then(function () { return [t, b, i]; })
                .spread(function (t, b, i) {
                var datatype = _this.context.knownTags[b][0];
                var bitCount = _this.context.CIPTypes[datatype][0] * 8;
                var tagData, words, readRequest;
                if (datatype == 211) {
                    //bool array
                    tagData = _this.buildTagIOI(tag, true);
                    words = utils_1._getWordCount(i, elements, bitCount);
                    readRequest = _this.addReadIOI(tagData, words);
                }
                else if (utils_1.BitofWord(t)) {
                    // bits of word
                    var split_tag = tag.split(".");
                    var bitPos = parseInt(split_tag[split_tag.length - 1]);
                    tagData = _this.buildTagIOI(tag, false);
                    words = utils_1._getWordCount(bitPos, elements, bitCount);
                    readRequest = _this.addReadIOI(tagData, words);
                }
                else {
                    //everything else
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
    /**
     * @description Processes the multiple read request
     * @param {Array} tags
     */
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
                        if (!(index < tags.length)) return [3 /*break*/, 7];
                        tag = tags[index];
                        tag_name = void 0, base = void 0;
                        if (!Array.isArray(tag)) return [3 /*break*/, 3];
                        result = utils_1._parseTagName(tag[0], 0);
                        base = result[1];
                        tag_name = result[0];
                        return [4 /*yield*/, this._initial_read(base, tag[1])];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        result = utils_1._parseTagName(tag, 0);
                        base = result[1];
                        tag_name = result[0];
                        return [4 /*yield*/, this._initial_read(base, null)];
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
                        return [3 /*break*/, 1];
                    case 7:
                        header = this.buildMultiServiceHeader();
                        segmentCount = utils_1.pack("<H", tagCount);
                        temp = header.length;
                        if (tagCount > 2)
                            temp += (tagCount - 2) * 2;
                        offsets = utils_1.pack("<H", temp);
                        // assemble all the segments
                        for (i = 0; i < tagCount; i++)
                            segments.push.apply(segments, Array.from(serviceSegments[i]));
                        for (i = 0; i < tagCount - 1; i++) {
                            temp += serviceSegments[i].length;
                            data = utils_1.pack("<H", temp);
                            offsets = Buffer.concat([offsets, data], data.length + offsets.length);
                        }
                        readRequest = Buffer.concat([header, segmentCount, offsets, Buffer.from(segments)], header.length + segmentCount.length + offsets.length + segments.length);
                        eipHeader = this.buildEIPHeader(readRequest);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
                    case 8:
                        _a = _b.sent(), status = _a[0], retData = _a[1];
                        if (status == 0) {
                            return [2 /*return*/, this.multiParser(tags, retData)];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Multi-read failed-" + tags.toString() + " - " + err, status);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @description Requests the PLC clock time
     * @param {Boolean} raw
     */
    EIPSocket.prototype.getWallClockTime = function (raw) {
        return __awaiter(this, void 0, void 0, function () {
            var AttributePacket, eipHeader, _a, status, retData, us, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        AttributePacket = utils_1.pack("<BBBBBBH1H", 0x03, // AttributeService
                        0x02, // AttributeSize
                        0x20, // AttributeClassType
                        0x8b, // AttributeClass
                        0x24, // AttributeInstanceType
                        0x01, // AttributeInstance
                        0x01, // AttributeCount
                        0x0b // TimeAttribute
                        );
                        eipHeader = this.buildEIPHeader(AttributePacket);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), status = _a[0], retData = _a[1];
                        if (status == 0) {
                            us = Number(utils_1.unpackFrom("<Q", retData, true, 56)[0].toString());
                            return [2 /*return*/, raw
                                    ? us
                                    : new Date(new Date(1970, 1, 1).getTime() * 0.001 + us / 1000)];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed get PLC time " + err, status);
                        }
                        return [2 /*return*/];
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
                        AttributePacket = utils_1.pack("<BBBBBBHHQ", 0x04, //AttributeService
                        0x02, // AttributeSize
                        0x20, // AttributeClassType
                        0x8b, // AttributeClass
                        0x24, // AttributeInstanceType
                        0x01, // AttributeInstance
                        0x01, // AttributeCount
                        0x06, // Attribute
                        date.getTime() * 1000);
                        eipHeader = this.buildEIPHeader(AttributePacket);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), status = _a[0], _ = _a[1];
                        if (status == 0) {
                            return [2 /*return*/, true];
                        }
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed set PLC time " + err, status);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description         Retrieves the tag list from the PLC
     *     Optional parameter allTags set to True
     *     If is set to False, it will return only controller
     *     otherwise controller tags and program tags.
     * @param {Boolean} allTags
     * @returns {Array}
     *
     */
    EIPSocket.prototype.getTagList = function (allTags) {
        if (allTags === void 0) { allTags = true; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!allTags) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._getTagList()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._getAllProgramsTags()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this._getTagList()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this._getUDT()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, this.context.tagList];
                }
            });
        });
    };
    /**
     *  @description Retrieves a program tag list from the PLC
     *     programName = "Program:ExampleProgram"
     */
    EIPSocket.prototype.getProgramTagList = function (programName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.context.programNames) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._getTagList()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.context.programNames = [];
                        _a.label = 3;
                    case 3:
                        if (!this.context.programNames.includes(programName)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._getProgramTagList(programName)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this._getUDT()];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, this.context.tagList];
                    case 6: return [2 /*return*/, new Error("Program not found, please check name!")];
                }
            });
        });
    };
    /**
     * @description         Retrieves a program names list from the PLC
     *    Sanity check: checks if programNames is empty
     *     and runs _getTagList
     */
    EIPSocket.prototype.getProgramsList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.context.programNames || !this.context.programNames.length)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._getTagList()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.context.programNames];
                }
            });
        });
    };
    /**
     * @description Requests the controller tag list and returns a list of LgxTag type
     */
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
                        return [4 /*yield*/, this.getBytes(eipHeader)];
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
                        if (!(status == 6)) return [3 /*break*/, 4];
                        this.offset += 1;
                        request = this.buildTagListRequest();
                        eipHeader = this.buildEIPHeader(request);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
                    case 3:
                        _b = _c.sent(), status = _b[0], retData = _b[1];
                        if (status == 0 || status == 6)
                            this.extractTagPacket(retData);
                        else {
                            err = errors_1.getErrorCode(status);
                            throw new errors_1.LogixError("Failed to get tag list-" + err, status);
                        }
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Requests all programs tag list and appends to taglist (LgxTag type)
     */
    EIPSocket.prototype._getAllProgramsTags = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, programName, request, eipHeader, _b, status_1, retData, err, request_1, eipHeader_1, _c, status_2, retData_1, err;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.offset = 0;
                        if (!this.context.programNames)
                            return [2 /*return*/];
                        _i = 0, _a = this.context.programNames;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        programName = _a[_i];
                        this.offset = 0;
                        request = this.buildTagListRequest(programName);
                        eipHeader = this.buildEIPHeader(request);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
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
                        if (!(status_1 == 6)) return [3 /*break*/, 5];
                        this.offset += 1;
                        request_1 = this.buildTagListRequest(programName);
                        eipHeader_1 = this.buildEIPHeader(request_1);
                        return [4 /*yield*/, this.getBytes(eipHeader_1)];
                    case 4:
                        _c = _d.sent(), status_2 = _c[0], retData_1 = _c[1];
                        if (status_2 == 0 || status_2 == 6)
                            this.extractTagPacket(retData_1, programName);
                        else {
                            err = errors_1.getErrorCode(status_2);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status_2);
                        }
                        return [3 /*break*/, 3];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Requests tag list for a specific program and returns a list of LgxTag type
     * @param {String} programName
     */
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
                        return [4 /*yield*/, this.getBytes(eipHeader)];
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
                        if (!(status == 6)) return [3 /*break*/, 4];
                        this.offset += 1;
                        request_2 = this.buildTagListRequest(programName);
                        eipHeader_2 = this.buildEIPHeader(request_2);
                        return [4 /*yield*/, this.getBytes(eipHeader_2)];
                    case 3:
                        _b = _c.sent(), status_3 = _b[0], retData_2 = _b[1];
                        if (status_3 == 0 || status_3 == 6)
                            this.extractTagPacket(retData_2, programName);
                        else {
                            err = errors_1.getErrorCode(status_3);
                            throw new errors_1.LogixError("Failed to get program tag list " + err, status_3);
                        }
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/];
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
                            return [2 /*return*/];
                        struct_tags = this.context.tagList.filter(function (x) { return x.struct === 1; });
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
                        if (!(_i < unique_1.length)) return [3 /*break*/, 4];
                        u = unique_1[_i];
                        return [4 /*yield*/, this.getTemplateAttribute(u.dataTypeValue)];
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
                        return [3 /*break*/, 1];
                    case 4:
                        _a = 0, _b = Object.entries(template);
                        _f.label = 5;
                    case 5:
                        if (!(_a < _b.length)) return [3 /*break*/, 8];
                        _c = _b[_a], key = _c[0], value = _c[1];
                        return [4 /*yield*/, this.getTemplate(parseInt(key), value[0])];
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
                        return [3 /*break*/, 5];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Get the attributes of a UDT
     * @param {Number} instance
     */
    EIPSocket.prototype.getTemplateAttribute = function (instance) {
        return __awaiter(this, void 0, bluebird_1.default, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
                        var readRequest, eipHeader, _a, _, retData;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    readRequest = this.buildTemplateAttributes(instance);
                                    eipHeader = this.buildEIPHeader(readRequest);
                                    return [4 /*yield*/, this.getBytes(eipHeader)];
                                case 1:
                                    _a = _b.sent(), _ = _a[0], retData = _a[1];
                                    return [2 /*return*/, retData];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * @description  Get the members of a UDT so we can get it
     * @param {Number} instance
     * @param {Number} dataLen
     * @returns {Bluebird<Buffer>}
     */
    EIPSocket.prototype.getTemplate = function (instance, dataLen) {
        return __awaiter(this, void 0, bluebird_1.default, function () {
            var readRequest, eipHeader, _a, _, retData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        readRequest = this.readTemplateService(instance, dataLen);
                        eipHeader = this.buildEIPHeader(readRequest);
                        return [4 /*yield*/, this.getBytes(eipHeader)];
                    case 1:
                        _a = _b.sent(), _ = _a[0], retData = _a[1];
                        return [2 /*return*/, retData];
                }
            });
        });
    };
    /**
     *
     * @param {Number} instance
     * @returns {Buffer}
     */
    EIPSocket.prototype.buildTemplateAttributes = function (instance) {
        return utils_1.pack("<BBBBHHHHHHH", 0x03, 0x03, 0x20, 0x6c, 0x25, instance, 0x04, 0x04, 0x03, 0x02, 0x01);
    };
    /**
     * @returns {Buffer}
     */
    EIPSocket.prototype.readTemplateService = function (instance, dataLen) {
        return utils_1.pack("<BBBBHHIH", 0x4c, 0x03, 0x20, 0x6c, 0x25, instance, 0x00, dataLen);
    };
    /**
     *
     * @description get properties of PLC
     * @param {LGXDevice} pass response object, current PLC or LGXDevice
     */
    EIPSocket.prototype.getIdentity = function (resp) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var request, _a, _, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        request = EIPSocket.buildListIdentity();
                        return [4 /*yield*/, this.getBytes(request)];
                    case 1:
                        _a = _b.sent(), _ = _a[0], data = _a[1];
                        return [2 /*return*/, utils_1._parseIdentityResponse(data, undefined, resp)];
                }
            });
        }); });
    };
    /**
     * @description  Request the properties of a module in a particular
     *      slot
     * @returns {LGXDevice}
     */
    EIPSocket.prototype.getModuleProperties = function (slot) {
        var _this = this;
        if (slot === void 0) { slot = 0; }
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var AttributePacket, frame, eipHeader, pad, retData, status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        AttributePacket = utils_1.pack("<10B", 0x01, //AttributeService
                        0x02, // AttributeSize
                        0x20, // AttributeClassType
                        0x01, // AttributeClass
                        0x24, // AttributeInstanceType
                        0x01, //AttributeInstance
                        0x01, //PathRouteSize
                        0x00, // Reserved
                        0x01, // Backplane
                        slot // LinkAddress
                        );
                        frame = this.buildCIPUnconnectedSend();
                        eipHeader = this.buildEIPSendRRDataHeader(frame.length);
                        eipHeader = Buffer.concat([eipHeader, frame, AttributePacket], eipHeader.length + frame.length + AttributePacket.length);
                        pad = utils_1.pack("<I", 0x00);
                        this.send(eipHeader);
                        return [4 /*yield*/, this.recv_data()];
                    case 1:
                        retData = _a.sent();
                        retData = Buffer.concat([pad, retData], pad.length + retData.length);
                        status = utils_1.unpackFrom("<B", retData, true, 46)[0];
                        return [2 /*return*/, status == 0
                                ? new Response(undefined, utils_1._parseIdentityResponse(retData), status)
                                : new Response(undefined, new lgxDevice_1.default(), status)];
                }
            });
        }); });
    };
    /**
     * @private
     * @description get packet string to send CIP data
     * @param {String} string
     * @returns {String}
     */
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
    /**
     * send data to socket and wait response
     * @param {Buffer} data
     */
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
    /**
     * @description listen data received from PLC
     * @returns {Promise<Buffer>}
     */
    EIPSocket.prototype.recv_data = function () {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, new bluebird_1.default(function (resolve) {
                                _this.once("data", resolve);
                            }).timeout(this.context.timeoutReceive, "timeout-recv-data")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1 instanceof bluebird_1.default.TimeoutError)
                            this.removeAllListeners("data");
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * send and receive data
     * @param {Buffer} data
     * @returns {Bluebird<Buffer>}
     */
    EIPSocket.prototype.getBytes = function (data) {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var retData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.resume();
                        return [4 /*yield*/, this.send(data)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.recv_data()];
                    case 2:
                        retData = _a.sent();
                        this.pause();
                        if (retData) {
                            return [2 /*return*/, [utils_1.unpackFrom("<B", retData, true, 48)[0], retData]];
                        }
                        else {
                            throw [1, undefined];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @override
     * @description connect to PLC using EIP protocol
     * @returns {Bluebird<EIPSocket>}
     */
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
    /**
     * @description Destroy and disconnect EIP socket
     * @returns {Bluebird<void>}
     */
    EIPSocket.prototype.disconnect = function () {
        var _this = this;
        return bluebird_1.default.try(function () { return __awaiter(_this, void 0, void 0, function () {
            var close_packet, unreg_packet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.disconnected || this._closing)
                            return [2 /*return*/];
                        this._closing = true;
                        if (!(this.connected &&
                            this.context._pool &&
                            !this.context._pool.isBorrowedResource(this))) return [3 /*break*/, 3];
                        this.removeAllListeners();
                        close_packet = this.buildForwardClosePacket();
                        unreg_packet = this.buildUnregisterSession();
                        return [4 /*yield*/, this.send(close_packet)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.send(unreg_packet)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _super.prototype.destroy.call(this);
                        this._closing = false;
                        this._connected = false;
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @override
     * @description Destroy and disconnect EIP socket and destroy from pool
     * @returns {Bluebird<void>}
     */
    EIPSocket.prototype.destroy = function () {
        var _this = this;
        return bluebird_1.default.resolve(function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.disconnect()];
                    case 1:
                        _b.sent();
                        _a = this.context._pool;
                        if (!_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.context._pool.destroy(this)];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        _a;
                        _super.prototype.destroy.call(this);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @static
     * @description Create CIP session
     * @returns {Bluebird<EIPSocket>}
     */
    EIPSocket.createClient = function (context) {
        var socket = new EIPSocket(context);
        return bluebird_1.default.try(function () {
            return socket.connect();
        });
    };
    /**
     * @description Build the list identity request for discovering Ethernet I/P
     *     devices on the network
     */
    EIPSocket.buildListIdentity = function () {
        return utils_1.pack("<HHIIHHHHI", 0x63, // ListService
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
    return EIPSocket;
}(net_1.Socket));
exports.default = EIPSocket;
/**
 *
 * @param {Buffer} packet
 * @param {String} programName
 */
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
    t.array = (val & 0x6000) >> 13;
    t.struct = (val & 0x8000) >> 15;
    if (t.array)
        t.size = utils_1.unpackFrom("<H", packet, true, length + 8)[0];
    else
        t.size = 0;
    return t;
}
var LgxTag = /** @class */ (function () {
    function LgxTag() {
        this.tagName = "";
        this.instanceId = 0x00;
        this.symbolType = 0x00;
        this.dataTypeValue = 0x00;
        this.dataType = "";
        this.array = 0x00;
        this.struct = 0x00;
        this.size = 0x00;
    }
    return LgxTag;
}());
exports.LgxTag = LgxTag;
var Response = /** @class */ (function () {
    function Response(tag_name, value, status) {
        this.tag_name = tag_name;
        this.value = value;
        this.status = status;
        if (status)
            this.message = errors_1.getErrorCode(status);
    }
    return Response;
}());
exports.Response = Response;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWlwLXNvY2tldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVpcC1zb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUE2QjtBQUM3QixpQ0FBc0M7QUFDdEMsc0RBQWdDO0FBRWhDLGlDQVVpQjtBQUNqQixtQ0FRa0I7QUFDbEIsMERBQW9DO0FBQ3BDLDZFQUFrRDtBQXV4RHpDLG1CQXZ4REYsdUJBQVEsQ0F1eERFO0FBdHhEakIsaUZBQXdEO0FBa0N4RDtJQUFnQyw4QkFBWTtJQXFCMUMsb0JBQVksT0FBMkI7UUFBdkMsWUFDRSxpQkFBTyxTQWVSO1FBcENNLFVBQUksR0FBVyxLQUFLLENBQUM7UUFDckIsY0FBUSxHQUFZLEtBQUssQ0FBQztRQUMxQixjQUFRLEdBQVcsTUFBTSxDQUFDO1FBQzFCLG1CQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLG9CQUFjLEdBQVcsR0FBRyxDQUFDO1FBQzdCLFVBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsb0JBQWMsR0FBVyxJQUFJLENBQUM7UUFDOUIsbUJBQWEsR0FBWSxJQUFJLENBQUM7UUFDOUIsb0JBQWMsR0FBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxjQUFRLEdBQWMsdUJBQVEsQ0FBQztRQUMvQix3QkFBa0IsR0FBVyxDQUFDLENBQUM7UUFDL0Isc0JBQWdCLEdBQVcsTUFBTSxDQUFDO1FBQ2xDLGVBQVMsR0FBZSxFQUFFLENBQUM7UUFDM0IsZ0JBQVUsR0FBWSxLQUFLLENBQUM7UUFDNUIsaUJBQVcsR0FBWSxLQUFLLENBQUM7UUFHN0Isb0JBQWMsR0FBVyxLQUFLLENBQUM7UUFLcEMsSUFDRSxPQUFPLENBQUMsY0FBYztZQUN0QixDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsR0FBRyxJQUFJLE9BQU8s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