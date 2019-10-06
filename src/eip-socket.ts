import { Socket } from "net";
import { EventEmitter } from "events";
import Bluebird from "bluebird";
import { Pool, Options } from "generic-pool";
import {
  unpackFrom,
  pack,
  parseTagName,
  BitValue,
  BitofWord,
  getBitOfWord,
  getWordCount,
  parseIdentityResponse,
  nameFunction
} from "./utils";
import {
  RegisterSessionError,
  ForwarOpenError,
  getErrorCode,
  LogixError,
  ConnectionLostError,
  ConnectionTimeoutError,
  ConnectionError
} from "./errors";
import LGXDevice from "./lgxDevice";
import CIPTypes from "../resources/CIPTypes.json";
import context_dict from "../resources/CIPContext.json";

export interface ITagReadOptions {
  count?: number;
  dataType?: number;
}

export interface ITagWriteOptions {
  count?: number;
  dataType?: number;
}

export interface IEIPContextOptions {
  pool?: Options;
  port: number;
  host?: string;
  Micro800?: boolean;
  vendorId?: number;
  processorSlot?: number;
  connectionSize?: number;
  connectTimeout?: number;
  allowHalfOpen?: boolean;
}

export type CIPType = (string | number)[];

export interface ICIPTypes {
  readonly [index: string]: CIPType;
}

export interface IKnownTags {
  [index: string]: CIPType;
}

export class EIPContext extends EventEmitter implements IEIPContextOptions {
  public port: number = 44818;
  public Micro800: boolean = false;
  public vendorId: number = 0x1337;
  public processorSlot: number = 0;
  public connectionSize: number = 508;
  public host: string = "";
  public connectTimeout: number = 5000;
  public allowHalfOpen: boolean = true;
  public connectionPath: Array<number> = [0x20, 0x02, 0x24, 0x01];
  public CIPTypes: ICIPTypes = CIPTypes;
  public connectionPathSize: number = 3;
  public structIdentifier: number = 0x0fce;
  public knownTags: IKnownTags = {};
  public _connected: boolean = false;
  public _connecting: boolean = false;
  public tagList?: Array<LgxTag>;
  public programNames?: string[];
  public timeoutReceive: number = 15000;
  public _pool?: Pool<EIPSocket>;

  constructor(options: IEIPContextOptions) {
    super();
    if (
      options.connectionSize &&
      (options.connectionSize < 500 || options.connectionSize > 4000)
    ) {
      throw new EvalError(
        "ConnectionSize must be an integer between 500 and 4000"
      );
    }
    Object.assign(this, options);
    if (this.Micro800) {
      this.connectionPathSize = 2;
      this.vendorId = 0x01;
    } else
      this.connectionPath = [0x01, this.processorSlot, 0x20, 0x02, 0x24, 0x01];
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  on(event: string, listener: (...args: []) => void): any {
    super.on(event, listener);
    return nameFunction(`off_${event}`, () => {
      super.off(event, listener);
    });
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  once(event: string, listener: (...args: []) => void): any {
    super.once(event, listener);
    return nameFunction(`off_${event}`, () => {
      super.off(event, listener);
    });
  }
}

export default class EIPSocket extends Socket {
  /**
   * @description Create EtherNet/IP socket to read/write tags in PLC
   * @param {EIPContext} context
   */
  private _connected: boolean = false;
  private _context: number = 0;
  public contextPointer: number = 0;
  public sessionHandle: number = 0x0000;
  public originatorSerialNumber: number = 42;
  public sequenceCounter: number = 1;
  public offset: number = 0;
  public serialNumber: number = 0;
  public id: number = 0;
  private _closing: boolean = false;

  constructor(public context: EIPContext) {
    super({ allowHalfOpen: context && context.allowHalfOpen });
  }
  /**
   * @description check if socket is connected
   * @returns {Boolean}
   */
  get connected(): boolean {
    return this._connected && !this.destroyed;
  }
  /**
   * @description Check if socket is disconnected
   * @returns {Boolean}
   */
  get disconnected(): boolean {
    return !this.connected;
  }
  /**
   * @description Check if closing
   */
  get closing(): boolean {
    return this._closing;
  }
  /**
   * @private
   * @description Register our CIP connection
   * @returns {Buffer}
   */
  buildRegisterSession(): Buffer {
    return pack(
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
  }
  /**
   * @private
   * @description Unregister CIP connection
   * @returns {Buffer}
   */
  buildUnregisterSession(): Buffer {
    return pack(
      "<HHIIQI",
      0x66,
      0x0,
      this.sessionHandle,
      0x0000,
      this._context,
      0x0000
    );
  }
  /**
   * @private
   * @description  Assemble the forward open packet
   * @returns {Buffer}
   */
  buildForwardOpenPacket(): Buffer {
    const forwardOpen = this.buildCIPForwardOpen();
    const rrDataHeader = this.buildEIPSendRRDataHeader(forwardOpen.length);
    return Buffer.concat(
      [rrDataHeader, forwardOpen],
      forwardOpen.length + rrDataHeader.length
    );
  }
  /**
   * @private
   * @description  Assemble the forward close packet
   * @returns {Buffer}
   */
  buildForwardClosePacket(): Buffer {
    const forwardClose = this.buildForwardClose();
    const rrDataHeader = this.buildEIPSendRRDataHeader(forwardClose.length);
    return Buffer.concat(
      [rrDataHeader, forwardClose],
      forwardClose.length + rrDataHeader.length
    );
  }
  /**
   * @private
   * @description Forward Open happens after a connection is made,
   *    this will sequp the CIP connection parameters
   * @returns {Buffer}
   */
  buildCIPForwardOpen(): Buffer | never {
    if (!this.context) throw new Error("Please must be assing context");
    this.serialNumber = ~~(Math.random() * 65001);
    let CIPService,
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
    const ForwardOpen = pack(
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
    const data = pack(
      pack_format,
      this.context.connectionPathSize,
      ...this.context.connectionPath
    );
    return Buffer.concat([ForwardOpen, data], ForwardOpen.length + data.length);
  }
  /**
   * @description Forward Close packet for closing the connection
   * @returns {Buffer}
   */
  buildForwardClose(): Buffer {
    const ForwardClose = pack(
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
    const pack_format = "<H" + this.context.connectionPath.length + "B";
    const CIPConnectionPath = pack(
      pack_format,
      this.context.connectionPathSize,
      ...this.context.connectionPath
    );
    return Buffer.concat(
      [ForwardClose, CIPConnectionPath],
      ForwardClose.length + CIPConnectionPath.length
    );
  }
  /**
   * @param {Number} frameLen
   * @returns {Buffer}
   */
  buildEIPSendRRDataHeader(frameLen: number): Buffer {
    return pack(
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
  }
  /**
   * @private
   * @description  The EIP Header contains the tagIOI and the
   *      commands to perform the read or write.  This request
   *     will be followed by the reply containing the data
   * @param {Buffer} tagIOI
   * @returns {Buffer}
   */
  buildEIPHeader(tagIOI: Buffer): Buffer {
    if (this.contextPointer === 155) this.contextPointer = 0;
    this.contextPointer += 1;
    const EIPHeaderFrame = pack(
      "<HHIIQIIHHHHIHHH",
      0x70,
      22 + tagIOI.length,
      this.sessionHandle,
      0x00,
      (context_dict as any)[this.contextPointer],
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
    return Buffer.concat(
      [EIPHeaderFrame, tagIOI],
      EIPHeaderFrame.length + tagIOI.length
    );
  }
  /**
   * @description Service header for making a multiple tag request
   * @returns {Buffer}
   */
  buildMultiServiceHeader(): Buffer {
    return pack(
      "<BBBBBB",
      0x0a, // MultiService
      0x02, // MultiPathSize
      0x20, // MutliClassType
      0x02, // MultiClassSegment
      0x24, // MultiInstanceType
      0x01 // MultiInstanceSegment
    );
  }
  /**
   * @description  Build the request for the PLC tags
   *     Program scoped tags will pass the program name for the request
   * @param {String} programName
   * @returns {Buffer}
   */
  buildTagListRequest(programName?: string): Buffer {
    let PathSegment: Buffer = Buffer.from([]);

    //If we're dealing with program scoped tags...
    if (programName) {
      PathSegment = pack("<BB", 0x91, programName.length, programName);
      //if odd number of characters, need to add a byte to the end.
      if (programName.length % 2) {
        const data = pack("<B", 0x00);
        PathSegment = Buffer.concat(
          [PathSegment, data],
          PathSegment.length + data.length
        );
      }
    }

    let data = pack("<H", 0x6b20);
    PathSegment = Buffer.concat(
      [PathSegment, data],
      PathSegment.length + data.length
    );

    if (this.offset < 256) data = pack("<BB", 0x24, this.offset);
    else data = pack("<HH", 0x25, this.offset);

    PathSegment = Buffer.concat(
      [PathSegment, data],
      PathSegment.length + data.length
    );

    const Attributes = pack("<HHHH", 0x03, 0x01, 0x02, 0x08);
    data = pack("<BB", 0x55, ~~(PathSegment.length / 2));

    return Buffer.concat(
      [data, PathSegment, Attributes],
      data.length + PathSegment.length + Attributes.length
    );
  }
  /**
   * @private
   * @description  Add the partial read service to the tag IOI
   * @param {Buffer} tagIOI
   * @param {Number} elements
   * @returns {Buffer}
   */
  addPartialReadIOI(tagIOI: Buffer, elements: number): Buffer {
    const data1 = pack("<BB", 0x52, ~~(tagIOI.length / 2));
    const data2 = pack("<H", elements);
    const data3 = pack("<I", this.offset);
    return Buffer.concat(
      [data1, tagIOI, data2, data3],
      data1.length + data2.length + data3.length + tagIOI.length
    );
  }
  /**
   * @private
   * @description Add the read service to the tagIOI
   * @param {Buffer} tagIOI
   * @param {Number} elements
   * @returns {Buffer}
   */
  addReadIOI(tagIOI: Buffer, elements: number): Buffer {
    const data1 = pack("<BB", 0x4c, ~~(tagIOI.length / 2));
    const data2 = pack("<H", elements);
    return Buffer.concat(
      [data1, tagIOI, data2],
      data1.length + data2.length + tagIOI.length
    );
  }
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
  buildTagIOI(tagName: string, isBoolArray: boolean): Buffer {
    let RequestTagData = Buffer.from([]);
    const tagArray = tagName.split(".");
    tagArray.forEach((_tag, i) => {
      if (_tag.endsWith("]")) {
        let [_, basetag, index] = parseTagName(_tag, 0);
        let BaseTagLenBytes = basetag.length;
        if (
          isBoolArray &&
          i === tagArray.length - 1 &&
          typeof index === "number"
        )
          index = ~~(index / 32);
        const data1 = pack("<BB", 0x91, BaseTagLenBytes);
        // Assemble the packet
        RequestTagData = Buffer.concat(
          [RequestTagData, data1, Buffer.from(basetag, "utf8")],
          RequestTagData.length + data1.length + BaseTagLenBytes
        );
        if (BaseTagLenBytes % 2) {
          BaseTagLenBytes += 1;
          const data = pack("<B", 0x00);
          RequestTagData = Buffer.concat(
            [RequestTagData, data],
            RequestTagData.length + data.length
          );
        }
        // const BaseTagLenWords = BaseTagLenBytes / 2;
        if (i < tagArray.length) {
          if (!Array.isArray(index)) {
            if (index < 256) {
              const data = pack("<BB", 0x28, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                data.length + RequestTagData.length
              );
            }

            if (65536 > index && index > 255) {
              const data = pack("<HH", 0x29, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                RequestTagData.length + data.length
              );
            }

            if (index > 65535) {
              const data = pack("<HI", 0x2a, index);
              RequestTagData = Buffer.concat(
                [RequestTagData, data],
                data.length + RequestTagData.length
              );
            }
          } else {
            index.forEach(element => {
              if (element < 256) {
                const data = pack("<BB", 0x28, element);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }

              if (65536 > element && element > 255) {
                const data = pack("<HH", 0x29, element);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }

              if (element > 65535) {
                const data = pack("<HI", 0x2a, element);
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
        let BaseTagLenBytes = _tag.length;
        const data = pack("<BB", 0x91, BaseTagLenBytes);
        RequestTagData = Buffer.concat(
          [RequestTagData, data, Buffer.from(_tag, "utf8")],
          data.length + RequestTagData.length + BaseTagLenBytes
        );
        if (BaseTagLenBytes % 2) {
          const data = pack("<B", 0x00);
          BaseTagLenBytes += 1;
          RequestTagData = Buffer.concat(
            [RequestTagData, data],
            data.length + RequestTagData.length
          );
        }
      }
    });
    return RequestTagData;
  }
  /**
   * @description build unconnected send to request tag database
   * @returns {Buffer}
   */
  buildCIPUnconnectedSend(): Buffer {
    return pack(
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
  }
  /**
   * @private
   * @description  Gets the replies from the PLC
   *               In the case of BOOL arrays and bits of a word, we do some reformating
   * @param {String} tag
   * @param {Number} elements
   * @param {Buffer|Array} data
   * @returns {Boolean|Array|Number}
   */
  async parseReply(
    tag: string,
    elements: number,
    data: Buffer | Array<number | string | boolean> | boolean | string
  ): Promise<Buffer | Array<number | string | boolean> | boolean | string> {
    const [_, basetag, index] = parseTagName(tag, 0);
    const datatype = this.context.knownTags[basetag][0],
      bitCount = (this.context.CIPTypes[datatype][0] as number) * 8;
    let vals;
    // if bit of word was requested
    if (BitofWord(tag)) {
      const split_tag = tag.split("."),
        bitPos = parseInt(split_tag[split_tag.length - 1]);
      const wordCount = getWordCount(bitPos, elements, bitCount);
      const words = await this.getReplyValues(tag, wordCount, data);
      vals = this.wordsToBits(tag, words, elements);
    } else if (datatype === 211) {
      const wordCount = getWordCount(index as number, elements, bitCount),
        words = await this.getReplyValues(tag, wordCount, data);
      vals = this.wordsToBits(tag, words, elements);
    } else {
      vals = await this.getReplyValues(tag, elements, data);
    }
    return vals.length === 1 ? vals[0] : vals;
  }
  /**
   * @private
   * @description Gather up all the values in the reply/replies
   * @param {String} tag
   * @param {Number} elements
   * @param {*} data
   * @returns {Array}
   */
  async getReplyValues(
    tag: string,
    elements: number,
    data: any
  ): Promise<Array<any>> {
    let status = unpackFrom("<B", data, true, 48)[0] as number;

    if (status == 0 || status == 6) {
      // parse the tag
      const basetag = parseTagName(tag, 0)[1];
      const datatype = this.context.knownTags[basetag][0] as number,
        CIPFormat = this.context.CIPTypes[datatype][2] as string;
      let vals = [];

      const dataSize = this.context.CIPTypes[datatype][0] as number;
      let numbytes = data.length - dataSize,
        counter = 0;
      this.offset = 0;
      for (let i = 0; i < elements; i++) {
        let index = 52 + counter * dataSize;
        if (datatype === 160) {
          const tmp = unpackFrom("<h", data, true, 52)[0];
          if (tmp == this.context.structIdentifier) {
            // gotta handle strings a little different
            index = 54 + counter * dataSize;
            const NameLength = unpackFrom("<L", data, true, index)[0] as number;
            const s = data.slice(index + 4, index + 4 + NameLength);
            vals.push(s.toString("utf8"));
          } else {
            const d = data.slice(index, index + data.length);
            vals.push(d);
          }
        } else if (datatype === 218) {
          index = 52 + counter * dataSize;
          const NameLength = unpackFrom("<B", data, true, index)[0] as number;
          const s = data.slice(index + 1, index + 1 + NameLength);
          vals.push(s.toString("utf8"));
        } else {
          const returnvalue = unpackFrom(CIPFormat, data, false, index)[0];
          vals.push(returnvalue);
        }
        this.offset += dataSize;
        counter += 1;
        //re-read because the data is in more than one packet
        if (index == numbytes && status == 6) {
          index = 0;
          counter = 0;

          const tagIOI = this.buildTagIOI(tag, false);
          const readIOI = this.addPartialReadIOI(tagIOI, elements);
          const eipHeader = this.buildEIPHeader(readIOI);

          await this.send(eipHeader);
          const data = (await this.recv_data()) as Buffer;

          status = unpackFrom("<B", data, true, 48)[0] as number;
          numbytes = data.length - dataSize;
        }
      }
      return vals;
    } else {
      const err = getErrorCode(status);
      throw new LogixError(
        `Failed to read tag-${tag} - ${err}`,
        status as number
      );
    }
  }
  /**
   * @property
   * @description Convert words to a list of true/false
   * @param {String} tag
   * @param {*} value
   * @param {Number} count
   * @returns {Array<Boolean>}
   */
  wordsToBits(
    tag: string,
    value: Array<number>,
    count: number = 0
  ): Array<boolean> {
    const [_, basetag, index] = parseTagName(tag, 0),
      datatype = this.context.knownTags[basetag][0],
      bitCount = <number>this.context.CIPTypes[datatype][0] * 8;
    let bitPos;
    if (datatype == 211) {
      bitPos = <number>index % 32;
    } else {
      const split_tag = tag.split(".");
      bitPos = split_tag[split_tag.length - 1];
      bitPos = parseInt(bitPos);
    }

    const ret: Array<boolean> = [];
    for (const v of value) {
      for (let i = 0; i < bitCount; i++) {
        ret.push(Boolean(BitValue(v, i)));
      }
    }
    return ret.slice(bitPos, bitPos + count);
  }
  /**
   * @description         Takes multi read reply data and returns an array of the values
   * @param {Array} tags Tags list to get read
   * @param {Buffer} data
   * @return {Array}
   */
  multiParser(tags: Array<string>, data: Buffer): Array<any> {
    //remove the beginning of the packet because we just don't care about it
    const stripped = data.slice(50);
    //const tagCount = unpackFrom("<H", stripped, true, 0)[0];
    const reply = [];
    for (let i = 0; i < tags.length; i++) {
      let tag = tags[i];
      if (Array.isArray(tag)) tag = tag[0];
      const loc = 2 + i * 2;
      const offset = unpackFrom("<H", stripped, true, loc)[0] as number;
      const replyStatus = unpackFrom(
        "<b",
        stripped,
        true,
        offset + 2
      )[0] as number;
      const replyExtended = unpackFrom(
        "<b",
        stripped,
        true,
        offset + 3
      )[0] as number;
      let response;
      //successful reply, add the value to our list
      if (replyStatus == 0 && replyExtended == 0) {
        const dataTypeValue = unpackFrom(
          "<B",
          stripped,
          true,
          offset + 4
        )[0] as number;
        // if bit of word was requested
        if (BitofWord(tag)) {
          const dataTypeFormat = this.context.CIPTypes[
            dataTypeValue
          ][2] as string;
          const val = unpackFrom(
            dataTypeFormat,
            stripped,
            true,
            offset + 6
          )[0] as number;
          const bitState = getBitOfWord(tag, val);
          response = new LgxResponse(tag, bitState, replyStatus);
          //reply.push(bitState);
        } else if (dataTypeValue == 211) {
          const dataTypeFormat = this.context.CIPTypes[
            dataTypeValue
          ][2] as string;
          const val = unpackFrom(
            dataTypeFormat,
            stripped,
            true,
            offset + 6
          )[0] as number;
          const bitState = getBitOfWord(tag, val);
          //reply.push(bitState);
          response = new LgxResponse(tag, bitState, replyStatus);
        } else if (dataTypeValue == 160) {
          const strlen = unpackFrom(
            "<B",
            stripped,
            true,
            offset + 8
          )[0] as number;
          const s = stripped.slice(offset + 12, offset + 12 + strlen);
          const value = s.toString("utf8");
          response = new LgxResponse(tag, value, replyStatus);
          //reply.push(s.toString("utf8"));
        } else {
          const dataTypeFormat = this.context.CIPTypes[
            dataTypeValue
          ][2] as string;
          //reply.push(unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0]);
          const value = unpackFrom(
            dataTypeFormat,
            stripped,
            false,
            offset + 6
          )[0];
          response = new LgxResponse(tag, value, replyStatus);
        }
      } else {
        response = new LgxResponse(tag, undefined, replyStatus);
      }
      reply.push(response);
    }
    return reply;
  }
  /**
   *
   * @param {Buffer} data
   * @param {String} programName
   * @returns {void}
   */
  extractTagPacket(data: Buffer, programName?: string): void {
    // the first tag in a packet starts at byte 50
    let packetStart = 50;
    if (!this.context.tagList) this.context.tagList = [];
    if (!this.context.programNames) this.context.programNames = [];
    while (packetStart < data.length) {
      //get the length of the tag name
      const tagLen = unpackFrom("<H", data, true, packetStart + 4)[0] as number;
      //get a single tag from the packet
      const packet = data.slice(packetStart, packetStart + tagLen + 20);
      //extract the offset
      this.offset = unpackFrom("<H", packet, true, 0)[0] as number;
      //add the tag to our tag list
      const tag = parseLgxTag(packet, programName);
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
  }

  /**
   * @private
   * @description Store each unique tag read in a dict so that we can retreive the
   *        data type or data length (for STRING) later
   * @param {String} baseTag
   * @param {Number} dt dataType of tag
   * @returns {Boolean}
   */
  private _initial_read(baseTag: string, dt: number | null): Bluebird<boolean> {
    return Bluebird.try(() => {
      if (baseTag in this.context.knownTags) return true;
      if (dt) {
        this.context.knownTags[baseTag] = [dt, 0];
        return true;
      }
      const tagData = this.buildTagIOI(baseTag, false),
        readRequest = this.addPartialReadIOI(tagData, 1);
      const eipHeader = this.buildEIPHeader(readRequest);
      // send our tag read request
      return this.getBytes(eipHeader).spread((status, retData) => {
        //make sure it was successful
        if (status == 0 || status == 6) {
          const dataType = unpackFrom(
            "<B",
            <Buffer>retData,
            true,
            50
          )[0] as number;
          const dataLen = unpackFrom(
            "<H",
            <Buffer>retData,
            true,
            2
          )[0] as number; // this is really just used for STRING
          this.context.knownTags[baseTag] = [dataType, dataLen];
          return true;
        } else {
          let err = getErrorCode(<number>status);
          // lost connection
          if (status === 7) {
            err = new ConnectionLostError();
            this.destroy();
          } else if (status === 1) {
            err = new ConnectionError(err);
          } else {
            err = new LogixError(`Failed to read tag-${err}`, <number>status);
          }
          err.code = status;
          throw err;
        }
      });
    });
  }
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
  addWriteBitIOI(
    tag: string,
    tagIOI: Buffer,
    writeData: Array<any>,
    dataType: number
  ): Buffer {
    const NumberOfBytes =
      <number>this.context.CIPTypes[dataType][0] * writeData.length;
    let data = pack("<BB", 0x4e, ~~(tagIOI.length / 2));
    let writeIOI = Buffer.concat([data, tagIOI], data.length + tagIOI.length);
    const fmt = (this.context.CIPTypes[dataType][2] as string).toUpperCase();
    const s = tag.split(".");
    let bit;
    if (dataType == 211) {
      bit = <number>parseTagName(s[s.length - 1], 0)[2] % 32;
    } else {
      bit = parseInt(s[s.length - 1]);
    }
    data = pack("<h", NumberOfBytes);
    writeIOI = Buffer.concat([writeIOI, data], writeIOI.length + data.length);
    const byte = Math.pow(2, NumberOfBytes * 8 - 1);
    const bits = Math.pow(2, bit);
    if (writeData[0]) {
      const data1 = pack(fmt, bits);
      const data2 = pack(fmt, byte);
      writeIOI = Buffer.concat(
        [writeIOI, data1, data2],
        writeIOI.length + data1.length + data2.length
      );
    } else {
      const data1 = pack(fmt, 0x00);
      const data2 = pack(fmt, byte - bits);
      writeIOI = Buffer.concat(
        [writeIOI, data1, data2],
        writeIOI.length + data1.length + data2.length
      );
    }
    return writeIOI;
  }
  /**
   * @private
   * @param {Buffer} tagIOI
   * @param {Array} writeData
   * @param {Number} dataType
   * @returns {Buffer}
   */
  addWriteIOI(tagIOI: Buffer, writeData: Array<any>, dataType: number): Buffer {
    // Add the write command stuff to the tagIOI
    let data = pack("<BB", 0x4d, ~~(tagIOI.length / 2));
    let CIPWriteRequest = Buffer.concat(
        [data, tagIOI],
        data.length + tagIOI.length
      ),
      RequestNumberOfElements = writeData.length,
      TypeCodeLen;

    if (dataType == 160) {
      RequestNumberOfElements = this.context.structIdentifier;
      TypeCodeLen = 0x02;
      data = pack(
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
      data = pack("<BBH", dataType, TypeCodeLen, RequestNumberOfElements);
      CIPWriteRequest = Buffer.concat(
        [CIPWriteRequest, data],
        CIPWriteRequest.length + data.length
      );
    }

    for (const v of writeData) {
      if (Array.isArray(v) || typeof v === "string") {
        for (let i = 0; i < v.length; i++) {
          const el = v[i];
          data = pack(this.context.CIPTypes[dataType][2] as string, el);
          CIPWriteRequest = Buffer.concat(
            [CIPWriteRequest, data],
            CIPWriteRequest.length + data.length
          );
        }
      } else {
        data = pack(this.context.CIPTypes[dataType][2] as string, v);
        CIPWriteRequest = Buffer.concat(
          [CIPWriteRequest, data],
          data.length + CIPWriteRequest.length
        );
      }
    }
    return CIPWriteRequest;
  }
  /**
   * @private write tag function low level
   * @param {String} tag
   * @param {any} value
   * @param {Object} options
   *  @param {Number} dataType
   *  @param {Boolean} emitEvent emit event if value change
   *
   */
  writeTag(
    tag: string,
    value: any,
    options: ITagWriteOptions = {}
  ): Bluebird<boolean> {
    const { dataType: dt }: ITagWriteOptions = options;
    return Bluebird.try<boolean>(() => {
      this.offset = 0;
      const writeData: Array<string | number | Array<number>> = [];
      const [t, b, i] = parseTagName(tag, 0);
      return this._initial_read(b, dt as number)
        .then(() => b)
        .then(b => {
          /**
           * Processes the write request
           */
          const dataType = this.context.knownTags[b][0] as number;
          // check if values passed were a list
          if (Array.isArray(value)) {
          } else {
            value = [value];
          }

          for (const v of value) {
            if (dataType == 202 || dataType == 203) {
              writeData.push(Number(v));
            } else if (dataType == 160 || dataType == 218) {
              writeData.push(this._makeString(v));
            } else {
              writeData.push(Number(v));
            }
          }
          let tagData, writeRequest;
          if (BitofWord(tag)) {
            tagData = this.buildTagIOI(tag, false);
            writeRequest = this.addWriteBitIOI(
              tag,
              tagData,
              writeData,
              dataType
            );
          } else if (dataType == 211) {
            tagData = this.buildTagIOI(tag, true);
            writeRequest = this.addWriteBitIOI(
              tag,
              tagData,
              writeData,
              dataType
            );
          } else {
            tagData = this.buildTagIOI(tag, false);
            writeRequest = this.addWriteIOI(tagData, writeData, dataType);
          }
          return this.getBytes(this.buildEIPHeader(writeRequest));
        })
        .spread(status => {
          if (status != 0) {
            const err = getErrorCode(<number>status);
            throw new LogixError(`Write failed -${err}`, <number>status);
          }
          return true;
        });
    });
  }
  /**
   * @description  Read tag function low level
   * @private
   * @param {String} tag tagName
   * @param {Number} elements Num elements
   * @param {Number} dt DataType
   * @returns {Array|Boolean|Number|String}}
   */
  readTag(tag: string, options: ITagReadOptions = {}): any {
    const { count: elements = 1, dataType: dt } = options;
    return Bluebird.try(() => {
      this.offset = 0;
      const [t, b, i] = parseTagName(tag, 0);
      return this._initial_read(b, dt as number)
        .then(() => [t, b, i])
        .spread((t, b, i) => {
          const datatype = this.context.knownTags[b as number][0];
          const bitCount = <number>this.context.CIPTypes[datatype][0] * 8;
          let tagData, words, readRequest;

          if (datatype == 211) {
            //bool array
            tagData = this.buildTagIOI(tag, true);
            words = getWordCount(i as number, elements, bitCount);
            readRequest = this.addReadIOI(tagData, words);
          } else if (BitofWord(t as string)) {
            // bits of word
            const split_tag = tag.split(".");
            const bitPos = parseInt(split_tag[split_tag.length - 1]);
            tagData = this.buildTagIOI(tag, false);
            words = getWordCount(bitPos, elements, bitCount);

            readRequest = this.addReadIOI(tagData, words);
          } else {
            //everything else
            tagData = this.buildTagIOI(tag, false);
            readRequest = this.addReadIOI(tagData, elements);
          }
          const eipHeader = this.buildEIPHeader(readRequest);
          return this.getBytes(eipHeader);
        })
        .spread((status, retData) => {
          if (status == 0 || status == 6)
            return this.parseReply(tag, elements, retData as Buffer);
          else {
            const err = getErrorCode(<number>status);
            throw new LogixError("Read failed-" + err, <number>status);
          }
        });
    });
  }
  /**
   * @description Processes the multiple read request
   * @param {Array} tags
   */
  multiReadTag(tags: Array<string>): Bluebird<Array<LgxResponse>> {
    return Bluebird.try<Array<LgxResponse>>(async () => {
      const serviceSegments = [];
      const segments = [];
      let tagCount = tags.length;
      this.offset = 0;

      for (let index = 0; index < tags.length; index++) {
        const tag = tags[index];
        let tag_name, base;
        if (Array.isArray(tag)) {
          const result = parseTagName(tag[0], 0);
          base = result[1];
          tag_name = result[0];
          await this._initial_read(base, tag[1]);
        } else {
          const result = parseTagName(tag, 0);
          base = result[1];
          tag_name = result[0];
          await this._initial_read(base, null);
        }
        const dataType = this.context.knownTags[base][0];
        const tagIOI = this.buildTagIOI(tag_name, dataType == 211);
        serviceSegments.push(this.addReadIOI(tagIOI, 1));
      }
      const header = this.buildMultiServiceHeader();
      const segmentCount = pack("<H", tagCount);
      let temp = header.length;
      if (tagCount > 2) temp += (tagCount - 2) * 2;
      let offsets = pack("<H", temp);

      // assemble all the segments
      for (let i = 0; i < tagCount; i++)
        segments.push(...Array.from(serviceSegments[i]));

      for (let i = 0; i < tagCount - 1; i++) {
        temp += serviceSegments[i].length;
        const data = pack("<H", temp);
        offsets = Buffer.concat([offsets, data], data.length + offsets.length);
      }
      const readRequest = Buffer.concat(
        [header, segmentCount, offsets, Buffer.from(segments)],
        header.length + segmentCount.length + offsets.length + segments.length
      );
      const eipHeader = this.buildEIPHeader(readRequest);
      const [status, retData] = await this.getBytes(eipHeader);
      if (status == 0) {
        return this.multiParser(tags, retData);
      } else {
        const err = getErrorCode(status);
        throw new LogixError(
          `Multi-read failed-${tags.toString()} - ${err}`,
          status
        );
      }
    });
  }
  /**
   * @description Requests the PLC clock time
   * @param {Boolean} raw
   */
  async getWallClockTime(raw: boolean): Promise<number | Date> {
    const AttributePacket = pack(
      "<BBBBBBH1H",
      0x03, // AttributeService
      0x02, // AttributeSize
      0x20, // AttributeClassType
      0x8b, // AttributeClass
      0x24, // AttributeInstanceType
      0x01, // AttributeInstance
      0x01, // AttributeCount
      0x0b // TimeAttribute
    );
    const eipHeader = this.buildEIPHeader(AttributePacket);
    const [status, retData] = await this.getBytes(eipHeader);
    if (status == 0) {
      const us = Number(unpackFrom("<Q", retData, true, 56)[0].toString());
      return raw
        ? us
        : new Date(new Date(1970, 1, 1).getTime() * 0.001 + us / 1000);
    } else {
      const err = getErrorCode(status);
      throw new LogixError(`Failed get PLC time ${err}`, status);
    }
  }

  async setWallClockTime(date: Date = new Date()): Promise<boolean> {
    const AttributePacket = pack(
      "<BBBBBBHHQ",
      0x04, //AttributeService
      0x02, // AttributeSize
      0x20, // AttributeClassType
      0x8b, // AttributeClass
      0x24, // AttributeInstanceType
      0x01, // AttributeInstance
      0x01, // AttributeCount
      0x06, // Attribute
      date.getTime() * 1000
    );
    const eipHeader = this.buildEIPHeader(AttributePacket);
    const [status, _] = await this.getBytes(eipHeader);
    if (status == 0) {
      return true;
    } else {
      const err = getErrorCode(status);
      throw new LogixError(`Failed set PLC time ${err}`, status);
    }
  }
  /**
   * @description         Retrieves the tag list from the PLC
   *     Optional parameter allTags set to True
   *     If is set to False, it will return only controller
   *     otherwise controller tags and program tags.
   * @param {Boolean} allTags
   * @returns {Array}
   *
   */
  async getTagList(
    allTags: boolean = true
  ): Promise<Array<LgxTag> | undefined> {
    if (allTags) {
      await this._getTagList();
      await this._getAllProgramsTags();
    } else {
      await this._getTagList();
    }
    await this._getUDT();
    return this.context.tagList;
  }
  /**
   *  @description Retrieves a program tag list from the PLC
   *     programName = "Program:ExampleProgram"
   */
  async getProgramTagList(programName: string) {
    // Ensure programNames is not empty
    if (this.context.programNames) await this._getTagList();
    else this.context.programNames = [];
    //Get a single program tags if programName exists
    if (this.context.programNames.includes(programName)) {
      await this._getProgramTagList(programName);
      await this._getUDT();
      return this.context.tagList;
    } else {
      return new Error("Program not found, please check name!");
    }
  }
  /**
   * @description         Retrieves a program names list from the PLC
   *    Sanity check: checks if programNames is empty
   *     and runs _getTagList
   */
  async getProgramsList(): Promise<Array<string> | undefined> {
    if (!this.context.programNames || !this.context.programNames.length)
      await this._getTagList();
    return this.context.programNames;
  }
  /**
   * @description Requests the controller tag list and returns a list of LgxTag type
   */
  private async _getTagList() {
    this.offset = 0;
    delete this.context.programNames;
    delete this.context.tagList;
    let request = this.buildTagListRequest();
    let eipHeader = this.buildEIPHeader(request);
    let [status, retData] = await this.getBytes(eipHeader);

    if (status === 0 || status === 6) {
      this.extractTagPacket(retData);
    } else {
      const err = getErrorCode(status);
      throw new LogixError(`Failed to get tag list ${err}`, status);
    }
    while (status == 6) {
      this.offset += 1;
      request = this.buildTagListRequest();
      eipHeader = this.buildEIPHeader(request);
      [status, retData] = await this.getBytes(eipHeader);
      if (status == 0 || status == 6) this.extractTagPacket(retData);
      else {
        const err = getErrorCode(status);
        throw new LogixError(`Failed to get tag list-${err}`, status);
      }
    }
    return;
  }
  /**
   * @description Requests all programs tag list and appends to taglist (LgxTag type)
   */
  private async _getAllProgramsTags() {
    this.offset = 0;
    if (!this.context.programNames) return;
    for (const programName of this.context.programNames) {
      this.offset = 0;
      const request = this.buildTagListRequest(programName);
      const eipHeader = this.buildEIPHeader(request);
      const [status, retData] = await this.getBytes(eipHeader);
      if (status == 0 || status == 6)
        this.extractTagPacket(retData, programName);
      else {
        const err = getErrorCode(status);
        throw new LogixError(`Failed to get program tag list ${err}`, status);
      }

      while (status == 6) {
        this.offset += 1;
        const request = this.buildTagListRequest(programName);
        const eipHeader = this.buildEIPHeader(request);
        const [status, retData] = await this.getBytes(eipHeader);
        if (status == 0 || status == 6)
          this.extractTagPacket(retData, programName);
        else {
          const err = getErrorCode(status);
          throw new LogixError(`Failed to get program tag list ${err}`, status);
        }
      }
    }
    return;
  }
  /**
   * @description Requests tag list for a specific program and returns a list of LgxTag type
   * @param {String} programName
   */
  private async _getProgramTagList(programName?: string) {
    this.offset = 0;
    delete this.context.tagList;

    const request = this.buildTagListRequest(programName);
    const eipHeader = this.buildEIPHeader(request);
    const [status, retData] = await this.getBytes(eipHeader);
    if (status == 0 || status == 6) this.extractTagPacket(retData, programName);
    else {
      const err = getErrorCode(status);
      throw new LogixError(`Failed to get program tag list ${err}`, status);
    }

    while (status == 6) {
      this.offset += 1;
      const request = this.buildTagListRequest(programName);
      const eipHeader = this.buildEIPHeader(request);
      const [status, retData] = await this.getBytes(eipHeader);
      if (status == 0 || status == 6)
        this.extractTagPacket(retData, programName);
      else {
        const err = getErrorCode(status);
        throw new LogixError(`Failed to get program tag list ${err}`, status);
      }
    }

    return;
  }

  private async _getUDT() {
    if (!this.context.tagList) return;
    //get only tags that are a struct
    const struct_tags = this.context.tagList.filter(x => x.struct);
    // reduce our struct tag list to only unique instances
    const seen = new Set();
    const unique = struct_tags.filter(obj => {
      if (obj.dataTypeValue && !seen.has(obj.dataTypeValue)) {
        seen.add(obj.dataTypeValue);
        return true;
      }
      return false;
    });
    const template: any = {};
    for (const u of unique) {
      const temp = await this.getTemplateAttribute(u.dataTypeValue);
      const data = temp.slice(46);
      const val = unpackFrom("<I", data, true, 10)[0] as number;
      const words = val * 4 - 23;
      const member_count = unpackFrom("<H", data, true, 24)[0] as number;
      template[u.dataTypeValue] = [words, "", member_count];
    }
    for (let [key, value] of Object.entries(template)) {
      const t = await this.getTemplate(parseInt(key), (value as any)[0]);
      const size = (value as any)[2] * 8;
      const p = t.slice(50);
      const member_bytes = p.slice(size);
      let split_char: string = pack("<b", 0x00).toString();
      const members = member_bytes.toString().split(split_char);
      split_char = pack("<b", 0x3b).toString();
      const name = members[0].split(split_char)[0];
      template[key][1] = String(name.toString());
    }
    for (const tag of this.context.tagList) {
      if (tag.dataTypeValue in template) {
        tag.dataType = template[tag.dataTypeValue][1];
      } else if (tag.symbolType in this.context.CIPTypes) {
        tag.dataType = <string>this.context.CIPTypes[tag.symbolType][1];
      }
    }
    return;
  }
  /**
   * @description Get the attributes of a UDT
   * @param {Number} instance
   */
  async getTemplateAttribute(instance: number): Bluebird<Buffer> {
    return Bluebird.try<Buffer>(
      async (): Promise<Buffer> => {
        const readRequest = this.buildTemplateAttributes(instance);
        const eipHeader = this.buildEIPHeader(readRequest);
        const [_, retData] = await this.getBytes(eipHeader);
        return retData;
      }
    );
  }
  /**
   * @description  Get the members of a UDT so we can get it
   * @param {Number} instance
   * @param {Number} dataLen
   * @returns {Bluebird<Buffer>}
   */
  async getTemplate(instance: number, dataLen: number): Bluebird<Buffer> {
    const readRequest = this.readTemplateService(instance, dataLen);
    const eipHeader = this.buildEIPHeader(readRequest);
    const [_, retData] = await this.getBytes(eipHeader);
    return retData;
  }
  /**
   *
   * @param {Number} instance
   * @returns {Buffer}
   */
  buildTemplateAttributes(instance: number): Buffer {
    return pack(
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
  }
  /**
   * @returns {Buffer}
   */
  readTemplateService(instance: number, dataLen: number): Buffer {
    return pack(
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
  }
  /**
   *
   * @description get properties of PLC
   * @param {LGXDevice} pass response object, current PLC or LGXDevice
   */
  getIdentity(resp?: LGXDevice): Bluebird<LGXDevice | undefined> {
    return Bluebird.try<LGXDevice | undefined>(async () => {
      const request = EIPSocket.buildListIdentity();
      const [_, data] = await this.getBytes(request);
      return parseIdentityResponse(data, undefined, resp);
    });
  }
  /**
   * @description  Request the properties of a module in a particular
   *      slot
   * @returns {LGXDevice}
   */
  getModuleProperties(slot = 0): Bluebird<LGXDevice> {
    return Bluebird.try<LGXDevice>(
      async (): Promise<LGXDevice> => {
        const AttributePacket = pack(
          "<10B",
          0x01, //AttributeService
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

        const frame = this.buildCIPUnconnectedSend();
        let eipHeader = this.buildEIPSendRRDataHeader(frame.length);
        eipHeader = Buffer.concat(
          [eipHeader, frame, AttributePacket],
          eipHeader.length + frame.length + AttributePacket.length
        );
        const pad = pack("<I", 0x00);
        this.send(eipHeader);
        let retData = await this.recv_data();

        retData = Buffer.concat([pad, retData], pad.length + retData.length);
        const status = <number>unpackFrom("<B", retData, true, 46)[0];

        return status == 0
          ? new LgxResponse(undefined, parseIdentityResponse(retData), status)
          : new LgxResponse(undefined, new LGXDevice(), status);
      }
    );
  }

  /**
   * @private
   * @description get packet string to send CIP data
   * @param {String} string
   * @returns {String}
   */
  private _makeString(string: string): Array<number> {
    const work = [];
    let temp = "";
    if (this.context.Micro800) {
      temp = pack("<B", string.length).toString("utf8");
    } else {
      temp = pack("<I", string.length).toString("utf8");
    }
    for (let i = 0; i < temp.length; i++) work.push(temp.charCodeAt(i));
    for (let i = 0; i < string.length; i++) work.push(string.charCodeAt(i));
    if (!this.context.Micro800)
      for (let i = string.length; i < 84; i++) work.push(0x00);

    return work;
  }
  /**
   * send data to socket and wait response
   * @param {Buffer} data
   */
  send(data: Buffer): Bluebird<boolean> {
    return new Bluebird<boolean>((resolve, reject) => {
      this.setNoDelay(true);
      this.write(data, error => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }
  /**
   * @description listen data received from PLC
   * @returns {Promise<Buffer>}
   */
  recv_data(): Bluebird<Buffer> {
    return Bluebird.try<Buffer>(
      async (): Promise<Buffer> => {
        try {
          return await new Bluebird<Buffer>(resolve => {
            this.once("data", resolve);
          }).timeout(this.context.timeoutReceive, "timeout-recv-data");
        } catch (error) {
          if (error instanceof Bluebird.TimeoutError)
            this.removeAllListeners("data");
          throw error;
        }
      }
    );
  }
  /**
   * send and receive data
   * @param {Buffer} data
   * @returns {Bluebird<Buffer>}
   */
  getBytes(data: Buffer): Bluebird<[number, Buffer]> {
    return Bluebird.try<[number, Buffer]>(
      async (): Promise<[number, Buffer]> => {
        try {
          this.resume();
          await this.send(data);
          const retData = await this.recv_data();
          this.pause();
          if (retData) {
            return [<number>unpackFrom("<B", retData, true, 48)[0], retData];
          } else {
            throw [1, undefined];
          }
        } catch (error) {
          throw error;
          /* if (!Array.isArray(error)) {
            throw new ConnectionLostError();
          } else {
            throw error;
          } */
        }
      }
    );
  }
  /**
   * @override
   * @description connect to PLC using EIP protocol
   * @returns {Bluebird<EIPSocket>}
   */
  connect(): Bluebird<EIPSocket> | any {
    return new Bluebird((resolve, reject) => {
      if (!this.context.host)
        return reject(new TypeError("host option must be assigned"));
      const onError = () => {
        super.destroy();
        reject(
          new ConnectionTimeoutError(
            this.context.host,
            this.context.connectTimeout
          )
        );
      };
      super.setTimeout(this.context.connectTimeout);
      super.once("timeout", onError);
      super.once("error", onError);
      super.connect(this.context.port, this.context.host, () => {
        super.setTimeout(0);
        super.removeAllListeners();
        resolve();
      });
    })
      .then(() => this.send(this.buildRegisterSession()))
      .then(() => this.recv_data())
      .then(retData => {
        return Bluebird.try(() => {
          if (retData) {
            this.sequenceCounter = 1;
            this.sessionHandle = unpackFrom(
              "<I",
              retData,
              false,
              4
            )[0] as number;
            return true;
          } else {
            throw new RegisterSessionError();
          }
        });
      })
      .then(() => this.send(this.buildForwardOpenPacket()))
      .then(() => this.recv_data())
      .then(retData => [retData, unpackFrom("<b", retData, false, 42)[0]])
      .spread((retData, sts) => {
        super.removeAllListeners();
        if (!sts) {
          super.once("timeout", () => {
            this.end();
          });
          super.once("error", () => {
            this.disconnect();
          });
          this.id = <number>unpackFrom("<I", <Buffer>retData, true, 44)[0];
          this._connected = true;
          this.pause();
          return this;
        } else {
          this.destroy();
          this._connected = false;
          throw new ForwarOpenError();
        }
      });
  }
  /**
   * @description Destroy and disconnect EIP socket
   * @returns {Bluebird<void>}
   */
  disconnect(): Bluebird<void> {
    return Bluebird.try(async () => {
      if (this.disconnected || this._closing) return;
      this._closing = true;
      if (
        this.connected &&
        this.context._pool &&
        !this.context._pool.isBorrowedResource(this)
      ) {
        this.removeAllListeners();
        const close_packet = this.buildForwardClosePacket();
        const unreg_packet = this.buildUnregisterSession();
        await this.send(close_packet);
        await this.send(unreg_packet);
      }
      super.destroy();
      this._closing = false;
      this._connected = false;
    });
  }
  /**
   * @override
   * @description Destroy and disconnect EIP socket and destroy from pool
   * @returns {Bluebird<void>}
   */
  destroy(): Bluebird<any> {
    return Bluebird.resolve(async () => {
      await this.disconnect();
      this.context._pool && (await this.context._pool.destroy(this));
      super.destroy();
    });
  }

  /**
   * @static
   * @description Create CIP session
   * @returns {Bluebird<EIPSocket>}
   */
  static createClient(context: EIPContext): Bluebird<EIPSocket> {
    var socket = new EIPSocket(context);
    return Bluebird.try(() => {
      return socket.connect();
    });
  }
  /**
   * @description Build the list identity request for discovering Ethernet I/P
   *     devices on the network
   */
  static buildListIdentity(): Buffer {
    return pack(
      "<HHIIHHHHI",
      0x63, // ListService
      0x00, // ListLength
      0x00, // ListSessionHandle
      0x00, // ListStatus
      0xfa, // ListResponse
      0x6948, // ListContext1
      0x6f4d, // ListContext2
      0x006d, // ListContext3
      0x00 // ListOptions
    );
  }
  /**
   * @description to string override
   */
  toString() {
    return "[Object EIPSocket]";
  }
}

/**
 *
 * @param {Buffer} packet
 * @param {String} programName
 */
function parseLgxTag(packet: Buffer, programName?: string) {
  const t = new LgxTag();
  const length = unpackFrom("<H", packet, true, 4)[0] as number;
  const name = packet.slice(6, length + 6).toString("utf8");
  if (programName) t.tagName = String(programName + "." + name);
  else t.tagName = String(name);
  t.instanceId = unpackFrom("<H", packet, true, 0)[0] as number;
  const val = unpackFrom("<H", packet, true, length + 6)[0] as number;
  t.symbolType = val & 0xff;
  t.dataTypeValue = val & 0xfff;
  t.array = Boolean((val & 0x6000) >> 13);
  t.struct = Boolean((val & 0x8000) >> 15);
  if (t.array) t.size = <number>unpackFrom("<H", packet, true, length + 8)[0];
  else t.size = 0;
  return t;
}

export class LgxTag {
  tagName: string = "";
  instanceId: number = 0x00;
  symbolType: number = 0x00;
  dataTypeValue: number = 0x00;
  dataType: string = "";
  array: boolean = false;
  struct: boolean = false;
  size: number = 0x00;
  constructor() {}
  toString() {
    return "[Object LgxTag]";
  }
}

export class LgxResponse {
  public message?: string;
  constructor(
    public tag_name?: string | undefined,
    public value?: any,
    public status?: number
  ) {
    if (status) this.message = getErrorCode(status);
  }
  toString() {
    return "[Object LgxResponse]";
  }
}

export { CIPTypes };
