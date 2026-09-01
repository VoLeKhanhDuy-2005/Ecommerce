const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Định dạng log cho Console (dễ đọc)
const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }), // Hiển thị stack trace nếu có lỗi
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

// Định dạng log cho File (chuẩn JSON để hệ thống khác dễ đọc)
const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const logDirectory = path.join(__dirname, "../../logs");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    // Ghi log ra màn hình console
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Ghi log ra file, rotate mỗi ngày
    new DailyRotateFile({
      filename: path.join(logDirectory, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true, // Nén file cũ
      maxSize: "20m", // Kích thước tối đa mỗi file
      maxFiles: "14d", // Giữ log tối đa 14 ngày
      format: fileFormat,
      level: "info",
    }),
    // Tách riêng file log cho Error để dễ dò
    new DailyRotateFile({
      filename: path.join(logDirectory, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
      level: "error",
    }),
  ],
});

module.exports = logger;
