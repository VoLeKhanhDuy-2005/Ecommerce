const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");
const Order = require("../models/order");

const createOrder = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.createOrder(
      req.user.email,
      req.body,
    );

    if (statusCode === 201) {
      const io = req.app.get("io");
      if (io) {
        const adminRoom = io.sockets.adapter.rooms.get("admin_room");
        const adminCount = adminRoom ? adminRoom.size : 0;
        console.log(
          `[Socket] Emitting NEW_ORDER to admin_room (${adminCount} admins connected)`,
        );
        io.to("admin_room").emit("NEW_ORDER", {
          message:
            req.body.paymentMethod === "COD"
              ? "Có đơn hàng COD mới vừa được đặt!"
              : "Có đơn hàng MoMo mới đang chờ thanh toán!",
          orderId: data?.data?._id,
        });
      } else {
        console.log("[Socket] ERROR: io không tìm thấy trong app!");
      }
    }
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const verifyMomoPayment = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.verifyMomoPayment(
      req.params.id,
      req.user.email, // Tránh trường hợp người dùng lấy ID đơn hàng của người khác
    );
    if (statusCode === 200 && data?.success) {
      const io = req.app.get("io");
      if (io) {
        io.to("admin_room").emit("NEW_ORDER", {
          message: `Đơn hàng MoMo #${data.data._id} vừa được thanh toán thành công!`,
          orderId: data.data._id,
        });
        io.to(`user_${req.user.email}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Thanh toán MoMo thành công cho đơn hàng #${data.data._id}`,
        });
      }
    }
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const handleMomoIPN = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.handleMomoIPN(req.body);
    if ((statusCode === 200 || statusCode === 204) && data?.success) {
      //204 No contend
      const io = req.app.get("io");
      if (io) {
        // req.body.orderId chứa orderId từ MoMo gửi về
        const orderId = req.body.orderId || (data.data && data.data._id);
        io.to("admin_room").emit("NEW_ORDER", {
          message: `Đơn hàng MoMo #${orderId} vừa được thanh toán thành công qua IPN!`,
          orderId: orderId,
        });
        if (data.data && data.data.userEmail) {
          io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
            orderId: orderId,
            status: data.data.status || "New",
            message: `Thanh toán MoMo thành công cho đơn hàng #${orderId}`,
          });
        }
      }
    }
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
    if (statusCode === 200 && data?.success) {
      const io = req.app.get("io");
      if (io) io.to("admin_room").emit("ADMIN_REFRESH_ORDERS");
    }
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
    if (statusCode === 200 && data?.success) {
      const io = req.app.get("io");
      if (io) io.to("admin_room").emit("ADMIN_REFRESH_ORDERS");
    }
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

    if (statusCode === 200 && data?.data) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Đơn hàng #${data.data._id} của bạn đã được cập nhật trạng thái: ${data.data.status}`,
        });
      }
    }

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

    if (statusCode === 200 && data?.data) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Yêu cầu hủy đơn #${data.data._id} đã được phản hồi.`,
        });
      }
    }

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
      return res.status(403).json({
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

const requestReturn = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.requestReturn(
      req.params.id,
      req.user.email,
      req.body,
      req.files,
    );
    if (statusCode === 200 && data?.success) {
      const io = req.app.get("io");
      if (io) io.to("admin_room").emit("ADMIN_REFRESH_ORDERS");
    }
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const adminApproveReturn = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.handleReturnAction(
      req.params.id,
      "Approve",
    );

    if (statusCode === 200 && data?.data) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Yêu cầu hoàn tiền đơn #${data.data._id} đã được chấp thuận.`,
        });
      }
    }

    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const adminRejectReturn = async (req, res, next) => {
  try {
    const { rejectReason } = req.body;
    const { statusCode, ...data } = await orderService.handleReturnAction(
      req.params.id,
      "Reject",
      rejectReason,
    );

    if (statusCode === 200 && data?.data) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Yêu cầu hoàn tiền đơn #${data.data._id} đã bị từ chối. Lý do: ${rejectReason || "Không có"}`,
        });
      }
    }

    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const adminCompleteReturn = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await orderService.completeReturn(
      req.params.id,
    );

    if (statusCode === 200 && data?.data) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${data.data.userEmail}`).emit("ORDER_STATUS_UPDATED", {
          orderId: data.data._id,
          status: data.data.status,
          message: `Quá trình hoàn tiền đơn hàng #${data.data._id} đã hoàn tất.`,
        });
      }
    }

    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyMomoPayment,
  handleMomoIPN,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  markOrderAsReceived,
  getShopOrders,
  updateShopOrderStatus,
  handleShopCancelRequest,
  calculateShipping,
  exportInvoice,
  requestReturn,
  adminApproveReturn,
  adminRejectReturn,
  adminCompleteReturn,
};
