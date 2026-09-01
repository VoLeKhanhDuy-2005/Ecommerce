require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
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
      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Token bị hết hạn/hoặc không hợp lệ",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Bạn chưa truyền Access Token ở header/Hoặc token bị hết hạn",
    });
  }
};

module.exports = auth;
