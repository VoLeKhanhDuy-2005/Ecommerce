const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("../config/redis");

// Custom Redis store wrapper to handle connection errors
const createRedisStore = () => {
  if (process.env.NODE_ENV === "test") {
    return undefined; // Use default MemoryStore in test environment
  }
  return new RedisStore({
    // rate-limit-redis v4 expects sendCommand
    sendCommand: (...args) => redisClient.sendCommand(args),
  });
};

// General limiter for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createRedisStore(),
  message: {
    EC: 429,
    EM: "Too many requests from this IP, please try again after 15 minutes",
    DT: null,
  },
});

// Strict limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per `window` for auth routes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: createRedisStore(),
  message: {
    EC: 429,
    EM: "Too many authentication attempts from this IP, please try again after 15 minutes",
    DT: null,
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
