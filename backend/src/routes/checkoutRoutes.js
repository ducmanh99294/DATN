const express = require("express");
const router = express.Router();
const checkoutCtrl = require("../controllers/checkoutController");
const auth = require("../middlewares/authMiddleware");

router.post("/", auth, checkoutCtrl.checkout);

module.exports = router;
