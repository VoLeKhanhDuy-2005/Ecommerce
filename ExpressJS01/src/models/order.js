const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, "Email người dùng không được để trống"],
      trim: true,
      lowercase: true,
    },
    customerName: {
      type: String,
      required: [true, "Tên người nhận không được để trống"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Số điện thoại không được để trống"],
      trim: true,
    },
    shippingAddress: {
      type: String,
      required: [true, "Địa chỉ nhận hàng không được để trống"],
      trim: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Tổng tiền không được âm"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["COD", "MOMO"],
        message: "Phương thức thanh toán không hợp lệ: {VALUE}",
      },
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["New", "Confirmed", "Preparing", "Shipping", "Delivered", "Cancelled"],
      default: "New",
    },
    cancelRequest: {
      type: Boolean,
      default: false,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    momoRequestId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
