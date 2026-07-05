const { redisClient } = require("../config/redis");

const OTP_TTL = parseInt(process.env.OTP_TTL) || 300; // Mặc định 5 phút

const getOtpCacheKey = (email, type) => `otp:${type}:${email}`;

const generateOTP = async (email, type) => {
  try {
    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = getOtpCacheKey(email, type);

    if (redisClient.isReady) {
      // Lưu vào Redis với TTL
      await redisClient.setEx(key, OTP_TTL, otp);
      return otp;
    } else {
      throw new Error("Redis không sẵn sàng để lưu OTP");
    }
  } catch (error) {
    console.error("Lỗi khi tạo OTP:", error.message);
    throw error;
  }
};

const verifyOTP = async (email, type, inputOtp) => {
  try {
    const key = getOtpCacheKey(email, type);

    if (redisClient.isReady) {
      const storedOtp = await redisClient.get(key);

      if (!storedOtp) {
        return {
          success: false,
          message: "Mã OTP đã hết hạn hoặc không tồn tại",
        };
      }

      if (storedOtp === inputOtp.toString()) {
        // Xoá OTP sau khi xác thực thành công
        await redisClient.del(key);
        return { success: true, message: "Xác thực OTP thành công" };
      } else {
        return { success: false, message: "Mã OTP không chính xác" };
      }
    } else {
      throw new Error("Redis không sẵn sàng để xác thực OTP");
    }
  } catch (error) {
    console.error("Lỗi khi xác thực OTP:", error.message);
    throw error;
  }
};

module.exports = {
  generateOTP,
  verifyOTP,
};
