const Product = require("../models/product");

const getHomePageProducts = async () => {
  const [
    newestProducts,
    bestSellingProducts,
    promotionalProducts,
    mostViewedProducts,
  ] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).limit(10),
    Product.find({ isHot: true }).sort({ sold: -1 }).limit(10),
    Product.find({ discountPrice: { $gt: 0 } }).limit(12),
    Product.find().sort({ views: -1 }).limit(10),
  ]);

  return {
    newest: newestProducts,
    bestSelling: bestSellingProducts,
    promotions: promotionalProducts,
    mostViewed: mostViewedProducts,
  };
};

const getProductsWithFilters = async (query) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 12,
  } = query;

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }
  if (category) {
    filter.category = category;
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortObj = { createdAt: -1 };
  if (sort) {
    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };
    if (sort === "newest") sortObj = { createdAt: -1 };
    if (sort === "bestselling") sortObj = { sold: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Sản phẩm không tồn tại");
  return product;
};

const getRelatedProducts = async (id, category) => {
  return await Product.find({ category, _id: { $ne: id } }).limit(4);
};

module.exports = {
  getHomePageProducts,
  getProductsWithFilters,
  getProductById,
  getRelatedProducts,
};
