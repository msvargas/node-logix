"use strict";

const PLC = require("./src/eip");
const EIPSocket = require("./src/eip-socket");

exports.EIPSocket = EIPSocket;
module.exports = PLC;
exports.default = PLC;
