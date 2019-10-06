# node-logix

Nodejs package to handle PLC as Micro820 of Allen Bradley

# Features

- Promise response with bluebird

- Manager multiple connections to write/read tags using pooling with generic-pool

- Listener events as _connect_, _connect_error_, _disconnect_, _closing_, or _found_, __found_error_ (discover function)

- Ardunio mode: functions as digitalRead, digitalWrite...

- Autoclose session with PLC

- Enable or disable identity on connect (ignoreIdentity param in connect function)

- Support to write and read string and array

- Support typescript

## Install package

```
  npm install node-logix
```

or

```
  yarn add node-logix
```

## Protocol

- EtherNet/IP

## Example with events, read and write tags

```js
const PLC = require("node-logix");

const comm = new PLC("192.168.100.9");

comm.on("connect", () => {
  console.log("PLC connected successful! ");
  comm
    .write("TEST_USINT", 127)
    .then(() => {
      return comm.read("TEST_USINT").then(console.log);
    })
    .catch(console.error);
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC", e);
});

comm.on("disconnect", reason => {
  console.log("PLC disconnected reason:", reason);
});
```

## Example: Discover devices

Find devices using dgram socket

```js
const PLC = require("node-logix");

PLC.discover().then(devices => {
  console.log("Devices:", devices);
});
```

## Example: Arduino mode

```js
comm
  .digitalRead(0)
  .then(result => {
    console.timeEnd("reading digital");
    console.log("value of:", result.valueOf(), "tagName:", result.tagName);
  })
  .catch(console.error);
[0, 1, 2, 3, 4, 5, 6].forEach(p => {
  comm
    .digitalWrite(p, false)
    .then(console.log)
    .catch(e => console.error("error write", e));
});
```

**More examples:** 
https://github.com/punisher97/node-logix/tree/master/examples

## Default Options

```js
PLC.defaultOptions = {
  allowHalfOpen: true, // Socket option nodejs, keep open TCP socket
  Micro800: false,     // use path for Micro800
  port: 44818,        // default port EIP
  connectTimeout: 3000,
  arduinoMode: true,  // Enable Arduino functions only Micro800
  pool: { // options generic-pool
    min: 0,
    max: 3,
    Promise : Bluebird, //bluebird
    priorityRange: 2,
    fifo: false,
    testOnBorrow: true,
    evictionRunIntervalMillis: 17000,
    idleTimeoutMillis: 30000
  }
```

- ArduinoMode only working with Micro800 enable, to working with other PLC, yout must be create custom pinMapping JSON and replacePin function:

```js
comm.pinMapping = {
  digital: {
    output: "_IO_EM_DO_{dd}",
    input: "_IO_EM_DI_{dd}"
  },
  analog: {
    input: "_IO_EM_AI_{dd}",
    output: "_IO_EM_AO_{dd}"
  }
};
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

```
## More Examples
 https://github.com/dmroeder/pylogix/tree/master/pylogix/examples


# NOTE:

**Connection size:**

- Packets have a ~500 byte limit, so you have to be cautions
  about not exceeding that or the read will fail.  It's a little
  difficult to predict how many bytes your reads will take up becuase
  the send packet will depend on the length of the tag name and the
  reply will depened on the data type.  Strings are a lot longer than
  DINT's for example.

- Micro800 has CIP protocol Limited, check examples to check work functions

* **[API Documentation](https://punisher97.github.io/node-logix/docs/globals.html)**

## Inpired by projects

- [pylogix](https://github.com/dmroeder/pylogix)

## License

This project is licensed under the MIT License - see the [LICENCE](https://github.com/cmseaton42/node-ethernet-ip/blob/master/LICENSE) file for details
