const Order = require("../models/Order");
const User = require("../models/User");

exports.getReport = async (req, res) => {
  try {
    const { type, date, month, year, startDate, endDate } = req.query;

    let start, end;

    const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));

    // Xử lý time range
    if (type === "today") {
      start = startOfDay(new Date());
      end = endOfDay(new Date());
    } 
    else if (type === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      start = startOfDay(d);
      end = endOfDay(d);
    } 
    else if (type === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      start = startOfDay(d);
      end = endOfDay(d);
    } 
    else if (type === "date" && date) {
      const d = new Date(date);
      start = startOfDay(d);
      end = endOfDay(d);
    } 
    else if (type === "month" && month && year) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    } 
    else if (type === "year" && year) {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
    } 
    else if (type === "range" && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } 
    else {
      return res.status(400).json({ message: "Invalid filter type" });
    }

    // Order report
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    });

    const totalOrders = orders.length;

    const completedOrders = orders.filter(
      (o) => o.status === "completed"
    );

    const processingOrders = orders.filter(
      (o) => o.status !== "completed"
    );

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0
    );

    // User report
    const totalUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    res.json({
      filter: {
        start,
        end,
      },
      stats: {
        totalOrders,
        totalRevenue, // doanh thu từ đơn completed
        totalUsers,
        processingOrders: processingOrders.length,
        completedOrders: completedOrders.length,
      },
    });

  } catch (error) {
    console.error("REPORT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};