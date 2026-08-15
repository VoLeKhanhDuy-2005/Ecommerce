const express = require("express");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  register,
  handleLogin,
  handleRefreshToken,
  handleLogout,
  handleSendRegisterOTP,
  handleSendForgotOTP,
  handleResetPassword,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register/send-otp", authLimiter, handleSendRegisterOTP);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, handleLogin);
router.post("/forgot-password/send-otp", authLimiter, handleSendForgotOTP);
router.post("/forgot-password", authLimiter, handleResetPassword);
router.post("/refresh-token", authLimiter, handleRefreshToken);
router.post("/logout", handleLogout);

module.exports = router;
