"use client";
import { useSocket } from "@/context/SocketProvider";
import { useState } from "react";

export default function Page() {
    const { sendMessage, message: msg } = useSocket();
    const [message, setMessage] = useState("");
    return (
        <div>
            <div>
                <input
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message..."
                />
                <button onClick={() => sendMessage(message)}>Send</button>
            </div>
            <div>
                {msg.map((i, index) => (
                    <div key={index}>{i}</div>
                ))}
            </div>
        </div>
    );
}
