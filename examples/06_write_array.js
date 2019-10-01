/**
 * The simplest example of writing and reading a tag from a PLC
 */

const PLC = require("../index").default;

const comm = new PLC("192.168.100.174");

comm
  .connect()
  .then(() => {
    return comm.write("LargeArray[10]", [
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60
    ]);
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
