/**
 * The simplest example of writing and reading a tag from a PLC
 */

const PLC = require("../index");

const comm = new PLC("192.168.100.9");

comm.on("connect", () => {
  console.log("PLC connected successful! ");
  comm
    .write("TEST_USINT", 127)
    .then(() => {
      return comm.read("TEST_USINT").then(console.log);
    })
    .catch(console.error);
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC", e);
});

comm.on("reconnect", () => {
  console.log("PLC reconnected");
});

comm.on("error", e => {
  console.log("plc error:", e.message);
});

comm.on("disconnect", reason => {
  console.log("PLC disconnected reason:", reason);
});

comm.on("inactivity", () => {
  console.log("PLC inactivty");
});

comm.on("reachable", () => {
  console.log("PLC is port reachable");
});
