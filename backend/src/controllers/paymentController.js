const Payment = require("../models/Payment");
const Order = require("../models/Order");

/**
 * 💰 USER GET PAYMENTS
 */
exports.getMyPayments = async (req, res) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate("order")
    .sort({ createdAt: -1 });

  res.json(payments);
};

exports.confirmPayment = async (req, res) => {
  const { transactionId } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  payment.status = "paid";
  payment.transactionId = transactionId;
  await payment.save();

  // Update order status
  await Order.findByIdAndUpdate(payment.order, {
    status: "confirmed",
    paymentStatus: "paid"
  });

  res.json({
    message: "Payment confirmed",
    payment
  });
};
