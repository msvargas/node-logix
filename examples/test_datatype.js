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
    //await comm.Write("TEST_STRING", "Hola");
    await comm.Write("TEST_SINT", 10);
    await comm.Write("TEST_BOOL", false);
    await comm.Write("TEST_INT", 11);
    await comm.Write("TEST_DINT", 12);
    await comm.Write("TEST_LINT", 13);
    await comm.Write("TEST_USINT", 14);
    await comm.Write("TEST_UINT", 15);
    await comm.Write("TEST_UDINT", 16);
    await comm.Write("TEST_LWORD", 17);
    await comm.Write("TEST_REAL", 17.1);
    await comm.Write("TEST_LREAL", 17.35);
    await comm.Write("TEST_DWORD", 19);
    console.log("End test");
    console.log(comm.KnownTags);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
