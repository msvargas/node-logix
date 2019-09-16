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
const { Socket, isIP } = require("net");
const { unpackFrom, pack } = require("python-struct");
const Promise = require("bluebird");
const { EventEmitter } = require("events");
const isPortReachable = require("is-port-reachable");
const { GetDevice, GetVendor, LGXDevice } = require("./lgxDevice");
const context_dict = require("./context");
const {
  ValueError,
  LogixError,
  cipErrorCodes,
  ConnectionError,
  ConnectionTimeout,
  DisconnectedError,
  UnReachableError
} = require("./error");

function randrange(max) {
  return ~~(Math.random() * (max + 1));
}

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
  /**
   *
   * @param {String|Object} IPAddress IP Address of PLC alternative pass Object with all options
   * @param {Object} options Options to set if IPAddress typeof string
   */
  constructor(IPAddress, options = {}) {
    super();
    if (typeof IPAddress === "object") options = Object.assign({}, IPAddress);
    else if (typeof IPAddress !== "string")
      throw new TypeError(
        `constructor only pass string (IP) or object with options, not accept '${typeof IPAddress}'`
      );
    else if (!IPAddress.length) throw new Error("Check empty IPAddress");
    else if (!isIP(IPAddress))
      throw new Error("IP Address no valid, check IP: " + IPAddress);
    this.IPAddress = typeof IPAddress === "string" ? IPAddress : "";
    this.ProcessorSlot = 0;
    this.Micro800 = true; // Working with Allen Bradley Micro820, Micro850...
    this.Port = 44818;
    this.VendorID = 0x1337;
    this.Context = 0x00;
    this.ContextPointer = 0;
    this.OTNetworkConnectionID = undefined;
    this.SessionHandle = 0x0000;
    this.SerialNumber = 0;
    this.OriginatorSerialNumber = 42;
    this.SequenceCounter = 1;
    this.ConnectionSize = 508;
    this.StructIdentifier = 0x0fce;
    this.autoConnect = true;
    this.requestTimeout = 1000;
    this.connectionTimeout = 5000;
    this.autoClose = true;
    this.pingInterval = 10000;
    this.pingTimeout = 25000;
    Object.assign(this, PLC.defaultOptions, options);
    this.SessionRegistered = false;
    this.Socket = new Socket();
    this.SocketConnected = false;
    this.CIPTypes = CIPTypes;
    this.TagList = [];
    this._tagValuesEvent = {};
    this.KnownTags = {};
    this.Offset = 0;
    this._isReachable = false;
    this.__init__();
  }
  /**
   * @property check if Socket connecting
   */
  get connecting() {
    return this.Socket.connecting;
  }
  /**
   * @property check PLC connected
   */
  get connected() {
    return this.SocketConnected;
  }
  /**
   * @property to check PLC disconnected
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * @property to get socket address
   */
  get address() {
    return { addres: this.IPAddress, port: this.Port };
  }
  /**
   * @property to get socket client
   */
  get socket() {
    return this.Socket;
  }
  /**
   * @property get session id of PLC
   */
  get id() {
    return this.OTNetworkConnectionID;
  }
  /**
   * @private initialize autoConnect and autoClose functions
   */
  __init__() {
    if (!!this.autoConnect) this._connect();
    if (!!this.autoClose) {
      process.once("exit", code => {
        this.close(0);
      });
    }
  }
  /**
   * Read tag in PLC
   * @param {String} tag Tag name to read
   * @param {Object} options { `count` : Num elements of value,  `dataType` : Data Type check `this.CIPDataType`}
   */
  read(tag, options) {
    /**
 *  We have two options for reading depending on
  the arguments, read a single tag, or read an array
 */
    return Promise.try(() => {
      if (Array.isArray(tag)) {
      } else {
        return this._readTag(tag, options);
      }
    });
  }

  /**
   * @private read tag function low level
   * @param {String} tag TagName
   * @param {Number} elements Num elements
   * @param {Number} dt DataType
   */
  _readTag(tag, options = {}) {
    const {
      count: elements = 1,
      dataType: dt,
      timeout = this.requestTimeout
    } = options;
    return Promise.try(() => {
      return this._waitConnect()
        .then(() => {
          // processes the read request
          this.Offset = 0;
          const [t, b, i] = _parseTagName(tag, 0);
          return this._initial_read(t, b, dt).then(() => [t, b, i]);
        })
        .spread((t, b, i) => {
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
          return this._getBytes(eipHeader);
        })
        .spread((status, retData) => {
          if (status == 0 || status == 6)
            return this._parseReply(tag, elements, retData);
          else {
            if (status in cipErrorCodes) err = cipErrorCodes[status];
            else err = "Unknown error " + status;
            throw new LogixError("Read failed: " + err, status);
          }
        });
    })
      .timeout(timeout, `Timeout to read tag: ${tag} at ${timeout}ms`)
      .catch(err => {
        if (err instanceof Promise.TimeoutError) {
          err.tag = tag;
          err.timeout = timeout;
        }
        this._checkPortReachable();
        return err;
      });
  }
  /**
   *
   * @param {String} tag Tag name to set value
   * @param {Boolean|String|Number|Array} value value to write in scope
   * @param {Object} options Options to change ex: timeout, dataType
   */
  write(tag, value, options = {}) {
    /*  We have two options for writing depending on
    the arguments, write a single tag, or write an array */
    return Promise.try(() => {
      if (Array.isArray(tag)) {
      } else {
        return this._writeTag(tag, value, dataType, emitEvent);
      }
    });
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
  _writeTag(tag, value, options = {}) {
    const { dataType: dt, emitEvent, timeout = this.requestTimeout } = options;
    return Promise.try(async () => {
      /**
       * Processes the write request
       */
      this.Offset = 0;
      const writeData = [];
      await this._waitConnect();

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
      const [status, _] = await this._getBytes(eipHeader);
      //console.log("retData:", retData, retData.length, status);
      if (status != 0) {
        let err;
        if (status in cipErrorCodes) {
          err = cipErrorCodes[status];
        } else {
          err = `Unknown error ${status}`;
        }
        throw new LogixError(`Write failed: ${err}`, status);
      }
      if (!!emitEvent && value !== this._tagValuesEvent[tag]) {
        this.emit("change", tag, value); // local global event
        this.emit(tag, value); // specific tag event
        this._tagValuesEvent[tag] = value;
      }
    }).timeout(timeout, `Timeout to write tag:${tag} with value: ${value}`);
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

  _initial_read(tag, baseTag, dt) {
    return Promise.try(() => {
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
      return this._getBytes(eipHeader).spread((status, retData) => {
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
          if (status === 7) {
            err = new ConnectionError(err);
            this.emit("connect_error", err);
            this.close();
          } else {
            err = new LogixError(`Failed to read tag: ${err}`, status);
          }
          err.code = status;
          throw err;
        }
      });
    });
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

          await this._send(eipHeader);
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
    return Promise.try(() => {
      if (this.connecting)
        new Error("Fail to connect, status while connecting socket");
      return this._connect();
    });
  }

  close(timeout = 1000) {
    return Promise.try(async () => {
      await this._closeConnection();
    })
      .timeout(timeout)
      .catch(e => {
        if (e instanceof Promise.TimeoutError) {
          e = new Promise.TimeoutError(
            "Failed to close connection with: " + this.IPAddress
          );
        }
        return e;
      });
  }

  _send(data) {
    return Promise.try(() => {
      if (this.Socket.destroyed) {
        if (!!this._isReachable) throw new DisconnectedError();
        else return;
      }
      return new Promise((resolve, reject) => {
        this.Socket.write(data, error => {
          if (error)
            reject(
              error.name.indexOf("[ERR_STREAM_DESTROYED]") > -1
                ? new DisconnectedError()
                : error
            );
          else resolve(true);
        });
      });
    });
  }

  _getBytes(data) {
    return Promise.try(() => {
      return this._send(data)
        .then(() => this.recv_data())
        .then(retData => {
          if (retData) {
            const status = unpackFrom("<B", retData, true, 48)[0];
            return [status, retData];
          } else {
            throw [1, undefined];
          }
        })
        .catch(error => {
          this.SocketConnected = false;
          this.emit("error", error);
          return [7, undefined];
        });
    });
  }

  recv_data() {
    return new Promise(resolve => {
      this.Socket.once("data", resolve);
    });
  }

  async _closeConnection() {
    if (this.disconnected) return;
    this.SocketConnected = false;
    const close_packet = this._buildForwardClosePacket();
    const unreg_packet = this._buildUnregisterSession();
    try {
      await this._send(close_packet);
      await this._send(unreg_packet);
      this.Socket.destroy();
      this._iv && clearInterval(this._iv);
      this.emit("disconnect", "close connection");
    } catch (error) {
      this.Socket.destroy();
    } finally {
      this.OTNetworkConnectionID = undefined;
    }
  }
  /**
   * @private Check if PLC is available
   */
  _checkPortReachable() {
    return Promise.try(async () => {
      if (this._checking) return this._isReachable;
      this._checking = true;
      this._isReachable = await isPortReachable(this.Port, {
        host: this.IPAddress
      });
      const e = new UnReachableError();
      if (!this._isReachable && this.connected) this.Socket.destroy(e);
      this._checking = false;
      return this._isReachable;
    });
  }
  /**
   * @protected simple async connect
   */
  _connect() {
    if (
      (!this.Socket.destroyed && this.SocketConnected) ||
      this.Socket.connecting
    )
      return Promise.resolve();
    return Promise.try(() => {
      if (this.ConnectionSize < 500 || this.ConnectionSize > 4000)
        throw new ValueError(
          "ConnectionSize must be an integer between 500 and 4000"
        );
      this.Socket = new Socket();
      this.Socket.setKeepAlive(true);
      this.Socket.setNoDelay(true);
      return new Promise((resolve, reject) => {
        this.Socket.setTimeout(this.connectionTimeout, () => {
          this.Socket.destroy();
          this._checkPortReachable().then(isReachable => {
            if (!isReachable)
              reject(new UnReachableError(this.Port, this.IPAddress));
            else
              reject(
                new ConnectionTimeout(
                  "Fail to connect timeout connection with " + this.IPAddress,
                  this.connectionTimeout
                )
              );
          });
        });
        this.Socket.connect(this.Port, this.IPAddress, resolve);
      });
    })
      .then(() => this._send(this._buildRegisterSession()))
      .then(() => this.recv_data())
      .then(retData => {
        return Promise.try(() => {
          if (retData) {
            this.SequenceCounter = 1;
            this.SessionHandle = unpackFrom("<I", retData, false, 4)[0];
            return true;
          } else {
            throw new ConnectionError("Failed to register session");
          }
        });
      })
      .then(() => this._send(this._buildForwardOpenPacket()))
      .then(() => this.recv_data())
      .then(retData => [retData, unpackFrom("<b", retData, false, 42)[0]])
      .spread((retData, sts) => {
        return Promise.try(() => {
          if (!sts) {
            this.OTNetworkConnectionID = unpackFrom("<I", retData, true, 44)[0];
            this.Socket.once("timeout", () => {
              this.Socket.end();
              //this.Socket.destroy("timeout disconnection");
            });
            this.Socket.once("error", error => {
              this.Socket.destroy();
              if (!!error)
                this.emit(
                  "disconnect",
                  error instanceof Error ? error.message : error
                );
              console.log("error:", error);
            });
            this.Socket.once("close", had_error => {
              console.log("close:", had_error);
              // this._connect();
            });
            this.Socket.setTimeout(this.pingTimeout);
            this.SocketConnected = true;
            if (!this._iv) {
              this._iv = setInterval(() => {
                return this._checkPortReachable().then(isReachable => {
                  if (!isReachable) {
                    this.SocketConnected = false;
                    this.emit(
                      "error",
                      new UnReachableError(this.Port, this.IPAddress)
                    );
                  }
                });
                //console.log(this.connected, this.connecting);
              }, this.pingInterval);
              this.emit("connect");
            }
            return true;
          } else {
            this.Socket.destroy();
            throw new ConnectionError("Forward open Failed");
          }
        });
      })
      .catch(error => {
        this.SocketConnected = false;
        this.emit("connect_error", error);
        return error;
      });
  }
  /**
   *
   * @param {Number} timeout Timeout to wait connect to PLC
   */
  _waitConnect() {
    return Promise.try(() => {
      if (this.connected) return true;
      else if (this.connecting)
        return Promise.delay(10).then(() => this._waitConnect());
      else if (!this.connected) {
        return this._connect();
      }
    });
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

PLC.defaultOptions = {
  Micro800: true,
  Port: 44818,
  requestTimeout: 1000,
  connectionTimeout: 5000,
  autoConnect: false,
  autoClose: true,
  pingInterval: 10000,
  pingTimeout: 25000
};

PLC.CIPTypes = Object.keys(CIPTypes)
  .map(key => ({ [CIPTypes[key][1]]: key }))
  .reduce(function(result, item) {
    const key = Object.keys(item)[0]; //first property: a, b, c
    result[key] = parseInt(item[key]);
    return result;
  }, {});

PLC.cipErrorCodes = cipErrorCodes;

module.exports = PLC;
exports.default = PLC;
