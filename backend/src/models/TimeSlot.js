const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String, // "08:00"
      required: true,
    },

    endTime: {
      type: String, // "08:30"
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "booked", "cancelled", "pending"],
      default: "available",
    },

  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },
    
  appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  { timestamps: true }
);

// tránh tạo trùng slot
timeSlotSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
