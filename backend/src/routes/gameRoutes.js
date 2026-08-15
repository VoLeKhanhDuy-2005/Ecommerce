const express = require("express");
const {
  getFoodQuestion,
  submitGameAnswer,
} = require("../controllers/gameController");

const router = express.Router();

router.get("/game/question", getFoodQuestion);
router.post("/game/submit", submitGameAnswer);

module.exports = router;
