import { Server } from "socket.io";
import RedisServer from "./Redis";
import { produceMessage } from "./kafka";

class SocketService {
    private _io: Server;
    private pub: RedisServer;
    private sub: RedisServer;
    constructor() {
        this._io = new Server({
            cors: {
                allowedHeaders: ["*"],
                origin: "*",
            },
        });
        this.pub = new RedisServer();
        this.sub = new RedisServer();
    }
    public initListeners() {
        const io = this._io;
        io.on("connect", (socket) => {
            console.log("New Socket Connected", socket.id);

            socket.on(
                "event:message",
                async ({ message }: { message: string }) => {
                    await this.pub.produce(
                        "Message",
                        JSON.stringify({ message })
                    );
                }
            );
        });
        this.sub.consume("Message", async (message) => {
            const msg = JSON.parse(message);
            io.emit("message", message);
            await produceMessage(msg.message);
        });
    }
    get io() {
        return this._io;
    }
}

export default SocketService;
