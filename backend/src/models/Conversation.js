const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  type:{
    type:String,
    enum:["ai","private"],
    default:"private"
  },

  lastMessage: {
    type: String,
    default: ""
  },

  lastMessageAt: {
    type: Date
  },

  isClosed: {
    type: Boolean,
    default: false
  },

  lastActiveAt: {
    type: Date,
    default: null
  },

  messages: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true }
    }
  ],

  context: {
    symptoms: [{
      type: String,
      default: ""
    }],

    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      default: null
    },

    specialtyName: {
      type: String,
      default: ""
    },

    doctorId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"DoctorProfile"
    },

    slotId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"TimeSlot"
    },

    availableSlots: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TimeSlot" 
    }],

    waitingSlotSelection: { 
      type: Boolean,
      default: false
    },

    waitingBooking: {
      type: Boolean,
      default: false
    },

    lastQuestion: {
      type: String,
      default: ""
    },

    lastIntent:{
      type:String,
      default:null
    },
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Conversation", conversationSchema);