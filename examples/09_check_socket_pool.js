"use-strict";
/**
 * @description check generic-pool each five seconds
 */
const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;
const comm = new PLC("192.168.100.174");

let pin = 6;
var iv1 = setInterval(() => {
  const t = new Date();
  comm
    .read("_IO_EM_DI_0" + pin)
    .then(val => {
      console.log("value:", val);
      console.log("reading pin at ", Number(Date.now() - t).toFixed(3));
    })
    .catch(e => {
      console.error("error pin ", pin, e);
    });
  if (--pin < 0) pin = 6;
}, 10000);

var iv2 = setInterval(() => {
  console.log(
    "==================",
    "max:",
    comm.max,
    "size:",
    comm.size,
    "pending:",
    comm.pending,
    "borrowed:",
    comm.borrowed,
    "available:",
    comm.available,
    "====================="
  );
}, 5000);
comm.on("connect", () => {
  console.timeEnd("PLC connected successful! ");
  console.time("read tag 1");
  comm
    .read("_IO_EM_DI_01")
    .then(val => {
      console.timeEnd("read tag 1");
      console.log("value:", val);
    })
    .catch(console.error);

  console.time("read tag 2");
  comm
    .read("_IO_EM_DI_02")
    .then(val => {
      console.timeEnd("read tag 2");
      console.log("value:", val);
    })
    .catch(console.error);

  console.time("read tag 3");
  comm
    .read("_IO_EM_DI_03")
    .then(val => {
      console.timeEnd("read tag 3");
      console.log("value:", val);
    })
    .catch(console.error);

  console.time("read tag 4");
  comm
    .read("_IO_EM_DI_04")
    .then(val => {
      console.timeEnd("read tag 4");
      console.log("value:", val);
    })
    .catch(console.error);
  console.time("read tag 5");
  comm
    .read("_IO_EM_DI_04")
    .then(val => {
      console.timeEnd("read tag 5");
      console.log("value:", val);
    })
    .catch(console.error);
  console.time("read tag 7");
  comm
    .read("_IO_EM_DI_04")
    .then(val => {
      console.timeEnd("read tag 7");
      console.log("value:", val);
    })
    .catch(console.error);
});

const onExit = () => {
  clearInterval(iv1);
  clearInterval(iv2);
  comm.close();
  process.exit(0);
};
process.on("SIGINT", onExit);
