const PLC = require("./src/eip");
const { LogixError, ValueError, ConnectionTimeout, ConnectionError, UnReachableError } = require("./src/error");
const context = require('./src/context')
const Promise = require("bluebird");

PLC.TimeoutError = Promise.TimeoutError;
PLC.LogixError = LogixError;
PLC.ValueError = ValueError;
PLC.ConnectionError = ConnectionError;
PLC.ConnectionTimeout = ConnectionTimeout;
PLC.UnReachableError = UnReachableError

exports.context = context
exports.LogixError = LogixError;
exports.ValueError = ValueError;
module.exports = PLC;
exports.default = PLC;
