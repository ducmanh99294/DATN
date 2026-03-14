const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/orderController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

router.post("/", auth, orderCtrl.createOrder);
router.get("/me", auth, orderCtrl.getMyOrders);
router.get("/:id", auth, orderCtrl.getOrderDetail);

// admin
router.put("/:id/status", auth, admin, orderCtrl.updateOrderStatus);
router.put("/:id/cancel", auth, admin, orderCtrl.cancelOrder);
router.put("/:id/payment-status", auth, admin, orderCtrl.updatePaymentStatus);
router.get("/", auth, admin, orderCtrl.getAllOrders);
router.post("/import", auth, admin, orderCtrl.importOrders);
router.get("/stats/month", orderCtrl.getMonthlyStats);

module.exports = router;
