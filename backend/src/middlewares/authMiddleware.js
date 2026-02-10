const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.isBanned) {
      return res.status(403).json({
        message: "User is banned",
        reason: user.banReason
      });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
