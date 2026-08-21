const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const {
  getSettings,
  updateSetting,
} = require("../controllers/settingController");

const router = express.Router();

router.get("/settings", getSettings);
router.put("/admin/settings", auth, isAdmin, updateSetting);

module.exports = router;
