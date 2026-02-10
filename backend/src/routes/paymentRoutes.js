const express = require("express");
const router = express.Router();
const paymentCtrl = require("../controllers/paymentController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

router.get("/me", auth, paymentCtrl.getMyPayments);
router.put("/:id/confirm", auth, admin, paymentCtrl.confirmPayment);

module.exports = router;
