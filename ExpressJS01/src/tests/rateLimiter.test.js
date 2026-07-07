const request = require("supertest");
const express = require("express");
const { apiLimiter, authLimiter } = require("../middleware/rateLimiter");

describe("Rate Limiter Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.set("trust proxy", 1); // Cần thiết để mock IP qua X-Forwarded-For

    // Dummy route cho API thông thường
    app.get("/api/test", apiLimiter, (req, res) => {
      res.status(200).json({ message: "Success" });
    });

    // Dummy route cho Auth
    app.post("/api/auth/login", authLimiter, (req, res) => {
      res.status(200).json({ message: "Logged in" });
    });
  });

  describe("API Limiter", () => {
    const testIp = "1.1.1.1";

    it("should allow requests under the limit (100 reqs/15p)", async () => {
      const res = await request(app)
        .get("/api/test")
        .set("X-Forwarded-For", testIp);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Success");
      // draft-7 uses combined RateLimit header
      expect(res.headers["ratelimit"]).toMatch(/limit=100/);
    });

    it("should block requests exceeding the limit of 100 reqs", async () => {
      const testIp2 = "1.1.1.2"; // Dùng IP khác để không bị ảnh hưởng bởi test trước
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app).get("/api/test").set("X-Forwarded-For", testIp2),
        );
      }

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Request thứ 101 phải bị block
      const blockedRes = await request(app)
        .get("/api/test")
        .set("X-Forwarded-For", testIp2);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.EC).toBe(429);
      expect(blockedRes.body.EM).toBe(
        "Too many requests from this IP, please try again after 15 minutes",
      );
    });
  });

  describe("Auth Limiter", () => {
    it("should allow requests under the limit (10 reqs/15p)", async () => {
      const testIp3 = "1.1.1.3";
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", testIp3);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged in");
      expect(res.headers["ratelimit"]).toMatch(/limit=10/);
    });

    it("should block requests exceeding the limit of 10 reqs", async () => {
      const testIp4 = "1.1.1.4";
      // Gửi 10 request hợp lệ
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .set("X-Forwarded-For", testIp4);
        expect(res.status).toBe(200);
      }

      // Request thứ 11 phải bị block
      const blockedRes = await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", testIp4);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.EC).toBe(429);
      expect(blockedRes.body.EM).toBe(
        "Too many authentication attempts from this IP, please try again after 15 minutes",
      );
    });
  });
});
