# node-logix

Nodejs package to handle PLC as Micro820 of Allen Bradley

- Pooling using generic-pool to async read/write

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

## Example: discover devices

```js
const PLC = require("node-logix");

PLC.discover().then(devices => {
  console.log("Devices:", devices);
});
```

## Default Options

**Micro800 default true**:

Change global option

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
};
```

## Related Projects

- [pylogix](https://github.com/dmroeder/pylogix)

## License

This project is licensed under the MIT License - see the [LICENCE](https://github.com/cmseaton42/node-ethernet-ip/blob/master/LICENSE) file for details
