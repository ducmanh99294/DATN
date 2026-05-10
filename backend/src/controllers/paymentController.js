const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const User = require("../models/User");
const Product = require("../models/Product");
const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");
const Doctor = require("../models/Doctor");

const AppoitmentController = require("./appointmentController");
const OrderController = require("./orderController");

const mongoose = require("mongoose");

const qs = require("qs");
const crypto = require("crypto");
const moment = require('moment-timezone');


function sortObject(obj) {
  let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// USER GET PAYMENTS
exports.getMyPayments = async (req, res) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate("order")
    .sort({ createdAt: -1 });

  res.json(payments);
};

exports.createPaymentUrl = async (req, res) => {
  try {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const { amount, type, metadata } = req.body;

    const date = new Date();

    const createDate = moment(date).tz("Asia/Ho_Chi_Minh").format("YYYYMMDDHHmmss");
    const expireDate = moment(date).tz("Asia/Ho_Chi_Minh").add(15, "minutes").format("YYYYMMDDHHmmss");

    const orderId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    let ipAddr = 
      req.headers['x-forwarded-for'] || 
      req.connection?.remoteAddress || 
      req.socket?.remoteAddress || 
      req.ip;

    if (typeof ipAddr === 'string' && ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }

    if (!ipAddr || ipAddr === '::1' || ipAddr === '127.0.0.1' || ipAddr.startsWith('10.') || ipAddr.startsWith('192.168.')) {
      ipAddr = '113.160.225.97'; 
    }
    
    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",

      vnp_TxnRef: orderId,
      vnp_OrderInfo: "Thanh_toan_don_hang",
      vnp_OrderType: "other",

      vnp_Amount: amount * 100,

      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,

      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // lưu payment trước
    await Payment.create({
      orderId,
      type, 
      user: req.user.id,
      amount,
      method: "vnpay",
      status: "PENDING",
      metadata
    });
const sortedParams = sortObject(vnp_Params);

const signData = qs.stringify(sortedParams, { encode: false });

const signed = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(signData)
      .digest("hex");

    const secureSortedParams = sortObject(vnp_Params);

    const queryString = qs.stringify(secureSortedParams, { encode: false });

    const paymentUrl = vnpUrl + "?" + queryString + "&vnp_SecureHash=" + signed;
    return res.json({ paymentUrl });

  } catch (err) {
    console.error("Create payment error:", err);
    return res.status(500).json({ message: "Payment error" });
  }
};

exports.vnpayReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let vnp_Params = req.query;

    const rawParams = { ...req.query };

    const secureHash = rawParams["vnp_SecureHash"];

    delete rawParams["vnp_SecureHash"];
    delete rawParams["vnp_SecureHashType"];

    const sortedParams = sortObject(rawParams);


    const signData = qs.stringify(sortedParams, { encode: false });

    const signed = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(signData)
      .digest("hex");
        if (secureHash !== signed) {
          await session.abortTransaction();
          return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
    }

    const orderId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const payment = await Payment.findOne({ orderId }).session(session);
    console.log("🛑 [DEBUG 1] Tìm Payment với orderId:", orderId);

    if (!payment) {
      await session.abortTransaction();
      return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
    }

    if (payment.status === "SUCCESS") {
      await session.commitTransaction();
      let realMongoId = orderId;
      if (payment.type === "medicine") {
          const savedOrder = await Order.findOne({ paymentId: payment._id });
          if (savedOrder) realMongoId = savedOrder._id.toString();
      }
      return res.redirect(`https://datn-z8rb.vercel.app/checkout/success/${realMongoId}`);
    }

    // FAIL
    if (responseCode !== "00") {
      payment.status = "FAILED";
      await payment.save({ session });

      if (payment.type === "appointment") {
        await releaseSlot(payment.metadata.slotId);
      }

      await session.commitTransaction();
      return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
    }

    // SUCCESS
    payment.status = "SUCCESS";
    payment.transactionId = vnp_Params["vnp_TransactionNo"];
    await payment.save({ session });

    // APPOINTMENT
    if (payment.type === "appointment") {
      const existed = await Appointment.findOne({
        paymentId: payment._id,
      }).session(session);

      if (!existed) {
        const {
          doctorId,
          patientId,
          slotId,
          symptoms,
          description,
          price,
          specialtyId
        } = payment.metadata;

        // lock + update slot
        const slot = await TimeSlot.findOneAndUpdate(
          {
            _id: slotId,
            status: "pending",
            lockedBy: payment.user
          },
          {
            status: "booked"
          },
          { new: true, session }
        );

        if (!slot) {
          throw new Error("Slot đã bị người khác đặt");
        }

        const appointment = await Appointment.create([{
          doctorId,
          patientId,
          specialtyId,
          slotId,
          symptoms,
          description,
          price,
          paymentId: payment._id,
          status: "confirmed"
        }], { session });

        await TimeSlot.findByIdAndUpdate(
          slotId,
          { appointmentId: appointment[0]._id },
          { session }
        );
      }
    }
    // MEDICINE
if (payment.type === "medicine") {
  try {
    const existed = await Order.findOne({
      paymentId: payment._id,
    }).session(session);

    if (!existed) {

      // Lấy lại cart giống createOrder
      const cart = await Cart.findOne({ user: payment.user }).session(session);
      if (!cart) throw new Error("Cart is empty");

      const cartItems = await CartItem.find({ cart: cart._id })
        .populate("product")
        .session(session);

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      // Tạo order
      const order = await Order.create([{
        user: payment.user,
        shippingAddress: payment.metadata?.shippingAddress,
        note: payment.metadata?.note,
        paymentMethod: "vnpay",
        paymentStatus: "paid",
        totalPrice: payment.amount,
        paymentId: payment._id,
      }], { session });
      console.log(JSON.stringify(order[0], null, 2));
      // Tạo order items giống createOrder
      for (const item of cartItems) {
        const price = item.product.price || 0;

        await OrderItem.create([{
          order: order[0]._id,
          product: item.product._id,
          quantity: item.quantity,
          price,
        }], { session });
      }

      // Clear cart
      await CartItem.deleteMany({ cart: cart._id }).session(session);
    }
  } catch (e) {
    console.log("lỗi khi tạo đơn hàng", e);
  }
}

    await session.commitTransaction();
    console.log("Thanh toán thành công:", orderId);

    let realMongoId = orderId;

    const savedOrder = await Order.findOne({ paymentId: payment._id });
    if (savedOrder) {     
      realMongoId = savedOrder._id.toString();  
    }

    return res.redirect(`https://datn-z8rb.vercel.app/checkout/success/${realMongoId}`);

  } catch (err) {
    await session.abortTransaction();
    console.error("VNPay return error:", err.message, err.stack);
    return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
  } finally {
    session.endSession();
  }
};