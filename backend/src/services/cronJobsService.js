const logger = require("../utils/logger");
const cron = require("node-cron");
const Order = require("../models/order");
const { redisClient } = require("../config/redis");

const initCronJobs = (app) => {
  // Chạy mỗi phút (every minute)
  cron.schedule("* * * * *", async () => {
    try {
      // 1. Thử xin quyền Redis Lock (Distributed Lock)
      // SET key value NX (chỉ set nếu chưa tồn tại) EX 50 (hết hạn sau 50 giây)
      // Nếu có nhiều instance đang chạy cùng lúc, chỉ instance đầu tiên gửi lệnh này tới Redis mới nhận kết quả thành công (lockAcquired = true/OK)
      const lockAcquired = await redisClient.set(
        "lock:auto-confirm-order",
        "locked",
        { NX: true, EX: 50 },
      );

      // Nếu không xin được lock (server khác đã xin chạy trước trong phút này), thì return ngay lập tức
      if (!lockAcquired) {
        return;
      }

      // 2. Đã giữ lock, tiến hành logic update DB
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const ordersToUpdate = await Order.find({
        status: "New",
        createdAt: { $lte: thirtyMinutesAgo },
      });

      if (ordersToUpdate.length > 0) {
        const result = await Order.updateMany(
          { status: "New", createdAt: { $lte: thirtyMinutesAgo } },
          { $set: { status: "Confirmed" } },
        );

        logger.info(
          `[Auto-Confirm Background Job] Đã tự động xác nhận ${result.modifiedCount} đơn hàng.`,
        );

        const io = app.get("io");
        if (io) {
          ordersToUpdate.forEach((order) => {
            // Notify user
            io.to(`user_${order.userEmail}`).emit("ORDER_STATUS_UPDATED", {
              orderId: order._id,
              status: "Confirmed",
              message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã được tự động xác nhận.`,
            });
          });
          // Notify admin
          io.to("admin_room").emit("ADMIN_REFRESH_ORDERS");
        }
      }
    } catch (err) {
      logger.error("Lỗi trong tiến trình quét tự động xác nhận đơn hàng:", err);
    }
  });

  logger.info("Cron jobs initialized.");
};

module.exports = {
  initCronJobs,
};
