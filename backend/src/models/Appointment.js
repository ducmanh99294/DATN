const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },

    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      required: true,
    },

    symptoms: [{
      type: String,
      required: true,
      trim: true,
    }],

    description: {
      type: String,
      trim: true,
    },

    duration: {
      type: Number,
      default: 30
    },

    slotId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
      unique: true, // mỗi slot chỉ có 1 appointment
    }],

    status: {
      type: String,
      enum: ["pending","confirmed", "cancelled", "completed"],
      default: "pending",
    },
    price: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      trim: true,

    aiSuggestedDuration: {
      type: Number,
      enum: [30, 60, 90],
    },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
