const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  fullName: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  andress:{
    type: String,
  },
  gender:String,
  role: {
    type: String,
    enum: ["patient", "doctor", 'admin'],
    default: 'patient'
  },
  refreshToken: {
    type: String
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: Date,
  banReason: String
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
