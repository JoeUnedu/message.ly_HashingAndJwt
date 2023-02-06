/** Common config for Message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const CFG_PORT = 3000;

const CFG_DB_URI = (process.env.NODE_ENV === "test")
  ? "postgresql:///messagely_test"
  : "postgresql:///messagely";

const CFG_SECRET_KEY = process.env.SECRET_KEY || "PlainTextSecret!";

const CFG_BCRYPT_WORK_FACTOR = 12;


module.exports = {
  CFG_PORT,
  CFG_DB_URI,
  CFG_SECRET_KEY,
  CFG_BCRYPT_WORK_FACTOR
};