const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DoctorProfile = require("../models/Doctor");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/jwt");
const mongoose = require("mongoose");

exports.createGuest = async (req, res) => {
  const user = req.body;
  const guest = await User.create(user);
  console.log("Guest created:", guest);
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
    return res.json({
      isBanned: user.isBanned,
      message: "Your account has been banned",
      reason: user.banReason
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  }); 

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

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      });
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

exports.updateProfile = async (req, res) => {
  const { fullName, phone, email, gender } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { fullName, phone, email, gender },
    { new: true }
  );

  res.json(user);
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Không có file upload",
      });
    }

    const user = await User.findById(req.user.id);

    user.image = req.file.path; 

    await user.save();

    res.json({
      success: true,
      user,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu cũ" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Không cho admin tự ban chính mình
    if (req.user.id === id) {
      return res.status(400).json({ message: "Không thể tự ban chính mình" });
    }

    user.isBanned = true;
    user.bannedAt = new Date();
    user.banReason = reason || "Vi phạm điều khoản";
    user.refreshToken = null; // ép logout
    await user.save();

    res.json({ message: "User đã bị ban thành công" });

  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    user.isBanned = false;
    user.bannedAt = null;
    user.banReason = null;
    await user.save();

    res.json({ message: "User đã được gỡ ban" });

  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
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

exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      specialty
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (specialty && specialty !== "all") {
      if (!mongoose.Types.ObjectId.isValid(specialty)) {
        return res.status(400).json({ message: "Invalid specialty id" });
      }

      const doctors = await DoctorProfile.find({
        specialtyId: new mongoose.Types.ObjectId(specialty) // ✅ đúng field
      }).select("userId");

      const userIds = doctors.map(d => d.userId).filter(Boolean);

      query._id = userIds.length > 0 ? { $in: userIds } : null;
    }

    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Không cho admin tự xoá chính mình
    if (req.user.id === id) {
      return res.status(400).json({ message: "Không thể xoá chính mình" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "Xoá người dùng thành công" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.updateUser = async (req, res) => {
  console.log(req.file);
  try {
    const { userId } = req.params;
    const { fullName, phone, email, role, gender } = req.body;

    let updateData = {
      fullName,
      phone,
      email,
      role,
      gender,
    };

    if (req.file) {
      updateData.image = req.file.path; 
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.importUsers = async (req, res) => {
  try {
    const { users: usersPayload } = req.body;

    // 🔥 validate giống product
    if (!Array.isArray(usersPayload) || usersPayload.length === 0) {
      return res.status(400).json({ message: "Dữ liệu user không hợp lệ" });
    }

    const created = [];

    for (const row of usersPayload) {
      const { email, fullName, password, role } = row;

      // ❌ thiếu field → bỏ qua (không throw)
      if (!email || !password) continue;

      // 🔥 check email đã tồn tại chưa
      const existed = await User.findOne({ email });
      if (existed) continue;

      // 🔥 hash password
      const hashedPassword = await bcrypt.hash(String(password), 10);

      const user = await User.create({
        email: String(email).trim(),
        fullName: fullName ? String(fullName).trim() : "",
        password: hashedPassword,
        role: role ? String(role).trim() : "user"
      });

      created.push(user._id);
    }

    res.status(201).json({
      message: `Đã thêm ${created.length} user`,
      count: created.length,
      ids: created
    });

  } catch (error) {
    console.error("Import users error:", error);
    res.status(500).json({
      message: error.message || "Lỗi nhập user"
    });
  }
};