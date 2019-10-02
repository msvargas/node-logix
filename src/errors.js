"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CIPErrorCodes_json_1 = __importDefault(require("../resources/CIPErrorCodes.json"));
exports.cipErrorCodes = CIPErrorCodes_json_1.default;
var ValueError = /** @class */ (function (_super) {
    __extends(ValueError, _super);
    function ValueError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ValueError";
        return _this;
    }
    return ValueError;
}(Error));
exports.ValueError = ValueError;
var LogixError = /** @class */ (function (_super) {
    __extends(LogixError, _super);
    function LogixError(message, status) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.name = "LogixError";
        return _this;
    }
    return LogixError;
}(Error));
exports.LogixError = LogixError;
var ConnectionError = /** @class */ (function (_super) {
    __extends(ConnectionError, _super);
    function ConnectionError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ConnectionError";
        return _this;
    }
    return ConnectionError;
}(Error));
exports.ConnectionError = ConnectionError;
var ConnectionTimeoutError = /** @class */ (function (_super) {
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
exports.ConnectionTimeoutError = ConnectionTimeoutError;
var DisconnectedError = /** @class */ (function (_super) {
    __extends(DisconnectedError, _super);
    function DisconnectedError() {
        var _this = _super.call(this, "Failed to send data, PLC was disconnected or no connected yet") || this;
        _this.name = "DisconnectedError";
        return _this;
    }
    return DisconnectedError;
}(Error));
exports.DisconnectedError = DisconnectedError;
var RegisterSessionError = /** @class */ (function (_super) {
    __extends(RegisterSessionError, _super);
    function RegisterSessionError() {
        return _super.call(this, "Failed to register session") || this;
    }
    return RegisterSessionError;
}(ConnectionError));
exports.RegisterSessionError = RegisterSessionError;
var ConnectionLostError = /** @class */ (function (_super) {
    __extends(ConnectionLostError, _super);
    function ConnectionLostError() {
        var _this = _super.call(this, CIPErrorCodes_json_1.default[7]) || this;
        _this.status = 7;
        return _this;
    }
    return ConnectionLostError;
}(ConnectionError));
exports.ConnectionLostError = ConnectionLostError;
var ForwarOpenError = /** @class */ (function (_super) {
    __extends(ForwarOpenError, _super);
    function ForwarOpenError() {
        return _super.call(this, "Forward open Failed") || this;
    }
    return ForwarOpenError;
}(ConnectionError));
exports.ForwarOpenError = ForwarOpenError;
var PinMappingError = /** @class */ (function (_super) {
    __extends(PinMappingError, _super);
    function PinMappingError(message) {
        var _this = _super.call(this, "Pin mapping error: " + message) || this;
        _this.name = "PinMappingError";
        return _this;
    }
    return PinMappingError;
}(Error));
exports.PinMappingError = PinMappingError;
/* export class ConnectionSizeError extends Error{
  constructor(connectionSize? : number){
    super("Max ConnectionSize");
    this.name = "ConnectionSizeError"
  }
} */
//Get the CIP error code string
function getErrorCode(status) {
    return status in CIPErrorCodes_json_1.default
        ? CIPErrorCodes_json_1.default[status]
        : "Unknown error " + status;
}
exports.getErrorCode = getErrorCode;
exports.default = {
    PinMappingError: PinMappingError,
    ForwarOpenError: ForwarOpenError,
    ConnectionLostError: ConnectionLostError,
    RegisterSessionError: RegisterSessionError,
    DisconnectedError: DisconnectedError,
    ConnectionTimeoutError: ConnectionTimeoutError,
    LogixError: LogixError,
    ValueError: ValueError,
    ConnectionError: ConnectionError,
    cipErrorCodes: CIPErrorCodes_json_1.default
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVGQUE0RDtBQThFbkQsd0JBOUVGLDRCQUFhLENBOEVFO0FBNUV0QjtJQUFnQyw4QkFBSztJQUNuQyxvQkFBWSxPQUFlO1FBQTNCLFlBQ0Usa0JBQU0sT0FBTyxDQUFDLFNBRWY7UUFEQyxLQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQzs7SUFDM0IsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQUxELENBQWdDLEtBQUssR0FLcEM7QUFMWSxnQ0FBVTtBQU92QjtJQUFnQyw4QkFBSztJQUNuQyxvQkFBWSxPQUFlLEVBQVMsTUFBYztRQUFsRCxZQUNFLGtCQUFNLE9BQU8sQ0FBQyxTQUVmO1FBSG1DLFlBQU0sR0FBTixNQUFNLENBQVE7UUFFaEQsS0FBSSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7O0lBQzNCLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUFMRCxDQUFnQyxLQUFLLEdBS3BDO0FBTFksZ0NBQVU7QUFPdkI7SUFBcUMsbUNBQUs7SUFDeEMseUJBQVksT0FBZTtRQUEzQixZQUNFLGtCQUFNLE9BQU8sQ0FBQyxTQUVmO1FBREMsS0FBSSxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQzs7SUFDaEMsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0FBQyxBQUxELENBQXFDLEtBQUssR0FLekM7QUFMWSwwQ0FBZTtBQU81QjtJQUE0QywwQ0FBSztJQUMvQyxnQ0FBbUIsSUFBYSxFQUFTLE9BQWdCO1FBQXpELFlBQ0Usa0JBQ0UsNEJBQTRCLEdBQUcsSUFBSSxHQUFHLGVBQWUsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUN2RSxTQUVGO1FBTGtCLFVBQUksR0FBSixJQUFJLENBQVM7UUFBUyxhQUFPLEdBQVAsT0FBTyxDQUFTO1FBSXZELEtBQUksQ0FBQyxJQUFJLEdBQUcsd0JBQXdCLENBQUM7O0lBQ3ZDLENBQUM7SUFDSCw2QkFBQztBQUFELENBQUMsQUFQRCxDQUE0QyxLQUFLLEdBT2hEO0FBUFksd0RBQXNCO0FBU25DO0lBQXVDLHFDQUFLO0lBQzFDO1FBQUEsWUFDRSxrQkFBTSwrREFBK0QsQ0FBQyxTQUV2RTtRQURDLEtBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7O0lBQ2xDLENBQUM7SUFDSCx3QkFBQztBQUFELENBQUMsQUFMRCxDQUF1QyxLQUFLLEdBSzNDO0FBTFksOENBQWlCO0FBTzlCO0lBQTBDLHdDQUFlO0lBQ3ZEO2VBQ0Usa0JBQU0sNEJBQTRCLENBQUM7SUFDckMsQ0FBQztJQUNILDJCQUFDO0FBQUQsQ0FBQyxBQUpELENBQTBDLGVBQWUsR0FJeEQ7QUFKWSxvREFBb0I7QUFNakM7SUFBeUMsdUNBQWU7SUFFdEQ7UUFBQSxZQUNFLGtCQUFNLDRCQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FDeEI7UUFIRCxZQUFNLEdBQVcsQ0FBQyxDQUFDOztJQUduQixDQUFDO0lBQ0gsMEJBQUM7QUFBRCxDQUFDLEFBTEQsQ0FBeUMsZUFBZSxHQUt2RDtBQUxZLGtEQUFtQjtBQU9oQztJQUFxQyxtQ0FBZTtJQUNsRDtlQUNFLGtCQUFNLHFCQUFxQixDQUFDO0lBQzlCLENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUFKRCxDQUFxQyxlQUFlLEdBSW5EO0FBSlksMENBQWU7QUFNNUI7SUFBcUMsbUNBQUs7SUFDeEMseUJBQVksT0FBZTtRQUEzQixZQUNFLGtCQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxTQUV2QztRQURDLEtBQUksQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUM7O0lBQ2hDLENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUFMRCxDQUFxQyxLQUFLLEdBS3pDO0FBTFksMENBQWU7QUFPNUI7Ozs7O0lBS0k7QUFDSiwrQkFBK0I7QUFDL0IsU0FBZ0IsWUFBWSxDQUFDLE1BQWM7SUFDekMsT0FBTyxNQUFNLElBQUksNEJBQWE7UUFDNUIsQ0FBQyxDQUFFLDRCQUFxQixDQUFDLE1BQU0sQ0FBQztRQUNoQyxDQUFDLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO0FBQ2hDLENBQUM7QUFKRCxvQ0FJQztBQUlELGtCQUFlO0lBQ2IsZUFBZSxpQkFBQTtJQUNmLGVBQWUsaUJBQUE7SUFDZixtQkFBbUIscUJBQUE7SUFDbkIsb0JBQW9CLHNCQUFBO0lBQ3BCLGlCQUFpQixtQkFBQTtJQUNqQixzQkFBc0Isd0JBQUE7SUFDdEIsVUFBVSxZQUFBO0lBQ1YsVUFBVSxZQUFBO0lBQ1YsZUFBZSxpQkFBQTtJQUNmLGFBQWEsOEJBQUE7Q0FDZCxDQUFDIn0=