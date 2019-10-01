"use-strict";

const PLC = require("../index").default;

PLC.discover().then(devices => {
  console.log(devices);
});
