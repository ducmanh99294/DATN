const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatController");
const multer = require("multer");

const auth = require("../middlewares/authMiddleware");
const upload = multer(); // lưu RAM

router.post("/chat",auth, controller.chatConsult);

router.get("/messages/:conversationId",auth, controller.getMessages);
router.get("/conversation",auth, controller.getConversations);
router.post("/conversation",auth, controller.createConversation);
router.post("/message",auth, controller.sendMessage);
router.delete("/conversation/:conversationId", auth, controller.deleteConversation);

module.exports = router;
