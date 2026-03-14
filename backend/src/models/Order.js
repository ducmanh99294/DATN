const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["cod", "bank", "momo", "vnpay", "zalopay"],
    default: "cod"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "completed", 'failed', "cancelled"],
    default: "pending"
  },

  totalPrice: {
    type: Number,
    default: 0
  },
  note: String,

  shippingAddress: {
    fullName: String,
    phone: String,
    district: String,
    ward: String,
    address: String,
  },
  date: {
    type: Date,
    default: Date.now
  },
  dateConfirmed: Date,
  reason: String, 
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
