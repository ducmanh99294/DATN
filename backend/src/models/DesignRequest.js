const mongoose = require("mongoose");

const designRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // thông tin khách hàng
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,

  // thông tin căn hộ / nhà
  spaceType: {
    type: String,
    enum: ["apartment", "house", "office", "shop"],
    required: true
  },

  area: Number, // m2

  style: {
    type: String,
    enum: ["modern", "scandinavian", "japanese", "luxury", "industrial", "classic"]
  },

  budget: {
    min: Number,
    max: Number
  },

  message: String,

  // file đính kèm (ảnh mặt bằng, video...)
  attachments: [String],

  status: {
    type: String,
    enum: ["new", "contacted", "designing", "quoted", "done", "cancelled"],
    default: "new"
  },

  adminNote: String

}, { timestamps: true });

module.exports = mongoose.model("DesignRequest", designRequestSchema);
