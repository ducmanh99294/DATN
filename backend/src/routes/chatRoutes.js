const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatController");

const auth = require("../middlewares/authMiddleware");

router.post("/chat",auth, controller.chatConsult);

module.exports = router;
