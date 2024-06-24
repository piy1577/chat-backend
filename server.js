const http = require("http");
require("dotenv").config();
const connect = require("./src/db");

const PORT = process.env.PORT || 3000;
const server = http.createServer(require("./src/app"));

connect(server, PORT);
