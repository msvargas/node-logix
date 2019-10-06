"use-strict";

/**
 * @description The simplest example to check identity
 */

const PLC = require("../index").default;
PLC.defaultOptions.Micro800 = true;
const comm = new PLC("192.168.100.174");

const ignoreIdentity = false;
comm
  .connect(ignoreIdentity)
  .then(() => {
    comm.getWallClockTime(true).then(console.log);
    // get props identity
    const {
      vendor,
      vendorId,
      device,
      deviceType,
      productCode,
      productName,
      state,
      status,
      serialNumber,
      host,
      connected
    } = comm;
    // show identity
    console.log({
      host,
      vendor,
      vendorId,
      device,
      deviceType,
      productCode,
      productName,
      state,
      status,
      serialNumber,
      connected
    });
  })
  .catch(console.error);

comm.on("connect", () => {
  console.log("PLC connected successful! ");
});

comm.on("connect_error", e => {
  console.log("Fail to connect PLC!");
});

comm.on("disconnect", reason => {
  console.log("PLC disconnected reason:", reason);
});
