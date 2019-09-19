const { unpackFrom, pack } = require("python-struct");
const { LGXDevice, getDevice, getVendor } = require("./lgxDevice");
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
  const newStart = start % bits;
  const newEnd = newStart + length;
  const totalWords = (newEnd - 1) / bits;
  return totalWords + 1;
}

/**
 * @description parse the packet to get the base tag name
 *   the offset is so that we can increment the array pointer if need be
 * @param {String} tag
 * @param {Number} offset
 * @returns {Array}
 */
function _parseTagName(tag, offset) {
  let bt = tag,
    ind = 0;
  try {
    if (tag.endsWith("]")) {
      const pos = tag.length - tag.indexOf("[");
      bt = tag.slice(0, -pos);
      const temp = tag.slice(-pos);
      ind = temp.slice(1, -1);
      const s = ind.split(",");
      if (s.length === 1) {
        ind = parseInt(ind, 10);
        //const newTagName = bt+'['+ind+offset+']'
      } else {
        ind = s.map(Math.round);
      }
    }
    return [tag, bt, ind];
  } catch (error) {
    return [tag, bt, 0];
  }
}

/**
 * @description Test if the user is trying to write to a bit of a word
 *   ex. Tag.1 returns true (Tag = DINT)
 * @param {String} tag
 * @returns {Boolean}
 */
function BitofWord(tag) {
  const s = tag.split(".");
  return /^\d+$/.test(s[s.length - 1]);
}

/**
 * @description Returns the specific bit of a words value
 * @param {Number} value
 * @param {Number} bitno
 * @returns {Boolean}
 */
function BitValue(value, bitno) {
  return value & (1 << bitno);
}

/**
 * @description Takes a tag name, gets the bit from the end of it, then returns that bits value
 * @param {String} tag
 * @param {String} value
 * @returns {Boolean}
 */
function _getBitOfWord(tag, value) {
  const split_tag = tag.split("."),
    stripped = split_tag[split_tag.length - 1];
  let returnValue;
  if (stripped.endsWith("]")) {
    const val = parseInt(
      stripped.slice(stripped.indexOf("[") + 1, stripped.lastIndexOf("]")),
      10
    );
    const bitPos = val & 0x1f;
    returnValue = BitValue(value, bitPos);
  } else {
    try {
      const bitPos = parseInt(stripped, 10);
      if (bitPos <= 31) returnValue = BitValue(value, bitPos);
    } catch (error) {}
  }
  return returnValue;
}

/**
 * @description replace pin mapping
 * @param {String} str
 * @param {Number} pin
 * @param {String}
 */
function _replacePin(str = "", pin) {
  if (typeof str !== "string")
    throw new TypeError("Pin must be a string not a " + typeof str);
  if (typeof pin === "string" && !/\d{1,}/.test(pin))
    throw new TypeError("Pin must has number to assing pin value: " + pin);
  const match = str.match(/{(d+)}/);
  if (match === null)
    throw new PinMappingError(`Replace: ${str} no match with {d} or {dd}`);
  if (match.index > 0) {
    return str.replace(match[0], String(pin).padStart(match[1].length, "0"));
  }
  return str;
}

/**
 * flatten array
 * @param {Array} arr
 * @returns {Array}
 */
const flatten = arr => arr.reduce((flat, next) => flat.concat(next), []);
/**
 * @description we're going to take the packet and parse all the data that is in it.
 * @param {Buffer|Array} data
 * @returns {LGXDevice}
 */
function _parseIdentityResponse(data, rinfo) {
  const resp = new LGXDevice(rinfo);
  resp.length = unpackFrom("<H", data, true, 28)[0];
  resp.encapsulationVersion = unpackFrom("<H", data, true, 30)[0];

  const longIP = unpackFrom("<I", data, true, 36)[0];
  resp.IPAddress = pack("<L", longIP).join(".");
  resp.vendorId = unpackFrom("<H", data, true, 48)[0];
  resp.vendor = getVendor(resp.vendorId);

  resp.deviceType = unpackFrom("<H", data, true, 50)[0];
  resp.device = getDevice(resp.deviceType);

  resp.productCode = unpackFrom("<H", data, true, 52)[0];
  const major = unpackFrom("<B", data, true, 54)[0];
  const minor = unpackFrom("<B", data, true, 55)[0];
  resp.revision = major === minor ? major : major + "." + minor;

  resp.status = unpackFrom("<H", data, true, 56)[0];
  resp.serialNumber = "0x" + unpackFrom("<I", data, true, 58)[0].toString(16);
  const productNameLength = unpackFrom("<B", data, true, 62)[0];
  resp.productName = data.slice(63, 63 + productNameLength).toString("utf8");

  resp.state = data.slice(-1)[0];

  return resp;
}

exports.unpackFrom = unpackFrom;
exports.pack = pack;
exports.LGXDevice = LGXDevice;
exports.flatten = flatten;
exports._parseIdentityResponse = _parseIdentityResponse;
exports._parseTagName = _parseTagName;
exports._getWordCount = _getWordCount;
exports._getBitOfWord = _getBitOfWord;
exports._replacePin = _replacePin;
exports.BitofWord = BitofWord;
exports.BitValue = BitValue;
