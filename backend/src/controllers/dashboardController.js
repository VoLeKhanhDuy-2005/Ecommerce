const User = require("../models/user");
const Order = require("../models/order");
const excel = require("exceljs");

const getDashboardStats = async (req, res) => {
  try {
    // If year is provided, we'll calculate up to the end of that year.
    // If it's a specific year filter, maybe we filter orders/users created up to that year.
    const queryYear = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();
    const currentYear = new Date().getFullYear();

    // Determine the start and end date for the filter (within the selected year)
    const startDate = new Date(queryYear, 0, 1, 0, 0, 0, 0);
    let endDate = new Date(queryYear, 11, 31, 23, 59, 59, 999);
    if (queryYear === currentYear) {
      endDate = new Date(); // Up to current time if current year
    }

    // "Tổng Người Dùng" is from beginning to present (all-time)
    const totalUsers = await User.countDocuments({
      role: "user",
      createdAt: { $lte: endDate },
    });

    // Other metrics are strictly within the selected year
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Total Revenue (sum of totalAmount for delivered orders in the year)
    const deliveredOrders = await Order.find({
      status: "Delivered",
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const totalRevenue = deliveredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const orderStatuses = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } },
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

    const recentOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
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
    const lastMonth =
      queryYear === currentYear ? new Date().getMonth() + 1 : 12;

    for (let month = 1; month <= lastMonth; month++) {
      const monthStr = `${month.toString().padStart(2, "0")}/${queryYear}`;

      const found = monthlyRevenueRaw.find(
        (m) => m._id.year === queryYear && m._id.month === month,
      );

      monthlyRevenue.push({
        name: monthStr,
        Revenue: found ? found.total : 0,
      });
    }

    return res.status(200).json({
      success: true,
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
      success: false,
      message: "Lỗi lấy dữ liệu thống kê",
      data: null,
    });
  }
};

const exportDashboardStats = async (req, res) => {
  try {
    const yearsParam = req.query.years;
    if (!yearsParam) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Vui lòng chọn ít nhất 1 năm để xuất báo cáo",
        });
    }

    const years = yearsParam
      .split(",")
      .map(Number)
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();

    const workbook = new excel.Workbook();
    workbook.creator = "FoodShop Admin";
    workbook.created = new Date();

    for (const year of years) {
      const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      let endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      if (year === currentYear) {
        endDate = new Date();
      }

      const totalOrders = await Order.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
      const deliveredOrders = await Order.find({
        status: "Delivered",
        createdAt: { $gte: startDate, $lte: endDate },
      });
      const totalRevenue = deliveredOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      const monthlyRevenueRaw = await Order.aggregate([
        {
          $match: {
            status: "Delivered",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            total: { $sum: "$totalAmount" },
          },
        },
      ]);

      const lastMonth = year === currentYear ? new Date().getMonth() + 1 : 12;
      const monthlyData = [];
      for (let month = 1; month <= lastMonth; month++) {
        const found = monthlyRevenueRaw.find((m) => m._id.month === month);
        monthlyData.push({
          month: `Tháng ${month}`,
          revenue: found ? found.total : 0,
        });
      }

      const sheet = workbook.addWorksheet(`Báo cáo ${year}`);

      // Formatting
      sheet.getColumn(1).width = 25;
      sheet.getColumn(2).width = 30;
      sheet.getColumn(3).width = 25;

      // Title row
      sheet.mergeCells("A1:C1");
      sheet.getCell("A1").value = `BÁO CÁO THỐNG KÊ DOANH THU NĂM ${year}`;
      sheet.getCell("A1").font = {
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      sheet.getCell("A1").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      sheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA580C" },
      };

      sheet.addRow([]);

      // Summary Stats
      sheet.addRow(["Tổng quan", "Tổng số đơn hàng", totalOrders]);
      sheet.addRow(["", "Tổng doanh thu", totalRevenue]);

      // Format currency for value column (C)
      sheet.getColumn(3).numFmt = "#,##0";

      sheet.addRow([]);

      // Monthly Breakdown
      sheet.addRow(["Doanh thu theo tháng", "Tháng", "Doanh thu"]);
      const headerRow = sheet.lastRow;
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };

      monthlyData.forEach((data) => {
        sheet.addRow(["", data.month, data.revenue]);
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Bao_Cao_Thong_Ke.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ success: false, message: "Lỗi xuất file Excel" });
  }
};

module.exports = {
  getDashboardStats,
  exportDashboardStats,
};
