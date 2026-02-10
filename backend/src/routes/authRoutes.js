const express = require('express')
const router = express.Router()
const userCtrl = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

router.post("/guest", userCtrl.createGuest);
router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/refresh-token", userCtrl.refreshToken);
router.post("/logout", userCtrl.logout);
router.get("/me", auth, userCtrl.getMe);
//admin
router.post("/ban", auth, admin, userCtrl.banUser);
router.post("/unban", auth, admin, userCtrl.unbanUser);

module.exports = router
