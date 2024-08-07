const { Router } = require("express");
const {
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    getContacts,
    logout,
    Me,
} = require("../controller/User.controller");
const userRouter = Router();
const verifyUser = require("../Middleware/verifyUser");

userRouter.post("/login", login);
userRouter.get("/logout", logout);
userRouter.post("/register", register);
userRouter.put("/forgotPassword", forgotPassword);
userRouter.get("/reset-password", resetPassword);
userRouter.post("/reset-password", changePassword);
userRouter.get("/getContacts", verifyUser, getContacts);
userRouter.get("/", verifyUser, Me);

module.exports = userRouter;
