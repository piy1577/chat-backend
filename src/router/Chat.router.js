const { Router } = require("express");
const {
    createChat,
    createGroup,
    fetchMessage,
} = require("../controller/Chat.controller");

const chatRouter = Router();
chatRouter.post("/group", createGroup);
chatRouter.post("/", createChat);
chatRouter.post("/message", fetchMessage);

module.exports = chatRouter;
