"use-strict";

const PLC = require("../index");

PLC.discover().then(devices => {
  console.log("Devices:", devices);
});
