require("dotenv").config();
const express = require("express"); //commonjs
const configViewEngine = require("./config/viewEngine");
const apiRoutes = require("./routes/api");
const connection = require("./config/database");
const { getHomepage } = require("./controllers/homeController");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Order = require("./models/order");
const app = express(); //cấu hình app là express
const port = process.env.PORT || 8888;
app.use(cors({ origin: true, credentials: true })); //config cors cho phép gửi cookie
app.use(cookieParser()); //config req.cookies
app.use(express.json()); // //config req.body cho json
app.use(express.urlencoded({ extended: true })); // for form data
configViewEngine(app); //config template engine
//config route cho view ejs
const webAPI = express.Router();
webAPI.get("/", getHomepage);
app.use("/", webAPI);
//khai báo route cho API
app.use("/v1/api/", apiRoutes);
(async () => {
  try {
    await connection();

    setInterval(async () => {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const result = await Order.updateMany(
          { status: "New", createdAt: { $lte: thirtyMinutesAgo } },
          { $set: { status: "Confirmed" } }
        );
        if (result.modifiedCount > 0) {
          console.log(`[Auto-Confirm Background Job] Đã tự động xác nhận ${result.modifiedCount} đơn hàng.`);
        }
      } catch (err) {
        console.error("Lỗi trong tiến trình quét tự động xác nhận đơn hàng:", err);
      }
    }, 60000); // Quét mỗi 60 giây tự động xác nhận đơn hàng quá 30 phút

    app.listen(port, () => {
      console.log(`Backend Nodejs App listening on port ${port}`);
    });
  } catch (error) {
    console.log(">>> Error connect to DB: ", error);
  }
})();

