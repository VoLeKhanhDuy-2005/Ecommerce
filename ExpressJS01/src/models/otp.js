const mongoose = require("mongoose");
const OTP_TTL = parseInt(process.env.OTP_TTL) || 300; // Mặc định 5 phút

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["register", "forgot"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: OTP_TTL, // Tự động xoá document sau OTP_TTL giây
  },
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
