const { Router } = require("express");
const {
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    getContacts,
    Me,
} = require("../controller/User.controller");
const userRouter = Router();

userRouter.post("/login", login);
userRouter.post("/register", register);
userRouter.put("/forgotPassword", forgotPassword);
userRouter.get("/reset-password", resetPassword);
userRouter.post("/reset-password", changePassword);
userRouter.get("/getContacts", getContacts);
userRouter.get("/", Me);

module.exports = userRouter;
