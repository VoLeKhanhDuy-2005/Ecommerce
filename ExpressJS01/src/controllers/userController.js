const {
  registerService,
  loginService,
  getUserService,
  getCurrentUserService,
  refreshTokenService,
  updateProfile,
  sendRegisterOTPService,
  sendForgotPasswordOTPService,
  resetPasswordService,
} = require("../services/userService");

const register = async (req, res, next) => {
  try {
    const { name, email, password, otp } = req.body;
    const data = await registerService(name, email, password, otp);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleSendRegisterOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ EC: 1, EM: "Thiếu email" });
    const data = await sendRegisterOTPService(email);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleSendForgotOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ EC: 1, EM: "Thiếu email" });
    const data = await sendForgotPasswordOTPService(email);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleResetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ EC: 1, EM: "Thiếu dữ liệu bắt buộc" });
    const data = await resetPasswordService(email, otp, newPassword);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginService(email, password);

    if (data && data.refresh_token) {
      res.cookie("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: false, // Set là true nếu chạy trên HTTPS
        sameSite: "strict",
        // Trình duyệt chỉ gửi cookie nếu bạn đang ở trang A (nganhang.com)
        // và thực hiện hành động (nhấp link, gửi biểu mẫu, gọi API) dẫn đến trang A
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      // Xóa refresh_token khỏi response body để bảo mật
      delete data.refresh_token;
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const data = await getUserService();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const data = await getCurrentUserService(req.user.email);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleRefreshToken = async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res
        .status(401)
        .json({ EC: 1, EM: "Không tìm thấy refresh token trong cookie" });
    }

    const data = await refreshTokenService(refresh_token);

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const handleLogout = (req, res) => {
  res.clearCookie("refresh_token");
  return res.status(200).json({ EC: 0, EM: "Đăng xuất thành công" });
};

const handleUpdateProfile = async (req, res, next) => {
  try {
    const result = await updateProfile(req.user.email, req.body, req.file);
    if (result.EC === 0)
      return res.status(200).json({
        success: true,
        message: "Cập nhật thành công",
        data: result.data,
      });
    return res.status(400).json({ success: false, message: result.EM });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  handleLogin,
  getUser,
  getCurrentUser,
  handleRefreshToken,
  handleLogout,
  handleUpdateProfile,
  handleSendRegisterOTP,
  handleSendForgotOTP,
  handleResetPassword,
};
