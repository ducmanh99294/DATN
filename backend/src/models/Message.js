// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  sender: {
    type: String,
    enum: ["user", "admin"],
  },
  content: String,
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
