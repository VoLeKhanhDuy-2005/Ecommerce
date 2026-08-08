const User = require("../models/user");
const Order = require("../models/order");

const getDashboardStats = async (req, res) => {
  try {
    // If year is provided, we'll calculate up to the end of that year.
    // If it's a specific year filter, maybe we filter orders/users created up to that year.
    const queryYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Determine the start and end date for the filter (within the selected year)
    const startDate = new Date(queryYear, 0, 1, 0, 0, 0, 0);
    let endDate = new Date(queryYear, 11, 31, 23, 59, 59, 999);
    if (queryYear === currentYear) {
      endDate = new Date(); // Up to current time if current year
    }

    // "Tổng Người Dùng" is from beginning to present (all-time)
    const totalUsers = await User.countDocuments({ role: "user", createdAt: {$lte: endDate} });
    
    // Other metrics are strictly within the selected year
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

    // Total Revenue (sum of totalAmount for delivered orders in the year)
    const deliveredOrders = await Order.find({ status: "Delivered", createdAt: { $gte: startDate, $lte: endDate } });
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const orderStatuses = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const orderStatusData = orderStatuses.map((status) => ({
      name: status._id,
      value: status.count,
    }));

    const recentOrders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.product", "name")
      .select("customerName totalAmount status paymentMethod createdAt");

    const monthlyRevenueRaw = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format monthly revenue data to ensure all months up to the last month exist even if 0
    const monthlyRevenue = [];
    const lastMonth = queryYear === currentYear ? new Date().getMonth() + 1 : 12;

    for (let month = 1; month <= lastMonth; month++) {
      const monthStr = `${month.toString().padStart(2, '0')}/${queryYear}`;
      
      const found = monthlyRevenueRaw.find(
        (m) => m._id.year === queryYear && m._id.month === month
      );

      monthlyRevenue.push({
        name: monthStr,
        Revenue: found ? found.total : 0,
      });
    }

    return res.status(200).json({
      EC: 0,
      data: {
        summary: {
          totalUsers,
          totalOrders,
          totalRevenue,
        },
        orderStatusData,
        recentOrders,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Lỗi lấy dữ liệu thống kê",
      data: null,
    });
  }
};

module.exports = {
  getDashboardStats,
};
