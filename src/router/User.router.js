const { Router } = require("express");
const {
    login,
    register,
    updateName,
    forgotPassword,
    resetPassword,
    changePassword,
    getContacts,
    Me,
    resetName,
    changeName,
} = require("../controller/User.controller");
const userRouter = Router();

userRouter.post("/login", login);
userRouter.post("/register", register);
userRouter.put("/updateName", updateName);
userRouter.get("/reset-name", resetName);
userRouter.post("/reset-name", changeName);
userRouter.put("/forgotPassword", forgotPassword);
userRouter.get("/reset-password", resetPassword);
userRouter.post("/reset-password", changePassword);
userRouter.get("/getContacts", getContacts);
userRouter.get("/me", Me);

module.exports = userRouter;
