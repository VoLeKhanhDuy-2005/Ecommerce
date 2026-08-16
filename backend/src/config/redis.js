const { createClient } = require("redis");

const redisClient = createClient({
  // Tạo client nhưng chưa connect
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message); // Không throw error để tránh crash app. App sẽ fallback xuống Database.
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

// Start connecting immediately so that rate limiter commands can be queued
if (process.env.NODE_ENV !== "test") {
  redisClient.connect().catch((error) => {
    console.error(
      "Can not connect to Redis at startup. The system will continue to run using MongoDB.",
      error.message,
    );
  });
}

module.exports = {
  redisClient,
};
