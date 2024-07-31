const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://chat-application-gold-tau.vercel.app",
        ],
    })
);
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "views")));
app.use(cookieParser());

app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/user", require("./router/User.router"));
app.use("/chat", require("./router/Chat.router"));

module.exports = app;

// functionality
// login, register, sendMessage, getContacts, getMessages, updateProfile
// routes: /user/login, /user/register, /chat/sendMessage, /user/getContacts, /chat/getMessages, /user/updateProfile /chat/new
// models: User, chat
// controllers: userController, chatController
// userModel: { id, name, password, email, profilePic, chats: [chatId]}
// chatModel: { id, name,  users:[userId], messages: [{ sender, message, seen }] }
