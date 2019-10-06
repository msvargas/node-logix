import { RemoteInfo } from "dgram";
import { unpackFrom, pack, DataType } from "python-struct";
import LGXDevice, { getDevice, getVendor, ILGXDevice } from "./lgxDevice";
import { PinMappingError } from "./errors";
import PLC from "./PLC";

declare module "python-struct" {
  export function unpackFrom(
    format: string,
    data: Buffer,
    checkBounds: boolean | undefined,
    position: number
  ): Array<DataType>;
}

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
export function getWordCount(start: number, length: number, bits: number) {
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
export function parseTagName(
  tag: string,
  offset: number
): [string, string, Array<number> | number] {
  let bt: string = tag,
    ind: number | string | Array<number> = 0;
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
        ind = s.map(n => Math.round(parseInt(n)));
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
export function BitofWord(tag: string) {
  const s = tag.split(".");
  return /^\d+$/.test(s[s.length - 1]);
}

/**
 * @description Returns the specific bit of a words value
 * @param {Number} value
 * @param {Number} bitno
 * @returns {Boolean}
 */
export function BitValue(value: number, bitno: number) {
  return value & (1 << bitno);
}

/**
 * @description Takes a tag name, gets the bit from the end of it, then returns that bits value
 * @param {String} tag
 * @param {Number} value
 * @returns {Boolean}
 */
export function getBitOfWord(tag: string, value: number) {
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
 * Helper to return dynamic name function
 * @param {String} name
 * @param {Function} body
 */

export function nameFunction(
  name: string,
  body: (...args: []) => any
): () => any {
  return {
    [name]() {
      return body();
    }
  }[name];
}

/**
 * @description replace pin mapping
 * @param {String} str
 * @param {Number} pin
 * @param {String}
 */
export function _replacePin(str: string = "", pin: string): string {
  if (typeof str !== "string")
    throw new TypeError("Pin must be a string not a " + typeof str);
  if (typeof pin === "string" && !/\d{1,}/.test(pin))
    throw new TypeError("Pin must has number to assing pin value: " + pin);
  const match = str.match(/{(d+)}/) as RegExpMatchArray;
  if (match === null)
    throw new PinMappingError(`Replace: ${str} no match with {d} or {dd}`);
  if (match.index == undefined)
    throw new PinMappingError("No match found to pin");

  return str.replace(match[0], String(pin).padStart(match[1].length, "0"));
}

/**
 * flatten array
 * @param {Array} arr
 * @returns {Array}
 */
export const flatten = (arr: Array<any>) =>
  arr.reduce((flat, next) => flat.concat(next), []);
/**
 * @description we're going to take the packet and parse all the data that is in it.
 * @param {Buffer|Array} data
 * @returns {LGXDevice}
 */
export function parseIdentityResponse(
  data: Buffer,
  rinfo?: RemoteInfo,
  resp?: LGXDevice | PLC
) {
  if (!resp) resp = new LGXDevice(rinfo);
  try {
    if (!(resp instanceof PLC)) {
      resp.length = unpackFrom("<H", data, true, 28)[0] as number;
      resp.encapsulationVersion = (unpackFrom("<H", data, true, 30) as any)[0];
      const longIP = unpackFrom("<I", data, true, 36)[0] as number;
      resp.IPAddress = pack("<L", longIP).join(".");
    }
    resp.vendorId = unpackFrom("<H", data, true, 48)[0] as number;
    resp.vendor = getVendor(resp.vendorId);

    resp.deviceType = unpackFrom("<H", data, true, 50)[0] as number;
    resp.device = getDevice(resp.deviceType);

    resp.productCode = unpackFrom("<H", data, true, 52)[0] as number;
    const major = unpackFrom("<B", data, true, 54)[0] as number;
    const minor = unpackFrom("<B", data, true, 55)[0] as number;
    resp.revision = major === minor ? String(major) : major + "." + minor;

    resp.status = unpackFrom("<H", data, true, 56)[0] as number;
    resp.serialNumber = unpackFrom("<I", data, true, 58)[0] as number;
    resp.productName = data
      .slice(63, 63 + <number>unpackFrom("<B", data, true, 62)[0])
      .toString();

    resp.state = data.slice(-1)[0];
    return resp;
  } catch {
    //throw new Error(error);
  }
}

export { unpackFrom, pack, ILGXDevice };
