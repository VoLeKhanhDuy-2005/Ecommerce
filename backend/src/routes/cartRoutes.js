const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/cart", getCart);
router.post("/cart", addToCart);
router.put("/cart", updateCartItem);
router.delete("/cart/:productId", deleteCartItem);
router.delete("/cart", clearCart);

module.exports = router;
