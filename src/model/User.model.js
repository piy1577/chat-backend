const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        validate: [validator.isEmail, "Invalid Email"],
    },
    password: { type: String, required: [true, "Password is required"] },
    chat: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Chat",
        default: [],
    },
});

module.exports = mongoose.model("User", userSchema);
