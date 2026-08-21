const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { validateCategoryImage } = require("../middleware/fileValidate");
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/categories", getAllCategories);
router.post(
  "/admin/categories",
  auth,
  isAdmin,
  validateCategoryImage,
  createCategory,
);
router.put(
  "/admin/categories/:id",
  auth,
  isAdmin,
  validateCategoryImage,
  updateCategory,
);
router.delete("/admin/categories/:id", auth, isAdmin, deleteCategory);

module.exports = router;
