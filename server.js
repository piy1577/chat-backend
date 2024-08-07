const http = require("http");
require("dotenv").config({ path: "./src/config/.env" });

const connect = require("./src/config/db");

const PORT = process.env.PORT || 3000;
const server = http.createServer(require("./src/app"));
require("./src/controller/Chat.controller").socket(server);
connect(server, PORT);
