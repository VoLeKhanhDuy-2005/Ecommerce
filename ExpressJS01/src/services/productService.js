const Product = require("../models/product");
const { getImagePresignedUrlByKey } = require("./fileService");

const mapProductImageUrls = async (products) => {
  const list = Array.isArray(products) ? products : [products];

  const result = await Promise.all(
    list.map(async (product) => {
      const pObj = product.toObject ? product.toObject() : product;
      if (pObj.images?.length) {
        pObj.images = await Promise.all(
          pObj.images.map(getImagePresignedUrlByKey)
        );
      }
      return pObj;
    })
  );

  return Array.isArray(products) ? result : result[0];
};

const getHomePageProducts = async () => {
  const [
    newestProducts,
    bestSellingProducts,
    promotionalProducts,
    mostViewedProducts,
  ] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).limit(10),
    Product.find().sort({ sold: -1 }).limit(10),
    Product.find().sort({ discountPercent: -1 }).limit(12),
    Product.find().sort({ views: -1 }).limit(10),
  ]);

  return {
    newest: await mapProductImageUrls(newestProducts),
    bestSelling: await mapProductImageUrls(bestSellingProducts),
    promotions: await mapProductImageUrls(promotionalProducts),
    mostViewed: await mapProductImageUrls(mostViewedProducts),
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
    limit = 8,
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
    products: await mapProductImageUrls(products),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Sản phẩm không tồn tại");
  return await mapProductImageUrls(product);
};

const incrementProductView = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true },
  );
  if (!product) throw new Error("Sản phẩm không tồn tại");
  return product; // We don't map images here because it just returns views
};

const getRelatedProducts = async (id, category) => {
  const products = await Product.find({ category, _id: { $ne: id } }).limit(4);
  return await mapProductImageUrls(products);
};

module.exports = {
  getHomePageProducts,
  getProductsWithFilters,
  getProductById,
  incrementProductView,
  getRelatedProducts,
};
