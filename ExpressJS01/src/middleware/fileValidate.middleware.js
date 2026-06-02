const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: (req, file, fileFilterCallback) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            fileFilterCallback(null, true);
        } else {
            fileFilterCallback(new Error('Định dạng file không hợp lệ! Chỉ chấp nhận JPEG hoặc PNG.'), false);
        }
    }
});

const validateAvatar = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new Error("File quá lớn! Tối đa chỉ được 2MB."));
            }
            return next(new Error(err.message));
        } else if (err) {
            return next(new Error(err.message));
        }
        next(); // Nếu file hợp lệ, cho phép đi tiếp
    });
};

module.exports = { validateAvatar };