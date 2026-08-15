const express = require("express");
const isAdmin = require("../middleware/isAdmin");
const {
  getSettings,
  updateSetting,
} = require("../controllers/settingController");

const router = express.Router();

router.get("/settings", getSettings);
router.put("/admin/settings", isAdmin, updateSetting);

module.exports = router;
