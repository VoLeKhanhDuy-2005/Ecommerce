const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { validateProductImages } = require("../middleware/fileValidate");
const {
  createOrder,
  verifyMomoPayment,
  handleMomoIPN,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  markOrderAsReceived,
  getShopOrders,
  updateShopOrderStatus,
  handleShopCancelRequest,
  calculateShipping,
  exportInvoice,
  requestReturn,
  adminApproveReturn,
  adminRejectReturn,
  adminCompleteReturn,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", auth, createOrder);
router.post("/orders/calculate-shipping", auth, calculateShipping);
router.get("/orders", auth, getMyOrders);
router.get("/orders/:id", auth, getOrderDetails);
router.post("/orders/momo-ipn", handleMomoIPN);
router.post("/orders/:id/cancel", auth, cancelOrder);
router.post("/orders/:id/received", auth, markOrderAsReceived);
router.post("/orders/:id/verify-momo", auth, verifyMomoPayment);
router.post("/orders/:id/return", auth, validateProductImages, requestReturn);
router.get("/orders/:id/invoice", auth, exportInvoice);

router.get("/admin/orders", auth, isAdmin, getShopOrders);
router.patch("/admin/orders/:id", auth, isAdmin, updateShopOrderStatus);
router.post(
  "/admin/orders/:id/cancel-request",
  auth,
  isAdmin,
  handleShopCancelRequest,
);
router.put(
  "/admin/orders/:id/return-approve",
  auth,
  isAdmin,
  adminApproveReturn,
);
router.put("/admin/orders/:id/return-reject", auth, isAdmin, adminRejectReturn);
router.put(
  "/admin/orders/:id/return-complete",
  auth,
  isAdmin,
  adminCompleteReturn,
);

module.exports = router;
