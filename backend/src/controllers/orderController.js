const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");

/**
 * 🧾 CREATE ORDER FROM CART
 */
exports.createOrder = async (req, res) => {
  const { shippingAddress } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const cartItems = await CartItem.find({ cart: cart._id })
    .populate("product");

  if (cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // 1️⃣ Create order
  const order = await Order.create({
    user: req.user.id,
    shippingAddress
  });

  let totalPrice = 0;

  // 2️⃣ Create order items
  for (const item of cartItems) {
    const price = item.product.price || 0;
    totalPrice += price * item.quantity;

    await OrderItem.create({
      order: order._id,
      product: item.product._id,
      quantity: item.quantity,
      price,
      // note: item.note
    });
  }

  // 3️⃣ Update total
  order.totalPrice = totalPrice;
  await order.save();

  // 4️⃣ Clear cart
  await CartItem.deleteMany({ cart: cart._id });

  res.status(201).json(order);
};

/**
 * 📦 USER GET ORDERS
 */
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.json(orders);
};

/**
 * 🔍 ORDER DETAIL
 */
exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "email");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // user chỉ xem order của mình
  if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const items = await OrderItem.find({ order: order._id })
    .populate("product");

  res.json({
    order,
    items
  });
};

/**
 * 🛠 ADMIN UPDATE ORDER STATUS
 */
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(order);
};
