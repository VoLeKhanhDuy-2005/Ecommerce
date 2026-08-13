const Product = require("../models/product");
const { getImagePresignedUrlByKey } = require("./fileService");

const mapProductImageUrls = async (products) => {
  const list = Array.isArray(products) ? products : [products];

  const result = await Promise.all(
    list.map(async (product) => {
      const pObj = product.toObject ? product.toObject() : product;
      if (pObj.images?.length) {
        pObj.images = await Promise.all(
          pObj.images.map(getImagePresignedUrlByKey),
        );
      }
      return pObj;
    }),
  );
  return Array.isArray(products) ? result : result[0];
};

const getTimeBasedRecommendations = async () => {
  const vnHour = (new Date().getUTCHours() + 7) % 24;
  let title = "";
  let keywords = [];

  if (vnHour >= 5 && vnHour < 10) {
    title = "Năng lượng cho buổi sáng ☀️";
    keywords = ["phở", "bún", "bánh mì", "cafe", "cà phê", "sáng", "xôi"];
  } else if (vnHour >= 10 && vnHour < 14) {
    title = "Trưa nay ăn gì? 🍱";
    keywords = ["cơm", "bún", "lẩu", "trưa"];
  } else if (vnHour >= 14 && vnHour < 18) {
    title = "Nạp năng lượng xế chiều 🧋";
    keywords = ["trà sữa", "ăn vặt", "bánh", "chè", "kem", "trà"];
  } else {
    title = "Món ngon buổi tối 🌙";
    keywords = ["lẩu", "nướng", "cháo", "mì", "cơm", "đêm", "ốc"];
  }

  let products = await Product.find({ name: { $regex: new RegExp(keywords.join("|"), "i") } }).limit(10);

  if (products.length < 10) {
    const existingIds = products.map(p => p._id);
    const fillerProducts = await Product.find({ _id: { $nin: existingIds } }).sort({ sold: -1 }).limit(10 - products.length);
    products = [...products, ...fillerProducts];
  }

  return {
    title,
    products: await mapProductImageUrls(products)
  };
};

const getHomePageProducts = async () => {
  const [
    newestProducts,
    bestSellingProducts,
    promotionalProducts,
    mostViewedProducts,
    timeBasedData,
  ] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).limit(10),
    Product.find().sort({ sold: -1 }).limit(10),
    Product.find().sort({ discountPercent: -1 }).limit(12),
    Product.find().sort({ views: -1 }).limit(10),
    getTimeBasedRecommendations(),
  ]);

  return {
    newest: await mapProductImageUrls(newestProducts),
    bestSelling: await mapProductImageUrls(bestSellingProducts),
    promotions: await mapProductImageUrls(promotionalProducts),
    mostViewed: await mapProductImageUrls(mostViewedProducts),
    timeBased: timeBasedData,
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
    filter.discountPrice = {};
    if (minPrice) filter.discountPrice.$gte = Number(minPrice);
    if (maxPrice) filter.discountPrice.$lte = Number(maxPrice);
  }

  let sortObj = { createdAt: -1 };
  if (sort) {
    if (sort === "price-asc") sortObj = { discountPrice: 1 };
    if (sort === "price-desc") sortObj = { discountPrice: -1 };
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
