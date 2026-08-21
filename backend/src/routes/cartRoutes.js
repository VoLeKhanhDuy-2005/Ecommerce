const express = require("express");
const auth = require("../middleware/auth");
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/cart", auth, getCart);
router.post("/cart", auth, addToCart);
router.put("/cart", auth, updateCartItem);
router.delete("/cart/:productId", auth, deleteCartItem);
router.delete("/cart", auth, clearCart);

module.exports = router;
