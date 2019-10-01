# node-logix

Nodejs package to handle PLC as Micro820 of Allen Bradley

- Promise response with bluebird

- Manager multiple connections to write/read tags using pooling with generic-pool

- Listener events as *connect*, *connect_error*, *disconnect* or *found* (discover function)

- Ardunio mode: functions as digitalRead, digitalWrite... 

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
      console.log(
        "value of:",
        result.valueOf(),
        "tagName:",
        result.tagName
      );
    })
    .catch(console.error);
  [0, 1, 2, 3, 4, 5, 6].forEach(p => {
    comm
      .digitalWrite(p, false)
      .then(console.log)
      .catch(e => console.error("error write", e));
  });

```

## Default Options

**NOTE:** Micro800 option default: *true*:

```js
PLC.defaultOptions = {
  allowHalfOpen: true, // Socket option nodejs, keep open TCP socket
  Micro800: true,     // use path for Micro800
  port: 44818,        // default port EIP
  connectTimeout: 3000,
  arduinoMode: true,  // Enable Arduino functions only Micro800
  pool: { // options generic-pool
    min: 0,
    max: 3,
    Promise, //bluebird
    priorityRange: 2,
    fifo: false,
    testOnBorrow: true,
    evictionRunIntervalMillis: 17000,
    idleTimeoutMillis: 30000
  }
```

## Inpired by projects

- [pylogix](https://github.com/dmroeder/pylogix)

## License

This project is licensed under the MIT License - see the [LICENCE](https://github.com/cmseaton42/node-ethernet-ip/blob/master/LICENSE) file for details

# Notes

- For Micro800 of CIP Service if limited, no working getProgramList, getModuleProperties(0)..., only get global tag names

- ArduinoMode only working with Micro800 enable, to working with other PLC, yout must be create custom pinMapping JSON and replacePin function: 
```js
comm.pinMapping =  {
    "digital" : {
        "output": "_IO_EM_DO_{dd}",
        "input": "_IO_EM_DI_{dd}"
    },
    "analog" : {
        "input" : "_IO_EM_AI_{dd}",
        "output" : "_IO_EM_AO_{dd}"
    }
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
```
# Issues
- For write array, only write 256 positions
