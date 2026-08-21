const express = require("express");
const auth = require("../middleware/auth");
const { handleResolveMapLink } = require("../controllers/utilController");

const router = express.Router();

router.post("/utils/resolve-map-link", auth, handleResolveMapLink);

module.exports = router;
