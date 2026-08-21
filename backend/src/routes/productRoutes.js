const express = require("express");
const auth = require("../middleware/auth");
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
router.get("/products/:id/reviews/eligibility", auth, handleCheckEligibility);
router.post("/products/:id/reviews", auth, handleAddReview);
router.delete("/products/:id/reviews", auth, handleDeleteReview);

router.get("/admin/products", auth, isAdmin, getAllProducts);
router.post("/admin/products", auth, isAdmin, validateProductImages, createProduct);
router.put(
  "/admin/products/:id",
  auth,
  isAdmin,
  validateProductImages,
  updateProduct,
);
router.delete("/admin/products/:id", auth, isAdmin, deleteProduct);

module.exports = router;
