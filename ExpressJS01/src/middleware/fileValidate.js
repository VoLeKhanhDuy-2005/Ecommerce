const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
  fileFilter: (req, file, fileFilterCallback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      fileFilterCallback(null, true);
    } else {
      fileFilterCallback(
        new Error(
          "Định dạng file không hợp lệ! Chỉ chấp nhận JPEG, PNG hoặc WebP.",
        ),
        false,
      );
    }
  },
});

const validateImage = (
  fieldName,
  maxCount = 1,
  allowedMimes = ["image/jpeg", "image/png"],
) => {
  return (req, res, next) => {
    const uploader =
      maxCount === 1
        ? upload.single(fieldName)
        : upload.array(fieldName, maxCount);
    uploader(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new Error("Một hoặc nhiều file quá lớn! Tối đa chỉ được 2MB."),
          );
        }
        return next(new Error(err.message));
      }
      if (err) return next(new Error(err.message));

      const files = req.files ? req.files : req.file ? [req.file] : [];
      if (files.length === 0) return next();

      for (let file of files) {
        const type = await fileTypeFromBuffer(file.buffer);
        if (!type)
          return next(
            new Error(
              "File không hợp lệ (không thể xác định nội dung file thật).",
            ),
          );
        if (!allowedMimes.includes(type.mime)) {
          return next(
            new Error(
              `File phải là một trong các định dạng ảnh thật: ${allowedMimes.map((m) => m.replace("image/", "")).join(", ")}`,
            ),
          );
        }
      }

      next();
    });
  };
};

const validateAvatar = validateImage("avatar", 1, ["image/jpeg", "image/png"]);
const validateCategoryImage = validateImage("image", 1, [
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const validateProductImages = validateImage("images", 5, [
  "image/jpeg",
  "image/png",
  "image/webp",
]);

module.exports = {
  validateAvatar,
  validateCategoryImage,
  validateProductImages,
};
