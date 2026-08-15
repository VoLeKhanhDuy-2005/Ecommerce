const express = require("express");
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

router.post("/orders", createOrder);
router.post("/orders/calculate-shipping", calculateShipping);
router.get("/orders", getMyOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/momo-ipn", handleMomoIPN);
router.post("/orders/:id/cancel", cancelOrder);
router.post("/orders/:id/received", markOrderAsReceived);
router.post("/orders/:id/verify-momo", verifyMomoPayment);
router.post("/orders/:id/return", validateProductImages, requestReturn);
router.get("/orders/:id/invoice", exportInvoice);

router.get("/admin/orders", isAdmin, getShopOrders);
router.patch("/admin/orders/:id", isAdmin, updateShopOrderStatus);
router.post("/admin/orders/:id/cancel-request", isAdmin, handleShopCancelRequest);
router.put("/admin/orders/:id/return-approve", isAdmin, adminApproveReturn);
router.put("/admin/orders/:id/return-reject", isAdmin, adminRejectReturn);
router.put("/admin/orders/:id/return-complete", isAdmin, adminCompleteReturn);

module.exports = router;
