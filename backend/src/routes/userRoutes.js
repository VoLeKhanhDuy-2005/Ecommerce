const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { validateAvatar } = require("../middleware/fileValidate");
const {
  getUser,
  getCurrentUser,
  handleUpdateProfile,
} = require("../controllers/userController");

const router = express.Router();

router.get("/user", auth, isAdmin, getUser);
router.get("/user/me", auth, getCurrentUser);
router.put("/user/profile", auth, validateAvatar, handleUpdateProfile);

module.exports = router;
