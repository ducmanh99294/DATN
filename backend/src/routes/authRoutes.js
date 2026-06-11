const express = require('express')
const router = express.Router()
const userCtrl = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload");
const passport = require("../controllers/passport");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

function requireGoogleOAuth(req, res, next) {
  if (!passport.isGoogleOAuthConfigured) {
    return res.status(503).json({
      message:
        "Google OAuth chưa cấu hình. Thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env.",
    });
  }
  next();
}

// Redirect sang Google
router.get(
  "/google",
  requireGoogleOAuth,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback từ Google
router.get(
  "/google/callback",
  requireGoogleOAuth,
  (req, res, next) => {
    // Nếu Google báo về là user đã bấm "Hủy" (Cancel)
    if (req.query.error === "access_denied") {
      return res.redirect(`https://datn-z8rb.vercel.app/login?status=cancelled`);
    }
    next(); 
  },

  passport.authenticate("google", { 
    session: false,
    failureRedirect: "https://datn-z8rb.vercel.app/login?status=failed" 
  }),

  (req, res) => {
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("https://datn-z8rb.vercel.app");
  }
);

router.post("/", userCtrl.createGuest);
router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/verify", userCtrl.verifyEmail);
router.post("/refresh-token", userCtrl.refreshToken);
router.post("/logout", userCtrl.logout);
router.get("/me", auth, userCtrl.getMe);
router.put("/avatar", auth, upload.single("image"), userCtrl.updateAvatar);
router.put("/profile", auth, userCtrl.updateProfile);
router.put("/change-password", auth, userCtrl.changePassword);
router.delete("/users/:id", auth, admin, userCtrl.deleteUser);
//admin
router.put("/:id/ban", auth, admin, userCtrl.banUser);
router.put("/:id/unban", auth, admin,  userCtrl.unbanUser);
router.put("/update/:userId", auth, admin, upload.single("image"), userCtrl.updateUser);
router.get("/", auth, admin, userCtrl.getAllUsers);
router.post("/import", auth, admin, userCtrl.importUsers);


module.exports = router
