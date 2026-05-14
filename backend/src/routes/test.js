const express = require("express");
const router = express.Router();

const { sendNotification } = require("../sockets/index");

router.get("/test-notify/:userId", (req, res) => {
  const { userId } = req.params;

  sendNotification(userId, {
    type: "system",
    message: "Thông báo test realtime"
  });

  res.json({
    success: true
  });
});

module.exports = router;