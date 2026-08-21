const express = require("express");
const auth = require("../middleware/auth");
const {
  getFoodQuestion,
  submitGameAnswer,
} = require("../controllers/gameController");

const router = express.Router();

router.get("/game/question", auth, getFoodQuestion);
router.post("/game/submit", auth, submitGameAnswer);

module.exports = router;
