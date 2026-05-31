const Cart = require("../models/cart");
const Product = require("../models/product");

const getCart = async (userEmail) => {
  try {
    let cart = await Cart.findOne({ userEmail }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }
    return { statusCode: 200, success: true, data: cart };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi lấy thông tin giỏ hàng: " + error.message,
    };
  }
};

const addToCart = async (userEmail, productId, quantity = 1) => {
  try {
    if (!productId) {
      return { statusCode: 400, success: false, message: "Thiếu productId" };
    }
    const product = await Product.findById(productId);
    if (!product) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy sản phẩm này",
      };
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + Number(quantity);
      if (newQuantity > product.stock) {
        return {
          statusCode: 400,
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        };
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      if (Number(quantity) > product.stock) {
        return {
          statusCode: 400,
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        };
      }
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );

    return {
      statusCode: 200,
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng",
      data: updatedCart,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi thêm sản phẩm vào giỏ hàng: " + error.message,
    };
  }
};

const updateCartItem = async (userEmail, productId, quantity) => {
  try {
    if (!productId || quantity === undefined) {
      return {
        statusCode: 400,
        success: false,
        message: "Thiếu productId hoặc quantity",
      };
    }

    if (Number(quantity) < 1) {
      return {
        statusCode: 400,
        success: false,
        message: "Số lượng sản phẩm tối thiểu là 1",
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    if (Number(quantity) > product.stock) {
      return {
        statusCode: 400,
        success: false,
        message: `Kho chỉ còn ${product.stock} sản phẩm. Vui lòng chọn lại số lượng.`,
      };
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return {
        statusCode: 404,
        success: false,
        message: "Giỏ hàng không tồn tại",
      };
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      return {
        statusCode: 404,
        success: false,
        message: "Sản phẩm không có trong giỏ hàng",
      };
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );
    return {
      statusCode: 200,
      success: true,
      message: "Đã cập nhật số lượng thành công",
      data: updatedCart,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi cập nhật giỏ hàng: " + error.message,
    };
  }
};

const deleteCartItem = async (userEmail, productId) => {
  try {
    if (!productId) {
      return { statusCode: 400, success: false, message: "Thiếu productId" };
    }

    const cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return {
        statusCode: 404,
        success: false,
        message: "Giỏ hàng không tồn tại",
      };
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );
    return {
      statusCode: 200,
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: updatedCart,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng: " + error.message,
    };
  }
};

const clearCart = async (userEmail) => {
  try {
    const cart = await Cart.findOne({ userEmail });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return { statusCode: 200, success: true, message: "Đã xóa sạch giỏ hàng" };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi xóa sạch giỏ hàng: " + error.message,
    };
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
