const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Hợp lệ, cho phép đi tiếp
  } else {
    return res.status(403).json({
      success: false,
      message: "Truy cập bị từ chối: Bạn không có quyền Quản trị viên.",
    });
  }
};
module.exports = isAdmin;
