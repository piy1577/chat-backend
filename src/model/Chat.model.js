const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    name: { type: String },
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        qef: "User",
    },
    messages: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            message: { type: String },
            seen: { type: Boolean, default: false },
        },
    ],
});


module.exports = mongoose.model("Chat", chatSchema);