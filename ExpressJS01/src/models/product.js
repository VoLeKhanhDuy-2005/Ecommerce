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
      index: true, // Index slug để tìm kiếm theo URL nhanh hơn
    },
    description: {
      type: String,
      required: [true, "Mô tả không được để trống"],
    },
    price: {
      type: Number,
      required: [true, "Giá sản phẩm không được để trống"],
      min: [0, "Giá không được âm"],
    },
    discountPercent: {
      type: Number,
      required: [true, "Phần trăm giảm không được để trống"],
      min: [0, "Phần trăm giảm không được âm"],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Giá sau giảm không được âm"],
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    category: {
      type: String,
      required: [true, "Danh mục không được để trống"],
      index: true, // Index để lọc theo danh mục nhanh hơn
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Tồn kho không được âm"],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Số lượng đã bán không được âm"],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating tối thiểu là 0"],
      max: [5, "Rating tối đa là 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Số lượng đánh giá không được âm"],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Lượt xem không được âm"],
    },
  },
  {
    timestamps: true,
  },
);

// Text index để hỗ trợ full-text search theo tên
productSchema.index({ name: "text" });

// Compound index để tăng tốc truy vấn bán chạy và xem nhiều nhất
productSchema.index({ sold: -1 });
productSchema.index({ views: -1 });

// Tự động tạo slug từ name nếu chưa có
productSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
});

const Product = mongoose.model("product", productSchema);

module.exports = Product;
