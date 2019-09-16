/**
 * The simplest example of writing and reading a tag from a PLC
 */

const PLC = require("../index");

const comm = new PLC("192.168.100.174");

comm.on("connect", () => {
  console.log("PLC connected successful! ");
  setInterval(() => {
    comm
      .digitalOutRead(2)
      .then(val => {
        val = !val;
        console.log("toogle:", val);
        return comm.digitalWrite(2, val);
      })
      .catch(console.error);
  }, 2000);
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC:", e);
});
