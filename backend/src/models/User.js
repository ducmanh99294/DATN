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
    unique: true,
  },
  image: {
    type: String,
    default: 'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?semt=ais_hybrid&w=740&q=80'
  },
  password: {
    type: String,
  },
  andress:{
    type: String,
  },
  gender:{
    type: String,
    default: "male"
  },
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
  image: String,
  
  bannedAt: Date,
  banReason: String
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
