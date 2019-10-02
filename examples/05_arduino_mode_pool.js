"use-strict";
/**
 * @description Combine arduino mode and pool config
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

comm.on("connect", async () => {
  console.log("Successfull connection PLC! ");
});

comm
  .connect()
  .then(() => {
    comm
      .digitalRead(0)
      .then(result => {
        console.log(
          "value of:",
          result.valueOf(),
          "  tagName:",
          result.tagName
        );
      })
      .catch(console.error);
    comm
      .digitalOutRead(0)
      .then(result => {
        console.log(
          "value of:",
          result.valueOf(),
          "  tagName:",
          result.tagName
        );
      })
      .catch(console.error);
    comm
      .analogRead(0)
      .then(result => {
        console.log(
          "value of:",
          result.valueOf(),
          "  tagName:",
          result.tagName
        );
      })
      .catch(console.error);
    [0, 1, 2, 3, 4, 5, 6].forEach(p => {
      comm.digitalWrite(p, p % 2).catch(e => console.error("Error write:", e));
    });
  })
  .catch(console.error);
