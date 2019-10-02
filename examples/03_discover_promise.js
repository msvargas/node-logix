"use-strict";
/**
 * @description Found IPv4 devices - PLC
 */
const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;

PLC.discover(3000, {
  family: "IPv4",
  onFound: (device, n) => {
    console.log(`#${n}`, device.address());
  },
  onError: (msg, rinfo) => {
    console.log("msg:", msg, "rinfo", rinfo);
  }
}).then(devices => {
  console.log(devices);
});
