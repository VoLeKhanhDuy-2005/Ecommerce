const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["DISCOUNT_AMOUNT", "DISCOUNT_PERCENT", "FREE_SHIP", "FREE_ITEM"],
      required: true,
    },
    value: {
      type: Number,
      required: true, // Discount amount or percentage
    },
    freeItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      default: null, // Used if type is FREE_ITEM
    },
    costInCoins: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Used for PERCENT to cap the discount
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxRedeems: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    redeemedCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Voucher = mongoose.model("voucher", voucherSchema);

module.exports = Voucher;
