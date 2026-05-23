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

// Helper gửi request HTTPS POST
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
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: "Failed to parse JSON response: " + body });
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

const createOrder = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { customerName, phoneNumber, shippingAddress, paymentMethod, items } =
      req.body;

    if (
      !customerName ||
      !phoneNumber ||
      !shippingAddress ||
      !paymentMethod ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin giao hàng và chọn món ăn.",
      });
    }

    // Kiểm tra tồn kho và lấy chi tiết sản phẩm
    let totalAmount = 0;
    const verifiedItems = [];
    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm ${item.name}`,
        });
      }
      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${dbProduct.name}" không đủ số lượng trong kho (Còn: ${dbProduct.stock}).`,
        });
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

    // Trừ tồn hàng của từng sản phẩm
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

    // Nếu thanh toán bằng COD, xóa giỏ hàng ngay lập tức
    if (paymentMethod === "COD") {
      const cart = await Cart.findOne({ userEmail });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      return res.status(201).json({
        success: true,
        message: "Đặt đơn hàng COD thành công!",
        data: newOrder,
      });
    }

    // Nếu thanh toán qua MOMO, khởi tạo liên kết thanh toán MoMo Sandbox
    if (paymentMethod === "MOMO") {
      const orderId = newOrder._id.toString();
      const requestId = orderId + "_" + Date.now(); // Tạo request id độc nhất cho MoMo
      const orderInfo = `Thanh toan don hang #${orderId} tai Food Shop`;
      const redirectUrl = "http://localhost:5173/orders";
      const ipnUrl = "https://example-ipn.vn/ipn"; // URL callback thực tế (ở localhost dùng fake)
      const extraData = "";

      // Tạo chữ ký số HMAC-SHA256 theo tài liệu MoMo
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
          // Lưu momoRequestId để tra cứu trạng thái sau này
          newOrder.momoRequestId = requestId;
          await newOrder.save();

          return res.status(201).json({
            success: true,
            message: "Tạo liên kết thanh toán MoMo thành công!",
            data: newOrder,
            payUrl: momoRes.payUrl, // Gửi link thanh toán về cho React
          });
        } else {
          // Tăng lại tồn kho nếu gọi MoMo thất bại
          for (const item of verifiedItems) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity, sold: -item.quantity },
            });
          }
          await Order.findByIdAndDelete(newOrder._id);

          return res.status(400).json({
            success: false,
            message:
              "Khởi tạo thanh toán MoMo thất bại: " +
              (momoRes.message || "Lỗi không xác định"),
          });
        }
      } catch (err) {
        // Tăng lại tồn kho nếu gọi MoMo thất bại
        for (const item of verifiedItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, sold: -item.quantity },
          });
        }
        await Order.findByIdAndDelete(newOrder._id);

        return res.status(500).json({
          success: false,
          message: "Lỗi kết nối đến cổng thanh toán MoMo: " + err.message,
        });
      }
    }

    res.status(400).json({
      success: false,
      message: "Phương thức thanh toán không được hỗ trợ",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng: " + error.message,
    });
  }
};

const verifyMomoPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng để xác thực",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Đơn hàng đã được thanh toán trước đó.",
        data: order,
      });
    }

    const orderId = order._id.toString();
    const requestId = order.momoRequestId || orderId;

    // Ký số yêu cầu tra cứu giao dịch MoMo
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;
    const signature = crypto
      .createHmac("sha256", MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    const momoPayload = {
      partnerCode: MOMO_PARTNER_CODE,
      requestId,
      orderId,
      signature,
    };

    const queryRes = await postHTTPS(MOMO_QUERY_ENDPOINT, momoPayload);

    // resultCode = 0 có nghĩa là thanh toán thành công
    if (queryRes && queryRes.resultCode === 0) {
      // 1. Cập nhật trạng thái đơn hàng trực tiếp
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: { paymentStatus: "Paid" } },
        { new: true },
      );

      const userEmail = order.userEmail;
      await Cart.updateOne({ userEmail }, { $set: { items: [] } });

      return res.status(200).json({
        success: true,
        message: "Thanh toán qua MoMo thành công!",
        data: updatedOrder,
      });
    } else {
      // Nếu MoMo báo giao dịch thất bại/hủy hoặc người dùng chưa hoàn thành
      const msg = queryRes.message || "Giao dịch chưa hoàn tất hoặc thất bại";

      const failedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: { paymentStatus: "Failed" } },
        { new: true },
      );

      return res.status(400).json({
        success: false,
        message: `Xác thực giao dịch MoMo thất bại: ${msg}`,
        resultCode: queryRes.resultCode,
        data: failedOrder,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi xác thực MoMo: " + error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userEmail = req.user.email;
    // Tự động cập nhật các đơn hàng trạng thái 'New' quá 30 phút sang 'Confirmed'
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    //const thirtyMinutesAgo = new Date(Date.now() - 30 * 1000); // 30 * 1000 ms = 30 giây
    await Order.updateMany(
      {
        userEmail,
        status: "New",
        createdAt: { $lte: thirtyMinutesAgo },
      },
      {
        $set: { status: "Confirmed" },
      },
    );

    const orders = await Order.find({ userEmail }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách đơn hàng: " + error.message,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    // Kiểm tra và cập nhật tự động cho đơn hàng này nếu là 'New' và quá 30 phút
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    if (order.status === "New") {
      const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
      if (orderAgeMs > 30 * 60 * 1000) {//if (orderAgeMs > 30 * 1000) {
        order.status = "Confirmed";
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi chi tiết đơn hàng: " + error.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userEmail = req.user.email;

    const order = await Order.findOne({ _id: id, userEmail });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng của bạn",
      });
    }

    // Kiểm tra xem đơn hàng đã đặt quá 30 phút chưa
    const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
    const isWithin30Mins = orderAgeMs <= 30 * 60 * 1000;

    if (!isWithin30Mins) {
      return res.status(400).json({
        success: false,
        message:
          "Đã quá 30 phút kể từ lúc đặt hàng. Bạn không thể tự hủy hoặc gửi yêu cầu hủy đơn này.",
      });
    }

    if (order.status === "New" || order.status === "Confirmed") {
      order.status = "Cancelled";
      order.cancelReason = reason || "Người dùng tự hủy đơn";
      await order.save();

      // Trả lại kho số lượng sản phẩm
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Đơn hàng đã được hủy thành công.",
        data: order,
      });
    } else if (order.status === "Preparing") {
      // Chuyển sang gửi yêu cầu hủy đơn cho shop duyệt
      order.cancelRequest = true;
      order.cancelReason = reason || "Yêu cầu hủy từ khách hàng";
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Đã gửi Yêu cầu hủy đơn hàng cho shop chuẩn bị hàng duyệt.",
        data: order,
      });
    } else if (order.status === "Shipping" || order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đang giao hoặc đã giao, không thể hủy.",
      });
    } else if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng này đã bị hủy trước đó.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đơn hàng: " + error.message,
    });
  }
};

// ==========================================
// CÁC ENDPOINT GIẢ LẬP SHOP (SIMULATOR API)
const getShopOrders = async (req, res) => {
  try {
    // Tự động cập nhật các đơn hàng trạng thái 'New' quá 30 phút sang 'Confirmed' của toàn hệ thống
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    //const thirtyMinutesAgo = new Date(Date.now() - 30 * 1000);
    await Order.updateMany(
      { status: "New", createdAt: { $lte: thirtyMinutesAgo } },
      { $set: { status: "Confirmed" } },
    );

    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách đơn hàng: " + error.message,
    });
  }
};

const updateShopOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = [
      "New",
      "Confirmed",
      "Preparing",
      "Shipping",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ.",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const oldStatus = order.status;
    order.status = status;

    // Nếu đổi sang Cancelled, trả hàng về kho
    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }
    }

    // Nếu đổi từ Cancelled sang trạng thái khác (trường hợp admin reset trạng thái)
    if (oldStatus === "Cancelled" && status !== "Cancelled") {
      // Trừ hàng khỏi kho trở lại (nếu đủ kho)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, sold: item.quantity },
        });
      }
    }

    // Nếu shop giao thành công, tự động cập nhật thanh toán thành Paid
    if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    await order.save();
    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng thành: ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật trạng thái đơn hàng: " + error.message,
    });
  }
};

const handleShopCancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' hoặc 'reject'

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    if (!order.cancelRequest) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng này không có yêu cầu hủy.",
      });
    }

    if (action === "approve") {
      order.status = "Cancelled";
      order.cancelRequest = false;
      order.cancelReason = order.cancelReason || "Shop chấp nhận yêu cầu hủy";
      await order.save();

      // Hoàn trả tồn kho
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Đã phê duyệt và HỦY đơn hàng thành công.",
        data: order,
      });
    } else if (action === "reject") {
      order.cancelRequest = false; // Bỏ cờ yêu cầu hủy, giữ nguyên trạng thái Preparing
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Đã TỪ CHỐI yêu cầu hủy đơn hàng. Đơn hàng tiếp tục chuẩn bị.",
        data: order,
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Hành động duyệt không hợp lệ. Chỉ chấp nhận 'approve' hoặc 'reject'",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý duyệt yêu cầu hủy: " + error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyMomoPayment,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getShopOrders,
  updateShopOrderStatus,
  handleShopCancelRequest,
};
