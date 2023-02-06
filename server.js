/** Server startup for Message.ly. */


const app = require("./app");

const { CFG_PORT } = require("./config");

app.listen(CFG_PORT, function () {
  console.log(`${(new Date()).toISOString()}: Server listening on port ${CFG_PORT}.`);
});