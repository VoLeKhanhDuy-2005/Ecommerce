const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const {
  getDashboardStats,
  exportDashboardStats,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/admin/dashboard/stats", auth, isAdmin, getDashboardStats);
router.get("/admin/dashboard/export", auth, isAdmin, exportDashboardStats);

module.exports = router;
