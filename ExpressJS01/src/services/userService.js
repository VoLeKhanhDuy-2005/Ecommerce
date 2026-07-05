require("dotenv").config();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const {
  deleteOldAndInsertNewImageInS3,
  getImagePresignedUrl,
} = require("../services/fileService");
const { generateOTP, verifyOTP } = require("./otpService");
const { sendOTPEmail } = require("./emailService");

const registerService = async (name, email, password, otp) => {
  try {
    if (!otp) return { EC: 1, EM: "Vui lòng nhập mã OTP" };

    const verification = await verifyOTP(email, "register", otp);
    if (!verification.success) {
      return { EC: 1, EM: verification.message };
    }

    //check user exist
    const user = await User.findOne({ email });
    if (user) {
      return { EC: 1, EM: "Email đã tồn tại" };
    }

    //hash user password
    const hashPassword = await bcrypt.hash(password, saltRounds);
    //save user to database
    let result = await User.create({
      name: name,
      email: email,
      password: hashPassword,
      role: "user",
    });
    return { EC: 0, EM: "Đăng ký thành công", data: result };
  } catch (error) {
    console.log(error);
    return { EC: -1, EM: "Lỗi hệ thống" };
  }
};

const sendRegisterOTPService = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (user) {
      return { EC: 1, EM: "Email đã tồn tại trong hệ thống" };
    }
    const otp = await generateOTP(email, "register");
    const isSent = await sendOTPEmail(email, otp, "register");
    if (isSent) {
      return { EC: 0, EM: "Mã OTP đã được gửi đến email của bạn" };
    } else {
      return { EC: 1, EM: "Lỗi gửi email OTP" };
    }
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống khi gửi OTP" };
  }
};

const sendForgotPasswordOTPService = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { EC: 1, EM: "Email không tồn tại trong hệ thống" };
    }
    const otp = await generateOTP(email, "forgot");
    const isSent = await sendOTPEmail(email, otp, "forgot");
    if (isSent) {
      return { EC: 0, EM: "Mã OTP đã được gửi đến email của bạn" };
    } else {
      return { EC: 1, EM: "Lỗi gửi email OTP" };
    }
  } catch (error) {
    return { EC: -1, EM: "Lỗi hệ thống khi gửi OTP" };
  }
};

const resetPasswordService = async (email, otp, newPassword) => {
  try {
    if (!otp) return { EC: 1, EM: "Vui lòng nhập mã OTP" };
    if (!newPassword || newPassword.length < 6)
      return { EC: 1, EM: "Mật khẩu mới phải có ít nhất 6 ký tự" };

    const verification = await verifyOTP(email, "forgot", otp);
    if (!verification.success) {
      return { EC: 1, EM: verification.message };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { EC: 1, EM: "Không tìm thấy user" };
    }

    const hashPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashPassword;
    await user.save();

    return { EC: 0, EM: "Đổi mật khẩu thành công" };
  } catch (error) {
    console.log(error);
    return { EC: -1, EM: "Lỗi hệ thống" };
  }
};

const loginService = async (email1, password) => {
  try {
    //fetch user by email
    const user = await User.findOne({ email: email1 });
    if (user) {
      //compare password
      const isMatchPassword = await bcrypt.compare(password, user.password);
      if (!isMatchPassword) {
        return {
          EC: 2,
          EM: "Email/Password không hợp lệ",
        };
      } else {
        //create an access token
        const payload = {
          email: user.email,
          name: user.name,
          role: user.role,
        };

        const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE,
        });

        // Tạo refresh token lưu ở cookie
        const refresh_token = jwt.sign(
          payload,
          process.env.REFRESH_JWT_SECRET,
          {
            expiresIn: process.env.REFRESH_JWT_EXPIRE,
          },
        );

        return {
          EC: 0,
          access_token,
          refresh_token,
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }
    } else {
      return {
        EC: 1,
        EM: "Email/Password không hợp lệ",
      };
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

const refreshTokenService = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_JWT_SECRET);
    const payload = {
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    // Tạo access_token mới
    const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    return {
      EC: 0,
      access_token,
      user: payload,
    };
  } catch (error) {
    console.log(error);
    return {
      EC: 1,
      EM: "Refresh token không hợp lệ hoặc đã hết hạn",
    };
  }
};

const getUserService = async () => {
  try {
    let result = await User.find({}).select("-password");
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getCurrentUserService = async (email1) => {
  try {
    console.log(email1);
    let user = await User.findOne({ email: email1 }).select("-password");

    if (user) {
      user = user.toObject ? user.toObject() : user;
      if (user.avatarName) user.avatarURL = await getImagePresignedUrl(user);

      return {
        EC: 0,
        EM: "Lấy thông tin user thành công",
        user: user,
      };
    } else {
      return {
        EC: 1,
        EM: "User không tồn tại",
        user: null,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      EC: -1,
      EM: "Lỗi hệ thống",
      user: null,
    };
  }
};

const updateProfile = async (email, body, file) => {
  try {
    const data = { ...body };
    let user = await User.findOne({ email });
    if (!user) {
      return { EC: 1, EM: "Không tìm thấy user" };
    }
    if (file)
      data.avatarName = await deleteOldAndInsertNewImageInS3(user, file);

    user.name = data.fullname !== undefined ? data.fullname : user.name;
    user.phone = data.phone !== undefined ? data.phone : user.phone;
    user.address = data.address !== undefined ? data.address : user.address;
    user.gender = data.gender !== undefined ? data.gender : user.gender;
    user.birthday = data.birthday !== undefined ? data.birthday : user.birthday;
    if (data.avatarName) user.avatarName = data.avatarName;

    user = await user.save();
    user = user.toObject();
    if (user.avatarName) user.avatarURL = await getImagePresignedUrl(user);

    return { EC: 0, EM: "Cập nhật hồ sơ thành công", data: user };
  } catch (error) {
    return {
      EC: -1,
      EM: "Lỗi cập nhật hồ sơ",
      user: null,
    };
  }
};

module.exports = {
  registerService,
  loginService,
  getUserService,
  getCurrentUserService,
  refreshTokenService,
  updateProfile,
  sendRegisterOTPService,
  sendForgotPasswordOTPService,
  resetPasswordService,
};
