const { Router } = require("express");
const {
    createChat,
    createGroup,
    fetchMessage,
} = require("../controller/Chat.controller");
const verifyUser = require("../Middleware/verifyUser");

const chatRouter = Router();
chatRouter.post("/group", verifyUser, createGroup);
chatRouter.post("/", verifyUser, createChat);
chatRouter.post("/message", verifyUser, fetchMessage);

module.exports = chatRouter;
