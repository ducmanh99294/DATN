const express = require('express')
const router = express.Router()
const userCtrl = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload");
const passport = require("../controllers/passport");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

// Redirect sang Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback từ Google
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("http://localhost:5173");
  }
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    const accessToken = generateAccessToken(req.user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("http://localhost:5173");
  }
);

router.post("/", userCtrl.createGuest);
router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/refresh-token", userCtrl.refreshToken);
router.post("/logout", userCtrl.logout);
router.get("/me", auth, userCtrl.getMe);
router.put("/avatar", auth, upload.single("image"), userCtrl.updateAvatar);
router.put("/profile", auth, userCtrl.updateProfile);
router.put("/change-password", auth, userCtrl.changePassword);
router.delete("/users/:id", auth, admin, userCtrl.deleteUser);
//admin
router.put("/:id/ban", auth, admin, userCtrl.banUser);
router.put("/:id/unban", auth, admin, userCtrl.unbanUser);
router.get("/", auth, admin, userCtrl.getAllUsers);

module.exports = router
