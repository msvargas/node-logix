const PLC = require("../index").default;

const comm = new PLC("192.168.100.9");

comm.on("connect", async () => {
  console.log("Successfull connection PLC! ");
});

comm
  .connect()
  .then(() => {
    comm
      .digitalRead(0)
      .then(result => {
        console.timeEnd("reading digital input");
        console.log("value of:", result.valueOf(), "tagName:", result.tagName);
      })
      .catch(console.error);
    comm
      .digitalOutRead(0)
      .then(result => {
        console.timeEnd("reading digital output");
        console.log("value of:", result.valueOf(), "tagName:", result.tagName);
      })
      .catch(console.error);
    comm
      .analogRead(0)
      .then(result => {
        console.timeEnd("reading analog input");
        console.log("value of:", result.valueOf(), "tagName:", result.tagName);
      })
      .catch(console.error);
    [0, 1, 2, 3, 4, 5, 6].forEach(p => {
      comm
        .digitalWrite(p, false)
        .then(console.log)
        .catch(e => console.error("Error write:", e));
    });
  })
  .catch(console.error);
