"use strict";

const cipErrorCodes = require("../resources/CIPErrorCodes.json");

class ValueError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValueError";
  }
}

class LogixError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "LogixError";
    this.status = status || null;
  }
}

class ConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConnectionError";
  }
}

class ConnectionTimeoutError extends Error {
  constructor(host, timeout) {
    super(
      "Faile to connect with PLC(" + host + ") timeout at " + timeout + "ms"
    );
    this.name = "ConnectionTimeoutError";
    this.timeout = timeout;
  }
}

class DisconnectedError extends Error {
  constructor() {
    super("Failed to send data, PLC was disconnected or no connected yet");
    this.name = "DisconnectedError";
  }
}

class RegisterSessionError extends ConnectionError {
  constructor() {
    super("Failed to register session");
  }
}

class ConnectionLostError extends ConnectionError {
  constructor() {
    super(cipErrorCodes[7]);
    this.status = 7;
  }
}

class ForwarOpenError extends ConnectionError {
  constructor() {
    super("Forward open Failed");
  }
}

class PinMappingError extends Error {
  constructor(message) {
    super("Pin mapping error: " + message);
    this.name = "PinMappingError";
  }
}

const defaultErrors = {
  PinMappingError,
  ForwarOpenError,
  ConnectionLostError,
  RegisterSessionError,
  DisconnectedError,
  ConnectionTimeoutError,
  LogixError,
  ValueError,
  ConnectionError,
  cipErrorCodes
};

exports.PinMappingError = PinMappingError;
exports.ForwarOpenError = ForwarOpenError;
exports.ConnectionLostError = ConnectionLostError;
exports.RegisterSessionError = RegisterSessionError;
exports.DisconnectedError = DisconnectedError;
exports.ConnectionTimeoutError = ConnectionTimeoutError;
exports.LogixError = LogixError;
exports.ValueError = ValueError;
exports.ConnectionError = ConnectionError;
exports.cipErrorCodes = cipErrorCodes;

module.exports = defaultErrors;
exports.default = defaultErrors;
