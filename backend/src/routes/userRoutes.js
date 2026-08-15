const express = require("express");
const isAdmin = require("../middleware/isAdmin");
const { validateAvatar } = require("../middleware/fileValidate");
const {
  getUser,
  getCurrentUser,
  handleUpdateProfile,
} = require("../controllers/userController");

const router = express.Router();

router.get("/user", isAdmin, getUser);
router.get("/user/me", getCurrentUser);
router.put("/user/profile", validateAvatar, handleUpdateProfile);

module.exports = router;
