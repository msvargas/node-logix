"use-strict";
/**
 * The simplest example of writing and reading a tag from a PLC
 */

const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;

const comm = new PLC("192.168.100.174");

comm
  .connect()
  .then(() => {
    return (
      // read array fromm 900 to 909
      comm
        .read("LargeArray[10]", { count: 10 })
        //.then(console.log)
        .then(data => console.log(data))
    );
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
