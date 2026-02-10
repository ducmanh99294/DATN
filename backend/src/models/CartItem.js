const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  quantity: {
    type: Number,
    default: 1,
    min: 1
  },

  note: String

}, { timestamps: true });

module.exports = mongoose.model("CartItem", cartItemSchema);
