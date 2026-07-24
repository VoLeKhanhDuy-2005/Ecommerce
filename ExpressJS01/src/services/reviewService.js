const Review = require("../models/review");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const mongoose = require("mongoose");

const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    const { averageRating, reviewCount } = result[0];
    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount,
    });
  } else {
    // Không có review nào
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

const getProductReviews = async (productId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate("user", "name avatarName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: productId }),
  ]);

  return {
    EC: 0,
    EM: "Lấy danh sách đánh giá thành công",
    data: {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const addOrUpdateReview = async (email, productId, rating, comment) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { EC: 1, EM: "Người dùng không tồn tại" };
  }

  // Kiểm tra người dùng đã mua và nhận hàng chưa
  const hasReceivedOrder = await Order.exists({
    userEmail: email,
    status: "Delivered",
    "items.product": productId,
  });

  if (!hasReceivedOrder) {
    return {
      EC: 1,
      EM: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công.",
    };
  }

  const review = await Review.findOneAndUpdate(
    { product: productId, user: user._id },
    { rating, comment },
    { new: true, upsert: true },
  );

  await updateProductRating(productId);

  return {
    EC: 0,
    EM: "Đánh giá sản phẩm thành công",
    data: review,
  };
};

const deleteReview = async (email, productId) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { EC: 1, EM: "Người dùng không tồn tại" };
  }

  const review = await Review.findOneAndDelete({
    product: productId,
    user: user._id,
  });

  if (!review) {
    return { EC: 1, EM: "Không tìm thấy đánh giá để xóa" };
  }

  await updateProductRating(productId);

  return {
    EC: 0,
    EM: "Xóa đánh giá thành công",
  };
};

const checkReviewEligibility = async (email, productId) => {
  const hasReceivedOrder = await Order.exists({
    userEmail: email,
    status: "Delivered",
    "items.product": productId,
  });
  return {
    EC: 0,
    EM: "Thành công",
    data: {
      canReview: !!hasReceivedOrder,
    },
  };
};

module.exports = {
  getProductReviews,
  addOrUpdateReview,
  deleteReview,
  checkReviewEligibility,
};
