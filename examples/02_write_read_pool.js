"use-strict";
/**
 * @description The simplest example of writing and reading a tag from a PLC
 */

const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;

const comm = new PLC("192.168.100.174", {
  arduinoMode: true,
  pool: {
    max: 7,
    min: 0
  }
});
console.time("PLC connected successful! ");
comm
  .connect()
  .then(() => {})
  .catch(e => {
    console.log("failed connect:");
    console.error(e);
  });

const unsubscribe = comm.on("connect", () => {
  console.time("reading digital");
  comm
    .read("_IO_EM_DI_00")
    .then(result => {
      console.timeEnd("reading digital");
      console.log(result);
    })
    .catch(console.error);
  [0, 1, 2, 3, 4, 5, 6].forEach(p => {
    comm
      .write(`_IO_EM_DO_0${p}`, p % 2)
      .catch(e => console.error("error write", e));
  });

  unsubscribe();
});

comm.on("connect_error", e => {
  console.log("KO! error");
});
