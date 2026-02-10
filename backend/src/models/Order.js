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

  shippingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    city: String,
    address: String,
    state: String,
    zipCode: String,
    country: String,
    note: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
