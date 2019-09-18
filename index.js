"use strict";

const PLC = require("./src/eip");
const context = require("./src/CIPcontext");

exports.context = context;
module.exports = PLC;
exports.default = PLC;
