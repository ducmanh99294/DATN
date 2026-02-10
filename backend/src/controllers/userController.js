const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/jwt");

exports.createGuest = async (req, res) => {
  const guest = await User.create({ role: "guest" });

  const accessToken = generateAccessToken(guest);
  const refreshToken = generateRefreshToken(guest);

  guest.refreshToken = refreshToken;
  await guest.save();

  res.cookie("accessToken", accessToken, { httpOnly: true });
  res.cookie("refreshToken", refreshToken, { httpOnly: true });

  res.json({
    message: "Guest created",
    userId: guest._id
  });
};

exports.register = async (req, res) => {
  const { fullName, email, password, phone, andress, dateOfBirth, gender } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    phone, 
    andress, 
    dateOfBirth,
    gender,
    password: hashed,
    role: "patient"
  });

  res.json({ message: "Register success" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid email" });
  
  if (user.isBanned) {
    return res.status(403).json({
      message: "Your account has been banned",
      reason: user.banReason
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, { httpOnly: true ,sameSite: 'lax'});
  res.cookie("refreshToken", refreshToken, { httpOnly: true ,sameSite: 'lax'});

  res.json({
    message: "Login success",
    role: user.role
  });
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  const user = await User.findOne({ refreshToken });
  if (!user) return res.sendStatus(403);

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    (err) => {
      if (err) return res.sendStatus(403);

      const newAccessToken = generateAccessToken(user);

      res.cookie("accessToken", newAccessToken, { httpOnly: true });
      res.json({ message: "Token refreshed" });
    }
  );
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await User.updateOne(
      { refreshToken },
      { $set: { refreshToken: null } }
    );
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

exports.banUser = async (req, res) => {
  const { userId, reason } = req.body;

  await User.findByIdAndUpdate(userId, {
    isBanned: true,
    bannedAt: new Date(),
    banReason: reason || "Vi phạm điều khoản"
  });

  res.json({ message: "User banned" });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isBanned) {
    return res.status(403).json({
      message: "User is banned",
      reason: user.banReason
    });
  }

  res.json(user);
};

exports.unbanUser = async (req, res) => {
  const { userId } = req.body;

  await User.findByIdAndUpdate(userId, {
    isBanned: false,
    bannedAt: null,
    banReason: null,
    refreshToken: null // buộc login lại
  });

  res.json({ message: "User unbanned" });
};