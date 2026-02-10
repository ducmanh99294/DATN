const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },

    date: [{
      type: Date, // chỉ lấy YYYY-MM-DD
      required: true,
    }],

    startTime: {
      type: String, // "08:00"
      required: true,
    },

    endTime: {
      type: String, // "11:00"
      required: true,
    },

    slotDuration: {
      type: Number, // phút, ví dụ 30
      default: 30,
    },

    maxPatients: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 1 bác sĩ không được tạo trùng lịch cùng ngày
doctorAvailabilitySchema.index(
  { doctorId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "DoctorAvailability",
  doctorAvailabilitySchema
);
