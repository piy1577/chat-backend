const Chat = require("../model/Chat.model");
const User = require("../model/User.model");
const socketio = require("socket.io");

const createChat = async (req, res) => {
    const user = req.body.user;
    const { email } = req.body;

    const contact = await User.findOne({ email: email });
    if (!contact) {
        return res.status(400).json({ message: "User not Register" });
    }

    if (user._id.toString() === contact._id.toString()) {
        return res
            .status(400)
            .json({ message: "You can't chat with yourself" });
    }

    const chats = await Promise.all(
        user.chat.map(async (chat) => await Chat.findById(chat))
    );

    const validate = chats.every((chat) => {
        return !(chat.users.length == 2 && chat.users.includes(contact._id));
    });

    if (!validate) {
        return res.status(400).json({ message: "Contact already exists" });
    }

    const chat = await Chat.create({
        users: [user._id, contact._id],
        messages: [],
    });

    await User.findByIdAndUpdate(user._id, {
        $push: { chat: chat._id },
    });

    await User.findByIdAndUpdate(contact._id, {
        $push: { chat: chat._id },
    });

    res.status(200).json({ message: "Chat created" });
};

const createGroup = async (req, res) => {
    const { name, emails } = req.body;

    if (!name || name.trim() === "") {
        return res
            .status(400)
            .json({ message: "Please provide a name to create a group" });
    }
    if (!emails || emails.length === 0) {
        return res
            .status(400)
            .json({ message: "Please provide emails to create a group" });
    }

    const user = req.body.user;

    let contacts = await Promise.all(
        emails.map(async (email) => {
            const contact = await User.findOne({ email });
            if (!contact) {
                return null;
            }
            return contact._id.toString();
        })
    );

    if (contacts.includes(null)) {
        return res.status(400).json({ message: "Please provide valid emails" });
    }
    contacts = contacts.filter((contact) => contact !== user._id.toString());

    if (contacts.length === 0) {
        return res.status(400).json({ message: "Please provide valid emails" });
    }
    const chat = await Chat.create({
        name,
        users: [user._id, ...contacts],
        messages: [],
    });

    await User.findByIdAndUpdate(user._id, {
        $push: { chat: chat._id },
    });

    contacts.map(async (contact) => {
        await User.findByIdAndUpdate(contact, {
            $push: { chat: chat._id },
        });
    });

    res.status(200).json({ message: "Group created" });
};

const fetchMessage = async (req, res) => {
    const { id } = req.body;
    const user = req.body.user;
    const chat = await Chat.findById(id);
    if (!chat) {
        return res.status(400).send("Chat not found");
    }

    if (!chat.users.includes(user._id)) {
        return res.status(401).send("You are not authorized to fetch messages");
    }

    if (chat.users.length > 2) {
        const messages = await Promise.all(
            chat.messages.map(async (message) => {
                const contactDetails = await User.findById(message.sender);
                return {
                    message: message.message,
                    sender: contactDetails.name,
                    isSender: message.sender.toString() === user._id.toString(),
                };
            })
        );

        res.status(200).json({
            messages,
            info: { name: chat.name, id: chat._id },
        });
    } else {
        const contact = chat.users.find(
            (userId) => userId.toString() !== user._id.toString()
        );

        const contactDetails = await User.findById(contact);
        const messages = chat.messages.map((message) => {
            return {
                text: message.message,
                isSender: message.sender.toString() === user._id.toString(),
            };
        });

        res.status(200).json({
            messages,
            info: { name: contactDetails.name, id: chat._id },
        });
    }
};

const sendMessage = async (io, users, chatId, userId, message) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new Error({ message: "Chat not found" });
    }

    if (!chat.users.includes(userId)) {
        throw new Error({ message: "You are not authorized to send messages" });
    }

    const messages = [{ sender: userId, message }, ...chat.messages];

    await Chat.findByIdAndUpdate(chatId, {
        messages,
    });
    chat.users.forEach((user) => {
        if (
            user.toString() !== userId &&
            users.some((u) => u.userId === user.toString())
        ) {
            const socketId = users.find(
                (u) => u.userId === user.toString()
            ).socketId;
            io.to(socketId).emit("getMessage", { chatId, userId, message });
        }
    });
};

const socket = (server) => {
    const io = socketio(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    }).of("/message");
    let users = [];
    io.on("connection", (socket) => {
        socket.on("addUser", (userId) => {
            if (!users.some((user) => user.userId === userId)) {
                users.push({ userId, socketId: socket.id });
            }
            io.emit(
                "getUsers",
                users.map((item) => item.userId)
            );
        });

        socket.on("disconnect", () => {
            users = users.filter((user) => user.socketId !== socket.id);
            io.emit(
                "getUsers",
                users.map((item) => item.userId)
            );
        });

        socket.on("sendMessage", ({ chatId, userId, message }) => {
            sendMessage(io, users, chatId, userId, message);
        });
    });
};

module.exports = {
    createChat,
    createGroup,
    fetchMessage,
    socket,
};
