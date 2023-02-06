/** Database connection for messagely. */


const { Client } = require("pg");
const { CFG_DB_URI } = require("./config");

const client = new Client(CFG_DB_URI);

client.connect();


module.exports = client;
