"use-strict";

/**
 * @description The simplest example of writing and reading a tag from a PLC
 *
 *I have a tag called "LargeArray", which is DINT[10000]
 *We can write a list of values all at once to be more efficient.
 *You should be careful not to exceed the ~500 byte limit of
 *the packet.  You can pack quite a few values into 500 bytes. */

const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;

const comm = new PLC("192.168.100.174");

const data = new Array(25);

for (let i = 0; i < data.length; i++) {
  data[i] = ~~(i * Math.random() * 100);
}
comm
  .connect()
  .then(() => {
    return comm.write("LargeArray[10]", data).then(res => {
      console.log(res);
      comm.close().then(() => process.exit());
    });
  })
  .catch(console.error);

comm.on("connect", () => {
  console.log("PLC connected successful! ");
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC!");
});

comm.on("disconnect", reason => {
  console.log("PLC disconnected reason:", reason);
});
