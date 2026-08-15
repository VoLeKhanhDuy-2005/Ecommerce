const express = require("express");
const isAdmin = require("../middleware/isAdmin");
const {
  createVoucher,
  getActiveVouchers,
  redeemVoucher,
  getMyVouchers,
  getAllAdminVouchers,
  updateVoucher,
  deleteVoucher,
} = require("../controllers/voucherController");

const router = express.Router();

router.get("/admin/vouchers", isAdmin, getAllAdminVouchers);
router.post("/admin/vouchers", isAdmin, createVoucher);
router.put("/admin/vouchers/:id", isAdmin, updateVoucher);
router.delete("/admin/vouchers/:id", isAdmin, deleteVoucher);

router.get("/vouchers/active", getActiveVouchers);
router.post("/vouchers/redeem", redeemVoucher);
router.get("/vouchers/my", getMyVouchers);

module.exports = router;
