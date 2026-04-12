const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatController");
const multer = require("multer");

const auth = require("../middlewares/authMiddleware");
const upload = multer(); // lưu RAM

// router.post("/ocr", upload.single("image"), controller.readPrescriptionFromImage)

// router.post("/ocr", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ text: "" });
//     }

//     // convert buffer → base64 chuẩn
//     const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

//     const text = await readPrescriptionFromImage(base64Image);

//     res.json({ text });

//   } catch (err) {
//     console.error("OCR API ERROR:", err);
//     res.status(500).json({ text: "" });
//   }
// });


router.post("/chat",auth, controller.chatConsult);

module.exports = router;
