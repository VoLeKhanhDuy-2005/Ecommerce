const express = require("express");
const auth = require("../middleware/auth");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const categoryRoutes = require("./categoryRoutes");
const settingRoutes = require("./settingRoutes");
const utilRoutes = require("./utilRoutes");
const voucherRoutes = require("./voucherRoutes");
const gameRoutes = require("./gameRoutes");
const livestreamRoutes = require("./livestreamRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.all(/(.*)/, auth); // Kiểm tra đăng nhập cho tất cả các route bên dưới

router.use("/", authRoutes);
router.use("/", userRoutes);
router.use("/", productRoutes);
router.use("/", cartRoutes);
router.use("/", orderRoutes);
router.use("/", categoryRoutes);
router.use("/", settingRoutes);
router.use("/", utilRoutes);
router.use("/", voucherRoutes);
router.use("/", gameRoutes);
router.use("/", livestreamRoutes);
router.use("/", dashboardRoutes);

module.exports = router;
