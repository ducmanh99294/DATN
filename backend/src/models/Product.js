const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  description: {type: String},

  price: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    maximum: 5,
    minimum: 0,
    default: 0
  },

  images: [String],

  discount: {
    type: Number,
    default: 0
  },

  stock: {
    type: Number,
    default: 0
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  sellCount: {
    type: Number,
    default: 0
  },
  //hướng dân sử dụng
  useFors: {type: String},
  //công dụng
  uses: {type: String},
  // tác dụng phụ
  sideEffects: {type: String},

  isSelling: {
    type: Boolean,
    default: true
  },

  prescriptionRequired: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

productSchema.index({ name: "text" });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isSelling: 1 });

module.exports = mongoose.model("Product", productSchema);


      