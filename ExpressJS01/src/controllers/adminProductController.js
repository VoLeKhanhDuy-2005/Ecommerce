const Product = require("../models/product");
const {
  uploadFileToS3,
  deleteFileFromS3ByKey,
  getImagePresignedUrlByKey,
} = require("../services/fileService");

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    const productsWithUrls = await Promise.all(
      products.map(async (p) => {
        const pObj = p.toObject();
        if (pObj.images && pObj.images.length > 0) {
          pObj.images = await Promise.all(
            pObj.images.map(
              async (img) => await getImagePresignedUrlByKey(img),
            ),
          );
        }
        return pObj;
      }),
    );
    return res.status(200).json({
      EC: 0,
      EM: "Lấy danh sách sản phẩm thành công",
      data: productsWithUrls,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server" });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPercent,
      category,
      stock,
      imageUrls,
    } = req.body;
    if (
      !name ||
      !description ||
      !price ||
      discountPercent === undefined ||
      !category ||
      stock === undefined
    ) {
      return res
        .status(400)
        .json({ EC: 1, EM: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    let images = [];
    // Lấy URL từ input text nếu có
    if (imageUrls) {
      // imageUrls có thể là chuỗi ngăn cách bởi dấu phẩy
      images = imageUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url !== "");
    }

    // Xử lý upload file lên S3
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadFileToS3(file));
      const s3Keys = await Promise.all(uploadPromises);
      images = [...images, ...s3Keys];
    }

    if (images.length === 0) {
      return res
        .status(400)
        .json({ EC: 1, EM: "Vui lòng cung cấp ít nhất 1 hình ảnh" });
    }

    const discountPrice = price - price * (discountPercent / 100);
    const newProduct = await Product.create({
      name,
      description,
      price: Number(price),
      discountPercent: Number(discountPercent),
      discountPrice: discountPrice,
      category,
      stock: Number(stock),
      images,
    });
    return res
      .status(201)
      .json({ EC: 0, EM: "Tạo sản phẩm thành công", data: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server: " + error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      discountPercent,
      category,
      stock,
      imageUrls,
    } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ EC: 1, EM: "Không tìm thấy sản phẩm" });
    }

    let images = [];
    if (imageUrls) {
      images = imageUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url !== "");
    }
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadFileToS3(file));
      const s3Keys = await Promise.all(uploadPromises);
      images = [...images, ...s3Keys];
    }

    // Nếu không cập nhật ảnh mới thì giữ nguyên ảnh cũ
    if (images.length === 0) {
      images = product.images;
    } else {
      // Có upload ảnh mới hoặc link mới => xóa ảnh cũ trên S3 nếu là ảnh S3
      const deletePromises = product.images.map((img) =>
        deleteFileFromS3ByKey(img),
      );
      await Promise.all(deletePromises);
    }

    let updateData = { name, description, category };
    if (price !== undefined) updateData.price = Number(price);
    if (discountPercent !== undefined)
      updateData.discountPercent = Number(discountPercent);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (images.length > 0) updateData.images = images;
    if (
      updateData.price !== undefined ||
      updateData.discountPercent !== undefined
    ) {
      const currentPrice =
        updateData.price !== undefined ? updateData.price : product.price;
      const currentDiscount =
        updateData.discountPercent !== undefined
          ? updateData.discountPercent
          : product.discountPercent;
      updateData.discountPrice =
        currentPrice - currentPrice * (currentDiscount / 100);
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      EC: 0,
      EM: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server: " + error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ EC: 1, EM: "Không tìm thấy sản phẩm" });
    }

    // Xóa file trên S3
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((img) =>
        deleteFileFromS3ByKey(img),
      );
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(id);
    return res.status(200).json({ EC: 0, EM: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server: " + error.message });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
