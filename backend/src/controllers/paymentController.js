const Payment = require("../models/Payment");
const Order = require("../models/Order");
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
const AppoitmentController = require("./appointmentController");
const OrderController = require("./orderController");

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    sorted[key] = obj[key];
  });

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
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    const orderId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const expireDate = moment(date)
      .add(15, "minutes")
      .format("YYYYMMDDHHmmss");


    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",

      vnp_TxnRef: orderId,
      vnp_OrderInfo: "Thanh toan don hang",
      vnp_OrderType: "other",

      vnp_Amount: amount * 100,

      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: req.ip,

      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // lưu payment trước
    await Payment.create({
      orderId,
      type, // "APPOINTMENT" | "MEDICINE"
      user: req.user.id,
      amount,
      method: "vnpay",
      status: "PENDING",
      metadata
    });

console.log("===== CREATE PAYMENT DEBUG =====");

console.log("ENV:");
console.log("tmnCode:", process.env.VNP_TMN_CODE);
console.log("secretKey:", process.env.VNP_HASH_SECRET ? "OK" : "❌");

console.log("DATA:");
console.log("amount:", amount);
console.log("orderId:", orderId);

console.log("PARAMS RAW:", vnp_Params);

const sortedParams = sortObject(vnp_Params);
console.log("PARAMS SORTED:", sortedParams);

const signData = qs.stringify(sortedParams, { encode: true });
console.log("SIGN DATA:", signData);

const signed = crypto
  .createHmac("sha512", process.env.VNP_HASH_SECRET)
  .update(signData)
  .digest("hex");

console.log("HASH CREATED:", signed);

console.log("FINAL URL:",
  process.env.VNP_URL + "?" + qs.stringify({
    ...sortedParams,
    vnp_SecureHash: signed
  }, { encode: true })
);

console.log("===== END CREATE DEBUG =====");

    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl =
      vnpUrl + "?" + qs.stringify(vnp_Params, { encode: true });

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

    console.log("===== VNPAY RETURN DEBUG =====");

// copy raw để so sánh
const rawParams = { ...req.query };
console.log("RAW PARAMS FROM VNPAY:", rawParams);

const secureHash = rawParams["vnp_SecureHash"];
console.log("SECURE HASH FROM VNPAY:", secureHash);

// remove để ký lại
delete rawParams["vnp_SecureHash"];

const sortedParams = sortObject(rawParams);

console.log("PARAMS AFTER REMOVE HASH:", sortedParams);

const signData = qs.stringify(sortedParams, { encode: true });
console.log("SIGN DATA (REBUILD):", signData);

const signed = crypto
  .createHmac("sha512", process.env.VNP_HASH_SECRET)
  .update(signData)
  .digest("hex");

console.log("HASH SERVER:", signed);

// 🔥 KẾT QUẢ
console.log("MATCH:", secureHash === signed ? "✅ TRUE" : "❌ FALSE");

console.log("RESPONSE CODE:", sortedParams["vnp_ResponseCode"]);

console.log("===== END RETURN DEBUG =====");

    if (secureHash !== signed) {
      await session.abortTransaction();
      return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
    }

    const orderId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];

    const payment = await Payment.findOne({ orderId }).session(session);

    if (!payment) {
      await session.abortTransaction();
      return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
    }

    if (payment.status === "SUCCESS") {
      await session.commitTransaction();
      return res.redirect("https://datn-z8rb.vercel.app/payment-success");
    }

    // FAIL
    if (responseCode !== "00") {
      payment.status = "FAILED";
      await payment.save({ session });

      if (payment.type === "APPOINTMENT") {
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
    if (payment.type === "APPOINTMENT") {
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
    if (payment.type === "MEDICINE") {
      const existed = await Order.findOne({
        paymentId: payment._id,
      }).session(session);

      if (!existed) {
        const { shippingAddress, note, items } = payment.metadata;

        const order = await Order.create([{
          user: payment.user,
          shippingAddress,
          note,
          paymentMethod: "vnpay",
          paymentStatus: "paid",
          totalPrice: payment.amount,
          paymentId: payment._id,
        }], { session });

        for (const item of items) {
          await OrderItem.create([{
            order: order[0]._id,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          }], { session });
        }

        const cart = await Cart.findOne({ user: payment.user }).session(session);
        if (cart) {
          await CartItem.deleteMany({ cart: cart._id }).session(session);
        }
      }
    }

    await session.commitTransaction();

    console.log("Thanh toán thành công:", orderId);

    return res.redirect("https://datn-z8rb.vercel.app/payment-success");

  } catch (err) {
    await session.abortTransaction();
    console.error("VNPay return error:", err);
    return res.redirect("https://datn-z8rb.vercel.app/payment-fail");
  } finally {
    session.endSession();
  }
};