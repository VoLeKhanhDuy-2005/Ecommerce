const cartService = require("../services/cartService");

const getCart = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await cartService.getCart(req.user.email);
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await cartService.addToCart(
      req.user.email,
      req.body.productId,
      req.body.quantity,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await cartService.updateCartItem(
      req.user.email,
      req.body.productId,
      req.body.quantity,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await cartService.deleteCartItem(
      req.user.email,
      req.params.productId,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await cartService.clearCart(req.user.email);
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
