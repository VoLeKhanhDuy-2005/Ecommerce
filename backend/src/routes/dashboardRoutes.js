const express = require("express");
const isAdmin = require("../middleware/isAdmin");
const {
  getDashboardStats,
  exportDashboardStats,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/admin/dashboard/stats", isAdmin, getDashboardStats);
router.get("/admin/dashboard/export", isAdmin, exportDashboardStats);

module.exports = router;
