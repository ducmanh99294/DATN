const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  role: {
    type: String, // "user" | "assistant"
  },
  message: String,

  type: String, 
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
