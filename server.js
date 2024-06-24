const http = require("http");
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const server = http.createServer(require("./src/app"));

server.listen(PORT, () => {
    console.log(`Server is running \x1b[34mhttp://localhost:${PORT}`);
});
