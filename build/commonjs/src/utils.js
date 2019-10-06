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
function getWordCount(start, length, bits) {
    var newStart = start % bits;
    var newEnd = newStart + length;
    var totalWords = (newEnd - 1) / bits;
    return totalWords + 1;
}
exports.getWordCount = getWordCount;
function parseTagName(tag, offset) {
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
exports.parseTagName = parseTagName;
function BitofWord(tag) {
    var s = tag.split(".");
    return /^\d+$/.test(s[s.length - 1]);
}
exports.BitofWord = BitofWord;
function BitValue(value, bitno) {
    return value & (1 << bitno);
}
exports.BitValue = BitValue;
function getBitOfWord(tag, value) {
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
exports.getBitOfWord = getBitOfWord;
function nameFunction(name, body) {
    var _a;
    return (_a = {},
        _a[name] = function () {
            return body();
        },
        _a)[name];
}
exports.nameFunction = nameFunction;
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
exports.flatten = function (arr) {
    return arr.reduce(function (flat, next) { return flat.concat(next); }, []);
};
function parseIdentityResponse(data, rinfo, resp) {
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
    }
}
exports.parseIdentityResponse = parseIdentityResponse;
//# sourceMappingURL=utils.js.map