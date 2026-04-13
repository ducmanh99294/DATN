const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // 1 user chỉ có 1 hồ sơ bác sĩ
    },
    rating: {
      type: Number,
      max: 5,
      min: 0,
      default: 0
    },
    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
      required: true
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0
    },
    qualifications: [{
      type: String,
    }],
    description: {
      type: String,
      trim: true
    },
    price:{
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
