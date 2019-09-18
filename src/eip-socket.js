const { Socket } = require("net");
const Promise = require("bluebird");
const {
  _parseTagName,
  BitValue,
  BitofWord,
  _getBitOfWord,
  _getWordCount
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
const context_dict = require("./CIPcontext");
const { unpackFrom, pack } = require("python-struct");

class EIPSocket extends Socket {
  constructor(context) {
    super({ allowHalfOpen: true });
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
  get connected() {
    return this._connected && !this.destroyed;
  }

  get disconnected() {
    return this.destroyed;
  }
  /**
   * @private
   * @description Register our CIP connection
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
   */
  buildForwardClosePacket() {
    const forwardClose = this.buildForwardClose();
    const rrDataHeader = this.buildEIPSendRRDataHeader(forwardClose.length);
    return Buffer.concat(
      [rrDataHeader, forwardClose],
      forwardClose.length + rrDataHeader.length
    );
  }
  /**           * @private
             * @description Forward Open happens after a connection is made,
                  this will sequp the CIP connection parameters
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
   * @param {*} frameLen
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
                  commands to perform the read or write.  This request
                  will be followed by the reply containing the data
            * @param {Buffer} tagIOI 
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
   * @private
   * @description  Add the partial read service to the tag IOI
   * @param {Buffer} tagIOI
   * @param {Number} elements
   */
  addPartialReadIOI(tagIOI, elements) {
    const data1 = pack("<BB", 0x52, Math.round(tagIOI.length / 2));
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
   */
  addReadIOI(tagIOI, elements) {
    const data1 = pack("<BB", 0x4c, Math.round(tagIOI.length / 2));
    const data2 = pack("<H", parseInt(elements, 10));
    return Buffer.concat(
      [data1, tagIOI, data2],
      data1.length + data2.length + tagIOI.length
    );
  }
  /**
             * @private
             * @description The tag IOI is basically the tag name assembled into
                  an array of bytes structured in a way that the PLC will
                  understand.  It's a little crazy, but we have to consider the
                  many variations that a tag can be:
                  @example
                  TagName (DINT)
                  TagName.1 (Bit of DINT)
                  TagName.Thing (UDT)
                  TagName[4].Thing[2].Length (more complex UDT)
                  We also might be reading arrays, a bool from arrays (atomic), strings.
                      Oh and multi-dim arrays, program scope tags...
            * @param {String} tagName 
            * @param {Boolean} isBoolArray 
            */
  buildTagIOI(tagName, isBoolArray) {
    let RequestTagData = Buffer.from([]);
    const tagArray = tagName.split(".");
    tagArray.forEach((_tag, i) => {
      if (_tag.endsWith("]")) {
        [tag, basetag, index] = _parseTagName(_tag, 0);
        let BaseTagLenBytes = basetag.length;
        if (isBoolArray && i === tagArray.length - 1)
          index = Math.round(index / 32, 10);
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

            if (65536 > index) {
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
                const data = pack("<BB", 0x28, index);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData
                );
              }

              if (65536 > element > 255) {
                const data = pack("<HH", 0x29, index);
                RequestTagData = Buffer.concat(
                  [RequestTagData, data],
                  data.length + RequestTagData.length
                );
              }

              if (element > 65535) {
                const data = pack("<HI", 0x2a, index);
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
                for non-array segment of tag
                the try might be a stupid way of doing this.  If the portion of the tag
                    can be converted to an integer successfully then we must be just looking
                    for a bit from a word rather than a UDT.  So we then don't want to assemble
                    the read request as a UDT, just read the value of the DINT.  We'll figure out
                    the individual bit in the read function.
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
               * @private
               * @description  Gets the replies from the PLC
                              In the case of BOOL arrays and bits of a word, we do some reformating
              * @param {String} tag 
              * @param {Number} elements 
              * @param {Buffer|Array} data 
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
      this.offset = 0;

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
      let err;
      if (status in cipErrorCodes) {
        err = cipErrorCodes[status];
      } else {
        err = "Unknown error";
      }
      throw new LogixError(`Failed to read tag: ${tag} - ${err}`, status);
    }
  }
  /**
   * @property
   * @description Convert words to a list of true/false
   * @param {String} tag
   * @param {*} value
   * @param {Number} count
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
               * @private
               * @description Store each unique tag read in a dict so that we can retreive the
                    data type or data length (for STRING) later
              * @param {String} baseTag 
              * @param {Number} dt dataType of tag 
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
          let err;
          if (status in cipErrorCodes) {
            err = cipErrorCodes[status];
          } else {
            err = "Unknown error ".concat(status);
          }
          // lost connection
          if (status === 7) {
            err = new ConnectionLostError(err);
            this._destroy();
          } else if (status === 1) {
            err = new ConnectionError(err);
          } else {
            err = new LogixError(`Failed to read tag: ${err}`, status);
          }
          err.code = status;
          return Promise.reject(err);
        }
      });
    });
  }
  /**
               * @private
               * @description This will add the bit level request to the tagIOI
                              Writing to a bit is handled in a different way than
                              other writes
              * @param {String} tag 
              * @param {Buffer} tagIOI 
              * @param {Array} writeData 
              * @param {Number} dataType 
              */
  addWriteBitIOI(tag, tagIOI, writeData, dataType) {
    const NumberOfBytes = this.context.CIPTypes[dataType][0] * writeData.length;
    let data = pack("<BB", 0x4e, Math.round(tagIOI.length / 2, 10));
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
   */
  addWriteIOI(tagIOI, writeData, dataType) {
    //console.log('tagIOI',tagIOI, 'writeData', writeData,dataType)
    // Add the write command stuff to the tagIOI
    let data = pack("<BB", 0x4d, Math.round(tagIOI.length / 2, 10));
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
      const b = _parseTagName(tag, 0)[1];
      return this._initial_read(b, dt)
        .then(() => b)
        .then(b => {
          /**
           * Processes the write request
           */
          const dataType = this.context.KnownTags[b][0];
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
          //console.log("writeRequest",JSON.stringify( writeRequest.toString("utf8")),writeRequest)
          return this.getBytes(this.buildEIPHeader(writeRequest));
        })
        .spread(status => {
          //console.log("retData:", retData, retData.length, status);
          if (status != 0) {
            let err;
            if (status in cipErrorCodes) {
              err = cipErrorCodes[status];
            } else {
              err = `Unknown error ${status}`;
            }
            return Promise.reject(
              new LogixError(`Write failed: ${err}`, status)
            );
          }
        });
    });
  }

  /**
   * @description  Read tag function low level
   * @private
   * @param {String} tag TagName
   * @param {Number} elements Num elements
   * @param {Number} dt DataType
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
            if (status in cipErrorCodes) err = cipErrorCodes[status];
            else err = "Unknown error " + status;
            return Promise.reject(
              new LogixError("Read failed: " + err, status)
            );
          }
        });
    });
  }
  /**
   * @private
   * @description get packet string to send CIP data
   * @param {String} string
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
   * listen data received from PLC
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
        this.setTimeout(0);
        super.removeAllListeners();
        resolve(true);
      });
    });
  }

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
      this.id = undefined;
      this._closing = false;
      this._connected = false;
    });
  }
  /**
   * Create CIP session
   */
  static createClient(context) {
    var socket = new EIPSocket(context);
    return Promise.try(() => {
      return socket
        .connect()
        .then(() => socket.send(socket.buildRegisterSession()))
        .then(() => socket.recv_data())
        .then(retData => {
          return Promise.try(() => {
            if (retData) {
              socket.sequenceCounter = 1;
              socket.sessionHandle = unpackFrom("<I", retData, false, 4)[0];
              return true;
            } else {
              throw new RegisterSessionError();
            }
          });
        })
        .then(() => socket.send(socket.buildForwardOpenPacket()))
        .then(() => socket.recv_data())
        .then(retData => [retData, unpackFrom("<b", retData, false, 42)[0]])
        .spread((retData, sts) => {
          socket.removeAllListeners();
          if (!sts) {
            socket.once("timeout", () => {
              socket.end();
            });
            socket.once("error", () => {
              socket.disconnect();
              //console.log("error");
            });

            socket.id = unpackFrom("<I", retData, true, 44)[0];
            socket._connected = true;

            return socket;
          } else {
            socket.removeAllListeners();
            socket.destroy();
            socket._connected = false;
            //console.log("erorr:", retData, retData.length, sts);
            throw new ForwarOpenError();
          }
        });
    });
  }

  destroy() {
    return Promise.resolve(async () => {
      await this.disconnect();
      await this.context._pool.destroy(this);
      super.destroy();
    });
  }
}

module.exports = EIPSocket;
