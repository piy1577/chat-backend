import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import prismaClient from "./prisma";

const kafka = new Kafka({
    brokers: [process.env.kafkaBroker || ""],
    ssl: {
        ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")],
    },
    sasl: {
        username: process.env.kafkaUsername || "",
        password: process.env.kafkaPassword || "",
        mechanism: "plain",
    },
});

let producer: null | Producer = null;

async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

export async function produceMessage(message: string) {
    const producer = await createProducer();
    producer.send({
        messages: [{ key: `message-${Date.now()}`, value: message }],
        topic: "MESSAGES",
    });
    return true;
}

export async function startConsumer() {
    const consumer = kafka.consumer({ groupId: "default" });
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES" });

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if (!message.value) return;
            console.log(`New Message Rec...`);
            try {
                await prismaClient.message.create({
                    data: {
                        text: message.value?.toString(),
                    },
                });
            } catch (err) {
                console.log(`Something is wrong`);
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: "MESSAGES" }]);
                }, 60 * 1000);
            }
        },
    });
}

export default kafka;
