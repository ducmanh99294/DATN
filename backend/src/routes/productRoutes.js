const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

// Public
router.get("/", productCtrl.getProducts);
router.get("/:id", productCtrl.getProductById);

// Admin
router.post("/", auth, admin, productCtrl.createProduct);
router.put("/:id", auth, admin, productCtrl.updateProduct);
router.delete("/:id", auth, admin, productCtrl.deleteProduct);

module.exports = router;
