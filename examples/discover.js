"use-strict";

const PLC = require("../index");

PLC.discover()
  .then(console.log)
  .catch(console.log);
