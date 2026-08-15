const express = require("express");
const { handleResolveMapLink } = require("../controllers/utilController");

const router = express.Router();

router.post("/utils/resolve-map-link", handleResolveMapLink);

module.exports = router;
