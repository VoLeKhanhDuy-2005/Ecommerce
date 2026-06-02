const express = require("express");
const {
  createUser,
  handleLogin,
  getUser,
  getAccount,
  getCurrentUser,
  handleRefreshToken,
  handleLogout,
  handleUpdateProfile,
} = require("../controllers/userController");
const {
  searchProducts,
  getHomePageProducts,
  getProductDetail,
  incrementView,
} = require("../controllers/productController");
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");
const {
  createOrder,
  verifyMomoPayment,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  markOrderAsReceived,
  getShopOrders,
  updateShopOrderStatus,
  handleShopCancelRequest,
  timeTravelOrder,
} = require("../controllers/orderController");
const auth = require("../middleware/auth");
const isAdmin=require("../middleware/isAdmin")
const { validateAvatar } = require("../middleware/fileValidate.middleware");

const routerAPI = express.Router();

routerAPI.all(/(.*)/, auth); // (.*) phiên bản mới -> Kiểm tra đăng nhập cho tất cả các route bên dưới

routerAPI.get("/", (req, res) => {
  return res.status(200).json("Hello world api");
});

routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);
routerAPI.post("/refresh-token", handleRefreshToken);
routerAPI.post("/logout", handleLogout);

routerAPI.get("/user", getUser);
routerAPI.get("/user/me", getCurrentUser);
routerAPI.put("/user/profile", validateAvatar, handleUpdateProfile);

routerAPI.get("/products", getHomePageProducts);
routerAPI.get("/products/search", searchProducts);
routerAPI.get("/products/:id", getProductDetail);
routerAPI.patch("/products/:id/view", incrementView);

routerAPI.get("/cart", getCart);
routerAPI.post("/cart", addToCart);
routerAPI.put("/cart", updateCartItem);
routerAPI.delete("/cart/:productId", deleteCartItem);
routerAPI.delete("/cart", clearCart);

routerAPI.post("/orders", createOrder);
routerAPI.get("/orders", getMyOrders);
routerAPI.get("/orders/:id", getOrderDetails);
routerAPI.post("/orders/:id/cancel", cancelOrder);
routerAPI.post("/orders/:id/received", markOrderAsReceived);
routerAPI.post("/orders/:id/verify-momo", verifyMomoPayment);

routerAPI.get("/admin/orders", isAdmin, getShopOrders);
routerAPI.patch("/admin/orders/:id", isAdmin, updateShopOrderStatus);
routerAPI.post("/admin/orders/:id/cancel-request", isAdmin, handleShopCancelRequest);

module.exports = routerAPI;

