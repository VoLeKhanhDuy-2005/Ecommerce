const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
  fileFilter: (req, file, fileFilterCallback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      // Check sơ bộ
      fileFilterCallback(null, true);
    } else {
      fileFilterCallback(
        new Error("Định dạng file không hợp lệ! Chỉ chấp nhận JPEG hoặc PNG."),
        false,
      );
    }
  },
});

const validateAvatar = (req, res, next) => {
  upload.single("avatar")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new Error("File quá lớn! Tối đa chỉ được 2MB."));
      }
      return next(new Error(err.message));
    }

    if (err) {
      return next(new Error(err.message));
    }

    // Không có file
    if (!req.file) {
      return next();
    }

    // Kiểm tra nội dung thật của file
    const type = await fileTypeFromBuffer(req.file.buffer);

    if (!type) {
      return next(new Error("File không hợp lệ"));
      //.txt đổi tên thành .png: fileTypeFromBuffer()
      // không nhận diện được loại file (file giả hoàn toàn) (type = undefined)
    }

    if (type.mime !== "image/jpeg" && type.mime !== "image/png") {
      return next(
        new Error("File phải là ảnh JPEG hoặc PNG thật"),
        //vd: .gif đổi tên thành .png (vẫn là GIF thật)
        // type = {
        //     ext: "gif",
        //     mime: "image/gif"
        // }
        // -> type tồn tại
        // khác whitelist -> file hợp lệ nhưng không nằm trong loại cho phép
      );
    }

    next(); // Nếu file hợp lệ, cho phép đi tiếp
  });
};

const validateCategoryImage = (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new Error("File quá lớn! Tối đa chỉ được 2MB."));
      }
      return next(new Error(err.message));
    }

    if (err) {
      return next(new Error(err.message));
    }

    if (!req.file) {
      return next();
    }

    const type = await fileTypeFromBuffer(req.file.buffer);

    if (!type) {
      return next(new Error("File không hợp lệ"));
    }

    if (
      type.mime !== "image/jpeg" &&
      type.mime !== "image/png" &&
      type.mime !== "image/webp"
    ) {
      return next(new Error("File phải là ảnh JPEG, PNG hoặc WebP thật"));
    }

    next();
  });
};

module.exports = { validateAvatar, validateCategoryImage };
