# node-logix

Nodejs package to handle PLC as Micro820 of Allen Bradley

- Manager multiple connections to write/read tags using pooling with (generic-pool)[https://www.npmjs.com/package/generic-pool]
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
  allowHalfOpen: true,
  Micro800: true,
  port: 44818,
  connectTimeout: 3000,
  arduinoMode: true,
  pool: {
    min: 0,
    max: 3,
    Promise,
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
