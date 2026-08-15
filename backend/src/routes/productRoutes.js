const express = require("express");
const isAdmin = require("../middleware/isAdmin");
const { validateProductImages } = require("../middleware/fileValidate");
const {
  searchProducts,
  getHomePageProducts,
  getProductDetail,
  incrementView,
} = require("../controllers/productController");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminProductController");
const {
  handleGetProductReviews,
  handleAddReview,
  handleDeleteReview,
  handleCheckEligibility,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/products", getHomePageProducts);
router.get("/products/search", searchProducts);
router.get("/products/:id", getProductDetail);
router.patch("/products/:id/view", incrementView);
router.get("/products/:id/reviews", handleGetProductReviews);
router.get("/products/:id/reviews/eligibility", handleCheckEligibility);
router.post("/products/:id/reviews", handleAddReview);
router.delete("/products/:id/reviews", handleDeleteReview);

router.get("/admin/products", isAdmin, getAllProducts);
router.post("/admin/products", isAdmin, validateProductImages, createProduct);
router.put("/admin/products/:id", isAdmin, validateProductImages, updateProduct);
router.delete("/admin/products/:id", isAdmin, deleteProduct);

module.exports = router;
