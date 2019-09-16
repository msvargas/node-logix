/**
 * The simplest example of reading a tag from a PLC
NOTE: You only need to call .Close() after you are done exchanging
data with the PLC.  If you were going to read in a loop or read
more tags, you wouldn't want to call .Close() every time.
 */

const PLC = require("../index");

PLC.defaultOptions = {
  requestTimeout: 2000,
  Micro800: true
};

const comm = new PLC("192.168.100.9" /* { Micro800 : false } */);

comm.on("connect", () => {
  console.log("PLC connected successful! ");
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC");
});

comm
  .read("_IO_EM_DI_01")
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    comm.close();
    process.exit();
  });
