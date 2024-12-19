import http from "http";
import SocketService from "./services/socket";
import { startConsumer } from "./services/kafka";

async function init() {
    startConsumer();
    const socketService = new SocketService();
    const httpServer = http.createServer();
    const PORT = process.env.PORT || 8000;

    socketService.io.attach(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`HTTP Server started on PORT: ${PORT}`);
    });
    socketService.initListeners();
}

init();
