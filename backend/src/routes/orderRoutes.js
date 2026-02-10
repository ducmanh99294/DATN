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

module.exports = router;
