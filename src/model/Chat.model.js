const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    name: { type: String },
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        qef: "User",
    },
    messages: {
        type: [
            {
                sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                message: { type: String },
                seenBy: {
                    type: [mongoose.Schema.Types.ObjectId],
                    ref: "User",
                    default: [],
                },
            },
        ],
        default: [],
    },
});

module.exports = mongoose.model("Chat", chatSchema);
