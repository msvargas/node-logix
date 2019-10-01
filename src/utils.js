"use strict";
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
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
var python_struct_1 = require("python-struct");
exports.unpackFrom = python_struct_1.unpackFrom;
exports.pack = python_struct_1.pack;
var lgxDevice_1 = __importStar(require("./lgxDevice"));
var errors_1 = require("./errors");
var bluebird_1 = __importDefault(require("bluebird"));
global.Promise = bluebird_1.default;
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
  var bt = tag,
    ind = 0;
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
      } else {
        ind = s.map(function(n) {
          return Math.round(parseInt(n));
        });
      }
    }
    return [tag, bt, ind];
  } catch (error) {
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
  var split_tag = tag.split("."),
    stripped = split_tag[split_tag.length - 1];
  var returnValue;
  if (stripped.endsWith("]")) {
    var val = parseInt(
      stripped.slice(stripped.indexOf("[") + 1, stripped.lastIndexOf("]")),
      10
    );
    var bitPos = val & 0x1f;
    returnValue = BitValue(value, bitPos);
  } else {
    try {
      var bitPos = parseInt(stripped, 10);
      if (bitPos <= 31) returnValue = BitValue(value, bitPos);
    } catch (error) {}
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
  return ((_a = {}),
  (_a[name] = function() {
    return body();
  }),
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
  if (str === void 0) {
    str = "";
  }
  if (typeof str !== "string")
    throw new TypeError("Pin must be a string not a " + typeof str);
  if (typeof pin === "string" && !/\d{1,}/.test(pin))
    throw new TypeError("Pin must has number to assing pin value: " + pin);
  var match = str.match(/{(d+)}/);
  if (match === null)
    throw new errors_1.PinMappingError(
      "Replace: " + str + " no match with {d} or {dd}"
    );
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
exports.flatten = function(arr) {
  return arr.reduce(function(flat, next) {
    return flat.concat(next);
  }, []);
};
/**
 * @description we're going to take the packet and parse all the data that is in it.
 * @param {Buffer|Array} data
 * @returns {LGXDevice}
 */
function _parseIdentityResponse(data, rinfo) {
  var resp = new lgxDevice_1.default(rinfo);
  try {
    resp.length = python_struct_1.unpackFrom("<H", data, true, 28)[0];
    resp.encapsulationVersion = python_struct_1.unpackFrom(
      "<H",
      data,
      true,
      30
    )[0];
    var longIP = python_struct_1.unpackFrom("<I", data, true, 36)[0];
    resp.IPAddress = python_struct_1.pack("<L", longIP).join(".");
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
  } catch (_a) {
    //throw new Error(error);
  }
}
exports._parseIdentityResponse = _parseIdentityResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwrQ0FBaUQ7QUF5THhDLHFCQXpMQSwwQkFBVSxDQXlMQTtBQUFFLGVBekxBLG9CQUFJLENBeUxBO0FBeEx6Qix1REFBOEQ7QUFDOUQsbUNBQTJDO0FBQzNDLHNEQUErQjtBQUUvQixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFPLENBQUM7QUFFekI7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLEtBQWEsRUFBRSxNQUFjLEVBQUUsSUFBWTtJQUN2RSxJQUFNLFFBQVEsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQzlCLElBQU0sTUFBTSxHQUFHLFFBQVEsR0FBRyxNQUFNLENBQUM7SUFDakMsSUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3ZDLE9BQU8sVUFBVSxHQUFHLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBTEQsc0NBS0M7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixhQUFhLENBQzNCLEdBQVcsRUFDWCxNQUFjO0lBRWQsSUFBSSxFQUFFLEdBQVcsR0FBRyxFQUNsQixHQUFHLEdBQW9DLENBQUMsQ0FBQztJQUMzQyxJQUFJO1FBQ0YsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3JCLElBQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENB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
