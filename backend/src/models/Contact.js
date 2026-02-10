const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: String,

  subject: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "processing", "done"],
    default: "pending"
  },

  adminNote: String

}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
