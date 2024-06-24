const { Router } = require("express");

const userRouter = Router();

userRouter.post("/login", (req, res) => {
    res.send("login");
});
userRouter.post("/register", (req, res) => {
    res.send("register");
});

userRouter.put("/updateProfile", (req, res) => {
    res.send("updateProfile");
});

userRouter.get("/getContacts", (req, res) => {
    res.send("getContacts");
});

userRouter.get("/me", (req, res) => {
    res.send("me");
});

module.exports = userRouter;
