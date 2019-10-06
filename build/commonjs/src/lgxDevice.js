"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var devices_json_1 = __importDefault(require("../resources/devices.json"));
var vendors_json_1 = __importDefault(require("../resources/vendors.json"));
var LGXDevice = (function () {
    function LGXDevice(rinfo) {
        if (!!rinfo)
            this.address = function () { return rinfo; };
    }
    return LGXDevice;
}());
exports.default = LGXDevice;
function getDevice(deviceType) {
    if (deviceType in devices_json_1.default)
        return devices_json_1.default[deviceType];
    else
        return "unknown";
}
exports.getDevice = getDevice;
function getVendor(vendorId) {
    if (vendorId in vendors_json_1.default)
        return vendors_json_1.default[vendorId];
    else
        return "unknown";
}
exports.getVendor = getVendor;
//# sourceMappingURL=lgxDevice.js.map