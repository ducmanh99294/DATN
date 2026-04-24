const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  orderId: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    enum: ["appointment", "medicine"],
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: Number,

  method: {
    type: String,
    enum: ["cod", "bank", "momo", "vnpay"],
    default: "vnpay"
  },

  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING"
  },

  metadata: Object,

  transactionId: String

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);