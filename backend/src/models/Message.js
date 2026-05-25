const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: {
    type: String,
    required: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  seen: {
    type: Boolean,
    default: false
  },

  type: {
    type: String,
    enum: ["text", "product"],
    default: "text"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Message", messageSchema);