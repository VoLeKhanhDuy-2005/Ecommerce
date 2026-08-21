const express = require("express");
const auth = require("../middleware/auth");
const { generateToken } = require("../controllers/livestreamController");

const router = express.Router();

router.get("/livestream/token", auth, generateToken);

module.exports = router;
