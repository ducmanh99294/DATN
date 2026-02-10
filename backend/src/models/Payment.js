const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  method: {
    type: String,
    enum: ["cod", "bank", "momo", "vnpay", "stripe"],
    default: "bank"
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  transactionId: String

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
