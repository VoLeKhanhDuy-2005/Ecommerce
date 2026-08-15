const Product = require("../models/product");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { shuffle } = require("../utils/mathUtils");

const getFoodQuestion = async (req, res) => {
  try {
    // Lấy ngẫu nhiên 1 sản phẩm có ít nhất 1 hình ảnh
    const correctProducts = await Product.aggregate([
      { $match: { "images.0": { $exists: true } } },
      { $sample: { size: 1 } },
    ]);

    if (correctProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm nào để tạo câu hỏi",
      });
    }

    const correctProduct = correctProducts[0];

    // Lấy ngẫu nhiên 3 sản phẩm khác làm câu trả lời sai
    const wrongProducts = await Product.aggregate([
      { $match: { _id: { $ne: correctProduct._id } } },
      { $sample: { size: 3 } },
    ]);

    // Tạo danh sách lựa chọn
    let options = [
      { name: correctProduct.name, isCorrect: true },
      ...wrongProducts.map((p) => ({ name: p.name, isCorrect: false })),
    ];

    // Xáo trộn ngẫu nhiên các lựa chọn
    options = shuffle(options);

    // Chỉ lấy tên để gửi về client (không gửi isCorrect)
    const optionNames = options.map((o) => o.name);

    // Tạo token chứa ID sản phẩm đúng
    const token = jwt.sign(
      { productId: correctProduct._id },
      process.env.JWT_SECRET || "secret-key-for-game",
      { expiresIn: "5m" },
    );

    return res.status(200).json({
      success: true,
      data: {
        image: correctProduct.images[0],
        options: optionNames,
        token,
      },
    });
  } catch (error) {
    console.error("Lỗi getFoodQuestion:", error);
    return res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

const submitGameAnswer = async (req, res) => {
  try {
    const { token, answer } = req.body;
    const userEmail = req.user.email; // Lấy từ middleware auth

    if (!token || !answer) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }

    // Giải mã token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret-key-for-game",
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Lấy tên sản phẩm đúng từ DB
    const correctProduct = await Product.findById(decoded.productId);
    if (!correctProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm gốc",
      });
    }

    const isCorrect = correctProduct.name === answer;
    let coinsEarned = 0;
    if (isCorrect) {
      coinsEarned = 1;
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          $inc: { coins: coinsEarned },
        },
      );
    }
    return res.status(200).json({
      success: true,
      isCorrect,
      correctName: correctProduct.name,
      coinsEarned,
    });
  } catch (error) {
    console.error("Lỗi submitGameAnswer:", error);
    return res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

module.exports = {
  getFoodQuestion,
  submitGameAnswer,
};
