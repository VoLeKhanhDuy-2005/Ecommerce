const Review = require("../models/review");
const Product = require("../models/product");
const User = require("../models/user");

const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: productId } },
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

  // Cập nhật nếu đã có, hoặc tạo mới nếu chưa có
  const review = await Review.findOneAndUpdate(
    { user: user._id, product: productId },
    { rating, comment },
    { new: true, upsert: true, setDefaultsOnInsert: true },
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

module.exports = {
  getProductReviews,
  addOrUpdateReview,
  deleteReview,
};
