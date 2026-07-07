require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const white_lists = [
    "/",
    "/register",
    "/login",
    "/products",
    "/refresh-token",
    "/logout",
    "/forgot-password",
    "/categories",
  ];

  // Cho phép các route bắt đầu bằng danh sách whitelist đi qua mà không cần check token
  const isWhiteListed = white_lists.some((item) => {
    if (item === "/")
      return req.originalUrl === "/v1/api" || req.originalUrl === "/v1/api/";
    return req.originalUrl.startsWith("/v1/api" + item);
  }); // Trả về true nếu ít nhất một phần tử thỏa điều kiện

  // Bắt buộc xác thực cho tính năng gửi hoặc xoá đánh giá và kiểm tra quyền đánh giá
  const isReviewEligibility =
    req.originalUrl.match(/\/v1\/api\/products\/.*\/reviews\/eligibility/) &&
    req.method === "GET";
  const isReviewAction =
    req.originalUrl.match(/\/v1\/api\/products\/.*\/reviews/) &&
    ["POST", "DELETE"].includes(req.method);

  if (isWhiteListed && !isReviewAction && !isReviewEligibility) {
    next();
  } else {
    if (req?.headers?.authorization?.split(" ")?.[1]) {
      const token = req.headers.authorization.split(" ")[1];

      //verify token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          createdBy: "volekhanhduy2005",
        };
        //console.log(">>> check token: ", decoded)
        next();
      } catch (error) {
        return res.status(401).json({
          message: "Token bị hết hạn/hoặc không hợp lệ",
        });
      }
    } else {
      return res.status(401).json({
        message: "Bạn chưa truyền Access Token ở header/Hoặc token bị hết hạn",
      });
    }
  }
};

module.exports = auth;
