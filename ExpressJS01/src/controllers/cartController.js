const Cart = require("../models/cart");
const Product = require("../models/product");

const getCart = async (req, res) => {
  try {
    const userEmail = req.user.email;
    let cart = await Cart.findOne({ userEmail }).populate("items.product");

    // Nếu chưa có giỏ hàng, tự động tạo cart mới rỗng
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin giỏ hàng: " + error.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu productId",
      });
    }

    // Kiểm tra sản phẩm tồn tại và số lượng kho
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm này",
      });
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }

    // Tìm xem sản phẩm đã có trong giỏ chưa
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      // Đã có -> cộng thêm số lượng
      const newQuantity = cart.items[itemIndex].quantity + Number(quantity);
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // Chưa có -> thêm mới
      if (Number(quantity) > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        });
      }
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );

    res.status(200).json({
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng",
      data: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm sản phẩm vào giỏ hàng: " + error.message,
    });
  }
};

// Cập nhật số lượng của một sản phẩm trong giỏ
const updateCartItem = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu productId hoặc quantity",
      });
    }

    if (Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Số lượng sản phẩm tối thiểu là 1",
      });
    }

    // Kiểm tra tồn kho của sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    if (Number(quantity) > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Kho chỉ còn ${product.stock} sản phẩm. Vui lòng chọn lại số lượng.`,
      });
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong giỏ hàng",
      });
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );
    res.status(200).json({
      success: true,
      message: "Đã cập nhật số lượng thành công",
      data: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật giỏ hàng: " + error.message,
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu productId",
      });
    }

    const cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );
    res.status(200).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng: " + error.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const cart = await Cart.findOne({ userEmail });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa sạch giỏ hàng",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sạch giỏ hàng: " + error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
