const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Vui lòng chọn số sao"],
      min: [1, "Số sao tối thiểu là 1"],
      max: [5, "Số sao tối đa là 5"],
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Một người dùng chỉ có thể đánh giá một sản phẩm một lần
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model("review", reviewSchema);

module.exports = Review;
