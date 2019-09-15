node-logix
============

Nodejs package to handle PLC as Micro820 of Allen Bradley, the source base code original written in Python language and port to nodejs.

pylogix: https://github.com/dmroeder/pylogix - changelog 08/26/19

```js

const comm = new PLC("192.168.100.9");

comm.on("connect", async () => {
  console.log("Successfull connection PLC! ");
});

comm.connect().then(async () => {
  await comm.Write('TEST_BOOL',true);
});

```
