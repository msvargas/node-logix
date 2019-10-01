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
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
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
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = require("net");
var events_1 = require("events");
var utils_1 = require("./utils");
var errors_1 = require("./errors");
var lgxDevice_1 = __importDefault(require("./lgxDevice"));
var CIPTypes_json_1 = __importDefault(require("../resources/CIPTypes.json"));
exports.CIPTypes = CIPTypes_json_1.default;
var CIPContext_json_1 = __importDefault(
  require("../resources/CIPContext.json")
);
var bluebird_1 = __importDefault(require("bluebird"));
var EIPContext = /** @class */ (function(_super) {
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
    _this.timeoutReceive = 3000;
    Object.assign(_this, options);
    if (_this.Micro800) _this.connectionPathSize = 2;
    else
      _this.connectionPath = [
        0x01,
        _this.processorSlot,
        0x20,
        0x02,
        0x24,
        0x01
      ];
    return _this;
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  EIPContext.prototype.on = function(event, listener) {
    var _this = this;
    _super.prototype.on.call(this, event, listener);
    return utils_1.nameFunction("off_" + event, function() {
      _super.prototype.off.call(_this, event, listener);
    });
  };
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  EIPContext.prototype.once = function(event, listener) {
    var _this = this;
    _super.prototype.once.call(this, event, listener);
    return utils_1.nameFunction("off_" + event, function() {
      _super.prototype.off.call(_this, event, listener);
    });
  };
  return EIPContext;
})(events_1.EventEmitter);
exports.EIPContext = EIPContext;
var EIPSocket = /** @class */ (function(_super) {
  __extends(EIPSocket, _super);
  function EIPSocket(context) {
    var _this =
      _super.call(this, { allowHalfOpen: context && context.allowHalfOpen }) ||
      this;
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
    get: function() {
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
    get: function() {
      return !this.connected;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(EIPSocket.prototype, "closing", {
    /**
     * @description Check if closing
     */
    get: function() {
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
  EIPSocket.prototype.buildRegisterSession = function() {
    return utils_1.pack(
      "<HHIIQIHH",
      0x0065,
      0x0004,
      this.sessionHandle,
      0x0000,
      this._context,
      0x0000,
      0x01,
      0x00
    );
  };
  /**
   * @private
   * @description Unregister CIP connection
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildUnregisterSession = function() {
    return utils_1.pack(
      "<HHIIQI",
      0x66,
      0x0,
      this.sessionHandle,
      0x0000,
      this._context,
      0x0000
    );
  };
  /**
   * @private
   * @description  Assemble the forward open packet
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildForwardOpenPacket = function() {
    var forwardOpen = this.buildCIPForwardOpen();
    var rrDataHeader = this.buildEIPSendRRDataHeader(forwardOpen.length);
    return Buffer.concat(
      [rrDataHeader, forwardOpen],
      forwardOpen.length + rrDataHeader.length
    );
  };
  /**
   * @private
   * @description  Assemble the forward close packet
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildForwardClosePacket = function() {
    var forwardClose = this.buildForwardClose();
    var rrDataHeader = this.buildEIPSendRRDataHeader(forwardClose.length);
    return Buffer.concat(
      [rrDataHeader, forwardClose],
      forwardClose.length + rrDataHeader.length
    );
  };
  /**
   * @private
   * @description Forward Open happens after a connection is made,
   *    this will sequp the CIP connection parameters
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildCIPForwardOpen = function() {
    if (!this.context) return;
    this.serialNumber = ~~(Math.random() * 65001);
    var CIPService,
      pack_format,
      CIPConnectionParameters = 0x4200;
    //  decide whether to use the standard ForwardOpen
    // or the large format
    if (this.context.connectionSize <= 511) {
      CIPService = 0x54;
      CIPConnectionParameters += this.context.connectionSize;
      pack_format = "<BBBBBBBBIIHHIIIHIHB";
    } else {
      CIPService = 0x5b;
      CIPConnectionParameters = CIPConnectionParameters << 16;
      CIPConnectionParameters += this.context.connectionSize;
      pack_format = "<BBBBBBBBIIHHIIIIIIB";
    }
    var ForwardOpen = utils_1.pack(
      pack_format,
      CIPService,
      0x02,
      0x20,
      0x06,
      0x24,
      0x01,
      0x0a,
      0x0e,
      0x20000002,
      0x20000001,
      this.serialNumber,
      this.context.vendorId,
      this.originatorSerialNumber,
      0x03,
      0x00201234,
      CIPConnectionParameters,
      0x00204001,
      CIPConnectionParameters,
      0xa3
    );
    // add the connection path
    pack_format = "<B" + this.context.connectionPath.length + "B";
    var data = utils_1.pack.apply(
      void 0,
      __spreadArrays(
        [pack_format, this.context.connectionPathSize],
        this.context.connectionPath
      )
    );
    return Buffer.concat([ForwardOpen, data], ForwardOpen.length + data.length);
  };
  /**
   * @description Forward Close packet for closing the connection
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildForwardClose = function() {
    var ForwardClose = utils_1.pack(
      "<BBBBBBBBHHI",
      0x4e,
      0x02,
      0x20,
      0x06,
      0x24,
      0x01,
      0x0a,
      0x0e,
      this.serialNumber,
      this.context.vendorId,
      this.originatorSerialNumber
    );
    var pack_format = "<H" + this.context.connectionPath.length + "B";
    var CIPConnectionPath = utils_1.pack.apply(
      void 0,
      __spreadArrays(
        [pack_format, this.context.connectionPathSize],
        this.context.connectionPath
      )
    );
    return Buffer.concat(
      [ForwardClose, CIPConnectionPath],
      ForwardClose.length + CIPConnectionPath.length
    );
  };
  /**
   * @param {Number} frameLen
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildEIPSendRRDataHeader = function(frameLen) {
    return utils_1.pack(
      "<HHIIQIIHHHHHH",
      0x6f,
      16 + frameLen,
      this.sessionHandle,
      0x00,
      this._context,
      0x00,
      0x00,
      0x00,
      0x02,
      0x00,
      0x00,
      0xb2,
      frameLen
    );
  };
  /**
   * @private
   * @description  The EIP Header contains the tagIOI and the
   *      commands to perform the read or write.  This request
   *     will be followed by the reply containing the data
   * @param {Buffer} tagIOI
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildEIPHeader = function(tagIOI) {
    if (this.contextPointer === 155) this.contextPointer = 0;
    this.contextPointer += 1;
    var EIPHeaderFrame = utils_1.pack(
      "<HHIIQIIHHHHIHHH",
      0x70,
      22 + tagIOI.length,
      this.sessionHandle,
      0x00,
      CIPContext_json_1.default[this.contextPointer],
      0x0000,
      0x00,
      0x00,
      0x02,
      0xa1,
      0x04,
      this.id,
      0xb1,
      tagIOI.length + 2,
      this.sequenceCounter
    );
    this.sequenceCounter += 1;
    this.sequenceCounter = this.sequenceCounter % 0x10000;
    //console.log(EIPHeaderFrame.length, "tag length:", tagIOI.length);
    return Buffer.concat(
      [EIPHeaderFrame, tagIOI],
      EIPHeaderFrame.length + tagIOI.length
    );
  };
  /**
   * @description Service header for making a multiple tag request
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildMultiServiceHeader = function() {
    return utils_1.pack(
      "<BBBBBB",
      0x0a, // MultiService
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
  EIPSocket.prototype.buildTagListRequest = function(programName) {
    var PathSegment = Buffer.from([]);
    //If we're dealing with program scoped tags...
    if (programName) {
      PathSegment = utils_1.pack("<BB", 0x91, programName.length, programName);
      //if odd number of characters, need to add a byte to the end.
      if (programName.length % 2) {
        var data_1 = utils_1.pack("<B", 0x00);
        PathSegment = Buffer.concat(
          [PathSegment, data_1],
          PathSegment.length + data_1.length
        );
      }
    }
    var data = utils_1.pack("<H", 0x6b20);
    PathSegment = Buffer.concat(
      [PathSegment, data],
      PathSegment.length + data.length
    );
    if (this.offset < 256) data = utils_1.pack("<BB", 0x24, this.offset);
    else data = utils_1.pack("<HH", 0x25, this.offset);
    PathSegment = Buffer.concat(
      [PathSegment, data],
      PathSegment.length + data.length
    );
    var Attributes = utils_1.pack("<HHHH", 0x03, 0x01, 0x02, 0x08);
    data = utils_1.pack("<BB", 0x55, ~~(PathSegment.length / 2));
    return Buffer.concat(
      [data, PathSegment, Attributes],
      data.length + PathSegment.length + Attributes.length
    );
  };
  /**
   * @private
   * @description  Add the partial read service to the tag IOI
   * @param {Buffer} tagIOI
   * @param {Number} elements
   * @returns {Buffer}
   */
  EIPSocket.prototype.addPartialReadIOI = function(tagIOI, elements) {
    var data1 = utils_1.pack("<BB", 0x52, ~~(tagIOI.length / 2));
    var data2 = utils_1.pack("<H", elements);
    var data3 = utils_1.pack("<I", this.offset);
    return Buffer.concat(
      [data1, tagIOI, data2, data3],
      data1.length + data2.length + data3.length + tagIOI.length
    );
  };
  /**
   * @private
   * @description Add the read service to the tagIOI
   * @param {Buffer} tagIOI
   * @param {Number} elements
   * @returns {Buffer}
   */
  EIPSocket.prototype.addReadIOI = function(tagIOI, elements) {
    var data1 = utils_1.pack("<BB", 0x4c, ~~(tagIOI.length / 2));
    var data2 = utils_1.pack("<H", elements);
    return Buffer.concat(
      [data1, tagIOI, data2],
      data1.length + data2.length + tagIOI.length
    );
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
  EIPSocket.prototype.buildTagIOI = function(tagName, isBoolArray) {
    var RequestTagData = Buffer.from([]);
    var tagArray = tagName.split(".");
    tagArray.forEach(function(_tag, i) {
      if (_tag.endsWith("]")) {
        var _a = utils_1._parseTagName(_tag, 0),
          _ = _a[0],
          basetag = _a[1],
          index = _a[2];
        var BaseTagLenBytes = basetag.length;
        if (
          isBoolArray &&
          i === tagArray.length - 1 &&
          typeof index === "number"
        )
          index = ~~(index / 32);
        var data1 = utils_1.pack("<BB", 0x91, BaseTagLenBytes);
        // Assemble the packet
        RequestTagData = Buffer.concat(
          [RequestTagData, data1, Buffer.from(basetag, "utf8")],
          RequestTagData.length + data1.length + BaseTagLenBytes
        );
        if (BaseTagLenBytes % 2) {
          BaseTagLenBytes += 1;
          var data = utils_1.pack("<B", 0x00);
          RequestTagData = Buffer.concat(
            [RequestTagData, data],
            RequestTagData.length + data.length
          );
        }
        // const BaseTagLenWords = BaseTagLenBytes / 2;
        if (i < tagArray.length) {
          if (!Array.isArray(index)) {
            if (index < 256) {
              var data = utils_1.pack("<BB", 0x28, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                data.length + RequestTagData.length
              );
            }
            if (65536 > index && index > 255) {
              var data = utils_1.pack("<HH", 0x29, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                RequestTagData.length + data.length
              );
            }
            if (index > 65535) {
              var data = utils_1.pack("<HI", 0x2a, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                data.length + RequestTagData.length
              );
            }
          } else {
            index.forEach(function(element) {
              if (element < 256) {
                var data = utils_1.pack("<BB", 0x28, element);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }
              if (65536 > element && element > 255) {
                var data = utils_1.pack("<HH", 0x29, element);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }
              if (element > 65535) {
                var data = utils_1.pack("<HI", 0x2a, element);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }
            });
          }
        }
      } else if (!/^d+$/.test(_tag)) {
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
        RequestTagData = Buffer.concat(
          [RequestTagData, data, Buffer.from(_tag, "utf8")],
          data.length + RequestTagData.length + BaseTagLenBytes
        );
        if (BaseTagLenBytes % 2) {
          var data_2 = utils_1.pack("<B", 0x00);
          BaseTagLenBytes += 1;
          RequestTagData = Buffer.concat(
            [RequestTagData, data_2],
            data_2.length + RequestTagData.length
          );
        }
      }
    });
    return RequestTagData;
  };
  /**
   * @description build unconnected send to request tag database
   * @returns {Buffer}
   */
  EIPSocket.prototype.buildCIPUnconnectedSend = function() {
    return utils_1.pack(
      "<BBBBBBBBH",
      0x52, //CIPService
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
  EIPSocket.prototype.parseReply = function(tag, elements, data) {
    return __awaiter(this, void 0, void 0, function() {
      var _a,
        _,
        basetag,
        index,
        datatype,
        bitCount,
        vals,
        split_tag,
        bitPos,
        wordCount,
        words,
        wordCount,
        words;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            (_a = utils_1._parseTagName(tag, 0)),
              (_ = _a[0]),
              (basetag = _a[1]),
              (index = _a[2]);
            (datatype = this.context.knownTags[basetag][0]),
              (bitCount = this.context.CIPTypes[datatype][0] * 8);
            if (!utils_1.BitofWord(tag)) return [3 /*break*/, 2];
            (split_tag = tag.split(".")),
              (bitPos = parseInt(split_tag[split_tag.length - 1]));
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
          case 4:
            return [4 /*yield*/, this.getReplyValues(tag, elements, data)];
          case 5:
            vals = _b.sent();
            _b.label = 6;
          case 6:
            return [2 /*return*/, vals.length === 1 ? vals[0] : vals];
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
  EIPSocket.prototype.getReplyValues = function(tag, elements, data) {
    return __awaiter(this, void 0, void 0, function() {
      var status,
        basetag,
        datatype,
        CIPFormat,
        vals,
        dataSize,
        numbytes,
        counter,
        i,
        index,
        tmp,
        NameLength,
        s,
        d,
        NameLength,
        s,
        returnvalue,
        tagIOI,
        readIOI,
        eipHeader,
        data_3,
        err;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            status = utils_1.unpackFrom("<B", data, true, 48)[0];
            if (!(status == 0 || status == 6)) return [3 /*break*/, 6];
            basetag = utils_1._parseTagName(tag, 0)[1];
            (datatype = this.context.knownTags[basetag][0]),
              (CIPFormat = this.context.CIPTypes[datatype][2]);
            vals = [];
            dataSize = this.context.CIPTypes[datatype][0];
            (numbytes = data.length - dataSize), (counter = 0);
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
              } else {
                d = data.slice(index, index + data.length);
                vals.push(d);
              }
            } else if (datatype === 218) {
              index = 52 + counter * dataSize;
              NameLength = utils_1.unpackFrom("<B", data, true, index)[0];
              s = data.slice(index + 1, index + 1 + NameLength);
              vals.push(s.toString("utf8"));
            } else {
              returnvalue = utils_1.unpackFrom(
                CIPFormat,
                data,
                false,
                index
              )[0];
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
            data_3 = _a.sent();
            status = utils_1.unpackFrom("<B", data_3, true, 48)[0];
            numbytes = data_3.length - dataSize;
            _a.label = 4;
          case 4:
            i++;
            return [3 /*break*/, 1];
          case 5:
            return [2 /*return*/, vals];
          case 6:
            err = get_error_code(status);
            throw new errors_1.LogixError(
              "Failed to read tag-" + tag + " - " + err,
              status
            );
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
  EIPSocket.prototype.wordsToBits = function(tag, value, count) {
    if (count === void 0) {
      count = 0;
    }
    var _a = utils_1._parseTagName(tag, 0),
      _ = _a[0],
      basetag = _a[1],
      index = _a[2],
      datatype = this.context.knownTags[basetag][0],
      bitCount = this.context.CIPTypes[datatype][0] * 8;
    var bitPos;
    if (datatype == 211) {
      bitPos = index % 32;
    } else {
      var split_tag = tag.split(".");
      bitPos = split_tag[split_tag.length - 1];
      bitPos = parseInt(bitPos);
    }
    var ret = [];
    for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
      var v = value_1[_i];
      for (var i = 0; i < bitCount; i++) {
        ret.push(utils_1.BitValue(v, i));
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
  EIPSocket.prototype.multiParser = function(tags, data) {
    //remove the beginning of the packet because we just don't care about it
    var stripped = data.slice(50);
    //const tagCount = unpackFrom("<H", stripped, true, 0)[0];
    var reply = [];
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (Array.isArray(tag)) tag = tag[0];
      var loc = 2 + i * 2;
      var offset = utils_1.unpackFrom("<H", stripped, true, loc)[0];
      var replyStatus = utils_1.unpackFrom("<b", stripped, true, offset + 2)[0];
      var replyExtended = utils_1.unpackFrom(
        "<b",
        stripped,
        true,
        offset + 3
      )[0];
      var response = void 0;
      //successful reply, add the value to our list
      if (replyStatus == 0 && replyExtended == 0) {
        var dataTypeValue = utils_1.unpackFrom(
          "<B",
          stripped,
          true,
          offset + 4
        )[0];
        // if bit of word was requested
        if (utils_1.BitofWord(tag)) {
          var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          var val = utils_1.unpackFrom(
            dataTypeFormat,
            stripped,
            true,
            offset + 6
          )[0];
          var bitState = utils_1._getBitOfWord(tag, val);
          response = new Response(tag, bitState, replyStatus);
          //reply.push(bitState);
        } else if (dataTypeValue == 211) {
          var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          var val = utils_1.unpackFrom(
            dataTypeFormat,
            stripped,
            true,
            offset + 6
          )[0];
          var bitState = utils_1._getBitOfWord(tag, val);
          //reply.push(bitState);
          response = new Response(tag, bitState, replyStatus);
        } else if (dataTypeValue == 160) {
          var strlen = utils_1.unpackFrom("<B", stripped, true, offset + 8)[0];
          var s = stripped.slice(offset + 12, offset + 12 + strlen);
          var value = s.toString("utf8");
          response = new Response(tag, value, replyStatus);
          //reply.push(s.toString("utf8"));
        } else {
          var dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          //reply.push(unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0]);
          var value = utils_1.unpackFrom(
            dataTypeFormat,
            stripped,
            false,
            offset + 6
          )[0];
          response = new Response(tag, value, replyStatus);
        }
      } else {
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
  EIPSocket.prototype.extractTagPacket = function(data, programName) {
    // the first tag in a packet starts at byte 50
    var packetStart = 50;
    if (!this.context.tagList) this.context.tagList = [];
    if (!this.context.programNames) this.context.programNames = [];
    // console.log(data[50:])
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
      } else if (tag.tagName.indexOf("Routine:") > -1) {
      } else if (tag.tagName.indexOf("Map:") > -1) {
      } else if (tag.tagName.indexOf("Task:") > -1) {
      } else {
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
  EIPSocket.prototype._initial_read = function(baseTag, dt) {
    var _this = this;
    return bluebird_1.default.try(function() {
      if (baseTag in _this.context.knownTags) return true;
      if (dt) {
        _this.context.knownTags[baseTag] = [dt, 0];
        return true;
      }
      var tagData = _this.buildTagIOI(baseTag, false),
        readRequest = _this.addPartialReadIOI(tagData, 1);
      var eipHeader = _this.buildEIPHeader(readRequest);
      //console.log("[EIP HEADER]", eipHeader.toString(), eipHeader.length);
      // send our tag read request
      return _this.getBytes(eipHeader).spread(function(status, retData) {
        //make sure it was successful
        if (status == 0 || status == 6) {
          var dataType = utils_1.unpackFrom("<B", retData, true, 50)[0];
          var dataLen = utils_1.unpackFrom("<H", retData, true, 2)[0]; // this is really just used for STRING
          _this.context.knownTags[baseTag] = [dataType, dataLen];
          return true;
        } else {
          var err = get_error_code(status);
          // lost connection
          if (status === 7) {
            err = new errors_1.ConnectionLostError();
            _this.destroy();
          } else if (status === 1) {
            err = new errors_1.ConnectionError(err);
          } else {
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
  EIPSocket.prototype.addWriteBitIOI = function(
    tag,
    tagIOI,
    writeData,
    dataType
  ) {
    var NumberOfBytes = this.context.CIPTypes[dataType][0] * writeData.length;
    var data = utils_1.pack("<BB", 0x4e, ~~(tagIOI.length / 2));
    var writeIOI = Buffer.concat([data, tagIOI], data.length + tagIOI.length);
    var fmt = this.context.CIPTypes[dataType][2].toUpperCase();
    var s = tag.split(".");
    var bit;
    if (dataType == 211) {
      bit = utils_1._parseTagName(s[s.length - 1], 0)[2] % 32;
    } else {
      bit = parseInt(s[s.length - 1]);
    }
    data = utils_1.pack("<h", NumberOfBytes);
    writeIOI = Buffer.concat([writeIOI, data], writeIOI.length + data.length);
    var byte = Math.pow(2, NumberOfBytes * 8 - 1);
    var bits = Math.pow(2, bit);
    if (writeData[0]) {
      var data1 = utils_1.pack(fmt, bits);
      var data2 = utils_1.pack(fmt, byte);
      writeIOI = Buffer.concat(
        [writeIOI, data1, data2],
        writeIOI.length + data1.length + data2.length
      );
    } else {
      var data1 = utils_1.pack(fmt, 0x00);
      var data2 = utils_1.pack(fmt, byte - bits);
      writeIOI = Buffer.concat(
        [writeIOI, data1, data2],
        writeIOI.length + data1.length + data2.length
      );
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
  EIPSocket.prototype.addWriteIOI = function(tagIOI, writeData, dataType) {
    //console.log('tagIOI',tagIOI, 'writeData', writeData,dataType)
    // Add the write command stuff to the tagIOI
    var data = utils_1.pack("<BB", 0x4d, ~~(tagIOI.length / 2));
    var CIPWriteRequest = Buffer.concat(
        [data, tagIOI],
        data.length + tagIOI.length
      ),
      RequestNumberOfElements = writeData.length,
      TypeCodeLen;
    if (dataType == 160) {
      RequestNumberOfElements = this.context.structIdentifier;
      TypeCodeLen = 0x02;
      data = utils_1.pack(
        "<BBHH",
        dataType,
        TypeCodeLen,
        RequestNumberOfElements,
        writeData.length
      );
      CIPWriteRequest = Buffer.concat(
        [CIPWriteRequest, data],
        CIPWriteRequest.length + data.length
      );
    } else {
      TypeCodeLen = 0x00;
      data = utils_1.pack(
        "<BBH",
        dataType,
        TypeCodeLen,
        RequestNumberOfElements
      );
      CIPWriteRequest = Buffer.concat(
        [CIPWriteRequest, data],
        CIPWriteRequest.length + data.length
      );
    }
    for (var _i = 0, writeData_1 = writeData; _i < writeData_1.length; _i++) {
      var v = writeData_1[_i];
      if (Array.isArray(v) || typeof v === "string") {
        for (var i = 0; i < v.length; i++) {
          var el = v[i];
          data = utils_1.pack(this.context.CIPTypes[dataType][2], el);
          CIPWriteRequest = Buffer.concat(
            [CIPWriteRequest, data],
            CIPWriteRequest.length + data.length
          );
        }
      } else {
        data = utils_1.pack(this.context.CIPTypes[dataType][2], v);
        CIPWriteRequest = Buffer.concat(
          [CIPWriteRequest, data],
          data.length + CIPWriteRequest.length
        );
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
  EIPSocket.prototype.writeTag = function(tag, value, options) {
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    var dt = options.dataType;
    return bluebird_1.default.try(function() {
      _this.offset = 0;
      var writeData = [];
      var _a = utils_1._parseTagName(tag, 0),
        t = _a[0],
        b = _a[1],
        i = _a[2];
      return _this
        ._initial_read(b, dt)
        .then(function() {
          return b;
        })
        .then(function(b) {
          /**
           * Processes the write request
           */
          var dataType = _this.context.knownTags[b][0];
          // check if values passed were a list
          if (Array.isArray(value)) {
          } else {
            value = [value];
          }
          //console.log("value:", value);
          for (var _i = 0, value_2 = value; _i < value_2.length; _i++) {
            var v = value_2[_i];
            if (dataType == 202 || dataType == 203) {
              writeData.push(Number(v));
            } else if (dataType == 160 || dataType == 218) {
              writeData.push(_this._makeString(v));
            } else {
              writeData.push(Number(v));
            }
          }
          var tagData, writeRequest;
          if (utils_1.BitofWord(tag)) {
            tagData = _this.buildTagIOI(tag, false);
            writeRequest = _this.addWriteBitIOI(
              tag,
              tagData,
              writeData,
              dataType
            );
          } else if (dataType == 211) {
            tagData = _this.buildTagIOI(tag, true);
            writeRequest = _this.addWriteBitIOI(
              tag,
              tagData,
              writeData,
              dataType
            );
          } else {
            tagData = _this.buildTagIOI(tag, false);
            writeRequest = _this.addWriteIOI(tagData, writeData, dataType);
          }
          return _this.getBytes(_this.buildEIPHeader(writeRequest));
        })
        .spread(function(status) {
          if (status != 0) {
            var err = get_error_code(status);
            throw new errors_1.LogixError("Write failed -" + err, status);
          }
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
  EIPSocket.prototype.readTag = function(tag, options) {
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    var _a = options.count,
      elements = _a === void 0 ? 1 : _a,
      dt = options.dataType;
    return bluebird_1.default.try(function() {
      _this.offset = 0;
      var _a = utils_1._parseTagName(tag, 0),
        t = _a[0],
        b = _a[1],
        i = _a[2];
      return _this
        ._initial_read(b, dt)
        .then(function() {
          return [t, b, i];
        })
        .spread(function(t, b, i) {
          var datatype = _this.context.knownTags[b][0];
          var bitCount = _this.context.CIPTypes[datatype][0] * 8;
          var tagData, words, readRequest;
          //console.log(this.context.CIPTypes[datatype], datatype);
          if (datatype == 211) {
            //bool array
            tagData = _this.buildTagIOI(tag, true);
            words = utils_1._getWordCount(i, elements, bitCount);
            readRequest = _this.addReadIOI(tagData, words);
          } else if (utils_1.BitofWord(t)) {
            // bits of word
            var split_tag = tag.split(".");
            var bitPos = parseInt(split_tag[split_tag.length - 1]);
            tagData = _this.buildTagIOI(tag, false);
            words = utils_1._getWordCount(bitPos, elements, bitCount);
            readRequest = _this.addReadIOI(tagData, words);
          } else {
            //everything else
            tagData = _this.buildTagIOI(tag, false);
            readRequest = _this.addReadIOI(tagData, elements);
          }
          var eipHeader = _this.buildEIPHeader(readRequest);
          return _this.getBytes(eipHeader);
        })
        .spread(function(status, retData) {
          if (status == 0 || status == 6)
            return _this.parseReply(tag, elements, retData);
          else {
            var err = get_error_code(status);
            throw new errors_1.LogixError("Read failed-" + err, status);
          }
        });
    });
  };
  /**
   * @description Processes the multiple read request
   * @param {Array} tags
   */
  EIPSocket.prototype.multiReadTag = function(tags) {
    var _this = this;
    return bluebird_1.default.try(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var serviceSegments,
          segments,
          tagCount,
          index,
          tag,
          tag_name,
          base,
          result,
          result,
          dataType,
          tagIOI,
          header,
          segmentCount,
          temp,
          offsets,
          i,
          i,
          data,
          readRequest,
          eipHeader,
          _a,
          status,
          retData,
          err;
        return __generator(this, function(_b) {
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
              (tag_name = void 0), (base = void 0);
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
              if (tagCount > 2) temp += (tagCount - 2) * 2;
              offsets = utils_1.pack("<H", temp);
              // assemble all the segments
              for (i = 0; i < tagCount; i++)
                segments.push.apply(segments, Array.from(serviceSegments[i]));
              for (i = 0; i < tagCount - 1; i++) {
                temp += serviceSegments[i].length;
                data = utils_1.pack("<H", temp);
                offsets = Buffer.concat(
                  [offsets, data],
                  data.length + offsets.length
                );
              }
              readRequest = Buffer.concat(
                [header, segmentCount, offsets, Buffer.from(segments)],
                header.length +
                  segmentCount.length +
                  offsets.length +
                  segments.length
              );
              eipHeader = this.buildEIPHeader(readRequest);
              return [4 /*yield*/, this.getBytes(eipHeader)];
            case 8:
              (_a = _b.sent()), (status = _a[0]), (retData = _a[1]);
              if (status == 0) {
                return [2 /*return*/, this.multiParser(tags, retData)];
              } else {
                err = get_error_code(status);
                throw new errors_1.LogixError(
                  "Multi-read failed-" + tags.toString() + " - " + err,
                  status
                );
              }
              return [2 /*return*/];
          }
        });
      });
    });
  };
  /**
   * @description Requests the PLC clock time
   * @param {Boolean} raw
   */
  EIPSocket.prototype.getTime = function(raw) {
    return __awaiter(this, void 0, void 0, function() {
      var AttributePacket, eipHeader, _a, status, retData, us, err;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            AttributePacket = utils_1.pack(
              "<BBBBBBH1H",
              0x03,
              0x02,
              0x20,
              0x8b,
              0x24,
              0x01,
              0x01,
              0x0b
            );
            eipHeader = this.buildEIPHeader(AttributePacket);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 1:
            (_a = _b.sent()), (status = _a[0]), (retData = _a[1]);
            if (status == 0) {
              us = Number(
                utils_1.unpackFrom("<Q", retData, true, 56)[0].toString()
              );
              return [
                2 /*return*/,
                raw ? us : new Date(1970, 1, 1).getTime() * 0.001 + us / 1000
              ];
            } else {
              err = get_error_code(status);
              throw new errors_1.LogixError(
                "Failed get PLC time " + err,
                status
              );
            }
            return [2 /*return*/];
        }
      });
    });
  };
  EIPSocket.prototype.setTime = function() {
    return __awaiter(this, void 0, void 0, function() {
      var AttributePacket, eipHeader, _a, status, _, err;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            AttributePacket = utils_1.pack(
              "<BBBBBBHHQ",
              0x04,
              0x02,
              0x20,
              0x8b,
              0x24,
              0x01,
              0x01,
              0x06,
              Date.now() * 1000000
            );
            eipHeader = this.buildEIPHeader(AttributePacket);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 1:
            (_a = _b.sent()), (status = _a[0]), (_ = _a[1]);
            if (status == 0) {
              return [2 /*return*/];
            } else {
              err = get_error_code(status);
              throw new errors_1.LogixError(
                "Failed set PLC time " + err,
                status
              );
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
  EIPSocket.prototype.getTagList = function(allTags) {
    if (allTags === void 0) {
      allTags = true;
    }
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
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
          case 3:
            return [4 /*yield*/, this._getTagList()];
          case 4:
            _a.sent();
            _a.label = 5;
          case 5:
            return [4 /*yield*/, this._getUDT()];
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
  EIPSocket.prototype.getProgramTagList = function(programName) {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
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
            if (!this.context.programNames.includes(programName))
              return [3 /*break*/, 6];
            return [4 /*yield*/, this._getProgramTagList(programName)];
          case 4:
            _a.sent();
            return [4 /*yield*/, this._getUDT()];
          case 5:
            _a.sent();
            return [2 /*return*/, this.context.tagList];
          case 6:
            return [
              2 /*return*/,
              new Error("Program not found, please check name!")
            ];
        }
      });
    });
  };
  /**
   * @description         Retrieves a program names list from the PLC
   *    Sanity check: checks if programNames is empty
   *     and runs _getTagList
   */
  EIPSocket.prototype.getProgramsList = function() {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            if (
              !(!this.context.programNames || !this.context.programNames.length)
            )
              return [3 /*break*/, 2];
            return [4 /*yield*/, this._getTagList()];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            return [2 /*return*/, this.context.programNames];
        }
      });
    });
  };
  /**
   * @description Requests the controller tag list and returns a list of LgxTag type
   */
  EIPSocket.prototype._getTagList = function() {
    return __awaiter(this, void 0, void 0, function() {
      var request, eipHeader, _a, status, retData, err, err;
      var _b;
      return __generator(this, function(_c) {
        switch (_c.label) {
          case 0:
            this.offset = 0;
            delete this.context.programNames;
            delete this.context.tagList;
            request = this.buildTagListRequest();
            eipHeader = this.buildEIPHeader(request);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 1:
            (_a = _c.sent()), (status = _a[0]), (retData = _a[1]);
            if (status === 0 || status === 6) {
              this.extractTagPacket(retData);
              //console.log(this.context.tagList);
            } else {
              err = get_error_code(status);
              throw new errors_1.LogixError(
                "Failed to get tag list " + err,
                status
              );
            }
            _c.label = 2;
          case 2:
            if (!(status == 6)) return [3 /*break*/, 4];
            this.offset += 1;
            request = this.buildTagListRequest();
            eipHeader = this.buildEIPHeader(request);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 3:
            (_b = _c.sent()), (status = _b[0]), (retData = _b[1]);
            if (status == 0 || status == 6) this.extractTagPacket(retData);
            else {
              err = get_error_code(status);
              throw new errors_1.LogixError(
                "Failed to get tag list-" + err,
                status
              );
            }
            return [3 /*break*/, 2];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * @description Requests all programs tag list and appends to taglist (LgxTag type)
   */
  EIPSocket.prototype._getAllProgramsTags = function() {
    return __awaiter(this, void 0, void 0, function() {
      var _i,
        _a,
        programName,
        request,
        eipHeader,
        _b,
        status_1,
        retData,
        err,
        request_1,
        eipHeader_1,
        _c,
        status_2,
        retData_1,
        err;
      return __generator(this, function(_d) {
        switch (_d.label) {
          case 0:
            this.offset = 0;
            if (!this.context.programNames) return [2 /*return*/];
            (_i = 0), (_a = this.context.programNames);
            _d.label = 1;
          case 1:
            if (!(_i < _a.length)) return [3 /*break*/, 6];
            programName = _a[_i];
            this.offset = 0;
            request = this.buildTagListRequest(programName);
            eipHeader = this.buildEIPHeader(request);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 2:
            (_b = _d.sent()), (status_1 = _b[0]), (retData = _b[1]);
            if (status_1 == 0 || status_1 == 6)
              this.extractTagPacket(retData, programName);
            else {
              err = get_error_code(status_1);
              throw new errors_1.LogixError(
                "Failed to get program tag list " + err,
                status_1
              );
            }
            _d.label = 3;
          case 3:
            if (!(status_1 == 6)) return [3 /*break*/, 5];
            this.offset += 1;
            request_1 = this.buildTagListRequest(programName);
            eipHeader_1 = this.buildEIPHeader(request_1);
            return [4 /*yield*/, this.getBytes(eipHeader_1)];
          case 4:
            (_c = _d.sent()), (status_2 = _c[0]), (retData_1 = _c[1]);
            if (status_2 == 0 || status_2 == 6)
              this.extractTagPacket(retData_1, programName);
            else {
              err = get_error_code(status_2);
              throw new errors_1.LogixError(
                "Failed to get program tag list " + err,
                status_2
              );
            }
            return [3 /*break*/, 3];
          case 5:
            _i++;
            return [3 /*break*/, 1];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * @description Requests tag list for a specific program and returns a list of LgxTag type
   * @param {String} programName
   */
  EIPSocket.prototype._getProgramTagList = function(programName) {
    return __awaiter(this, void 0, void 0, function() {
      var request,
        eipHeader,
        _a,
        status,
        retData,
        err,
        request_2,
        eipHeader_2,
        _b,
        status_3,
        retData_2,
        err;
      return __generator(this, function(_c) {
        switch (_c.label) {
          case 0:
            this.offset = 0;
            delete this.context.tagList;
            request = this.buildTagListRequest(programName);
            eipHeader = this.buildEIPHeader(request);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 1:
            (_a = _c.sent()), (status = _a[0]), (retData = _a[1]);
            if (status == 0 || status == 6)
              this.extractTagPacket(retData, programName);
            else {
              err = get_error_code(status);
              throw new errors_1.LogixError(
                "Failed to get program tag list " + err,
                status
              );
            }
            _c.label = 2;
          case 2:
            if (!(status == 6)) return [3 /*break*/, 4];
            this.offset += 1;
            request_2 = this.buildTagListRequest(programName);
            eipHeader_2 = this.buildEIPHeader(request_2);
            return [4 /*yield*/, this.getBytes(eipHeader_2)];
          case 3:
            (_b = _c.sent()), (status_3 = _b[0]), (retData_2 = _b[1]);
            if (status_3 == 0 || status_3 == 6)
              this.extractTagPacket(retData_2, programName);
            else {
              err = get_error_code(status_3);
              throw new errors_1.LogixError(
                "Failed to get program tag list " + err,
                status_3
              );
            }
            return [3 /*break*/, 2];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  EIPSocket.prototype._getUDT = function() {
    return __awaiter(this, void 0, void 0, function() {
      var struct_tags,
        seen,
        unique,
        template,
        _i,
        unique_1,
        u,
        temp,
        data,
        val,
        words,
        member_count,
        _a,
        _b,
        _c,
        key,
        value,
        t,
        size,
        p,
        member_bytes,
        split_char,
        members,
        name_1,
        _d,
        _e,
        tag;
      return __generator(this, function(_f) {
        switch (_f.label) {
          case 0:
            if (!this.context.tagList) return [2 /*return*/];
            struct_tags = this.context.tagList.filter(function(x) {
              return x.struct === 1;
            });
            seen = new Set();
            unique = struct_tags.filter(function(obj) {
              if (obj.dataTypeValue && !seen.has(obj.dataTypeValue)) {
                seen.add(obj.dataTypeValue);
                return true;
              }
              return false;
            });
            template = {};
            (_i = 0), (unique_1 = unique);
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
            (_a = 0), (_b = Object.entries(template));
            _f.label = 5;
          case 5:
            if (!(_a < _b.length)) return [3 /*break*/, 8];
            (_c = _b[_a]), (key = _c[0]), (value = _c[1]);
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
              } else if (tag.symbolType in this.context.CIPTypes) {
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
  EIPSocket.prototype.getTemplateAttribute = function(instance) {
    return __awaiter(this, void 0, bluebird_1.default, function() {
      var _this = this;
      return __generator(this, function(_a) {
        return [
          2 /*return*/,
          bluebird_1.default.try(function() {
            return __awaiter(_this, void 0, void 0, function() {
              var readRequest, eipHeader, _a, _, retData;
              return __generator(this, function(_b) {
                switch (_b.label) {
                  case 0:
                    readRequest = this.buildTemplateAttributes(instance);
                    eipHeader = this.buildEIPHeader(readRequest);
                    return [4 /*yield*/, this.getBytes(eipHeader)];
                  case 1:
                    (_a = _b.sent()), (_ = _a[0]), (retData = _a[1]);
                    return [2 /*return*/, retData];
                }
              });
            });
          })
        ];
      });
    });
  };
  /**
   * @description  Get the members of a UDT so we can get it
   * @param {Number} instance
   * @param {Number} dataLen
   * @returns {Bluebird<Buffer>}
   */
  EIPSocket.prototype.getTemplate = function(instance, dataLen) {
    return __awaiter(this, void 0, bluebird_1.default, function() {
      var readRequest, eipHeader, _a, _, retData;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            readRequest = this.readTemplateService(instance, dataLen);
            eipHeader = this.buildEIPHeader(readRequest);
            return [4 /*yield*/, this.getBytes(eipHeader)];
          case 1:
            (_a = _b.sent()), (_ = _a[0]), (retData = _a[1]);
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
  EIPSocket.prototype.buildTemplateAttributes = function(instance) {
    return utils_1.pack(
      "<BBBBHHHHHHH",
      0x03,
      0x03,
      0x20,
      0x6c,
      0x25,
      instance,
      0x04,
      0x04,
      0x03,
      0x02,
      0x01
    );
  };
  /**
   * @returns {Buffer}
   */
  EIPSocket.prototype.readTemplateService = function(instance, dataLen) {
    return utils_1.pack(
      "<BBBBHHIH",
      0x4c,
      0x03,
      0x20,
      0x6c,
      0x25,
      instance,
      0x00,
      dataLen
    );
  };
  /**
   * @description  Request the properties of a module in a particular
   *      slot
   * @returns {LGXDevice}
   */
  EIPSocket.prototype.getModuleProperties = function(slot) {
    var _this = this;
    if (slot === void 0) {
      slot = 0;
    }
    return bluebird_1.default.try(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var AttributePacket, frame, eipHeader, pad, retData, status;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              AttributePacket = utils_1.pack(
                "<10B",
                0x01,
                0x02,
                0x20,
                0x01,
                0x24,
                0x01,
                0x01,
                0x00,
                0x01,
                slot
              );
              frame = this.buildCIPUnconnectedSend();
              eipHeader = this.buildEIPSendRRDataHeader(frame.length);
              eipHeader = Buffer.concat(
                [eipHeader, frame, AttributePacket],
                eipHeader.length + frame.length + AttributePacket.length
              );
              pad = utils_1.pack("<I", 0x00);
              this.send(eipHeader);
              return [4 /*yield*/, this.recv_data()];
            case 1:
              retData = _a.sent();
              retData = Buffer.concat(
                [pad, retData],
                pad.length + retData.length
              );
              status = utils_1.unpackFrom("<B", retData, true, 46)[0];
              return [
                2 /*return*/,
                status == 0
                  ? new Response(
                      undefined,
                      utils_1._parseIdentityResponse(retData),
                      status
                    )
                  : new Response(undefined, new lgxDevice_1.default(), status)
              ];
          }
        });
      });
    });
  };
  /**
   * @private
   * @description get packet string to send CIP data
   * @param {String} string
   * @returns {String}
   */
  EIPSocket.prototype._makeString = function(string) {
    var work = [];
    var temp = "";
    if (this.context.Micro800) {
      temp = utils_1.pack("<B", string.length).toString("utf8");
    } else {
      temp = utils_1.pack("<I", string.length).toString("utf8");
    }
    for (var i = 0; i < temp.length; i++) work.push(temp.charCodeAt(i));
    for (var i = 0; i < string.length; i++) work.push(string.charCodeAt(i));
    if (!this.context.Micro800)
      for (var i = string.length; i < 84; i++) work.push(0x00);
    return work;
  };
  /**
   * send data to socket and wait response
   * @param {Buffer} data
   */
  EIPSocket.prototype.send = function(data) {
    var _this = this;
    return new bluebird_1.default(function(resolve, reject) {
      _this.write(data, function(error) {
        if (error) reject(error);
        else resolve(true);
      });
    });
  };
  /**
   * @description listen data received from PLC
   * @returns {Promise<Buffer>}
   */
  EIPSocket.prototype.recv_data = function() {
    var _this = this;
    return bluebird_1.default.try(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var error_1;
        var _this = this;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                new bluebird_1.default(function(resolve) {
                  _this.once("data", resolve);
                }).timeout(this.context.timeoutReceive, "timeout-recv-data")
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_1 = _a.sent();
              if (error_1 instanceof bluebird_1.default.TimeoutError)
                this.removeAllListeners("data");
              throw error_1;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    });
  };
  /**
   * send and receive data
   * @param {Buffer} data
   * @returns {Bluebird<Buffer>}
   */
  EIPSocket.prototype.getBytes = function(data) {
    var _this = this;
    return bluebird_1.default.try(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var retData, error_2;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 3, , 4]);
              return [4 /*yield*/, this.send(data)];
            case 1:
              _a.sent();
              return [4 /*yield*/, this.recv_data()];
            case 2:
              retData = _a.sent();
              if (retData) {
                return [
                  2 /*return*/,
                  [utils_1.unpackFrom("<B", retData, true, 48)[0], retData]
                ];
              } else {
                throw [1, undefined];
              }
              return [3 /*break*/, 4];
            case 3:
              error_2 = _a.sent();
              if (!Array.isArray(error_2)) {
                throw new errors_1.ConnectionLostError();
              } else {
                throw error_2;
              }
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    });
  };
  /**
   * @override
   * @description connect to PLC using EIP protocol
   * @returns {Bluebird<EIPSocket>}
   */
  EIPSocket.prototype.connect = function() {
    var _this = this;
    return new bluebird_1.default(function(resolve, reject) {
      if (!_this.context.host)
        return reject(new TypeError("host option must be assigned"));
      var onError = function() {
        _super.prototype.destroy.call(_this);
        reject(
          new errors_1.ConnectionTimeoutError(
            _this.context.host,
            _this.context.connectTimeout
          )
        );
      };
      _super.prototype.setTimeout.call(_this, _this.context.connectTimeout);
      _super.prototype.once.call(_this, "timeout", onError);
      _super.prototype.once.call(_this, "error", onError);
      _super.prototype.connect.call(
        _this,
        _this.context.port,
        _this.context.host,
        function() {
          _super.prototype.setTimeout.call(_this, 0);
          _super.prototype.removeAllListeners.call(_this);
          resolve();
        }
      );
    })
      .then(function() {
        return _this.send(_this.buildRegisterSession());
      })
      .then(function() {
        return _this.recv_data();
      })
      .then(function(retData) {
        return bluebird_1.default.try(function() {
          if (retData) {
            _this.sequenceCounter = 1;
            _this.sessionHandle = utils_1.unpackFrom(
              "<I",
              retData,
              false,
              4
            )[0];
            return true;
          } else {
            throw new errors_1.RegisterSessionError();
          }
        });
      })
      .then(function() {
        return _this.send(_this.buildForwardOpenPacket());
      })
      .then(function() {
        return _this.recv_data();
      })
      .then(function(retData) {
        return [retData, utils_1.unpackFrom("<b", retData, false, 42)[0]];
      })
      .spread(function(retData, sts) {
        _super.prototype.removeAllListeners.call(_this);
        if (!sts) {
          _super.prototype.once.call(_this, "timeout", function() {
            _this.end();
          });
          _super.prototype.once.call(_this, "error", function() {
            _this.disconnect();
            //console.log("error");
          });
          _this.id = utils_1.unpackFrom("<I", retData, true, 44)[0];
          _this._connected = true;
          return _this;
        } else {
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
  EIPSocket.prototype.disconnect = function() {
    var _this = this;
    return bluebird_1.default.try(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var close_packet, unreg_packet;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (this.disconnected || this._closing) return [2 /*return*/];
              this._closing = true;
              if (
                !(
                  this.connected &&
                  this.context._pool &&
                  !this.context._pool.isBorrowedResource(this)
                )
              )
                return [3 /*break*/, 3];
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
      });
    });
  };
  /**
   * @override
   * @description Destroy and disconnect EIP socket and destroy from pool
   * @returns {Bluebird<void>}
   */
  EIPSocket.prototype.destroy = function() {
    var _this = this;
    return bluebird_1.default.resolve(function() {
      return __awaiter(_this, void 0, void 0, function() {
        var _a;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              return [4 /*yield*/, this.disconnect()];
            case 1:
              _b.sent();
              _a = this.context._pool;
              if (!_a) return [3 /*break*/, 3];
              return [4 /*yield*/, this.context._pool.destroy(this)];
            case 2:
              _a = _b.sent();
              _b.label = 3;
            case 3:
              _a;
              _super.prototype.destroy.call(this);
              return [2 /*return*/];
          }
        });
      });
    });
  };
  /**
   * @static
   * @description Create CIP session
   * @returns {Bluebird<EIPSocket>}
   */
  EIPSocket.createClient = function(context) {
    var socket = new EIPSocket(context);
    return bluebird_1.default.try(function() {
      return socket.connect();
    });
  };
  return EIPSocket;
})(net_1.Socket);
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
  if (programName) t.tagName = String(programName + "." + name);
  else t.tagName = String(name);
  t.instanceId = utils_1.unpackFrom("<H", packet, true, 0)[0];
  var val = utils_1.unpackFrom("<H", packet, true, length + 6)[0];
  t.symbolType = val & 0xff;
  t.dataTypeValue = val & 0xfff;
  t.array = (val & 0x6000) >> 13;
  t.struct = (val & 0x8000) >> 15;
  if (t.array) t.size = utils_1.unpackFrom("<H", packet, true, length + 8)[0];
  else t.size = 0;
  return t;
}
var LgxTag = /** @class */ (function() {
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
})();
exports.LgxTag = LgxTag;
var Response = /** @class */ (function() {
  function Response(tag_name, value, status) {
    this.tag_name = tag_name;
    if (typeof tag_name !== "undefined") this.tagName = tag_name;
    this.value = value;
    this.status = get_error_code(status);
  }
  return Response;
})();
exports.Response = Response;
//Get the CIP error code string
function get_error_code(status) {
  return status in errors_1.cipErrorCodes
    ? errors_1.cipErrorCodes[status]
    : "Unknown error " + status;
}
exports.get_error_code = get_error_code;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWlwLXNvY2tldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVpcC1zb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUE2QjtBQUM3QixpQ0FBc0M7QUFDdEMsaUNBVWlCO0FBQ2pCLG1DQVFrQjtBQUNsQiwwREFBb0M7QUFDcEMsNkVBQWtEO0FBdXVEekMsbUJBdnVERix1QkFBUSxDQXV1REU7QUF0dURqQixpRkFBd0Q7QUFDeEQsc0RBQXlDO0FBbUN6QztJQUFnQyw4QkFBWTtJQXFCMUMsb0JBQVksT0FBMkI7UUFBdkMsWUFDRSxpQkFBTyxTQUtSO1FBMUJNLFVBQUksR0FBVyxLQUFLLENBQUM7UUFDckIsY0FBUSxHQUFZLEtBQUssQ0FBQztRQUMxQixjQUFRLEdBQVcsTUFBTSxDQUFDO1FBQzFCLG1CQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLG9CQUFjLEdBQVcsR0FBRyxDQUFDO1FBQzdCLFVBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsb0JBQWMsR0FBVyxJQUFJLENBQUM7UUFDOUIsbUJBQWEsR0FBWSxJQUFJLENBQUM7UUFDOUIsb0JBQWMsR0FBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxjQUFRLEdBQWMsdUJBQVEsQ0FBQztRQUMvQix3QkFBa0IsR0FBVyxDQUFDLENBQUM7UUFDL0Isc0JBQWdCLEdBQVcsTUFBTSxDQUFDO1FBQ2xDLGVBQVMsR0FBZSxFQUFFLENBQUM7UUFDM0IsZ0JBQVUsR0FBWSxLQUFLLENBQUM7UUFDNUIsaUJBQVcsR0FBWSxLQUFLLENBQUM7UUFHN0Isb0JBQWMsR0FBVyxJQUFJLENBQUM7UUFLbkMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0IsSUFBSSxLQUFJLENBQUMs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
