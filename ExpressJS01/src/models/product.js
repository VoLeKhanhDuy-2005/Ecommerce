const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm không được để trống"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Mô tả không được để trống"],
    },
    price: {
      type: Number,
      required: [true, "Giá sản phẩm không được để trống"],
      min: 0,
    },
    discountPrice: {
      type: Number, // Giá sau khi giảm
      default: 0,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    category: {
      type: String,
      required: true,
      index: true, // Đánh index để lọc dữ liệu nhanh hơn
    },
    stock: {
      type: Number,
      required: true,
      default: 0, // Hàng tồn kho
    },
    sold: {
      type: Number,
      default: 0, // Số lượng đã bán được
    },
    rating: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    isHot: {
      type: Boolean,
      default: false, // Đánh dấu sản phẩm bán chạy
    },
    isNew: {
      type: Boolean,
      default: true, // Đánh dấu sản phẩm mới
    },
    promotion: {
      type: String, // Thông tin khuyến mãi đi kèm (ví dụ: "Mua 1 tặng 1")
      default: "",
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  },
);

// Tạo index để hỗ trợ tìm kiếm nhanh theo tên
productSchema.index({ name: "text" });

const Product = mongoose.model("product", productSchema);

module.exports = Product;
