"use-strict";

/**
 * @description Write string
 * @note ONLY Micro800 to others check if working o pass UDINT array
 *
 */

const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;

const comm = new PLC("192.168.100.174");

comm
  .connect()
  .then(() => {
    comm
      .read("String20")
      .then(res => {
        console.log(res);
        return null;
      })
      .then(() => {
        comm
          .write("String20", new Date().toISOString().slice(0, 20))
          .then(res => {
            console.log(res);
            comm.close().then(() => process.exit());
          });
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
