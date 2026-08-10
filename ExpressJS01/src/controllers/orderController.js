const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");
const Order = require("../models/order");

const createOrder = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.createOrder(
      req.user.email,
      req.body,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const verifyMomoPayment = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.verifyMomoPayment(
      req.params.id,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.getMyOrders(
      req.user.email,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getOrderDetails = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.getOrderDetails(
      req.params.id,
      req.user.email,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.cancelOrder(
      req.params.id,
      req.user.email,
      req.body.reason,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const markOrderAsReceived = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.markOrderAsReceived(
      req.params.id,
      req.user.email,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getShopOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "All";
    const { statusCode, ...data } = await orderService.getShopOrders(
      page,
      limit,
      status,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const updateShopOrderStatus = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.updateShopOrderStatus(
      req.params.id,
      req.body.status,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const handleShopCancelRequest = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.handleShopCancelRequest(
      req.params.id,
      req.body.action,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const calculateShipping = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const { statusCode, ...data } = await orderService.calculateShipping(
      lat,
      lng,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const exportInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.userEmail !== req.user.email && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Bạn không có quyền truy cập hóa đơn này",
        });
    }

    const pdfBuffer = await invoiceService.generateInvoicePDF(order);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
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
  calculateShipping,
  exportInvoice,
};
