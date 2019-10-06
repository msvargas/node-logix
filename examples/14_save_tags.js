"use-strict";
/**
 * @description The simplest example of writing and reading a tag from a PLC and save it
 */
const fs = require("fs");
const path = require("path");
const PLC = require("../index").default;

const comm = new PLC({
  host: "192.168.100.174",
  Micro800: true,
  autoClose: false
});

comm
  .connect()
  .then(() => {
    comm
      .getTagList()
      .then(tags => {
        const dst = path.resolve(__dirname, "./tags.json");
        fs.writeFileSync(dst, JSON.stringify(tags, null, 2), "utf8");
        console.log("tags save in " + dst);
        comm.close();
        process.exit(0);
      })
      .catch(console.error);
  })
  .catch(console.error);
