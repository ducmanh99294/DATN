const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const User = require("../models/User");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const { sendNotification } = require("../sockets");

//create
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, note, paymentMethod = "cod" } = req.body;

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
      note,
      paymentMethod,
      paymentStatus: "pending"
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

    // Create payment record (để theo dõi thanh toán, đặc biệt cho bank)
    await Payment.create({
      order: order._id,
      user: req.user.id,
      amount: totalPrice,
      method: paymentMethod,
      status: "pending"
    });

    // Clear cart
    await CartItem.deleteMany({ cart: cart._id });

        // thong bao user
    sendNotification(order.user, {
      type: "order_created",
      message: `Đơn hàng của bạn đã được tạo thành công.`,
    });

    res.status(201).json(order);
  } catch (error) {
      console.error("CREATE ORDER ERROR:", error);
      res.status(500).json({ message: error.message });
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

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, date } = req.query;

    const query = {};

    //Lọc theo trạng thái
    if (status && status !== "all") {
      query.status = status;
    }

    if (date && date !== "all") {
      let startDate;
      const now = new Date();

      if (date === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      if (date === "7days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
      }

      if (date === "30days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
      }

      if (date === "thisMonth") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };  // 🔥 đúng phải là createdAt
      }
    }

    // tìm theo mã đơn hoặc tên người dùng
    if (search && search.trim() !== "") {

      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const userIds = users.map(user => user._id);

        query.$or = [
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: search,
              options: "i"
            }
          }
        },

        { user: { $in: userIds } }
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//get my orders details
exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "email fullName phone");

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

//update
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    order.status = status;

    if (status === "confirmed" && !order.dateConfirmed) {
      order.dateConfirmed = new Date();
    }

    await order.save();

    res.json(order);

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//cancel order
exports.cancelOrder = async (req, res) => {
  const { reason } = req.body; 
  
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "cancelled", reason },
    { new: true }
  );
  res.json(order);
};

// cập nhật trạng thái thanh toán (admin xác nhận đã nhận tiền)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === "paid" && order.status === "pending") {
      order.status = "confirmed";
      if (!order.dateConfirmed) {
        order.dateConfirmed = new Date();
      }
    }

    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// import orders from Excel (admin)
exports.importOrders = async (req, res) => {
  try {
    const { orders: ordersPayload } = req.body;
    if (!Array.isArray(ordersPayload) || ordersPayload.length === 0) {
      return res.status(400).json({ message: "Dữ liệu đơn hàng không hợp lệ" });
    }
    const created = [];
    for (const row of ordersPayload) {
      const { userEmail, shippingAddress, note, items } = row;
          if (!userEmail || !shippingAddress?.fullName || !shippingAddress?.phone || !Array.isArray(items) || items.length === 0) {
            continue;
          }
      const user = await User.findOne({ email: userEmail.trim() });
      if (!user) continue;
      const order = await Order.create({
        user: user._id,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          address: shippingAddress.address || "",
          ward: shippingAddress.ward || "",
          district: shippingAddress.district || "",
        },
        note: note || "",
      });
      let totalPrice = 0;
      for (const it of items) {
        const product = await Product.findById(it.productId);
        if (!product) continue;
        const price = product.price || 0;
        const qty = Math.max(1, Number(it.quantity) || 1);
        totalPrice += price * qty;
        await OrderItem.create({
          order: order._id,
          product: product._id,
          quantity: qty,
          price,
        });
      }
      order.totalPrice = totalPrice;
      await order.save();
      created.push(order._id);
    }
    res.status(201).json({ message: `Đã tạo ${created.length} đơn hàng`, count: created.length, ids: created });
  } catch (err) {
    console.error("Import orders error:", err);
    res.status(500).json({ message: err.message || "Lỗi nhập đơn hàng" });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth
          },
          status: { $in: ["completed"] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalRevenue: stats[0]?.totalRevenue || 0,
      totalOrders: stats[0]?.totalOrders || 0
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};