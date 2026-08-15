const productService = require("../services/productService");

const searchProducts = async (req, res, next) => {
  try {
    const data = await productService.getProductsWithFilters(req.query);
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

const getHomePageProducts = async (req, res, next) => {
  try {
    const data = await productService.getHomePageProducts();
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

const getProductDetail = async (req, res, next) => {
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
    next(error);
  }
};

const incrementView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await productService.incrementProductView(id);
    // Trả về views mới để frontend cập nhật UI ngay, không cần GET lại
    res.status(200).json({ success: true, views: updated.views });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProducts,
  getHomePageProducts,
  getProductDetail,
  incrementView,
};
