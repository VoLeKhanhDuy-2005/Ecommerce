const logger = require("../utils/logger");
const { createClient } = require("redis");

const redisClient = createClient({
  // Tạo client nhưng chưa connect
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err.message); // Không throw error để tránh crash app. App sẽ fallback xuống Database.
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

redisClient.on("reconnecting", () => {
  logger.info("Redis reconnecting...");
});

// Start connecting immediately so that rate limiter commands can be queued
if (process.env.NODE_ENV !== "test") {
  redisClient.connect().catch((error) => {
    logger.error(
      "Can not connect to Redis at startup. The system will continue to run using MongoDB.",
      error.message,
    );
  });
}

module.exports = {
  redisClient,
};
