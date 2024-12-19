import { Redis } from "ioredis";

class RedisServer {
    private redis: Redis;

    constructor() {
        this.redis = new Redis({
            username: "default",
            password: process.env.redisPassword,
            host: process.env.redisHost,
            port: 13226,
        });
    }

    public async consume(channel: string, callback: (msg: string) => unknown) {
        await this.redis.subscribe(channel);
        this.redis.on("message", async (ch, message) => {
            if (channel == ch) {
                await callback(message);
            }
        });
    }

    public async produce(channel: string, message: string) {
        await this.redis.publish(channel, message);
    }
}

export default RedisServer;
