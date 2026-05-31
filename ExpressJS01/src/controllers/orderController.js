const orderService = require("../services/orderService");

const createOrder = async (req, res) => {
  const { statusCode, ...data } = await orderService.createOrder(req.user.email, req.body);
  return res.status(statusCode).json(data);
};

const verifyMomoPayment = async (req, res) => {
  const { statusCode, ...data } = await orderService.verifyMomoPayment(req.params.id);
  return res.status(statusCode).json(data);
};

const getMyOrders = async (req, res) => {
  const { statusCode, ...data } = await orderService.getMyOrders(req.user.email);
  return res.status(statusCode).json(data);
};

const getOrderDetails = async (req, res) => {
  const { statusCode, ...data } = await orderService.getOrderDetails(req.params.id, req.user.email);
  return res.status(statusCode).json(data);
};

const cancelOrder = async (req, res) => {
  const { statusCode, ...data } = await orderService.cancelOrder(req.params.id, req.user.email, req.body.reason);
  return res.status(statusCode).json(data);
};

const markOrderAsReceived = async (req, res) => {
  const { statusCode, ...data } = await orderService.markOrderAsReceived(req.params.id, req.user.email);
  return res.status(statusCode).json(data);
};

const getShopOrders = async (req, res) => {
  const { statusCode, ...data } = await orderService.getShopOrders();
  return res.status(statusCode).json(data);
};

const updateShopOrderStatus = async (req, res) => {
  const { statusCode, ...data } = await orderService.updateShopOrderStatus(req.params.id, req.body.status);
  return res.status(statusCode).json(data);
};

const handleShopCancelRequest = async (req, res) => {
  const { statusCode, ...data } = await orderService.handleShopCancelRequest(req.params.id, req.body.action);
  return res.status(statusCode).json(data);
};

module.exports = {
  createOrder,
  verifyMomoPayment,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  markOrderAsReceived,
  getShopOrders,
  updateShopOrderStatus,
  handleShopCancelRequest,
};
