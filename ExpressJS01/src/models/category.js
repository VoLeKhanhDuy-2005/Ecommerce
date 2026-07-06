const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: [true, "Mã danh mục không được để trống"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Tên danh mục không được để trống"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Hình ảnh danh mục không được để trống"],
    },
  },
  {
    timestamps: true,
  },
);

const Category = mongoose.model("category", categorySchema);

module.exports = Category;
