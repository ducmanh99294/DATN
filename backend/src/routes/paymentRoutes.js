const express = require("express");
const router = express.Router();
const paymentCtrl = require("../controllers/paymentController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

router.get("/me", auth, paymentCtrl.getMyPayments);
router.get("/vnpay_return", auth, paymentCtrl.vnpayReturn);
router.post("/create-payment", auth, paymentCtrl.createPaymentUrl);

module.exports = router;
