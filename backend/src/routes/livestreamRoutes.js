const express = require("express");
const { generateToken } = require("../controllers/livestreamController");

const router = express.Router();

router.get("/livestream/token", generateToken);

module.exports = router;
