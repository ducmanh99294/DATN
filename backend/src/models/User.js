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
    sparse: true 
  },
  image: {
    type: String,
    default: 'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?semt=ais_hybrid&w=740&q=80'
  },
  dateOfBirth: Date,
  password: {
    type: String,
    default: '$2b$10$B7YsNyJD5RNz9v/rZUSuO.ezgzYZRzvj/bDwY.EG.ejSrQlrdz2rm'
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
  
  bannedAt: Date,
  banReason: String,

  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
