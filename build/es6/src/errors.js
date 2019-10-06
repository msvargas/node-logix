var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import cipErrorCodes from "../resources/CIPErrorCodes.json";
var ValueError = (function (_super) {
    __extends(ValueError, _super);
    function ValueError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ValueError";
        return _this;
    }
    return ValueError;
}(Error));
export { ValueError };
var LogixError = (function (_super) {
    __extends(LogixError, _super);
    function LogixError(message, status) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.name = "LogixError";
        return _this;
    }
    return LogixError;
}(Error));
export { LogixError };
var ConnectionError = (function (_super) {
    __extends(ConnectionError, _super);
    function ConnectionError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ConnectionError";
        return _this;
    }
    return ConnectionError;
}(Error));
export { ConnectionError };
var ConnectionTimeoutError = (function (_super) {
    __extends(ConnectionTimeoutError, _super);
    function ConnectionTimeoutError(host, timeout) {
        var _this = _super.call(this, "Faile to connect with PLC(" + host + ") timeout at " + timeout + "ms") || this;
        _this.host = host;
        _this.timeout = timeout;
        _this.name = "ConnectionTimeoutError";
        return _this;
    }
    return ConnectionTimeoutError;
}(Error));
export { ConnectionTimeoutError };
var DisconnectedError = (function (_super) {
    __extends(DisconnectedError, _super);
    function DisconnectedError() {
        var _this = _super.call(this, "Failed to send data, PLC was disconnected or no connected yet") || this;
        _this.name = "DisconnectedError";
        return _this;
    }
    return DisconnectedError;
}(Error));
export { DisconnectedError };
var RegisterSessionError = (function (_super) {
    __extends(RegisterSessionError, _super);
    function RegisterSessionError() {
        return _super.call(this, "Failed to register session") || this;
    }
    return RegisterSessionError;
}(ConnectionError));
export { RegisterSessionError };
var ConnectionLostError = (function (_super) {
    __extends(ConnectionLostError, _super);
    function ConnectionLostError() {
        var _this = _super.call(this, cipErrorCodes[7]) || this;
        _this.status = 7;
        return _this;
    }
    return ConnectionLostError;
}(ConnectionError));
export { ConnectionLostError };
var ForwarOpenError = (function (_super) {
    __extends(ForwarOpenError, _super);
    function ForwarOpenError() {
        return _super.call(this, "Forward open Failed") || this;
    }
    return ForwarOpenError;
}(ConnectionError));
export { ForwarOpenError };
var PinMappingError = (function (_super) {
    __extends(PinMappingError, _super);
    function PinMappingError(message) {
        var _this = _super.call(this, "Pin mapping error: " + message) || this;
        _this.name = "PinMappingError";
        return _this;
    }
    return PinMappingError;
}(Error));
export { PinMappingError };
export function getErrorCode(status) {
    return status in cipErrorCodes
        ? cipErrorCodes[status]
        : "Unknown error " + status;
}
export { cipErrorCodes };
export default {
    PinMappingError: PinMappingError,
    ForwarOpenError: ForwarOpenError,
    ConnectionLostError: ConnectionLostError,
    RegisterSessionError: RegisterSessionError,
    DisconnectedError: DisconnectedError,
    ConnectionTimeoutError: ConnectionTimeoutError,
    LogixError: LogixError,
    ValueError: ValueError,
    ConnectionError: ConnectionError,
    cipErrorCodes: cipErrorCodes
};
//# sourceMappingURL=errors.js.map