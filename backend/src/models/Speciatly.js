const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true
    },
    keywords: {
      type: [String],
      index: true
    },
    image: {
      type: String,
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Specialty', specialtySchema);
