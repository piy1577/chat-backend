"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
    children?: React.ReactNode;
}

interface ISocketContext {
    sendMessage: (msg: string) => unknown;
    message: string[];
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = useContext(SocketContext);
    if (!state) throw new Error("state is undefined");

    return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>();
    const [message, setMessage] = useState<string[]>([]);

    const sendMessage: ISocketContext["sendMessage"] = useCallback(
        (msg) => {
            console.log("send Messgae", msg);
            if (socket) {
                socket.emit("event:message", { message: msg });
            }
        },
        [socket]
    );

    const onMessageRec = useCallback((msg: string) => {
        console.log("From server msg rec: ", msg);
        const { message: m } = JSON.parse(msg) as { message: string };
        setMessage((t) => [...t, m]);
    }, []);

    useEffect(() => {
        const _socket = io("http://localhost:8000");
        setSocket(_socket);
        _socket.on("message", onMessageRec);
        return () => {
            _socket.disconnect();
            _socket.off("message", onMessageRec);
            setSocket(undefined);
        };
    }, [onMessageRec]);
    return (
        <SocketContext.Provider value={{ sendMessage, message }}>
            {children}
        </SocketContext.Provider>
    );
};
