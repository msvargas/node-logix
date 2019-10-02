import cipErrorCodes from "../resources/CIPErrorCodes.json";

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}

export class LogixError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "LogixError";
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

export class ConnectionTimeoutError extends Error {
  constructor(public host?: string, public timeout?: number) {
    super(
      "Faile to connect with PLC(" + host + ") timeout at " + timeout + "ms"
    );
    this.name = "ConnectionTimeoutError";
  }
}

export class DisconnectedError extends Error {
  constructor() {
    super("Failed to send data, PLC was disconnected or no connected yet");
    this.name = "DisconnectedError";
  }
}

export class RegisterSessionError extends ConnectionError {
  constructor() {
    super("Failed to register session");
  }
}

export class ConnectionLostError extends ConnectionError {
  status: number = 7;
  constructor() {
    super(cipErrorCodes[7]);
  }
}

export class ForwarOpenError extends ConnectionError {
  constructor() {
    super("Forward open Failed");
  }
}

export class PinMappingError extends Error {
  constructor(message: string) {
    super("Pin mapping error: " + message);
    this.name = "PinMappingError";
  }
}

/* export class ConnectionSizeError extends Error{
  constructor(connectionSize? : number){
    super("Max ConnectionSize");
    this.name = "ConnectionSizeError"
  }
} */
//Get the CIP error code string
export function getErrorCode(status: number) {
  return status in cipErrorCodes
    ? (cipErrorCodes as any)[status]
    : "Unknown error " + status;
}

export { cipErrorCodes };

export default {
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
