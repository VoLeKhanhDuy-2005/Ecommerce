require("dotenv").config();
const express = require("express"); //commonjs

const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const rfs = require("rotating-file-stream");

const apiRoutes = require("./routes/index");

const connection = require("./config/database");
const { initCronJobs } = require("./services/cronJobsService");

const cors = require("cors");

const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const Order = require("./models/order");

const http = require("http");
const { Server } = require("socket.io");

const app = express(); //cấu hình app là express
app.set("trust proxy", 1); // Trust first proxy (Render) for rate limiting behind load balancers
const port = process.env.PORT || 8888;
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
//config cors cho phép từ trình duyệt gửi thông tin xác thực (cookie, Authorization headers ,...)
//trong các req đến server

const logDirectory = path.join(__dirname, "../logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const pad = (num) => (num > 9 ? "" : "0") + num;
const generator = (time) => {
  if (!time) time = new Date();
  const year = time.getFullYear();
  const month = pad(time.getMonth() + 1);
  const day = pad(time.getDate());
  return `${year}-${month}-${day}-access.log`;
};

const accessLogStream = rfs.createStream(generator, {
  interval: "1d", // rotate daily
  path: logDirectory,
});
app.use(morgan("combined", { stream: accessLogStream }));
/*
  ":referrer": Ghi lại địa chỉ trang web trước đó mà người dùng đã bấm vào để dẫn tới trang hiện tại
   (lấy từ HTTP Referer header)
  ":user-agent": Ghi lại chuỗi định danh của trình duyệt, hệ điều hành hoặc công cụ (như Postman, cURL)
    đang gửi yêu cầu (lấy từ HTTP User-Agent header)
*/

app.use(cookieParser()); //config req.cookies
app.use(express.json()); //config req.body cho json
app.use(express.urlencoded({ extended: true })); // for form data

//khai báo route cho API
app.use("/v1/api/", apiLimiter, apiRoutes);
app.use(errorHandler);
(async () => {
  try {
    await connection();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        //cho phép trình duyệt gửi HTTP request bằng hai phương thức GET và POST đến Socket.IO server
        //thực hiện HTTP handshake trước khi chuyển sang kết nối WebSocket
        credentials: true, // Cho phép gửi cookie (withCredentials: true) từ phía client
      },
    });
    app.set("io", io); //Lưu instance io vào Express App

    initCronJobs(app);

    io.on("connection", (socket) => {
      console.log("Client connected via Socket.io:", socket.id);

      socket.on("JOIN_USER_ROOM", (userIdOrEmail) => {
        if (userIdOrEmail) {
          socket.join(`user_${userIdOrEmail}`);
          console.log(`Socket ${socket.id} joined room: user_${userIdOrEmail}`);
        }
      });

      socket.on("JOIN_ADMIN_ROOM", () => {
        socket.join("admin_room");
        const roomSize = io.sockets.adapter.rooms.get("admin_room")?.size || 0;
        console.log(
          `[Socket] ${socket.id} joined admin_room (total in room: ${roomSize})`,
        );
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`Backend Nodejs App listening on port ${port}`);
    });
  } catch (error) {
    console.log(">>> Error connect to DB: ", error);
  }
})();
