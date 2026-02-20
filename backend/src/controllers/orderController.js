const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");

//create
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, note } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const cartItems = await CartItem.find({ cart: cart._id })
      .populate("product");
    console.log("Cart items:", cartItems);
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      shippingAddress,
      note
    });

    let totalPrice = 0;

    // Create order items
    for (const item of cartItems) {
      const price = item.product.price || 0;
      totalPrice += price * item.quantity;

      await OrderItem.create({
        order: order._id,
        product: item.product._id,
        quantity: item.quantity,
        price,
      });
    }

    // Update total
    order.totalPrice = totalPrice;
    await order.save();

    // Clear cart
    await CartItem.deleteMany({ cart: cart._id });

    res.status(201).json(order);
  } catch (error) {
      res.status(500).json({ message: "Lỗi server" });
    }
};

//get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map(order => order._id);

    const orderItems = await OrderItem.find({
      order: { $in: orderIds }
    }).populate("product");

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: orderItems.filter(
        item => item.order.toString() === order._id.toString()
      )
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Get orders failed" });
  }
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
