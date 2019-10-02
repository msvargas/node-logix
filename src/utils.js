"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var python_struct_1 = require("python-struct");
exports.unpackFrom = python_struct_1.unpackFrom;
exports.pack = python_struct_1.pack;
var lgxDevice_1 = __importStar(require("./lgxDevice"));
var errors_1 = require("./errors");
var PLC_1 = __importDefault(require("./PLC"));
/**
 * @description Get the number of words that the requested
    bits would occupy.  We have to take into account
    how many bits are in a word and the fact that the
    number of requested bits can span multipe words
 * @param {Number} start
 * @param {Number} length
 * @param {Number} bits
 * @returns {Number}
 */
function _getWordCount(start, length, bits) {
    var newStart = start % bits;
    var newEnd = newStart + length;
    var totalWords = (newEnd - 1) / bits;
    return totalWords + 1;
}
exports._getWordCount = _getWordCount;
/**
 * @description parse the packet to get the base tag name
 *   the offset is so that we can increment the array pointer if need be
 * @param {String} tag
 * @param {Number} offset
 * @returns {Array}
 */
function _parseTagName(tag, offset) {
    var bt = tag, ind = 0;
    try {
        if (tag.endsWith("]")) {
            var pos = tag.length - tag.indexOf("[");
            bt = tag.slice(0, -pos);
            var temp = tag.slice(-pos);
            ind = temp.slice(1, -1);
            var s = ind.split(",");
            if (s.length === 1) {
                ind = parseInt(ind, 10);
                //const newTagName = bt+'['+ind+offset+']'
            }
            else {
                ind = s.map(function (n) { return Math.round(parseInt(n)); });
            }
        }
        return [tag, bt, ind];
    }
    catch (error) {
        return [tag, bt, 0];
    }
}
exports._parseTagName = _parseTagName;
/**
 * @description Test if the user is trying to write to a bit of a word
 *   ex. Tag.1 returns true (Tag = DINT)
 * @param {String} tag
 * @returns {Boolean}
 */
function BitofWord(tag) {
    var s = tag.split(".");
    return /^\d+$/.test(s[s.length - 1]);
}
exports.BitofWord = BitofWord;
/**
 * @description Returns the specific bit of a words value
 * @param {Number} value
 * @param {Number} bitno
 * @returns {Boolean}
 */
function BitValue(value, bitno) {
    return value & (1 << bitno);
}
exports.BitValue = BitValue;
/**
 * @description Takes a tag name, gets the bit from the end of it, then returns that bits value
 * @param {String} tag
 * @param {Number} value
 * @returns {Boolean}
 */
function _getBitOfWord(tag, value) {
    var split_tag = tag.split("."), stripped = split_tag[split_tag.length - 1];
    var returnValue;
    if (stripped.endsWith("]")) {
        var val = parseInt(stripped.slice(stripped.indexOf("[") + 1, stripped.lastIndexOf("]")), 10);
        var bitPos = val & 0x1f;
        returnValue = BitValue(value, bitPos);
    }
    else {
        try {
            var bitPos = parseInt(stripped, 10);
            if (bitPos <= 31)
                returnValue = BitValue(value, bitPos);
        }
        catch (error) { }
    }
    return returnValue;
}
exports._getBitOfWord = _getBitOfWord;
/**
 * Helper to return dynamic name function
 * @param {String} name
 * @param {Function} body
 */
function nameFunction(name, body) {
    var _a;
    return (_a = {},
        _a[name] = function () {
            return body();
        },
        _a)[name];
}
exports.nameFunction = nameFunction;
/**
 * @description replace pin mapping
 * @param {String} str
 * @param {Number} pin
 * @param {String}
 */
function _replacePin(str, pin) {
    if (str === void 0) { str = ""; }
    if (typeof str !== "string")
        throw new TypeError("Pin must be a string not a " + typeof str);
    if (typeof pin === "string" && !/\d{1,}/.test(pin))
        throw new TypeError("Pin must has number to assing pin value: " + pin);
    var match = str.match(/{(d+)}/);
    if (match === null)
        throw new errors_1.PinMappingError("Replace: " + str + " no match with {d} or {dd}");
    if (match.index == undefined)
        throw new errors_1.PinMappingError("No match found to pin");
    return str.replace(match[0], String(pin).padStart(match[1].length, "0"));
}
exports._replacePin = _replacePin;
/**
 * flatten array
 * @param {Array} arr
 * @returns {Array}
 */
exports.flatten = function (arr) {
    return arr.reduce(function (flat, next) { return flat.concat(next); }, []);
};
/**
 * @description we're going to take the packet and parse all the data that is in it.
 * @param {Buffer|Array} data
 * @returns {LGXDevice}
 */
function _parseIdentityResponse(data, rinfo, resp) {
    if (!resp)
        resp = new lgxDevice_1.default(rinfo);
    try {
        if (!(resp instanceof PLC_1.default)) {
            resp.length = python_struct_1.unpackFrom("<H", data, true, 28)[0];
            resp.encapsulationVersion = python_struct_1.unpackFrom("<H", data, true, 30)[0];
            var longIP = python_struct_1.unpackFrom("<I", data, true, 36)[0];
            resp.IPAddress = python_struct_1.pack("<L", longIP).join(".");
        }
        resp.vendorId = python_struct_1.unpackFrom("<H", data, true, 48)[0];
        resp.vendor = lgxDevice_1.getVendor(resp.vendorId);
        resp.deviceType = python_struct_1.unpackFrom("<H", data, true, 50)[0];
        resp.device = lgxDevice_1.getDevice(resp.deviceType);
        resp.productCode = python_struct_1.unpackFrom("<H", data, true, 52)[0];
        var major = python_struct_1.unpackFrom("<B", data, true, 54)[0];
        var minor = python_struct_1.unpackFrom("<B", data, true, 55)[0];
        resp.revision = major === minor ? String(major) : major + "." + minor;
        resp.status = python_struct_1.unpackFrom("<H", data, true, 56)[0];
        resp.serialNumber = python_struct_1.unpackFrom("<I", data, true, 58)[0];
        resp.productName = data
            .slice(63, 63 + python_struct_1.unpackFrom("<B", data, true, 62)[0])
            .toString();
        resp.state = data.slice(-1)[0];
        return resp;
    }
    catch (_a) {
        //throw new Error(error);
    }
}
exports._parseIdentityResponse = _parseIdentityResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwrQ0FBaUQ7QUE0THhDLHFCQTVMQSwwQkFBVSxDQTRMQTtBQUFFLGVBNUxBLG9CQUFJLENBNExBO0FBM0x6Qix1REFBMEU7QUFDMUUsbUNBQTJDO0FBQzNDLDhDQUF3QjtBQUV4Qjs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFnQixhQUFhLENBQUMsS0FBYSxFQUFFLE1BQWMsRUFBRSxJQUFZO0lBQ3ZFLElBQU0sUUFBUSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDOUIsSUFBTSxNQUFNLEdBQUcsUUFBUSxHQUFHLE1BQU0sQ0FBQztJQUNqQyxJQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDdkMsT0FBTyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLENBQUM7QUFMRCxzQ0FLQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLGFBQWEsQ0FDM0IsR0FBVyxFQUNYLE1BQWM7SUFFZCxJQUFJLEVBQUUsR0FBVyxHQUFHLEVBQ2xCLEdBQUcsR0FBb0MsQ0FBQyxDQUFDO0lBQzNDLElBQUk7UUFDRixJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDckIsSUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4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