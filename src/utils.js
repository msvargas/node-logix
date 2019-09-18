/**
 * @description Get the number of words that the requested
    bits would occupy.  We have to take into account
    how many bits are in a word and the fact that the
    number of requested bits can span multipe words
 * @param {Number} start 
 * @param {Number} length 
 * @param {Number} bits 
 */
function _getWordCount(start, length, bits) {
  const newStart = start % bits;
  const newEnd = newStart + length;
  const totalWords = (newEnd - 1) / bits;
  return totalWords + 1;
}

/**
 * @description parse the packet to get the base tag name
    the offset is so that we can increment the array pointer if need be
 * @param {String} tag 
 * @param {Number} offset 
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
      ex. Tag.1 returns true (Tag = DINT)
   * @param {String} tag 
   */
function BitofWord(tag) {
  const s = tag.split(".");
  if (/^\d+$/.test(s[s.length - 1])) return true;
  else return false;
}

/**
 * @description Returns the specific bit of a words value
 * @param {Number} value
 * @param {Number} bitno
 */
function BitValue(value, bitno) {
  const mask = 1 << bitno;
  if (value & mask) return true;
  else return false;
}

/**
 * @copyright https://stackoverflow.com/questions/15987750/equivalent-of-inet-aton-in-mongodb
 * @example ip example: 192.168.2.1
 * @param {String} ip
 */
function inet_aton(ip) {
  var a = new Array();
  a = ip.split(".");
  return (
    ((a[0] << 24) >>> 0) +
    ((a[1] << 16) >>> 0) +
    ((a[2] << 8) >>> 0) +
    (a[3] >>> 0)
  );
}

/**
 * @example num example: 3232236033
 * @param {Number} n
 */
function inet_ntoa(n) {
  var a = ((n >> 24) & 0xff) >>> 0;
  var b = ((n >> 16) & 0xff) >>> 0;
  var c = ((n >> 8) & 0xff) >>> 0;
  var d = (n & 0xff) >>> 0;
  return a + "." + b + "." + c + "." + d;
}
/**
 * @description Takes a tag name, gets the bit from the end of it, then returns that bits value
 * @param {String} tag
 * @param {*} value
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

exports._parseTagName = _parseTagName;
exports._getWordCount = _getWordCount;
exports._getBitOfWord = _getBitOfWord;
exports._replacePin = _replacePin;

exports.BitofWord = BitofWord;
exports.BitValue = BitValue;
exports.inet_aton = inet_aton;
exports.inet_ntoa = inet_ntoa;
