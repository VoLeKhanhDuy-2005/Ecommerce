const express = require("express");
const auth = require("../middleware/auth");
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

router.get("/admin/vouchers", auth, isAdmin, getAllAdminVouchers);
router.post("/admin/vouchers", auth, isAdmin, createVoucher);
router.put("/admin/vouchers/:id", auth, isAdmin, updateVoucher);
router.delete("/admin/vouchers/:id", auth, isAdmin, deleteVoucher);

router.get("/vouchers/active", auth, getActiveVouchers);
router.post("/vouchers/redeem", auth, redeemVoucher);
router.get("/vouchers/my", auth, getMyVouchers);

module.exports = router;
