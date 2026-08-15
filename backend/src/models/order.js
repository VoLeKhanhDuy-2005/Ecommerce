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
    note: {
      type: String,
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
      enum: ["Pending", "Paid", "Failed", "Refunded", "Partially Refunded"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: [
        "New",
        "Confirmed",
        "Preparing",
        "Shipping",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Returned",
      ],
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
    shippingFee: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    deliveryCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    momoRequestId: {
      type: String,
    },
    momoTransId: {
      type: Number,
    },
    returnRequests: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        reason: {
          type: String,
          required: true,
        },
        images: [String],
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected", "Completed"],
          // Completed: Đã hoàn trả tiền thành công, không tính tiền lại nữa
          default: "Pending",
        },
        rejectReason: String,
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        refundAmount: {
          type: Number,
          default: 0,
        },
      },
    ],
    voucherApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "voucher",
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    coinsEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
