import devices from "../resources/devices.json";
import vendors from "../resources/vendors.json";
var LGXDevice = (function () {
    function LGXDevice(rinfo) {
        if (!!rinfo)
            this.address = function () { return rinfo; };
    }
    return LGXDevice;
}());
export default LGXDevice;
export function getDevice(deviceType) {
    if (deviceType in devices)
        return devices[deviceType];
    else
        return "unknown";
}
export function getVendor(vendorId) {
    if (vendorId in vendors)
        return vendors[vendorId];
    else
        return "unknown";
}
//# sourceMappingURL=lgxDevice.js.map