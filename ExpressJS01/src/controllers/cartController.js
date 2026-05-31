const cartService = require("../services/cartService");

const getCart = async (req, res) => {
  const { statusCode, ...data } = await cartService.getCart(req.user.email);
  return res.status(statusCode).json(data);
};

const addToCart = async (req, res) => {
  const { statusCode, ...data } = await cartService.addToCart(
    req.user.email,
    req.body.productId,
    req.body.quantity
  );
  return res.status(statusCode).json(data);
};

const updateCartItem = async (req, res) => {
  const { statusCode, ...data } = await cartService.updateCartItem(
    req.user.email,
    req.body.productId,
    req.body.quantity
  );
  return res.status(statusCode).json(data);
};

const deleteCartItem = async (req, res) => {
  const { statusCode, ...data } = await cartService.deleteCartItem(
    req.user.email,
    req.params.productId
  );
  return res.status(statusCode).json(data);
};

const clearCart = async (req, res) => {
  const { statusCode, ...data } = await cartService.clearCart(req.user.email);
  return res.status(statusCode).json(data);
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
