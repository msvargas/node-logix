"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var devices_json_1 = __importDefault(require("../resources/devices.json"));
var vendors_json_1 = __importDefault(require("../resources/vendors.json"));
var LGXDevice = /** @class */ (function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGd4RGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGd4RGV2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0EsMkVBQWdEO0FBQ2hELDJFQUFnRDtBQTZDaEQ7SUFnQkUsbUJBQVksS0FBa0I7UUFDNUIsSUFBSSxDQUFDLENBQUMsS0FBSztZQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsY0FBTSxPQUFBLEtBQUssRUFBTCxDQUFLLENBQUM7SUFDMUMsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQW5CRCxJQW1CQzs7QUFFRCxTQUFnQixTQUFTLENBQUMsVUFBMkI7SUFDbkQsSUFBSSxVQUFVLElBQUksc0JBQU87UUFBRSxPQUFPLHNCQUFPLENBQUMsVUFBa0MsQ0FBQyxDQUFDOztRQUN6RSxPQUFPLFNBQVMsQ0FBQztBQUN4QixDQUFDO0FBSEQsOEJBR0M7QUFFRCxTQUFnQixTQUFTLENBQUMsUUFBeUI7SUFDakQsSUFBSSxRQUFRLElBQUksc0JBQU87UUFBRSxPQUFPLHNCQUFPLENBQUMsUUFBZ0MsQ0FBQyxDQUFDOztRQUNyRSxPQUFPLFNBQVMsQ0FBQztBQUN4QixDQUFDO0FBSEQsOEJBR0MifQ==