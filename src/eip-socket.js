"use-strict";
const { Socket } = require("net");
const Promise = require("bluebird");
const { EventEmitter } = require("events");
const CIPTypes = require("../assets/CIPTypes.json");

const {
  unpackFrom,
  pack,
  _parseTagName,
  BitValue,
  BitofWord,
  _getBitOfWord,
  _getWordCount,
  _parseIdentityResponse,
  LGXDevice,
  nameFunction
} = require("./utils");
const {
  RegisterSessionError,
  ForwarOpenError,
  cipErrorCodes,
  LogixError,
  ConnectionLostError,
  ConnectionTimeoutError,
  ConnectionError
} = require("./errors");
const context_dict = require("../assets/CIPContext.json");

class EIPContext extends EventEmitter {
  constructor(props) {
    super();
    const {
      Micro800,
      vendorId,
      processorSlot,
      connectionSize,
      port,
      host,
      connectTimeout,
      allowHalfOpen
    } = props || {};
    this.port = port || 44818;
    this.host = host;
    this.allowHalfOpen = allowHalfOpen || true;
    this.Micro800 = !!Micro800;
    this.connectionSize = connectionSize || 508;
    this.vendorId = vendorId || 0x1337;
    this.processorSlot = processorSlot || 0;
    this.CIPTypes = CIPTypes;
    this.connectionPath = Micro800
      ? [0x20, 0x02, 0x24, 0x01]
      : [0x01, processorSlot, 0x20, 0x02, 0x24, 0x01];
    this.connectionPathSize = Micro800 ? 2 : 3;
    this.structIdentifier = 0x0fce;
    this.knownTags = {};
    this.connectTimeout = connectTimeout || 5000;
    this._connected = false;
    this._connecting = false;
    this.tagList = [];
    this.programNames = [];
  }
  /**
   * @override
   * @param {String} event
   * @param {Function} listener
   */
  on(event, listener) {
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
  once(event, listener) {
    super.once(event, listener);
    return nameFunction(`off_${event}`, () => {
      super.off(event, listener);
    });
  }
}

class EIPSocket extends Socket {
  /**
   * @description Create EtherNet/IP socket to read/write tags in PLC
   * @param {EIPContext} context
   */
  constructor(context) {
    super({ allowHalfOpen: context.allowHalfOpen });
    this.context = context;
    this._connected = false;
    this._context = 0x00;
    this.contextPointer = 0;
    this.sessionHandle = 0x0000;
    this.originatorSerialNumber = 42;
    this.sequenceCounter = 1;
    this.offset = 0;
    this.serialNumber = 0;
    this.id = 0;
  }
  /**
   * @description check if socket is connected
   * @returns {Boolean}
   */
  get connected() {
    return this._connected && !this.destroyed;
  }
  /**
   * @description Check if socket is disconnected
   * @returns {Boolean}
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * @private
   * @description Register our CIP connection
   * @returns {Buffer}
   */
  buildRegisterSession() {
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
  buildUnregisterSession() {
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
  buildForwardOpenPacket() {
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
  buildForwardClosePacket() {
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
  buildCIPForwardOpen() {
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
  buildForwardClose() {
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
  buildEIPSendRRDataHeader(frameLen) {
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
  buildEIPHeader(tagIOI) {
    if (this.contextPointer === 155) this.contextPointer = 0;
    this.contextPointer += 1;
    const EIPHeaderFrame = pack(
      "<HHIIQIIHHHHIHHH",
      0x70,
      22 + tagIOI.length,
      this.sessionHandle,
      0x00,
      context_dict[this.contextPointer],
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
  }
  /**
   * @description Service header for making a multiple tag request
   * @returns {Buffer}
   */
  buildMultiServiceHeader() {
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
  buildTagListRequest(programName) {
    let PathSegment = Buffer.from([]);

    //If we're dealing with program scoped tags...
    if (programName) {
      PathSegment =
        pack("<BB", 0x91, programName.length) + programName.toString();
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
  addPartialReadIOI(tagIOI, elements) {
    const data1 = pack("<BB", 0x52, ~~(tagIOI.length / 2));
    const data2 = pack("<H", parseInt(elements));
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
  addReadIOI(tagIOI, elements) {
    const data1 = pack("<BB", 0x4c, ~~(tagIOI.length / 2));
    const data2 = pack("<H", parseInt(elements, 10));
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
  buildTagIOI(tagName, isBoolArray) {
    let RequestTagData = Buffer.from([]);
    const tagArray = tagName.split(".");
    tagArray.forEach((_tag, i) => {
      if (_tag.endsWith("]")) {
        const [_, basetag, index] = _parseTagName(_tag, 0);
        let BaseTagLenBytes = basetag.length;
        if (isBoolArray && i === tagArray.length - 1) index = ~~(index / 32);
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

            if (65536 > index > 255) {
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
                  data.length + RequestTagData
                );
              }

              if (65536 > element > 255) {
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
  buildCIPUnconnectedSend() {
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
  async parseReply(tag, elements, data) {
    const [_, basetag, index] = _parseTagName(tag, 0);
    const datatype = this.context.knownTags[basetag][0],
      bitCount = this.context.CIPTypes[datatype][0] * 8;
    let vals;
    // if bit of word was requested
    if (BitofWord(tag)) {
      const split_tag = tag.split("."),
        bitPos = parseInt(split_tag[split_tag.length - 1]);
      const wordCount = _getWordCount(bitPos, elements, bitCount);
      words = await this.getReplyValues(tag, wordCount, data);
      vals = this.wordsToBits(tag, words, elements);
    } else if (datatype === 211) {
      const wordCount = _getWordCount(index, elements, bitCount),
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
  async getReplyValues(tag, elements, data) {
    let status = unpackFrom("<B", data, true, 48)[0];
    elements = parseInt(elements, 10);
    if (status == 0 || status == 6) {
      // parse the tag
      const basetag = _parseTagName(tag, 0)[1];
      const datatype = this.context.knownTags[basetag][0],
        CIPFormat = this.context.CIPTypes[datatype][2];
      let vals = [];

      const dataSize = this.context.CIPTypes[datatype][0];
      let numbytes = data.length - dataSize,
        counter = 0;
      this.offset = 0
      for (let i = 0; i < elements; i++) {
        let index = 52 + counter * dataSize;
        if (datatype === 160) {
          const tmp = unpackFrom("<h", data, true, 52)[0];
          if (tmp == this.context.structIdentifier) {
            // gotta handle strings a little different
            index = 54 + counter * dataSize;
            const NameLength = unpackFrom("<L", data, true, index)[0];
            const s = data.slice(index + 4, index + 4 + NameLength);
            vals.push(s.toString("utf8"));
          } else {
            const d = data.slice(index, index + data.length);
            vals.push(d);
          }
        } else if (datatype === 218) {
          index = 52 + counter * dataSize;
          const NameLength = unpackFrom("<B", data, true, index)[0];
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
          const data = await this.recv_data();

          status = unpackFrom("<B", data, true, 48)[0];
          numbytes = data.length - dataSize;
        }
      }
      return vals;
    } else {
      const err = get_error_code(status);
      throw new LogixError(`Failed to read tag-${tag} - ${err}`, status);
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
  wordsToBits(tag, value, count = 0) {
    const [_, basetag, index] = _parseTagName(tag, 0),
      datatype = this.context.knownTags[basetag][0],
      bitCount = this.context.CIPTypes[datatype][0] * 8;
    let bitPos;
    if (datatype == 211) {
      bitPos = index % 32;
    } else {
      const split_tag = tag.split(".");
      bitPos = split_tag[split_tag.length - 1];
      bitPos = parseInt(bitPos);
    }

    const ret = [];
    for (const v of value) {
      for (let i = 0; i < bitCount; i++) {
        ret.push(BitValue(v, i));
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
  multiParser(tags, data) {
    //remove the beginning of the packet because we just don't care about it
    const stripped = data.slice(50);
    //const tagCount = unpackFrom("<H", stripped, true, 0)[0];
    const reply = [];
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (Array.isArray(tag)) tag = tag[0];
      const loc = 2 + i * 2;
      const offset = unpackFrom("<H", stripped, true, loc)[0];
      const replyStatus = unpackFrom("<b", stripped, true, offset + 2)[0];
      const replyExtended = unpackFrom("<b", stripped, true, offset + 3)[0];
      let response;
      //successful reply, add the value to our list
      if (replyStatus == 0 && replyExtended == 0) {
        const dataTypeValue = unpackFrom("<B", stripped, true, offset + 4)[0];
        // if bit of word was requested
        if (BitofWord(tag)) {
          const dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          const val = unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
          const bitState = _getBitOfWord(tag, val);
          response = Response(tag, bitState, replyStatus);
          //reply.push(bitState);
        } else if (dataTypeValue == 211) {
          const dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          const val = unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0];
          const bitState = _getBitOfWord(tag, val);
          //reply.push(bitState);
          response = Response(tag, bitState, replyStatus);
        } else if (dataTypeValue == 160) {
          const strlen = unpackFrom("<B", stripped, true, offset + 8);
          const s = stripped.slice(offset + 12, offset + 12 + strlen);
          const value = s.toString("utf8");
          response = Response(tag, value, replyStatus);
          //reply.push(s.toString("utf8"));
        } else {
          const dataTypeFormat = this.context.CIPTypes[dataTypeValue][2];
          //reply.push(unpackFrom(dataTypeFormat, stripped, true, offset + 6)[0]);
          const value = unpackFrom(
            dataTypeFormat,
            stripped,
            false,
            offset + 6
          )[0];
          response = Response(tag, value, replyStatus);
        }
      } else {
        response = Response(tag, undefined, replyStatus);
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
  extractTagPacket(data, programName) {
    // the first tag in a packet starts at byte 50
    let packetStart = 50;
    if (!this.context.tagList) this.context.tagList = [];
    if (!this.context.programNames) this.context.programNames = [];
    // console.log(data[50:])
    while (packetStart < data.length) {
      //get the length of the tag name
      const tagLen = unpackFrom("<H", data, true, packetStart + 4)[0];
      //get a single tag from the packet
      const packet = data.slice(packetStart, packetStart + tagLen + 20);
      //extract the offset
      this.offset = unpackFrom("<H", packet, true, 0)[0];
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
  _initial_read(baseTag, dt) {
    return Promise.try(() => {
      if (baseTag in this.context.knownTags) return true;
      if (dt) {
        this.context.knownTags[baseTag] = [dt, 0];
        return true;
      }
      const tagData = this.buildTagIOI(baseTag, false),
        readRequest = this.addPartialReadIOI(tagData, 1);

      const eipHeader = this.buildEIPHeader(readRequest);
      //console.log("[EIP HEADER]", eipHeader.toString(), eipHeader.length);
      // send our tag read request
      return this.getBytes(eipHeader).spread((status, retData) => {
        //make sure it was successful
        if (status == 0 || status == 6) {
          const dataType = unpackFrom("<B", retData, true, 50)[0];
          const dataLen = unpackFrom("<H", retData, true, 2)[0]; // this is really just used for STRING
          this.context.knownTags[baseTag] = [dataType, dataLen];
          return true;
        } else {
          let err = get_error_code(status);
          // lost connection
          if (status === 7) {
            err = new ConnectionLostError(err);
            this._destroy();
          } else if (status === 1) {
            err = new ConnectionError(err);
          } else {
            err = new LogixError(`Failed to read tag-${err}`, status);
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
  addWriteBitIOI(tag, tagIOI, writeData, dataType) {
    const NumberOfBytes = this.context.CIPTypes[dataType][0] * writeData.length;
    let data = pack("<BB", 0x4e, ~~(tagIOI.length / 2));
    let writeIOI = Buffer.concat([data, tagIOI], data.length + tagIOI.length);
    const fmt = this.CIPTypes[dataType][2].toUpperCase();
    const s = tag.split(".");
    let bit;
    if (dataType == 211) {
      bit = _parseTagName(s[s.length - 1], 0)[2] % 32;
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
  addWriteIOI(tagIOI, writeData, dataType) {
    //console.log('tagIOI',tagIOI, 'writeData', writeData,dataType)
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
          data = pack(this.context.CIPTypes[dataType][2], el);
          CIPWriteRequest = Buffer.concat(
            [CIPWriteRequest, data],
            CIPWriteRequest.length + data.length
          );
        }
      } else {
        data = pack(this.context.CIPTypes[dataType][2], v);
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
  writeTag(tag, value, options = {}) {
    const { dataType: dt } = options;
    return Promise.try(() => {
      this.offset = 0;
      const writeData = [];
      const [t, b, i] = _parseTagName(tag, 0);
      return this._initial_read(b, dt)
        .then(() => b)
        .then(b => {
          /**
           * Processes the write request
           */
          const dataType = this.context.knownTags[b][0];
          // check if values passed were a list
          if (Array.isArray(value)) {
          } else {
            value = [value];
          }
          //console.log("value:", value);
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
            const err = get_error_code(status);
            throw new LogixError(`Write failed -${err}`, status);
          }
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
  readTag(tag, options = {}) {
    const { count: elements = 1, dataType: dt } = options;
    return Promise.try(() => {
      this.offset = 0;
      const [t, b, i] = _parseTagName(tag, 0);
      return this._initial_read(b, dt)
        .then(() => [t, b, i])
        .spread((t, b, i) => {
          const datatype = this.context.knownTags[b][0];
          const bitCount = this.context.CIPTypes[datatype][0] * 8;
          let tagData, words, readRequest;
          //console.log(this.context.CIPTypes[datatype], datatype);
          if (datatype == 211) {
            //bool array
            tagData = this.buildTagIOI(tag, (isBoolArray = True));
            words = _getWordCount(i, elements, bitCount);
            readRequest = this.addReadIOI(tagData, words);
          } else if (BitofWord(t)) {
            // bits of word
            split_tag = tag.split(".");
            bitPos = split_tag[split_tag.length - 1];
            bitPos = parseInt(bitPos);

            tagData = this.buildTagIOI(tag, false);
            words = _getWordCount(bitPos, elements, bitCount);

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
            return this.parseReply(tag, elements, retData);
          else {
            const err = get_error_code(status);
            throw new LogixError("Read failed-" + err, status);
          }
        });
    });
  }
  /**
   * @description Processes the multiple read request
   * @param {Array} tags
   */
  async multiReadTag(tags) {
    const serviceSegments = [];
    const segments = [];
    let tagCount = tags.length;
    this.offset = 0;
    for (let index = 0; index < tags.length; index++) {
      const tag = tags[index];
      let tag_name, base;
      if (Array.isArray(tag)) {
        const result = _parseTagName(tag[0], 0);
        base = result[1];
        tag_name = result[0];
        await this._initial_read(base, tag[1]);
      } else {
        const result = _parseTagName(tag, 0);
        base = result[1];
        tag_name = result[0];
        await this._initial_read(base, undefined);
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
    for (let i = 0; i < tagCount; i++) segments.push(serviceSegments[i]);

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
      const err = get_error_code(status);
      throw new LogixError(
        `Multi-read failed-${tags.toString()} - ${err}`,
        status
      );
    }
  }
  /**
   * @description Requests the PLC clock time
   * @param {Boolean} raw
   */
  async getTime(raw) {
    const AttributePacket = pack(
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
    const eipHeader = this.buildEIPHeader(AttributePacket);
    const [status, retData] = await this.getBytes(eipHeader);
    if (status == 0) {
      const us = Number(unpackFrom("<Q", retData, true, 56)[0].toString());
      return raw ? us : new Date(1970, 1, 1) + us / 1000;
    } else {
      const err = get_error_code(status);
      throw new LogixError(`Failed get PLC time ${err}`, status);
    }
  }
  async setTime() {
    const AttributePacket = pack(
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
    const eipHeader = this.buildEIPHeader(AttributePacket);
    const [status, _] = await this.getBytes(eipHeader);
    if (status == 0) {
      return;
    } else {
      const err = get_error_code(status);
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
  async getTagList(allTags = true) {
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
  async getProgramTagList(programName) {
    // Ensure programNames is not empty
    if (this.context.programNames) await this._getTagList();

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
  async getProgramsList() {
    if (!this.context.programNames.length) await this._getTagList();
    return this.context.programNames;
  }
  /**
   * @description Requests the controller tag list and returns a list of LgxTag type
   */
  async _getTagList() {
    this.offset = 0;
    delete this.context.programNames;
    delete this.context.tagList;
    let request = this.buildTagListRequest();
    let eipHeader = this.buildEIPHeader(request);
    let [status, retData] = await this.getBytes(eipHeader);

    if (status === 0 || status === 6) {
      this.extractTagPacket(retData);
      //console.log(this.context.tagList);
    } else {
      const err = get_error_code(status);
      throw new LogixError(`Failed to get tag list ${err}`, status);
    }
    while (status == 6) {
      this.offset += 1;
      request = this.buildTagListRequest();
      eipHeader = this.buildEIPHeader(request);
      [status, retData] = await this.getBytes(eipHeader);
      if (status == 0 || status == 6) this.extractTagPacket(retData);
      else {
        const err = get_error_code(status);
        throw new LogixError(`Failed to get tag list-${err}`, status);
      }
    }
    return;
  }
  /**
   * @description Requests all programs tag list and appends to taglist (LgxTag type)
   */
  async _getAllProgramsTags() {
    this.offset = 0;
    for (const programName of this.context.programNames) {
      this.offset = 0;
      const request = this.buildTagListRequest(programName);
      const eipHeader = this.buildEIPHeader(request);
      const [status, retData] = await this.getBytes(eipHeader);
      if (status == 0 || status == 6)
        this._extractTagPacket(retData, programName);
      else {
        const err = get_error_code(status);
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
          const err = get_error_code(status);
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
  async _getProgramTagList(programName) {
    this.offset = 0;
    delete this.context.tagList;

    const request = this.buildTagListRequest(programName);
    const eipHeader = this.buildEIPHeader(request);
    const [status, retData] = await this.getBytes(eipHeader);
    if (status == 0 || status == 6) this.extractTagPacket(retData, programName);
    else {
      const err = get_error_code(status);
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
        const err = get_error_code(status);
        throw new LogixError(`Failed to get program tag list ${err}`, status);
      }
    }

    return;
  }

  async _getUDT() {
    //get only tags that are a struct
    const struct_tags = this.context.tagList.filter(x => x.struct === 1);
    // reduce our struct tag list to only unique instances
    const seen = new Set();
    const unique = struct_tags.filter(obj => {
      if (obj.dataTypeValue && !seen.has(obj.dataTypeValue)) {
        seen.add(obj.dataTypeValue);
        return true;
      }
      return false;
    });
    const template = {};
    for (const u of unique) {
      const temp = await this.getTemplateAttribute(u.dataTypeValue);
      const data = temp.slice(46);
      const val = unpackFrom("<I", data, true, 10)[0];
      const words = val * 4 - 23;
      const member_count = parseInt(unpackFrom("<H", data, true, 24))[0];
      template[u.dataTypeValue] = [words, "", member_count];
    }
    for (let [key, value] of Object.entries(template)) {
      const t = await this.getTemplate(key, value[0]);
      const size = value[2] * 8;
      const p = t.slice(50);
      const member_bytes = p.slice(size);
      let split_char = pack("<b", 0x00);
      const members = member_bytes.split(split_char);
      split_char = pack("<b", 0x3b);
      name = members[0].split(split_char)[0];
      template[key][1] = String(name.toString());
    }
    for (const tag of this.context.tagList) {
      if (tag.dataTypeValue in template) {
        tag.dataType = template[tag.dataTypeValue][1];
      } else if (tag.symbolType in this.context.CIPTypes) {
        tag.dataType = this.context.CIPTypes[tag.symbolType][1];
      }
    }
    return;
  }
  /**
   * @description Get the attributes of a UDT
   * @param {Number} instance
   * @returns {Promise<Buffer>}
   */
  async getTemplateAttribute(instance) {
    const readRequest = this.buildTemplateAttributes(instance);
    const eipHeader = this.buildEIPHeader(readRequest);
    const [_, retData] = await this.getBytes(eipHeader);
    return retData;
  }
  /**
   * @description  Get the members of a UDT so we can get it
   * @param {Number} instance
   * @param {Number} dataLen
   * @returns {Promise<Buffer>}
   */
  async getTemplate(instance, dataLen) {
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
  buildTemplateAttributes(instance) {
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
  readTemplateService(instance, dataLen) {
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
   * @description  Request the properties of a module in a particular
   *      slot
   * @returns {LGXDevice}
   */
  getModuleProperties(slot = 0) {
    const AttributePacket = pack(
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

    const frame = this.buildCIPUnconnectedSend();
    let eipHeader = this.buildEIPSendRRDataHeader(frame.length);
    eipHeader = Buffer.concat(
      [eipHeader, frame, AttributePacket],
      eipHeader.length + frame.length + AttributePacket.length
    );
    const pad = pack("<I", 0x00);
    this.send(eipHeader);
    let retData = this.recv_data();
    retData = Buffer.concat([pad, retData], pad.length + retData.length);
    const status = unpack_from("<B", retData, 46)[0];

    return status == 0
      ? Response(undefined, _parseIdentityResponse(retData), status)
      : Response(undefined, new LGXDevice(), status);
  }

  /**
   * @private
   * @description get packet string to send CIP data
   * @param {String} string
   * @returns {String}
   */
  _makeString(string) {
    const work = [];
    let temp = "";
    if (this.context.Micro800) {
      temp = pack("<B", string.length).toString("utf8");
    } else {
      temp = pack("<I", string.length).toString("utf8");
    }
    for (let i = 0; i < temp.length; i++) work.push(temp.charCodeAt(i));
    for (let i = 0; i < string.length; i++) work.push(string.charCodeAt(i));
    if (!this.context.Micro800) {
      for (let i = string.length; i < 84; i++) work.push(0x00);
    }
    return work;
  }
  /**
   * send data to socket and wait response
   * @param {Buffer} data
   * @returns {Promise<Boolean>}
   */
  send(data) {
    return new Promise((resolve, reject) => {
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
  recv_data() {
    return new Promise(resolve => {
      this.once("data", resolve);
    })
      .timeout(this.context.timeoutReceive || 3000, "timeout-recv-data")
      .catch(error => {
        if (error instanceof Promise.TimeoutError)
          this.removeAllListeners("data");
        return Promise.reject(error);
      });
  }
  /**
   * send and receive data
   * @param {Buffer} data
   * @returns {Promise<Buffer>}
   */
  getBytes(data) {
    return Promise.try(() => {
      return this.send(data)
        .then(() => this.recv_data())
        .then(retData => {
          if (retData) {
            return [unpackFrom("<B", retData, true, 48)[0], retData];
          } else {
            throw [1, undefined];
          }
        })
        .catch(async error => {
          if (!Array.isArray(error)) {
            throw new ConnectionLostError();
          } else {
            throw error;
          }
        });
    });
  }
  /**
   * @override
   * @description connect to PLC using EIP protocol
   * @returns {Promise<EIPSocket>}
   */
  connect() {
    return new Promise((resolve, reject) => {
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
        return Promise.try(() => {
          if (retData) {
            this.sequenceCounter = 1;
            this.sessionHandle = unpackFrom("<I", retData, false, 4)[0];
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
            //console.log("error");
          });
          this.id = unpackFrom("<I", retData, true, 44)[0];
          this._connected = true;
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
   * @returns {Promise<void>}
   */
  disconnect() {
    return Promise.try(async () => {
      if (this.disconnected || this._closing) return;
      this._closing = true;
      if (this.connected && !this.context._pool.isBorrowedResource(this)) {
        this.removeAllListeners();
        const close_packet = this.buildForwardClosePacket();
        const unreg_packet = this.buildUnregisterSession();
        await this.send(close_packet);
        await this.send(unreg_packet);
      }
      super.destroy();
      this.id = undefined;
      this._closing = false;
      this._connected = false;
    });
  }
  /**
   * @override
   * @description Destroy and disconnect EIP socket and destroy from pool
   * @returns {Promise<void>}
   */
  destroy() {
    return Promise.resolve(async () => {
      await this.disconnect();
      await this.context._pool.destroy(this);
      super.destroy();
    });
  }

  /**
   * @static
   * @description Create CIP session
   * @returns {Promise<EIPSocket>}
   */
  static createClient(context) {
    var socket = new EIPSocket(context);
    return Promise.try(() => {
      return socket.connect();
    });
  }
}

/**
 *
 * @param {Buffer} packet
 * @param {String} programName
 */
function parseLgxTag(packet, programName) {
  const t = new LgxTag();
  const length = unpackFrom("<H", packet, true, 4)[0];
  const name = packet.slice(6, length + 6).toString("utf8");
  if (programName) t.tagName = String(programName + "." + name);
  else t.tagName = String(name);
  t.instanceId = unpackFrom("<H", packet, true, 0)[0];

  const val = unpackFrom("<H", packet, true, length + 6)[0];

  t.symbolType = val & 0xff;
  t.dataTypeValue = val & 0xfff;
  t.array = (val & 0x6000) >> 13;
  t.struct = (val & 0x8000) >> 15;

  if (t.array) t.size = unpackFrom("<H", packet, true, length + 8)[0];
  else t.size = 0;
  return t;
}

class LgxTag {
  constructor() {
    this.tagName = "";
    this.instanceId = 0x00;
    this.symbolType = 0x00;
    this.dataTypeValue = 0x00;
    this.dataType = "";
    this.array = 0x00;
    this.struct = 0x00;
    this.size = 0x00;
  }
}

function Response(tag_name, value, status) {
  if (typeof tag_name !== "undefined") this.tagName = tag_name;
  this.value = value;
  this.status = get_error_code(status);
}
//Get the CIP error code string
function get_error_code(status) {
  return status in cipErrorCodes
    ? cipErrorCodes[status]
    : "Unknown error ".concat(status);
}

exports.Response = Response;
exports.EIPContext = EIPContext;
exports.EIPSocket = EIPSocket;
exports.CIPTypes = CIPTypes;
