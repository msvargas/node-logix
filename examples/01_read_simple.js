/**
 * The simplest example of reading a tag from a PLC
NOTE: You only need to call .Close() after you are done exchanging
data with the PLC.  If you were going to read in a loop or read
more tags, you wouldn't want to call .Close() every time.
 */

const PLC = require("../index");

PLC.defaultOptions = {
  Micro800: true,
  autoConnect: true,
  autoClose: true
};

const comm = new PLC("192.168.100.9" /* { Micro800 : false } */);

comm.on("connect", () => {
  console.log("PLC connected successful! ");
  //run();
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC", e.message);
});

comm.on("disconnect", reason => {
  console.log("PLC disconnected reason:", reason);
});

function run() {
  try {
    return comm
      .read("_IO_EM_AO_00")
      .then(console.log)
      .catch(e => {
        console.log("error read", e.message);
      })
      .finally(() => {
        // !comm.autoClose && comm.close();
        // process.exit();
      });
  } catch (error) {
    console.log("try catch");
  }
}
process.on("exit", code => {
  console.log("exit code:", code);
});

process.on("unhandledRejection", e => {
  console.log("handle ", e);
});

setInterval(() => {
  run();
}, 20000);
