const express = require("express");
const router = express.Router();
const cartCtrl = require("../controllers/cartController");
const auth = require("../middlewares/authMiddleware");

router.get("/", auth, cartCtrl.getCart);
router.post("/add", auth, cartCtrl.addToCart);
router.put("/item/:itemId", auth, cartCtrl.updateCartItem);
router.delete("/item/:itemId", auth, cartCtrl.removeCartItem);
router.delete("/clear", auth, cartCtrl.clearCart);

module.exports = router;
