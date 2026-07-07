# Implement Production-Ready Rate Limiting

This plan introduces production-ready rate limiting to Express application. It utilizes `express-rate-limit` backed by `rate-limit-redis` to share limits across multiple application instances, which is the standard practice for production environments.

> The server will be configured to trust reverse proxies (`app.set('trust proxy', 1)`). If your app is deployed behind multiple proxies (e.g., Cloudflare -> Nginx -> Node), you might need to adjust the number `1` or configure it via an environment variable.

## Proposed Changes

### Dependencies

We will install the required packages:

- `express-rate-limit`: Core rate limiting logic.
- `rate-limit-redis`: Redis store for rate limiting to synchronize limits across distributed nodes.

#### [NEW] Command Execution

```bash
npm install express-rate-limit rate-limit-redis
```

---

### Middleware

Create a new middleware file to define different rate limiters.

#### [NEW] [rateLimiter.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/middleware/rateLimiter.js)

- Import `rateLimit` and `RedisStore`.
- Use the existing `redisClient` from `src/config/redis.js`.
- Define **`apiLimiter`**: General limiter for all API routes (e.g., 100 requests per 15 minutes).
- Define **`authLimiter`**: Strict limiter for authentication routes (e.g., 10 requests per 15 minutes) to prevent brute-force attacks on login, registration, and OTP endpoints.

---

### App Configuration

Apply the rate limiters to the Express application.

#### [MODIFY] [server.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/server.js)

- Add `app.set("trust proxy", 1);` to correctly identify client IPs when deployed behind load balancers or proxies.
- Apply `apiLimiter` to the base `/v1/api/` route to protect all endpoints by default.

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)

- Apply the strict `authLimiter` to sensitive routes, specifically:
  - `/register/send-otp`
  - `/register`
  - `/login`
  - `/forgot-password/send-otp`
  - `/forgot-password`
  - `/refresh-token`

### Manual Verification

1. Start the application locally.
2. Send requests to a normal API endpoint and observe the `RateLimit-Limit` and `RateLimit-Remaining` response headers.
3. Test the `/login` endpoint repeatedly to verify that it blocks requests with a `429 Too Many Requests` status after exceeding the strict limit.
