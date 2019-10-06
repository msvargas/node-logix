const PLC = require("../index").default;

const comm = new PLC("192.168.100.174", { Micro800: true });

console.time("connect");
comm.connect().then(() => {
  console.timeEnd("connect");
  console.time("read string");
  comm.read("String20", { dataType: PLC.CIPTypes.STRING }).then(res => {
    console.timeEnd("read string");
    console.log(res);
  });
});

comm.on("found", (device, pos) => {
  console.log(device.address(), pos);
});
comm.on("found_error", (msg, rinfo) => {
  console.error("found error:", rinfo.address, ":", msg);
});
comm.discover();
