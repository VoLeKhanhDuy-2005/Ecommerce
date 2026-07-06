const Category = require("../models/category");
const Product = require("../models/product");
const {
  deleteOldAndInsertNewImageInS3,
  getImagePresignedUrl,
} = require("../services/fileService");

const createCategory = async (req, res) => {
  try {
    const { categoryId, name, imageUrl } = req.body;
    let image = imageUrl;

    if (!categoryId || !name) {
      return res.status(400).json({
        EC: 1,
        EM: "Vui lòng cung cấp đầy đủ mã và tên danh mục",
      });
    }

    if (req.file) {
      image = await deleteOldAndInsertNewImageInS3(null, req.file);
    }

    if (!image) {
      return res.status(400).json({
        EC: 1,
        EM: "Vui lòng cung cấp hình ảnh danh mục hoặc tải file lên",
      });
    }

    const existingCategory = await Category.findOne({ categoryId });
    if (existingCategory) {
      return res.status(400).json({
        EC: 1,
        EM: "Mã danh mục đã tồn tại",
      });
    }

    const newCategory = await Category.create({ categoryId, name, image });
    return res.status(201).json({
      EC: 0,
      EM: "Tạo danh mục thành công",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Lỗi server",
      error: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    const categoriesWithUrls = await Promise.all(
      categories.map(async (cat) => {
        const catObj = cat.toObject();
        if (catObj.image && !catObj.image.startsWith("http")) {
          catObj.image = await getImagePresignedUrl(catObj);
        }
        return catObj;
      }),
    );

    return res.status(200).json({
      EC: 0,
      EM: "Lấy danh sách danh mục thành công",
      data: categoriesWithUrls,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Lỗi server",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, imageUrl } = req.body;
    if (!categoryId || !name) {
      return res.status(400).json({
        EC: 1,
        EM: "Vui lòng cung cấp đầy đủ mã và tên danh mục",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        EC: 1,
        EM: "Không tìm thấy danh mục",
      });
    }

    let image = category.image;
    if (req.file) {
      image = await deleteOldAndInsertNewImageInS3(category, req.file);
    } else if (imageUrl) {
      image = imageUrl;
    }

    const existingCategory = await Category.findOne({
      categoryId,
      _id: { $ne: id },
    });
    if (existingCategory) {
      return res.status(400).json({
        EC: 1,
        EM: "Mã danh mục đã tồn tại cho một danh mục khác",
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { categoryId, name, image },
      { new: true, runValidators: true },
    );

    if (!updatedCategory) {
      return res.status(404).json({
        EC: 1,
        EM: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      EC: 0,
      EM: "Cập nhật danh mục thành công",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Lỗi server",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        EC: 1,
        EM: "Không tìm thấy danh mục",
      });
    }

    const productsCount = await Product.countDocuments({
      category: category.categoryId,
    });
    if (productsCount > 0) {
      return res.status(400).json({
        EC: 1,
        EM: `Không thể xóa danh mục này vì có ${productsCount} sản phẩm đang bán`,
      });
    }

    await Category.findByIdAndDelete(id);
    return res.status(200).json({
      EC: 0,
      EM: "Xóa danh mục thành công",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      EC: 1,
      EM: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
