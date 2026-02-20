const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");

/**
 * 🛒 GET USER CART
 */
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id });
  }

  const items = await CartItem.find({ cart: cart._id })
     .populate({
    path: "product",
    populate: {
      path: "category",
      select: "name _id"
    }});

    res.json({
    cartId: cart._id,
    items
  });
};

/**
 * ➕ ADD ITEM TO CART
 */
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id });
  }

  // check item trùng product + option
  const existedItem = await CartItem.findOne({
    cart: cart._id,
    product: productId,
    // color,
    // material
  });

  if (existedItem) {
    existedItem.quantity += quantity;
    await existedItem.save();
    return res.json(existedItem);
  }

  const newItem = await CartItem.create({
    cart: cart._id,
    product: productId,
    quantity,
  });

  res.status(201).json(newItem);
  
};

/**
 * 🔄 UPDATE CART ITEM
 */
exports.updateCartItem = async (req, res) => {
  const { quantity, color, material, note } = req.body;
  const { itemId } = req.params;

  const item = await CartItem.findById(itemId);

  if (!item) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  // bảo mật: item thuộc cart của user
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || item.cart.toString() !== cart._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (quantity !== undefined) item.quantity = quantity;
  // if (color !== undefined) item.color = color;
  // if (material !== undefined) item.material = material;
  // if (note !== undefined) item.note = note;

  await item.save();
  res.json(item);
};

/**
 * ❌ REMOVE ITEM
 */
exports.removeCartItem = async (req, res) => {
  const { itemId } = req.params;

  const item = await CartItem.findById(itemId);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || item.cart.toString() !== cart._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await item.deleteOne();
  res.json({ message: "Item removed" });
};

/**
 * 🧹 CLEAR CART
 */
exports.clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.json({ message: "Cart already empty" });
  }

  await CartItem.deleteMany({ cart: cart._id });
  res.json({ message: "Cart cleared" });
};
