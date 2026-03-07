const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload");

// Public
router.get("/", productCtrl.getProducts);
router.get("/:id", productCtrl.getProductById);

// Admin
router.post("/create", auth, admin, upload.array("images", 5), productCtrl.createProduct);
router.post("/import", auth, admin, productCtrl.importProducts);

router.put("/:id",  auth, admin, upload.array("images", 5), productCtrl.updateProduct);
router.put("/:id/status",  auth, admin, productCtrl.updateStatus);
router.delete("/:id", auth, admin, productCtrl.deleteProduct);

module.exports = router;