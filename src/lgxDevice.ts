import { RemoteInfo } from "dgram";
import devices from "../resources/devices.json";
import vendors from "../resources/vendors.json";

export interface ILGXDevice{
    /**
   * @description Vendor Identification
   */
  vendorId?: number | string;
  /**
   * @description vendor name
   */
  vendor?: string;
  /**
   * @description Indication of general type of product
   */
  deviceType?: number;
  /**
   * @description device name
   */
  device?: string;
  /**
   * @description Identification of a particular product of an individual vendor
   */
  productCode?: number;
  /**
   * @description Revision of the product
   */
  revision?: string | number;
  /**
   * @description Summary status of device
   */
  status?: number;
  /**
   * Serial number of device
   */
  serialNumber?: string | number;
  /**
   * @description Human readable identification
   */
  productName?: string;
  /**
   * @description Present state of the device
   */
  state?: number;
}

export default class LGXDevice implements ILGXDevice {
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
