const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Payment = require("../models/Payment");

/**
 * 🧾 CHECKOUT (CREATE ORDER + PAYMENT)
 */
exports.checkout = async (req, res) => {
  const { shippingAddress, paymentMethod, depositPercent = 30 } = req.body;

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
    shippingAddress,
    status: "pending"
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
      color: item.color,
      material: item.material,
      note: item.note
    });
  }

  order.totalPrice = totalPrice;
  await order.save();

  // 3️⃣ Create payment (deposit)
  const amount = Math.round(totalPrice * depositPercent / 100);

  const payment = await Payment.create({
    order: order._id,
    user: req.user.id,
    amount,
    method: paymentMethod || "bank"
  });

  // 4️⃣ Clear cart
  await CartItem.deleteMany({ cart: cart._id });

  res.status(201).json({
    message: "Checkout success",
    order,
    payment
  });
};
