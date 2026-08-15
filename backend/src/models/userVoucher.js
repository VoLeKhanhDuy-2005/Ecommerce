const mongoose = require("mongoose");

const userVoucherSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "voucher",
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const UserVoucher = mongoose.model("userVoucher", userVoucherSchema);

module.exports = UserVoucher;
