const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên không được để trống"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email không được để trống"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu không được để trống"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "Vai trò không hợp lệ: {VALUE}",
      },
      default: "user",
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "BANNED"],
        message: "Trạng thái không hợp lệ: {VALUE}",
      },
      default: "ACTIVE",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", ""],
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    birthday: {
      type: String,
      default: "",
    },
    avatarName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  },
);

const User = mongoose.model("user", userSchema);

module.exports = User;
