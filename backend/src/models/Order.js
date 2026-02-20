const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "designing", "shipping", "completed",'failed', "cancelled"],
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
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
