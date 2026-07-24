const { createClient } = require("redis");

const redisClient = createClient({
  // Tạo client nhưng chưa connect
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Lỗi Redis Client:", err.message); // Không throw error để tránh crash app. App sẽ fallback xuống Database.
});

redisClient.on("connect", () => {
  console.log("Đã kết nối thành công tới Redis!");
});

redisClient.on("reconnecting", () => {
  console.log("Đang thử kết nối lại với Redis...");
});

// Start connecting immediately so that rate limiter commands can be queued
if (process.env.NODE_ENV !== "test") {
  redisClient.connect().catch((error) => {
    console.error("Không thể kết nối đến Redis lúc khởi động. Hệ thống sẽ tiếp tục chạy bằng MongoDB.", error.message);
  });
}

module.exports = {
  redisClient,
};
