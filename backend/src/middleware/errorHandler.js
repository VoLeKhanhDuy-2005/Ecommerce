function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Lỗi server";
  const data = err.data || null;

  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

module.exports = errorHandler;
