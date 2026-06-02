require("dotenv").config();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const {
  deleteOldAndInsertNewImageInS3,
  getImagePresignedUrl,
} = require("../services/fileService");

const createUserService = async (name, email, password) => {
  try {
    //check user exist
    const user = await User.findOne({ email });
    if (user) {
      console.log(`>>> user exist, chọn 1 email khác: ${email}`);
      return null;
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
    return result;
  } catch (error) {
    console.log(error);
    return null;
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
    if (user.avatarName)
      user.avatarURL = await getImagePresignedUrl(user);

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
  createUserService,
  loginService,
  getUserService,
  getCurrentUserService,
  refreshTokenService,
  updateProfile,
};
