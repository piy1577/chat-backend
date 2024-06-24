const { Router } = require("express");

const chatRouter = Router();

chatRouter.post("/sendMessage", (req, res) => {
    res.send("sendMessage");
});

chatRouter.get("/getMessages", (req, res) => {
    res.send("getMessages");
});

chatRouter.post("/new", (req, res) => {
    res.send("new");
});

module.exports = chatRouter;
