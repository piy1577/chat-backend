const { Router } = require("express");
const {
    createChat,
    createGroup,
    fetchMessage,
} = require("../controller/Chat.controller");

const chatRouter = Router();
chatRouter.post("/group", createGroup);
chatRouter.post("/", createChat);
chatRouter.get("/", fetchMessage);

module.exports = chatRouter;
