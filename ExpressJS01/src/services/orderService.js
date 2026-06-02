const Order = require("../models/order");
const Product = require("../models/product");
const Cart = require("../models/cart");
const crypto = require("crypto");
const https = require("https");

// Ref Tích hợp MoMo: https://www.youtube.com/watch?v=ZlvwqtfCEUM
// Test Visa:
// Name: NGUYEN VAN A
// 4111 1111 1111 1111
// 05/26
// CSV: 111

// MoMo Sandbox Credentials
const MOMO_PARTNER_CODE = "MOMO";
const MOMO_ACCESS_KEY = "F8BBA842ECF85";
const MOMO_SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_CREATE_ENDPOINT =
  "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_QUERY_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/query";

const postHTTPS = (url, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      // là bất đồng bộ -> không trả kết quả ngay, không muốn block luồng chính -> Promise
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject({ error: "Failed to parse JSON response: " + body });
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

const createOrder = async (userEmail, payload) => {
  try {
    const { customerName, phoneNumber, shippingAddress, paymentMethod, items } =
      payload;

    if (
      !customerName ||
      !phoneNumber ||
      !shippingAddress ||
      !paymentMethod ||
      !items ||
      items.length === 0
    ) {
      return {
        statusCode: 400,
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin giao hàng và chọn món ăn.",
      };
    }

    let totalAmount = 0;
    const verifiedItems = [];
    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return {
          statusCode: 404,
          success: false,
          message: `Không tìm thấy sản phẩm ${item.name}`,
        };
      }
      if (dbProduct.stock < item.quantity) {
        return {
          statusCode: 400,
          success: false,
          message: `Sản phẩm "${dbProduct.name}" không đủ số lượng trong kho (Còn: ${dbProduct.stock}).`,
        };
      }
      const currentPrice =
        dbProduct.discountPrice && dbProduct.discountPrice > 0
          ? dbProduct.discountPrice
          : dbProduct.price;
      const itemSubtotal = currentPrice * item.quantity;
      totalAmount += itemSubtotal;
      verifiedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: currentPrice,
        quantity: item.quantity,
        image:
          dbProduct.images && dbProduct.images[0] ? dbProduct.images[0] : "",
      });
    }

    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    const orderData = {
      userEmail,
      customerName,
      phoneNumber,
      shippingAddress,
      items: verifiedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      status: "New",
    };
    const newOrder = await Order.create(orderData);

    if (paymentMethod === "COD") {
      const cart = await Cart.findOne({ userEmail });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
      return {
        statusCode: 201,
        success: true,
        message: "Đặt đơn hàng COD thành công!",
        data: newOrder,
      };
    }

    if (paymentMethod === "MOMO") {
      const orderId = newOrder._id.toString();
      const requestId = orderId + "_" + Date.now();
      const orderInfo = `Thanh toan don hang #${orderId} tai Food Shop`;
      const redirectUrl = "http://localhost:5173/orders";
      const ipnUrl = "https://example-ipn.vn/ipn";
      const extraData = "";

      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${totalAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
      const signature = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

      const momoPayload = {
        partnerCode: MOMO_PARTNER_CODE,
        partnerName: "Food Shop",
        storeId: "MomoTestStore",
        requestId,
        amount: totalAmount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: "vi",
        extraData,
        requestType: "payWithMethod",
        signature,
      };

      try {
        const momoRes = await postHTTPS(MOMO_CREATE_ENDPOINT, momoPayload);
        if (momoRes && momoRes.payUrl) {
          newOrder.momoRequestId = requestId;
          await newOrder.save();
          return {
            statusCode: 201,
            success: true,
            message: "Tạo liên kết thanh toán MoMo thành công!",
            data: newOrder,
            payUrl: momoRes.payUrl,
          };
        } else {
          for (const item of verifiedItems) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity, sold: -item.quantity },
            });
          }
          await Order.findByIdAndDelete(newOrder._id);
          return {
            statusCode: 400,
            success: false,
            message:
              "Khởi tạo thanh toán MoMo thất bại: " +
              (momoRes.message || "Lỗi không xác định"),
          };
        }
      } catch (err) {
        for (const item of verifiedItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, sold: -item.quantity },
          });
        }
        await Order.findByIdAndDelete(newOrder._id);
        return {
          statusCode: 500,
          success: false,
          message: "Lỗi kết nối đến cổng thanh toán MoMo: " + err.message,
        };
      }
    }

    return {
      statusCode: 400,
      success: false,
      message: "Phương thức thanh toán không được hỗ trợ",
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi tạo đơn hàng: " + error.message,
    };
  }
};

const verifyMomoPayment = async (orderIdParams) => {
  try {
    const order = await Order.findById(orderIdParams);
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng để xác thực",
      };
    }
    if (order.paymentStatus === "Paid") {
      return {
        statusCode: 200,
        success: true,
        message: "Đơn hàng đã được thanh toán trước đó.",
        data: order,
      };
    }

    const orderIdStr = order._id.toString();
    const requestId = order.momoRequestId || orderIdStr;

    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderIdStr}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;
    const signature = crypto
      .createHmac("sha256", MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    const momoPayload = {
      partnerCode: MOMO_PARTNER_CODE,
      requestId,
      orderId: orderIdStr,
      signature,
    };

    const queryRes = await postHTTPS(MOMO_QUERY_ENDPOINT, momoPayload);

    if (queryRes && queryRes.resultCode === 0) {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderIdParams,
        { $set: { paymentStatus: "Paid" } },
        { new: true },
      );
      await Cart.updateOne(
        { userEmail: order.userEmail },
        { $set: { items: [] } },
      );
      return {
        statusCode: 200,
        success: true,
        message: "Thanh toán qua MoMo thành công!",
        data: updatedOrder,
      };
    } else {
      const msg = queryRes.message || "Giao dịch chưa hoàn tất hoặc thất bại";
      const failedOrder = await Order.findByIdAndUpdate(
        orderIdParams,
        { $set: { paymentStatus: "Failed" } },
        { new: true },
      );
      return {
        statusCode: 400,
        success: false,
        message: `Xác thực giao dịch MoMo thất bại: ${msg}`,
        resultCode: queryRes.resultCode,
        data: failedOrder,
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi hệ thống khi xác thực MoMo: " + error.message,
    };
  }
};

const getMyOrders = async (userEmail) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Order.updateMany(
      { userEmail, status: "New", createdAt: { $lte: thirtyMinutesAgo } },
      { $set: { status: "Confirmed" } },
    );
    const orders = await Order.find({ userEmail }).sort({ createdAt: -1 });
    return { statusCode: 200, success: true, data: orders };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách đơn hàng: " + error.message,
    };
  }
};

const getOrderDetails = async (orderIdParams, userEmail) => {
  try {
    const order = await Order.findById(orderIdParams);
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng",
      };
    }
    if (order.status === "New") {
      const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
      if (orderAgeMs > 30 * 60 * 1000) {
        order.status = "Confirmed";
        await order.save();
      }
    }
    return { statusCode: 200, success: true, data: order };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi chi tiết đơn hàng: " + error.message,
    };
  }
};

const cancelOrder = async (orderIdParams, userEmail, reason) => {
  try {
    const order = await Order.findOne({ _id: orderIdParams, userEmail });
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng của bạn",
      };
    }
    const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
    const isWithin30Mins = orderAgeMs <= 30 * 60 * 1000;
    if (!isWithin30Mins) {
      return {
        statusCode: 400,
        success: false,
        message:
          "Đã quá 30 phút kể từ lúc đặt hàng. Bạn không thể tự hủy hoặc gửi yêu cầu hủy đơn này.",
      };
    }
    if (order.status === "New" || order.status === "Confirmed") {
      order.status = "Cancelled";
      order.cancelReason = reason || "Người dùng tự hủy đơn";
      await order.save();
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }
      return {
        statusCode: 200,
        success: true,
        message: "Đơn hàng đã được hủy thành công.",
        data: order,
      };
    } else if (order.status === "Preparing") {
      order.cancelRequest = true;
      order.cancelReason = reason || "Yêu cầu hủy từ khách hàng";
      await order.save();
      return {
        statusCode: 200,
        success: true,
        message: "Đã gửi Yêu cầu hủy đơn hàng cho shop chuẩn bị hàng duyệt.",
        data: order,
      };
    } else if (order.status === "Shipping" || order.status === "Delivered") {
      return {
        statusCode: 400,
        success: false,
        message: "Đơn hàng đang giao hoặc đã giao, không thể hủy.",
      };
    } else if (order.status === "Cancelled") {
      return {
        statusCode: 400,
        success: false,
        message: "Đơn hàng này đã bị hủy trước đó.",
      };
    }
    return {
      statusCode: 400,
      success: false,
      message: "Trạng thái đơn hàng không cho phép hủy",
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi hủy đơn hàng: " + error.message,
    };
  }
};

const markOrderAsReceived = async (orderIdParams, userEmail) => {
  try {
    const order = await Order.findOne({ _id: orderIdParams, userEmail });
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng của bạn",
      };
    }

    if (order.status !== "Shipping") {
      return {
        statusCode: 400,
        success: false,
        message: "Chỉ có thể xác nhận đã nhận khi đơn hàng đang được giao (Shipping).",
      };
    }

    order.status = "Delivered";
    order.paymentStatus = "Paid"; // Đánh dấu đã thanh toán khi nhận hàng thành công
    await order.save();

    return {
      statusCode: 200,
      success: true,
      message: "Bạn đã xác nhận nhận hàng thành công!",
      data: order,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi xác nhận nhận hàng: " + error.message,
    };
  }
};

const getShopOrders = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Order.updateMany(
      { status: "New", createdAt: { $lte: thirtyMinutesAgo } },
      { $set: { status: "Confirmed" } },
    );
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return { statusCode: 200, success: true, data: orders };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách đơn hàng: " + error.message,
    };
  }
};

const updateShopOrderStatus = async (orderIdParams, status) => {
  try {
    const validStatus = [
      "New",
      "Confirmed",
      "Preparing",
      "Shipping",
      "Cancelled",
    ];
    if (!validStatus.includes(status)) {
      return {
        statusCode: 400,
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ.",
      };
    }
    const order = await Order.findById(orderIdParams);
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng",
      };
    }
    const oldStatus = order.status;
    order.status = status;
    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }
    }
    if (oldStatus === "Cancelled" && status !== "Cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, sold: item.quantity },
        });
      }
    }
    await order.save();
    return {
      statusCode: 200,
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng thành: ${status}`,
      data: order,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi cập nhật trạng thái đơn hàng: " + error.message,
    };
  }
};

const handleShopCancelRequest = async (orderIdParams, action) => {
  try {
    const order = await Order.findById(orderIdParams);
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng",
      };
    }
    if (!order.cancelRequest) {
      return {
        statusCode: 400,
        success: false,
        message: "Đơn hàng này không có yêu cầu hủy.",
      };
    }
    if (action === "approve") {
      order.status = "Cancelled";
      order.cancelRequest = false;
      order.cancelReason = order.cancelReason || "Shop chấp nhận yêu cầu hủy";
      await order.save();
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }
      return {
        statusCode: 200,
        success: true,
        message: "Đã phê duyệt và HỦY đơn hàng thành công.",
        data: order,
      };
    } else if (action === "reject") {
      order.cancelRequest = false;
      await order.save();
      return {
        statusCode: 200,
        success: true,
        message: "Đã TỪ CHỐI yêu cầu hủy đơn hàng. Đơn hàng tiếp tục chuẩn bị.",
        data: order,
      };
    } else {
      return {
        statusCode: 400,
        success: false,
        message:
          "Hành động duyệt không hợp lệ. Chỉ chấp nhận 'approve' hoặc 'reject'",
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi xử lý duyệt yêu cầu hủy: " + error.message,
    };
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
};
