const PLC = require("../src/eip");

const comm = new PLC("192.168.100.9");

comm.on("connect", async () => {
  console.log("Successfull connection PLC! ");
});

comm.connect().then(() => {
  run();
});

async function run() {
  try {
    console.log("Start test...");
    //await comm.write("TEST_STRING", "Hola");
    await comm.write("TEST_SINT", 10);
    await comm.write("TEST_BOOL", false);
    await comm.write("TEST_INT", 11);
    await comm.write("TEST_DINT", 12);
    await comm.write("TEST_LINT", 13);
    await comm.write("TEST_USINT", 14);
    await comm.write("TEST_UINT", 15);
    await comm.write("TEST_UDINT", 16);
    await comm.write("TEST_LWORD", 17);
    await comm.write("TEST_REAL", 17.1);
    await comm.write("TEST_LREAL", 17.35);
    await comm.write("TEST_DWORD", 19);
    console.log("End test");
    console.log(comm.KnownTags);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
