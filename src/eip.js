/**
 *
 * @author Michael Vargas - node-logix
 * (msvargas97@gmail.com)
 * source python code and lincese:
   Originally created by Burt Peterson
   Updated and maintained by Dustin Roeder (dmroeder@gmail.com) 
   Copyright 2019 Dustin Roeder
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
const { Socket } = require("net");
const { unpackFrom, pack } = require("python-struct");
const Promise = require("bluebird");
const { EventEmitter } = require("events");
const { GetDevice, GetVendor, LGXDevice } = require("./lgxDevice");
const { ValueError, PLCError, cipErrorCodes } = require("./error");

function randrange(max) {
  return ~~(Math.random() * (max + 1));
}

const programNames = [];
const CIPTypes = {
  160: [88, "STRUCT", "B"],
  193: [1, "BOOL", "?"],
  194: [1, "SINT", "b"],
  195: [2, "INT", "h"],
  196: [4, "DINT", "i"],
  197: [8, "LINT", "q"],
  198: [1, "USINT", "B"],
  199: [2, "UINT", "H"],
  200: [4, "UDINT", "I"],
  201: [8, "LWORD", "Q"],
  202: [4, "REAL", "f"],
  203: [8, "LREAL", "d"],
  211: [4, "DWORD", "I"],
  218: [0, "STRING", "B"]
};

class PLC extends EventEmitter {
  constructor(IPAddress, options = {}) {
    super();
    this.IPAddress = IPAddress || "";
    this.ProcessorSlot = 0;
    this.Micro800 = true; // Working with Allen Bradley Micro820, Micro850...
    this.Port = 44818;
    this.VendorID = 0x1337;
    this.Context = 0x00;
    this.ContextPointer = 0;
    this.Socket = new Socket();
    this.SocketConnected = false;
    this.OTNetworkConnectionID = undefined;
    this.SessionHandle = 0x0000;
    this.SessionRegistered = false;
    this.SerialNumber = 0;
    this.OriginatorSerialNumber = 42;
    this.SequenceCounter = 1;
    this.ConnectionSize = 508;
    this.Offset = 0;
    this.KnownTags = {};
    this.TagList = [];
    this.StructIdentifier = 0x0fce;
    this.CIPTypes = CIPTypes;
    this.requestTimeout = 5000;
    Object.keys(options).length && Object.assign(this, options);
  }

  async Read(tag, count = 1, datatype = undefined) {
    /**
 *  We have two options for reading depending on
  the arguments, read a single tag, or read an array
 */
    if (!this.SocketConnected)
      return Promise.delay(50).then(() => {
        return this.read(tag, count, datatype);
      });
    if (Array.isArray(tag)) {
    } else {
      return await this._readTag(tag, count, datatype);
    }
  }

  async _readTag(tag, elements, dt) {
    /*     processes the read request
     */
    this.Offset = 0;
    if (!(await this._connect())) return undefined;

    const [t, b, i] = _parseTagName(tag, 0);
    await this._initial_read(t, b, dt);

    const datatype = this.KnownTags[b][0];
    const bitCount = this.CIPTypes[datatype][0] * 8;
    let tagData, words, readRequest;

    //console.log(this.CIPTypes[datatype], datatype);
    if (datatype == 211) {
      //bool array
      tagData = this._buildTagIOI(tag, (isBoolArray = True));
      words = _getWordCount(i, elements, bitCount);
      readRequest = this._addReadIOI(tagData, words);
    } else if (BitofWord(t)) {
      // bits of word
      split_tag = tag.split(".");
      bitPos = split_tag[split_tag.length - 1];
      bitPos = parseInt(bitPos);

      tagData = this._buildTagIOI(tag, false);
      words = _getWordCount(bitPos, elements, bitCount);

      readRequest = this._addReadIOI(tagData, words);
    } else {
      //everything else
      tagData = this._buildTagIOI(tag, false);
      readRequest = this._addReadIOI(tagData, elements);
    }

    const eipHeader = this._buildEIPHeader(readRequest);
    const [status, retData] = await this._getBytes(eipHeader);

    if (status == 0 || status == 6)
      return await this._parseReply(tag, elements, retData);
    else {
      if (status in cipErrorCodes) err = cipErrorCodes[status];
      else err = "Unknown error " + status;
      throw new PLCError("Read failed: " + err, status);
    }
  }

  async Write(tag, value, datatype = undefined) {
    /*  We have two options for writing depending on
    the arguments, write a single tag, or write an array */
    return this._writeTag(tag, value, datatype);
  }

  async _writeTag(tag, value, dt) {
    /**
     * Processes the write request
     */
    this.Offset = 0;
    const writeData = [];
    if (!(await this._connect())) return undefined;
    const [t, b, i] = _parseTagName(tag, 0);
    await this._initial_read(t, b, dt);

    const dataType = this.KnownTags[b][0];
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
      tagData = this._buildTagIOI(tag, false);
      writeRequest = this._addWriteBitIOI(tag, tagData, writeData, dataType);
    } else if (dataType == 211) {
      tagData = this._buildTagIOI(tag, true);
      writeRequest = this._addWriteBitIOI(tag, tagData, writeData, dataType);
    } else {
      tagData = this._buildTagIOI(tag, false);
      writeRequest = this._addWriteIOI(tagData, writeData, dataType);
    }
    //console.log("writeRequest",JSON.stringify( writeRequest.toString("utf8")),writeRequest)

    const eipHeader = this._buildEIPHeader(writeRequest);
    const [status, retData] = await this._getBytes(eipHeader);
    //console.log("retData:", retData, retData.length, status);
    if (status == 0) {
      return true;
    } else {
      let err;
      if (status in cipErrorCodes) {
        err = cipErrorCodes[status];
      } else {
        err = `Unknown error ${status}`;
      }
      throw new PLCError(`Write failed: ${err}`, status);
    }
  }

  _addWriteIOI(tagIOI, writeData, dataType) {
    //console.log('tagIOI',tagIOI, 'writeData', writeData,dataType)
    // Add the write command stuff to the tagIOI
    const elementSize = this.CIPTypes[dataType][0],
      dataLen = writeData.length,
      RequestPathSize = parseInt(tagIOI.length / 2, 10),
      RequestService = 0x4d;
    let CIPWriteRequest = Buffer.concat([
        pack("<BB", RequestService, RequestPathSize),
        tagIOI
      ]),
      RequestNumberOfElements = dataLen,
      TypeCodeLen;

    if (dataType == 160) {
      RequestNumberOfElements = this.StructIdentifier;
      TypeCodeLen = 0x02;
      CIPWriteRequest = Buffer.concat([
        CIPWriteRequest,
        pack(
          "<BBHH",
          dataType,
          TypeCodeLen,
          RequestNumberOfElements,
          writeData.length
        )
      ]);
    } else {
      TypeCodeLen = 0x00;
      CIPWriteRequest = Buffer.concat([
        CIPWriteRequest,
        pack("<BBH", dataType, TypeCodeLen, RequestNumberOfElements)
      ]);
    }

    for (const v of writeData) {
      if (Array.isArray(v) || typeof v === "string") {
        for (let i = 0; i < v.length; i++) {
          const el = v[i];
          CIPWriteRequest = Buffer.concat([
            CIPWriteRequest,
            pack(this.CIPTypes[dataType][2], el)
          ]);
        }
      } else {
        CIPWriteRequest = Buffer.concat([
          CIPWriteRequest,
          pack(this.CIPTypes[dataType][2], v)
        ]);
      }
    }
    return CIPWriteRequest;
  }

  _addWriteBitIOI(tag, tagIOI, writeData, dataType) {
    /**
     *         This will add the bit level request to the tagIOI
        Writing to a bit is handled in a different way than
        other writes
     */
    const elementSize = this.CIPTypes[dataType][0],
      dataLen = writeData.length,
      NumberOfBytes = elementSize * dataLen,
      RequestNumberOfElements = dataLen,
      RequestPathSize = parseInt(tagIOI.length / 2, 10),
      RequestService = 0x4e;
    let writeIOI = Buffer.concat([
      pack("<BB", RequestService, RequestPathSize),
      tagIOI
    ]);
    const fmt = this.CIPTypes[dataType][2].toUpperCase();
    const s = tag.split(".");
    let bit;
    if (dataType == 211) {
      const t = s[s.length - 1];
      let [tag, basetag, b] = _parseTagName(t, 0);
      bit = b;
      bit %= 32;
    } else {
      bit = s[s.length - 1];
      bit = parseInt(bit);
    }
    writeIOI = Buffer.concat([writeIOI, pack("<h", NumberOfBytes)]);
    const byte = Math.pow(2, NumberOfBytes * 8 - 1);
    const bits = Math.pow(2, bit);
    if (writeData[0]) {
      writeIOI = Buffer.concat([writeIOI, pack(fmt, bits), pack(fmt, byte)]);
    } else {
      writeIOI = Buffer.concat([
        writeIOI,
        pack(fmt, 0x00),
        pack(fmt, byte - bits)
      ]);
    }
    return writeIOI;
  }

  recv_data(timeout) {
    return Promise.try(() => {
      let handleError, handleData;
      return new Promise((resolve, reject) => {
        handleError = e => {
          this.Socket.off("data", handleData);
          reject(e);
        };
        handleData = data => {
          this.Socket.off("error", handleError);
          resolve(data);
        };
        this.Socket.once("error", handleError);
        this.Socket.once("data", handleData);
      })
        .timeout(timeout || this.requestTimeout)
        .catch(error => {
          if (error instanceof Promise.TimeoutError) {
            handleData && this.Socket.off("data", handleData);
            handleError && this.Socket.off("error", handleError);
            handleError = handleData = undefined;
          }
          return error;
        });
    });
  }

  async _initial_read(tag, baseTag, dt) {
    /**
     *         Store each unique tag read in a dict so that we can retreive the
        data type or data length (for STRING) later
     */
    if (baseTag in this.KnownTags) return true;
    if (dt) {
      this.KnownTags[baseTag] = [dt, 0];
      return true;
    }
    const tagData = this._buildTagIOI(baseTag, false),
      readRequest = this._addPartialReadIOI(tagData, 1);

    const eipHeader = this._buildEIPHeader(readRequest);
    //console.log("[EIP HEADER]", eipHeader.toString(), eipHeader.length);
    // send our tag read request
    const [status, retData] = await this._getBytes(eipHeader);

    //make sure it was successful
    if (status == 0 || status == 6) {
      const dataType = unpackFrom("<B", retData, true, 50)[0];
      const dataLen = unpackFrom("<H", retData, true, 2)[0]; // this is really just used for STRING
      this.KnownTags[baseTag] = [dataType, dataLen];
      return true;
    } else {
      let err;
      if (status in cipErrorCodes) {
        err = cipErrorCodes[status];
      } else {
        err = "Unknown error ".concat(status);
      }
      const e = new PLCError(`Failed to read tag: ${err}`, status);
      e.code = status;
      throw e;
    }
  }

  async _getBytes(data) {
    try {
      this.Socket.write(data);
      const retData = await this.recv_data();
      if (retData) {
        const status = unpackFrom("<B", retData, true, 48)[0];
        //console.log("data getbytes:", retData, retData.length,'status:', status);
        return [status, retData];
      } else {
        return [1, undefined];
      }
    } catch (error) {
      this.SocketConnected = false;
      return [7, undefined];
    }
  }

  async _parseReply(tag, elements, data) {
    /*
            Gets the replies from the PLC
        In the case of BOOL arrays and bits of
            a word, we do some reformating
           */
    const [tagName, basetag, index] = _parseTagName(tag, 0);
    const datatype = this.KnownTags[basetag][0],
      bitCount = this.CIPTypes[datatype][0] * 8;
    let vals;
    // if bit of word was requested
    if (BitofWord(tag)) {
      const split_tag = tag.split("."),
        bitPos = parseInt(split_tag[split_tag.length - 1]);
      const wordCount = _getWordCount(bitPos, elements, bitCount);
      words = await this._getReplyValues(tag, wordCount, data);
      vals = this._wordsToBits(tag, words, elements);
    } else if (datatype === 211) {
      const wordCount = _getWordCount(index, elements, bitCount),
        words = await this._getReplyValues(tag, wordCount, data);
      vals = this._wordsToBits(tag, words, elements);
    } else {
      vals = await this._getReplyValues(tag, elements, data);
    }
    if (vals.length === 1) {
      return vals[0];
    } else {
      return vals;
    }
  }

  _wordsToBits(tag, value, count = 0) {
    // Convert words to a list of true/false
    const [tagName, basetag, index] = _parseTagName(tag, 0),
      datatype = this.KnownTags[basetag][0],
      bitCount = this.CIPTypes[datatype][0] * 8;
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

  async _getReplyValues(tag, elements, data) {
    //         Gather up all the values in the reply/replies
    let status = unpackFrom("<B", data, true, 48)[0];
    elements = parseInt(elements, 10);
    if (status == 0 || status == 6) {
      // parse the tag
      const [tagName, basetag, index] = _parseTagName(tag, 0);
      const datatype = this.KnownTags[basetag][0],
        CIPFormat = this.CIPTypes[datatype][2];
      let vals = [];

      const dataSize = this.CIPTypes[datatype][0];
      let numbytes = data.length - dataSize,
        counter = 0;
      this.Offset = 0;

      for (let i = 0; i < elements; i++) {
        let index = 52 + counter * dataSize;
        if (datatype === 160) {
          const tmp = unpackFrom("<h", data, true, 52)[0];
          if (tmp == this.StructIdentifier) {
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
        this.Offset += dataSize;
        counter += 1;
        //re-read because the data is in more than one packet
        if (index == numbytes && status == 6) {
          index = 0;
          counter = 0;

          const tagIOI = this._buildTagIOI(tag, false);
          const readIOI = this._addPartialReadIOI(tagIOI, elements);
          const eipHeader = this._buildEIPHeader(readIOI);

          this.Socket.write(eipHeader);
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
      throw new PLCError(`Failed to read tag: ${tag} - ${err}`, status);
    }
  }

  _buildEIPHeader(tagIOI) {
    /**
     *         The EIP Header contains the tagIOI and the
        commands to perform the read or write.  This request
        will be followed by the reply containing the data
     */
    if (this.ContextPointer === 155) this.ContextPointer = 0;
    const EIPConnectedDataLength = tagIOI.length + 2,
      EIPCommand = 0x70,
      EIPLength = 22 + tagIOI.length,
      EIPSessionHandle = this.SessionHandle,
      EIPStatus = 0x00,
      EIPContext = context_dict[this.ContextPointer];

    this.ContextPointer += 1;

    const EIPOptions = 0x0000,
      EIPInterfaceHandle = 0x00,
      EIPTimeout = 0x00,
      EIPItemCount = 0x02,
      EIPItem1ID = 0xa1,
      EIPItem1Length = 0x04,
      EIPItem1 = this.OTNetworkConnectionID,
      EIPItem2ID = 0xb1,
      EIPItem2Length = EIPConnectedDataLength,
      EIPSequence = this.SequenceCounter;
    this.SequenceCounter += 1;
    this.SequenceCounter = this.SequenceCounter % 0x10000;

    const EIPHeaderFrame = pack(
      "<HHIIQIIHHHHIHHH",
      EIPCommand,
      EIPLength,
      EIPSessionHandle,
      EIPStatus,
      EIPContext,
      EIPOptions,
      EIPInterfaceHandle,
      EIPTimeout,
      EIPItemCount,
      EIPItem1ID,
      EIPItem1Length,
      EIPItem1,
      EIPItem2ID,
      EIPItem2Length,
      EIPSequence
    );
    //console.log(EIPHeaderFrame.length, "tag length:", tagIOI.length);
    return Buffer.concat([EIPHeaderFrame, tagIOI]);
  }

  _buildTagIOI(tagName, isBoolArray) {
    /**
 *         The tag IOI is basically the tag name assembled into
        an array of bytes structured in a way that the PLC will
        understand.  It's a little crazy, but we have to consider the
        many variations that a tag can be:

        TagName (DINT)
        TagName.1 (Bit of DINT)
        TagName.Thing (UDT)
        TagName[4].Thing[2].Length (more complex UDT)
        We also might be reading arrays, a bool from arrays (atomic), strings.
            Oh and multi-dim arrays, program scope tags...
 */
    let RequestTagData = Buffer.from([]);
    const tagArray = tagName.split(".");
    tagArray.forEach((_tag, i) => {
      if (_tag.endsWith("]")) {
        [tag, basetag, index] = _parseTagName(_tag, 0);
        let BaseTagLenBytes = basetag.length;
        if (isBoolArray && i === tagArray.length - 1)
          index = Math.round(index / 32, 10);

        // Assemble the packet
        RequestTagData = Buffer.concat([
          RequestTagData,
          pack("<BB", 0x91, BaseTagLenBytes),
          Buffer.from(basetag, "utf8")
        ]);
        if (BaseTagLenBytes % 2) {
          BaseTagLenBytes += 1;
          RequestTagData = Buffer.concat(RequestTagData, pack("<B", 0x00));
        }
        // const BaseTagLenWords = BaseTagLenBytes / 2;
        if (i < tagArray.length) {
          if (!Array.isArray(index)) {
            if (index < 256)
              RequestTagData = Buffer.concat([
                RequestTagData,
                pack("<BB", 0x28, index)
              ]);
            if (65536 > index)
              RequestTagData = Buffer.concat([
                RequestTagData,
                pack("<HH", 0x29, index)
              ]);
            if (index > 65535)
              RequestTagData = Buffer.concat([
                RequestTagData,
                pack("<HI", 0x2a, index)
              ]);
          } else {
            index.forEach(element => {
              if (element < 256)
                RequestTagData = Buffer.concat([
                  RequestTagData,
                  pack("<BB", 0x28, index)
                ]);
              if (65536 > element > 255)
                RequestTagData = Buffer.concat([
                  RequestTagData,
                  pack("<HH", 0x29, index)
                ]);
              if (element > 65535)
                RequestTagData = Buffer.concat([
                  RequestTagData,
                  pack("<HI", 0x2a, index)
                ]);
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
        RequestTagData = Buffer.concat([
          RequestTagData,
          pack("<BB", 0x91, BaseTagLenBytes),
          Buffer.from(_tag, "utf8")
        ]);
        if (BaseTagLenBytes % 2) {
          BaseTagLenBytes += 1;
          RequestTagData = Buffer.concat([RequestTagData, pack("<B", 0x00)]);
        }
      }
    });
    return RequestTagData;
  }

  _addReadIOI(tagIOI, elements) {
    /**
     *         Add the read service to the tagIOI
     */
    const RequestService = 0x4c,
      RequestPathSize = Math.round(tagIOI.length / 2),
      readIOI = Buffer.concat([
        pack("<BB", RequestService, RequestPathSize),
        tagIOI,
        pack("<H", parseInt(elements, 10))
      ]);
    return readIOI;
  }

  _addPartialReadIOI(tagIOI, elements) {
    // Add the partial read service to the tag IOI
    const RequestService = 0x52,
      RequestPathSize = Math.round(tagIOI.length / 2),
      readIOI = Buffer.concat([
        pack("<BB", RequestService, RequestPathSize),
        tagIOI,
        pack("<H", parseInt(elements)),
        pack("<I", this.Offset)
      ]);
    return readIOI;
  }

  _buildRegisterSession() {
    // Register our CIP connection
    const EIPCommand = 0x0065;
    const EIPLength = 0x0004;
    const EIPSessionHandle = this.SessionHandle;
    const EIPStatus = 0x0000;
    const EIPContext = this.Context;
    const EIPOptions = 0x0000;

    const EIPProtocolVersion = 0x01;
    const EIPOptionFlag = 0x00;
    const result = pack(
      "<HHIIQIHH",
      EIPCommand,
      EIPLength,
      EIPSessionHandle,
      EIPStatus,
      EIPContext,
      EIPOptions,
      EIPProtocolVersion,
      EIPOptionFlag
    );
    return result;
  }
  _buildUnregisterSession() {
    const EIPCommand = 0x66;
    const EIPLength = 0x0;
    const EIPSessionHandle = this.SessionHandle;
    const EIPStatus = 0x0000;
    const EIPContext = this.Context;
    const EIPOptions = 0x0000;
    return pack(
      "<HHIIQI",
      EIPCommand,
      EIPLength,
      EIPSessionHandle,
      EIPStatus,
      EIPContext,
      EIPOptions
    );
  }

  _buildForwardOpenPacket() {
    /* Assemble the forward open packet */
    const forwardOpen = this._buildCIPForwardOpen();
    const rrDataHeader = this._buildEIPSendRRDataHeader(forwardOpen.length);
    return Buffer.concat([rrDataHeader, forwardOpen]);
  }
  _buildForwardClosePacket() {
    /*  Assemble the forward close packet */
    const forwardClose = this._buildForwardClose();
    const rrDataHeader = this._buildEIPSendRRDataHeader(forwardClose.length);
    return Buffer.concat([rrDataHeader, forwardClose]);
  }

  _buildCIPForwardOpen() {
    /**
        Forward Open happens after a connection is made,
        this will sequp the CIP connection parameters
     */
    let CIPPathSize = 0x02,
      CIPClassType = 0x20,
      CIPClass = 0x06,
      CIPInstanceType = 0x24,
      CIPInstance = 0x01,
      CIPPriority = 0x0a,
      CIPTimeoutTicks = 0x0e,
      CIPOTConnectionID = 0x20000002,
      CIPTOConnectionID = 0x20000001;
    this.SerialNumber = randrange(65000);
    let CIPConnectionSerialNumber = this.SerialNumber,
      CIPVendorID = this.VendorID,
      CIPOriginatorSerialNumber = this.OriginatorSerialNumber,
      CIPMultiplier = 0x03,
      CIPOTRPI = 0x00201234,
      CIPConnectionParameters = 0x4200,
      CIPTORPI = 0x00204001,
      CIPTransportTrigger = 0xa3;
    let CIPService, pack_format, ConnectionPath;
    //  decide whether to use the standard ForwardOpen
    // or the large format
    if (this.ConnectionSize <= 511) {
      CIPService = 0x54;
      CIPConnectionParameters += this.ConnectionSize;
      pack_format = "<BBBBBBBBIIHHIIIHIHB";
    } else {
      CIPService = 0x5b;
      CIPConnectionParameters = CIPConnectionParameters << 16;
      CIPConnectionParameters += this.ConnectionSize;
      pack_format = "<BBBBBBBBIIHHIIIIIIB";
    }
    const CIPOTNetworkConnectionParameters = CIPConnectionParameters,
      CIPTONetworkConnectionParameters = CIPConnectionParameters;
    const ForwardOpen = pack(
      pack_format,
      CIPService,
      CIPPathSize,
      CIPClassType,
      CIPClass,
      CIPInstanceType,
      CIPInstance,
      CIPPriority,
      CIPTimeoutTicks,
      CIPOTConnectionID,
      CIPTOConnectionID,
      CIPConnectionSerialNumber,
      CIPVendorID,
      CIPOriginatorSerialNumber,
      CIPMultiplier,
      CIPOTRPI,
      CIPOTNetworkConnectionParameters,
      CIPTORPI,
      CIPTONetworkConnectionParameters,
      CIPTransportTrigger
    );
    // add the connection path
    if (this.Micro800) ConnectionPath = [0x20, 0x02, 0x24, 0x01];
    else ConnectionPath = [0x01, this.ProcessorSlot, 0x20, 0x02, 0x24, 0x01];
    const ConnectionPathSize = Math.round(ConnectionPath.length / 2);
    pack_format = "<B" + ConnectionPath.length + "B";
    const CIPConnectionPath = pack(
      pack_format,
      ConnectionPathSize,
      ...ConnectionPath
    );
    return Buffer.concat([ForwardOpen, CIPConnectionPath]);
  }

  _buildForwardClose() {
    /**
     * Forward Close packet for closing the connection
     */
    const CIPService = 0x4e,
      CIPPathSize = 0x02,
      CIPClassType = 0x20,
      CIPClass = 0x06,
      CIPInstanceType = 0x24,
      CIPInstance = 0x01,
      CIPPriority = 0x0a,
      CIPTimeoutTicks = 0x0e,
      CIPConnectionSerialNumber = this.SerialNumber,
      CIPVendorID = this.VendorID,
      CIPOriginatorSerialNumber = this.OriginatorSerialNumber;
    const ForwardClose = pack(
      "<BBBBBBBBHHI",
      CIPService,
      CIPPathSize,
      CIPClassType,
      CIPClass,
      CIPInstanceType,
      CIPInstance,
      CIPPriority,
      CIPTimeoutTicks,
      CIPConnectionSerialNumber,
      CIPVendorID,
      CIPOriginatorSerialNumber
    );
    let ConnectionPath;
    //add the connection path
    if (this.Micro800) ConnectionPath = [0x20, 0x02, 0x24, 0x01];
    else ConnectionPath = [0x01, this.ProcessorSlot, 0x20, 0x02, 0x24, 0x01];

    const ConnectionPathSize = Math.round(ConnectionPath.length / 2);
    const pack_format = "<H" + ConnectionPath.length + "B";
    const CIPConnectionPath = pack(
      pack_format,
      ConnectionPathSize,
      ...ConnectionPath
    );
    return Buffer.concat([ForwardClose, CIPConnectionPath]);
  }

  _buildEIPSendRRDataHeader(frameLen) {
    const EIPCommand = 0x6f,
      EIPLength = 16 + frameLen,
      EIPSessionHandle = this.SessionHandle,
      EIPStatus = 0x00,
      EIPContext = this.Context,
      EIPOptions = 0x00,
      EIPInterfaceHandle = 0x00,
      EIPTimeout = 0x00,
      EIPItemCount = 0x02,
      EIPItem1Type = 0x00,
      EIPItem1Length = 0x00,
      EIPItem2Type = 0xb2,
      EIPItem2Length = frameLen;

    return pack(
      "<HHIIQIIHHHHHH",
      EIPCommand,
      EIPLength,
      EIPSessionHandle,
      EIPStatus,
      EIPContext,
      EIPOptions,
      EIPInterfaceHandle,
      EIPTimeout,
      EIPItemCount,
      EIPItem1Type,
      EIPItem1Length,
      EIPItem2Type,
      EIPItem2Length
    );
  }
  connect() {
    return this._connect();
  }
  close() {
    return this.SocketConnected && this.Socket.destroy();
  }
  async _connect() {
    if (this.SocketConnected) return true;
    if (this.ConnectionSize < 500 || this.ConnectionSize > 4000)
      throw new ValueError(
        "ConnectionSize must be an integer between 500 and 4000"
      );
    try {
      this.Socket = new Socket();
      this.Socket.setTimeout(5000);
      await new Promise((resolve, reject) => {
        const onTimeout = () =>
          reject(new Promise.TimeoutError("Tiempo de espera agotado"));
        this.Socket.once("timeout", onTimeout);
        this.Socket.connect(this.Port, this.IPAddress, () => {
          this.Socket.off("timeout", onTimeout);
          this.Socket.on("connect", () => {
            this.SocketConnected = true;
            this.emit("reconnect");
          });
          this.Socket.on("close", had_error => {
            this.SocketConnected = false;
            this.emit("close");
          });
          resolve();
        });
      });
    } catch (error) {
      this.SocketConnected = false;
      this.SequenceCounter = 1;
      this.Socket && this.Socket.destroy();
      throw error;
    }
    this.Socket.write(this._buildRegisterSession());

    let retData = await this.recv_data();
    //console.log("retData", retData, retData.length);
    if (retData) {
      this.SessionHandle = unpackFrom("<I", retData, false, 4)[0];
    } else {
      this.SocketConnected = false;
      throw new Error("Failed to register session");
    }
    const _data = this._buildForwardOpenPacket();
    //console.log("open socket data:", _data);
    this.Socket.write(_data);
    retData = await this.recv_data();
    //console.log("retData2", retData, retData.length);
    const sts = unpackFrom("<b", retData, false, 42)[0];
    //console.log("sts", sts);
    if (!sts) {
      this.OTNetworkConnectionID = unpackFrom("<I", retData, true, 44)[0];
      this.SocketConnected = true;
      this.emit("connect");
      //console.log("ssid:", this.OTNetworkConnectionID);
    } else {
      this.SocketConnected = false;
      const e = new Error("Forward Open Failed");
      this.emit("connect_error", e);
      throw e;
    }
    return true;
  }
  _makeString(string) {
    const work = [];
    let temp = "";
    if (this.Micro800) {
      temp = pack("<B", string.length).toString("utf8");
    } else {
      temp = pack("<I", string.length).toString("utf8");
    }
    for (let i = 0; i < temp.length; i++) work.push(temp.charCodeAt(i));
    for (let i = 0; i < string.length; i++) work.push(string.charCodeAt(i));
    if (!this.Micro800) {
      for (let i = string.length; i < 84; i++) work.push(0x00);
    }
    return work;
  }
}

function _getBitOfWord(tag, value) {
  /**
   *     Takes a tag name, gets the bit from the end of
    it, then returns that bits value
   */
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

function _getWordCount(start, length, bits) {
  /**
   *     Get the number of words that the requested
    bits would occupy.  We have to take into account
    how many bits are in a word and the fact that the
    number of requested bits can span multipe words.
   */
  const newStart = start % bits;
  const newEnd = newStart + length;
  const totalWords = (newEnd - 1) / bits;
  return totalWords + 1;
}

function _parseTagName(tag, offset) {
  /**
   *     parse the packet to get the base tag name
    the offset is so that we can increment the array pointer if need be
   */
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

function BitofWord(tag) {
  /*Test if the user is trying to write to a bit of a word
    ex. Tag.1 returns true (Tag = DINT)
    */
  const s = tag.split(".");
  if (/^\d+$/.test(s[s.length - 1])) return true;
  else return false;
}

function BitValue(value, bitno) {
  /*
    Returns the specific bit of a words value
    */
  const mask = 1 << bitno;
  if (value & mask) return true;
  else return false;
}

6;
// https://stackoverflow.com/questions/15987750/equivalent-of-inet-aton-in-mongodb
// ip example: 192.168.2.1
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

// num example: 3232236033
function inet_ntoa(n) {
  var a = ((n >> 24) & 0xff) >>> 0;
  var b = ((n >> 16) & 0xff) >>> 0;
  var c = ((n >> 8) & 0xff) >>> 0;
  var d = (n & 0xff) >>> 0;
  return a + "." + b + "." + c + "." + d;
}

function _parseIdentityResponse(data) {
  /**
   *     # we're going to take the packet and parse all
    #  the data that is in it.
   */
  const resp = new LGXDevice();
  resp.Length = unpackFrom("<H", data, true, 28)[0];
  resp.EncapsulationVersion = unpackFrom("<H", data, true, 30)[0];

  const longIP = unpackFrom("<I", data, true, 36)[0];
  resp.IPAddress = inet_ntoa(parseInt(pack("<L", longIP).toString("hex"), 16));

  resp.VendorID = unpackFrom("<H", data, true, 48)[0];
  resp.Vendor = GetVendor(resp.VendorID);

  resp.DeviceID = unpackFrom("<H", data, true, 50)[0];
  resp.Device = GetDevice(resp.DeviceID);

  resp.ProductCode = unpackFrom("<H", data, true, 52)[0];
  const major = unpackFrom("<B", data, true, 54)[0];
  const minor = unpackFrom("<B", data, true, 55)[0];
  resp.Revision = major + "." + minor;

  resp.Status = unpackFrom("<H", data, true, 56)[0];
  resp.SerialNumber = hex(unpackFrom("<I", data, true, 58)[0]);
  resp.ProductNameLength = unpackFrom("<B", data, true, 62)[0];
  resp.ProductName = data
    .slice(63, 63 + resp.ProductNameLength)
    .toString("utf8");

  const state = data.slice(-1);
  resp.State = unpackFrom("<B", state, true, 0)[0];

  return resp;
}

function parseLgxTag(packet, programName) {}

function LgxTag() {
  this.TagName = "";
  this.InstanceID = 0x00;
  this.SymbolType = 0x00;
  this.DataTypeValue = 0x00;
  this.DataType = "";
  this.Array = 0x00;
  this.Struct = 0x00;
  this.Size = 0x00;
}

//Context values passed to the PLC when reading/writing
const context_dict = {
  0: 0x6572276557,
  1: 0x6f6e,
  2: 0x676e61727473,
  3: 0x737265,
  4: 0x6f74,
  5: 0x65766f6c,
  6: 0x756f59,
  7: 0x776f6e6b,
  8: 0x656874,
  9: 0x73656c7572,
  10: 0x646e61,
  11: 0x6f73,
  12: 0x6f64,
  13: 0x49,
  14: 0x41,
  15: 0x6c6c7566,
  16: 0x74696d6d6f63,
  17: 0x7327746e656d,
  18: 0x74616877,
  19: 0x6d2749,
  20: 0x6b6e696874,
  21: 0x676e69,
  22: 0x666f,
  23: 0x756f59,
  24: 0x746e646c756f77,
  25: 0x746567,
  26: 0x73696874,
  27: 0x6d6f7266,
  28: 0x796e61,
  29: 0x726568746f,
  30: 0x797567,
  31: 0x49,
  32: 0x7473756a,
  33: 0x616e6e6177,
  34: 0x6c6c6574,
  35: 0x756f79,
  36: 0x776f68,
  37: 0x6d2749,
  38: 0x676e696c656566,
  39: 0x6174746f47,
  40: 0x656b616d,
  41: 0x756f79,
  42: 0x7265646e75,
  43: 0x646e617473,
  44: 0x726576654e,
  45: 0x616e6e6f67,
  46: 0x65766967,
  47: 0x756f79,
  48: 0x7075,
  49: 0x726576654e,
  50: 0x616e6e6f67,
  51: 0x74656c,
  52: 0x756f79,
  53: 0x6e776f64,
  54: 0x726576654e,
  55: 0x616e6e6f67,
  56: 0x6e7572,
  57: 0x646e756f7261,
  58: 0x646e61,
  59: 0x747265736564,
  60: 0x756f79,
  61: 0x726576654e,
  62: 0x616e6e6f67,
  63: 0x656b616d,
  64: 0x756f79,
  65: 0x797263,
  66: 0x726576654e,
  67: 0x616e6e6f67,
  68: 0x796173,
  69: 0x657962646f6f67,
  70: 0x726576654e,
  71: 0x616e6e6f67,
  72: 0x6c6c6574,
  73: 0x61,
  74: 0x65696c,
  75: 0x646e61,
  76: 0x74727568,
  77: 0x756f79,
  78: 0x6576276557,
  79: 0x6e776f6e6b,
  80: 0x68636165,
  81: 0x726568746f,
  82: 0x726f66,
  83: 0x6f73,
  84: 0x676e6f6c,
  85: 0x72756f59,
  86: 0x73277472616568,
  87: 0x6e656562,
  88: 0x676e69686361,
  89: 0x747562,
  90: 0x657227756f59,
  91: 0x6f6f74,
  92: 0x796873,
  93: 0x6f74,
  94: 0x796173,
  95: 0x7469,
  96: 0x656469736e49,
  97: 0x6577,
  98: 0x68746f62,
  99: 0x776f6e6b,
  100: 0x732774616877,
  101: 0x6e656562,
  102: 0x676e696f67,
  103: 0x6e6f,
  104: 0x6557,
  105: 0x776f6e6b,
  106: 0x656874,
  107: 0x656d6167,
  108: 0x646e61,
  109: 0x6572276577,
  110: 0x616e6e6f67,
  111: 0x79616c70,
  112: 0x7469,
  113: 0x646e41,
  114: 0x6669,
  115: 0x756f79,
  116: 0x6b7361,
  117: 0x656d,
  118: 0x776f68,
  119: 0x6d2749,
  120: 0x676e696c656566,
  121: 0x74276e6f44,
  122: 0x6c6c6574,
  123: 0x656d,
  124: 0x657227756f79,
  125: 0x6f6f74,
  126: 0x646e696c62,
  127: 0x6f74,
  128: 0x656573,
  129: 0x726576654e,
  130: 0x616e6e6f67,
  131: 0x65766967,
  132: 0x756f79,
  133: 0x7075,
  134: 0x726576654e,
  135: 0x616e6e6f67,
  136: 0x74656c,
  137: 0x756f79,
  138: 0x6e776f64,
  139: 0x726576654e,
  140: 0x6e7572,
  141: 0x646e756f7261,
  142: 0x646e61,
  143: 0x747265736564,
  144: 0x756f79,
  145: 0x726576654e,
  146: 0x616e6e6f67,
  147: 0x656b616d,
  148: 0x756f79,
  149: 0x797263,
  150: 0x726576654e,
  151: 0x616e6e6f67,
  152: 0x796173,
  153: 0x657962646f6f67,
  154: 0x726576654e,
  155: 0xa680e2616e6e6f67
};

module.exports = PLC;
