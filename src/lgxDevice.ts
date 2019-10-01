import { RemoteInfo } from "dgram";
import devices from "../resources/devices.json";
import vendors from "../resources/vendors.json";

export default class LGXDevice {
  address?: () => RemoteInfo;
  IPAddress?: string;
  length?: number;
  encapsulationVersion?: string;
  vendorId?: number | string;
  vendor?: string;
  deviceType?: number;
  device?: string;
  productCode?: number;
  revision?: string | number;
  status?: number;
  serialNumber?: string | number;
  productName?: string;
  state?: number;
  constructor(rinfo?: RemoteInfo) {
    if (!!rinfo) this.address = () => rinfo;
  }
}

export function getDevice(deviceType: string | number): string {
  if (deviceType in devices) return devices[deviceType as keyof typeof devices];
  else return "unknown";
}

export function getVendor(vendorId: string | number): string {
   if (vendorId in vendors) return vendors[vendorId as keyof typeof vendors];
  else return "unknown";
}
