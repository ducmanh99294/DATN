const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ["chair", "table", "cabinet", "Sofa", "bed", "decor"],
    required: true
  },

  description: {type: String},

  detailedDescription: {type: String},

  price: {
    type: Number,
    default: 0 // bán phụ → có thể = 0
  },
  rating: {
    type: Number,
    maximum: 5,
    minimum: 0,
    default: 0
  },

  dimensions: {type: String},

  materials: [String],   // gỗ sồi, MDF, kim loại...
  colors: [String],      // trắng, nâu, đen...

  images: [String],      // url ảnh
  features: [String],
  model3D: String,       // url .glb
  has3d: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    index: true
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  sellCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);


      