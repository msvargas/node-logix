"use strict";
/**
   Copyright 2019 Michael Vargas (msvargas97@gmail.com)   
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 * 
 */

const devices = require("../resources/devices.json");
const vendors = require("../resources/vendors.json");

class LGXDevice {
  constructor(address) {
    if (!!address) this.address = () => address;
    this.IPAddress = undefined;
    this.length = undefined;
    this.encapsulationVersion = undefined;
    this.vendorId = undefined;
    this.vendor = undefined;
    this.deviceType = undefined;
    this.productCode = undefined;
    this.revision = undefined;
    this.status = undefined;
    this.serialNumber = undefined;
    this.productName = undefined;
    this.state = undefined;
  }
}

function getDevice(deviceType) {
  if (deviceType in devices) return devices[deviceType];
  else return "unknown";
}

function getVendor(vendorId) {
  if (vendorId in vendors) return vendors[vendorId];
  else return "unknown";
}

exports.LGXDevice = LGXDevice;
exports.getDevice = getDevice;
exports.getVendor = getVendor;
