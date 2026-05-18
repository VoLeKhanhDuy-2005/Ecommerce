const productService = require("../services/productService");

const searchProducts = async (req, res) => {
  try {
    const data = await productService.getProductsWithFilters(req.query);
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tìm kiếm thất bại: " + error.message,
    });
  }
};

const getHomePageProducts = async (req, res) => {
  try {
    const data = await productService.getHomePageProducts();
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy trang chủ thất bại" + error.message,
    });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    const relatedProducts = await productService.getRelatedProducts(
      id,
      product.category,
    );

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Lấy thông tin chi tiết sản phẩm thất bại: " + error.message,
    });
  }
};

module.exports = {
  searchProducts,
  getHomePageProducts,
  getProductDetail,
};