const Chat = require("../model/Chat.model");
const User = require("../model/User.model");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;
const socketio = require("socket.io");

const createChat = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const { email } = req.body;

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).send("You are not authorized to create a chat");
    }

    const contact = await User.findOne({ email: email });
    if (!contact) {
        return res.status(400).send("User not Register");
    }

    const chats = await Promise.all(
        user.chat.map(async (chat) => await Chat.findById(chat))
    );

    const validate = chats.every((chat) => {
        return !(chat.users.length == 2 && chat.users.includes(contact._id));
    });

    if (!validate) {
        return res.status(400).send("Contact already exists");
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
    const token = req.headers.authorization.split(" ")[1];
    const { name, emails } = req.body;

    if (name.trim() === "") {
        return res.status(400).send("Please provide a name to create a group");
    }
    if (emails.length === 0) {
        return res.status(400).send("Please provide emails to create a group");
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).send("You are not authorized to create a group");
    }

    const contacts = await Promise.all(
        emails.map(async (email) => {
            const contact = await User.findOne({ email: email });
            if (!contact) {
                return res.status(400).send("User not Register");
            }
            return contact._id;
        })
    );
};

const fetchMessage = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = req.body;

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).send("You are not authorized to fetch messages");
    }

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
                    isSender: message.sender === user._id,
                };
            })
        );

        res.status(200).json({
            messages,
            info: { name: chat.name, id: chat._id },
        });
    } else {
        const contact = chat.users.find((userId) => userId !== user._id);
        const contactDetails = await User.findById(contact);
        const messages = chat.messages.map((message) => {
            return {
                message: message.message,
                sender:
                    message.sender === user._id
                        ? user.name
                        : contactDetails.name,
                isSender: message.sender === user._id,
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
        return { error: "Chat not found" };
    }

    if (!chat.users.includes(userId)) {
        return { error: "You are not authorized to send messages" };
    }

    const messages = [{ sender: userId, message }, ...chat.messages];

    await Chat.findByIdAndUpdate(
        chatId,
        {
            messages,
        },
        { new: true }
    );

    chat.users.forEach((user) => {
        if (user !== userId && users.some((u) => u.userId === user)) {
            const socketId = users.find((u) => u.userId === user).socketId;
            io.to(socketId).emit("getMessage", chatId, userId, message);
        }
    });
};

const socket = (server) => {
    const io = socketio(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    }).of("/chat");
    const users = [];
    io.on("connection", (socket) => {
        socket.on("addUser", (userId) => {
            if (!users.some((user) => user.userId === userId)) {
                users.push({ userId, socketId: socket.id });
            }
            io.emit("getUsers", users);
        });

        socket.on("disconnect", () => {
            users = users.filter((user) => user.socketId !== socket.id);
            io.emit("getUsers", users);
        });

        socket.on("sendMessage", (chatId, userId, message) => {
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
