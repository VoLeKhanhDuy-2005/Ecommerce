const express = require("express");
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
  isAdmin,
  validateCategoryImage,
  createCategory,
);
router.put(
  "/admin/categories/:id",
  isAdmin,
  validateCategoryImage,
  updateCategory,
);
router.delete("/admin/categories/:id", isAdmin, deleteCategory);

module.exports = router;
