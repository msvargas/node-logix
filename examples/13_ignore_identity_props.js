const PLC = require("../index").default;

const comm = new PLC({ host: "192.168.100.174", Micro800: true });

console.time("connect");
comm.connect(false).then(() => {
  console.timeEnd("connect");
});
