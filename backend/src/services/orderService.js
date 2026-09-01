const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const UserVoucher = require("../models/userVoucher");
const cartService = require("./cartService");
const settingService = require("./settingService");
const fileService = require("./fileService");
const emailService = require("./emailService");
const crypto = require("crypto");
const https = require("https");

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadian = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRadian(lat2 - lat1);
  const dLon = toRadian(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(lat1)) *
      Math.cos(toRadian(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateShippingLogic = async (distanceKm) => {
  let fee = 0;
  if (distanceKm > 0) {
    let baseFee = 15000;
    let baseDistance = 3;
    let extraFeePerKm = 5000;

    const res = await settingService.getSettings();
    if (res && res.success && res.data && res.data.default_shipping_fee) {
      baseFee = res.data.default_shipping_fee.baseFee ?? baseFee;
      baseDistance = res.data.default_shipping_fee.baseDistance ?? baseDistance;
      extraFeePerKm =
        res.data.default_shipping_fee.extraFeePerKm ?? extraFeePerKm;
    }

    if (distanceKm <= baseDistance) {
      fee = baseFee;
    } else {
      fee = baseFee + Math.ceil(distanceKm - baseDistance) * extraFeePerKm;
    }
  }
  return fee;
};

// Ref Tích hợp MoMo: https://www.youtube.com/watch?v=ZlvwqtfCEUM
// Test ATM:
// Name: NGUYEN VAN A
// 9704 0000 0000 0018
// 03/07
// OTP: 000000

// MoMo Sandbox Credentials
const MOMO_PARTNER_CODE = "MOMO";
const MOMO_ACCESS_KEY = "F8BBA842ECF85";
const MOMO_SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_CREATE_ENDPOINT =
  "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_QUERY_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/query";
const MOMO_REFUND_ENDPOINT =
  "https://test-payment.momo.vn/v2/gateway/api/refund";

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
        } catch {
          reject({ error: "Failed to parse JSON response: " + body });
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    // Add a 30-second timeout to prevent indefinite hanging if MoMo Sandbox is slow/down
    req.setTimeout(30000, () => {
      req.destroy();
      reject(
        new Error(
          "Timeout khi kết nối đến MoMo API (Sandbox có thể đang quá tải).",
        ),
      );
    });

    req.write(postData);
    req.end();
  });
};

const createOrder = async (userEmail, payload) => {
  try {
    const {
      customerName,
      phoneNumber,
      shippingAddress,
      paymentMethod,
      items,
      lat,
      lng,
      voucherId,
      note,
    } = payload;

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

    let shippingFee = 0;
    let distance = 0;
    let deliveryCoordinates = null;

    if (lat && lng) {
      // Lấy cấu hình vị trí cửa hàng
      const settingsRes = await settingService.getSettings();
      const storeLoc = settingsRes.data.store_location;

      distance = calculateDistance(
        storeLoc.lat,
        storeLoc.lng,
        parseFloat(lat),
        parseFloat(lng),
      );
      shippingFee = await calculateShippingLogic(distance);
      deliveryCoordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    let discountAmount = 0;
    let appliedVoucherId = null;
    let userVoucherRecord = null;

    if (voucherId) {
      userVoucherRecord = await UserVoucher.findOne({
        voucher: voucherId,
        userEmail,
        isUsed: false,
      }).populate("voucher");

      if (userVoucherRecord && userVoucherRecord.voucher) {
        const voucher = userVoucherRecord.voucher;
        if (voucher.isActive && new Date(voucher.expirationDate) > new Date()) {
          if (totalAmount >= voucher.minOrderValue) {
            appliedVoucherId = voucher._id;

            if (voucher.type === "DISCOUNT_AMOUNT") {
              discountAmount = voucher.value;
            } else if (voucher.type === "DISCOUNT_PERCENT") {
              const calcDiscount = (totalAmount * voucher.value) / 100;
              discountAmount = voucher.maxDiscountAmount
                ? Math.min(calcDiscount, voucher.maxDiscountAmount)
                : calcDiscount;
            } else if (voucher.type === "FREE_SHIP") {
              discountAmount = Math.min(shippingFee, voucher.value);
            } else if (voucher.type === "FREE_ITEM" && voucher.freeItemId) {
              const freeProduct = await Product.findById(voucher.freeItemId);
              const giftQty = voucher.value || 1;
              if (freeProduct && freeProduct.stock >= giftQty) {
                verifiedItems.push({
                  product: freeProduct._id,
                  name: freeProduct.name + " (Quà tặng)",
                  price: 0,
                  quantity: giftQty,
                  image:
                    freeProduct.images && freeProduct.images[0]
                      ? freeProduct.images[0]
                      : "",
                });
                await Product.findByIdAndUpdate(freeProduct._id, {
                  $inc: { stock: -giftQty, sold: giftQty },
                });
              }
            }
          }
        }
      }
    }

    if (discountAmount > totalAmount + shippingFee) {
      discountAmount = totalAmount + shippingFee;
    }
    const finalTotalAmount = totalAmount + shippingFee - discountAmount;

    const orderData = {
      userEmail,
      customerName,
      phoneNumber,
      shippingAddress,
      items: verifiedItems,
      totalAmount: finalTotalAmount,
      shippingFee,
      distance: Number(distance.toFixed(2)),
      deliveryCoordinates,
      paymentMethod,
      paymentStatus: "Pending",
      status: "New",
      voucherApplied: appliedVoucherId,
      discountAmount,
      note,
    };
    const newOrder = await Order.create(orderData);

    if (userVoucherRecord) {
      userVoucherRecord.isUsed = true;
      userVoucherRecord.usedAt = new Date();
      await userVoucherRecord.save();
    }

    if (paymentMethod === "COD") {
      await cartService.clearCart(userEmail);
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
      const redirectUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/orders`
        : "http://localhost:5173/orders";
      const ipnUrl = process.env.BACKEND_URL
        ? `${process.env.BACKEND_URL}/v1/api/orders/momo-ipn`
        : "http://localhost:8686/v1/api/orders/momo-ipn";
      const extraData = "";

      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${finalTotalAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
      const signature = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

      const momoPayload = {
        partnerCode: MOMO_PARTNER_CODE,
        partnerName: "Food Shop",
        storeId: "MomoTestStore",
        requestId,
        amount: finalTotalAmount,
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
          await cartService.clearCart(userEmail);
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

const verifyMomoPayment = async (orderIdParams, userEmail) => {
  try {
    const order = await Order.findOne({ _id: orderIdParams, userEmail });
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
        {
          $set: {
            paymentStatus: "Paid",
            momoTransId: queryRes.transId,
          },
        },
        { new: true },
      );
      await cartService.clearCart(order.userEmail);
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

      // Hoàn lại voucher nếu có
      if (failedOrder && failedOrder.voucherApplied) {
        await UserVoucher.findOneAndUpdate(
          {
            userEmail: failedOrder.userEmail,
            voucher: failedOrder.voucherApplied,
            isUsed: true,
          },
          { $set: { isUsed: false, usedAt: null } },
        );
      }

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

const mapOrderImages = async (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc; // orderDoc.toObject = null -> đã là object thuần
  if (order.returnRequests && order.returnRequests.length > 0) {
    for (const req of order.returnRequests) {
      if (req.images && req.images.length > 0) {
        req.images = await Promise.all(
          req.images.map(
            async (img) => await fileService.getImagePresignedUrlByKey(img),
          ),
        );
      }
    }
  }
  return order;
};

const getMyOrders = async (userEmail) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Order.updateMany(
      { userEmail, status: "New", createdAt: { $lte: thirtyMinutesAgo } },
      { $set: { status: "Confirmed" } },
    );
    const orders = await Order.find({ userEmail }).sort({ createdAt: -1 });
    const processedOrders = await Promise.all(orders.map(mapOrderImages));
    return { statusCode: 200, success: true, data: processedOrders };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách đơn hàng: " + error.message,
    };
  }
};

const getOrderDetails = async (orderIdParams) => {
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
    const processedOrder = await mapOrderImages(order);
    return { statusCode: 200, success: true, data: processedOrder };
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

      if (order.voucherApplied) {
        await UserVoucher.findOneAndUpdate(
          { userEmail, voucher: order.voucherApplied, isUsed: true },
          { $set: { isUsed: false, usedAt: null } },
        );
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
        message:
          "Chỉ có thể xác nhận đã nhận khi đơn hàng đang được giao (Shipping).",
      };
    }

    const coinsEarned = Math.floor(order.totalAmount / 10000);
    order.coinsEarned = coinsEarned;
    order.status = "Delivered";
    order.paymentStatus = "Paid"; // Đánh dấu đã thanh toán khi nhận hàng thành công
    await order.save();

    if (coinsEarned > 0) {
      await User.findOneAndUpdate(
        { email: userEmail },
        { $inc: { coins: coinsEarned } },
      );
    }

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

const getShopOrders = async (page = 1, limit = 10, status = "All") => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Order.updateMany(
      { status: "New", createdAt: { $lte: thirtyMinutesAgo } },
      { $set: { status: "Confirmed" } },
    );

    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const processedOrders = await Promise.all(orders.map(mapOrderImages));

    return {
      statusCode: 200,
      success: true,
      data: processedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

      // Hoàn lại voucher nếu có
      if (order.voucherApplied) {
        await UserVoucher.findOneAndUpdate(
          {
            userEmail: order.userEmail,
            voucher: order.voucherApplied,
            isUsed: true,
          },
          { $set: { isUsed: false, usedAt: null } },
        );
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

      if (order.voucherApplied) {
        await UserVoucher.findOneAndUpdate(
          {
            userEmail: order.userEmail,
            voucher: order.voucherApplied,
            isUsed: true,
          },
          { $set: { isUsed: false, usedAt: null } },
        );
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

const calculateShipping = async (lat, lng) => {
  if (!lat || !lng) {
    return {
      statusCode: 400,
      success: false,
      message: "Thiếu tọa độ GPS",
    };
  }
  const settingsRes = await settingService.getSettings();
  const storeLoc = settingsRes.data.store_location;

  const distance = calculateDistance(
    storeLoc.lat,
    storeLoc.lng,
    parseFloat(lat),
    parseFloat(lng),
  );
  const fee = await calculateShippingLogic(distance);
  return {
    statusCode: 200,
    success: true,
    data: { distance: Number(distance.toFixed(2)), fee },
  };
};

const requestReturn = async (orderId, userEmail, body, files) => {
  const order = await Order.findOne({ _id: orderId, userEmail });
  if (!order)
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy đơn hàng",
    };
  if (order.status !== "Delivered")
    return {
      statusCode: 400,
      success: false,
      message: "Chỉ được hoàn trả đơn hàng đã giao thành công",
    };

  const hoursSinceDelivered =
    (new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60);
  if (hoursSinceDelivered > 1) {
    return {
      statusCode: 400,
      success: false,
      message:
        "Đã quá hạn 1 giờ kể từ khi nhận hàng. Không thể yêu cầu hoàn trả.",
    };
  }

  let returnItems;
  try {
    returnItems =
      typeof body.items === "string" ? JSON.parse(body.items) : body.items;
  } catch {
    return {
      statusCode: 400,
      success: false,
      message: "Dữ liệu items không hợp lệ",
    };
  }

  if (!returnItems || returnItems.length === 0) {
    return {
      statusCode: 400,
      success: false,
      message: "Vui lòng chọn sản phẩm cần hoàn trả",
    };
  }

  const uploadedImages = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const key = await fileService.uploadFileToS3(file);
      uploadedImages.push(key);
    }
  }

  for (const item of returnItems) {
    const orderItem = order.items.find(
      (i) => i.product.toString() === item.itemId,
    );
    if (!orderItem) continue;

    const existingReq = order.returnRequests.find(
      (r) => r.item.toString() === item.itemId,
    );
    if (existingReq) continue;

    const qty = Math.min(item.quantity, orderItem.quantity);
    order.returnRequests.push({
      item: orderItem.product,
      quantity: qty,
      reason: item.reason || body.reason || "Không có lý do",
      images: uploadedImages,
      status: "Pending",
      refundAmount: qty * orderItem.price,
    });
  }

  if (order.returnRequests.length === 0) {
    return {
      statusCode: 400,
      success: false,
      message: "Không có sản phẩm nào hợp lệ để hoàn trả",
    };
  }

  order.status = "Return Requested";
  await order.save();

  return {
    statusCode: 200,
    success: true,
    message: "Gửi yêu cầu hoàn trả thành công",
    data: order,
  };
};

const handleReturnAction = async (orderId, action, rejectReason) => {
  const order = await Order.findById(orderId);
  if (!order)
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy đơn hàng",
    };

  for (const req of order.returnRequests) {
    if (req.status === "Pending") {
      req.status = action === "Approve" ? "Approved" : "Rejected";
      if (action === "Reject") req.rejectReason = rejectReason;
    }
  }

  if (action === "Reject") {
    order.status = "Delivered";
    await order.save();
  }

  if (action === "Approve") {
    await completeReturn(order);
  }

  const user = await User.findOne({ email: order.userEmail });
  if (user) {
    await emailService.sendMail({
      to: user.email,
      subject: "Cập nhật yêu cầu khiếu nại & hoàn tiền",
      text: `Yêu cầu khiếu nại cho đơn hàng ${order._id} của bạn đã được ${action === "Approve" ? "chấp nhận. Chúng tôi sẽ hoàn tiền, voucher, xu thưởng (nếu có) cho bạn." : "từ chối. Lý do: " + rejectReason}`,
    });
  }

  if (action === "Approve") {
    return {
      statusCode: 200,
      success: true,
      message: `Đã chấp nhận yêu cầu hoàn tiền`,
      data: order,
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: `Đã từ chối yêu cầu hoàn tiền`,
    data: order,
  };
};

async function completeReturn(orderIdOrDoc) {
  const order =
    typeof orderIdOrDoc === "object"
      ? orderIdOrDoc
      : await Order.findById(orderIdOrDoc);
  if (!order)
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy đơn hàng",
    };
  const orderId = order._id;

  let currentRefund = 0; // Tổng giá gốc của các sản phẩm đang được chấp nhận hoàn trả
  for (const req of order.returnRequests) {
    if (req.status === "Approved") {
      currentRefund += req.refundAmount;
    }
  }

  if (currentRefund > 0) {
    const totalItemOriginalPrice = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totalCompletedRefund = order.returnRequests
      .filter((r) => r.status === "Completed")
      .reduce((sum, r) => sum + r.refundAmount, 0);

    const isFullReturn =
      totalCompletedRefund + currentRefund >= totalItemOriginalPrice - 1;
    // chênh lệch tối đa 1 VNĐ (do các sai số làm tròn khi tính toán)

    // THỰC HIỆN HOÀN TIỀN QUA MOMO (NẾU CÓ) TRƯỚC KHI CẬP NHẬT DB
    if (order.paymentMethod === "MOMO" && order.momoTransId) {
      const momoRefundAmount = Math.round(
        currentRefund * (order.totalAmount / totalItemOriginalPrice),
        // * tỷ lệ tiền ship, khuyến mãi
      );

      if (momoRefundAmount > 0) {
        const refundId = "REFUND_" + Date.now();
        const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${momoRefundAmount}&description=Hoan tien don hang ${orderId}&orderId=${refundId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${refundId}&transId=${order.momoTransId}`;
        const signature = crypto
          .createHmac("sha256", MOMO_SECRET_KEY)
          .update(rawSignature)
          .digest("hex");

        const momoRefundPayload = {
          partnerCode: MOMO_PARTNER_CODE,
          orderId: refundId,
          requestId: refundId,
          amount: momoRefundAmount,
          transId: order.momoTransId,
          lang: "vi",
          description: `Hoan tien don hang ${orderId}`,
          signature,
        };

        try {
          const refundRes = await postHTTPS(
            MOMO_REFUND_ENDPOINT,
            momoRefundPayload,
          );
          if (refundRes && refundRes.resultCode !== 0) {
            if (
              refundRes.resultCode === 7002 ||
              refundRes.resultCode === 9000
            ) {
              //mã lỗi 7002 (Đang xử lý) hoặc 9000 (Giao dịch đang chờ xác nhận)
              // eslint-disable-next-line no-console
              console.warn(
                `MOMO Sandbox Warning: ${refundRes.message} (Mã lỗi: ${refundRes.resultCode}). Bỏ qua lỗi này trong môi trường test.`,
              );
            } else {
              throw new Error(
                `Ví MoMo từ chối hoàn tiền: ${refundRes.message} (Mã lỗi: ${refundRes.resultCode})`,
              );
            }
          }
        } catch (err) {
          throw new Error(
            "Lỗi khi kết nối hoặc hoàn tiền qua MoMo: " + err.message,
            { cause: err },
          );
        }
      }
    }

    // NẾU HOÀN TIỀN THÀNH CÔNG (HOẶC KHÔNG PHẢI MOMO), BẮT ĐẦU CẬP NHẬT DB
    for (const req of order.returnRequests) {
      if (req.status === "Approved") {
        req.status = "Completed";
        // KHÔNG CỘNG LẠI KHO VÌ ĐỒ ĂN KHÔNG THỂ BÁN LẠI ĐƯỢC NỮA
      }
    }

    if (order.coinsEarned > 0) {
      const currentRefundRatio = currentRefund / totalItemOriginalPrice;
      /*
        KHÔNG chia cho order.totalAmount vì:
        Giả sử:
        Món A: 100k
        Món B: 200k
        Tổng giá gốc (totalItemOriginalPrice): 300k
        Phí ship: 0k
        Mã giảm giá siêu khủng: giảm 150k
        -> Khách chỉ phải trả (order.totalAmount): 300k - 150k = 150k.
        -> Số Xu nhận được: 150k / 10000 = 15 Xu.

        Bây giờ, khách trả lại toàn bộ Món A và Món B (tức là trả lại 300k tiền gốc).
        Nếu tính tỷ lệ bằng order.totalAmount:
        Tỷ lệ = currentRefund / order.totalAmount = 300k / 150k = 2 (tức là 200%). 
        Số Xu bị trừ = 15 Xu * 200% = 30 Xu.
        Hậu quả: Khách mua hàng chỉ được cộng 15 Xu, nhưng khi trả hàng lại bị trừ tới 30 Xu
      */

      const coinsToDeduct = Math.floor(order.coinsEarned * currentRefundRatio);
      await User.findOneAndUpdate(
        { email: order.userEmail },
        { $inc: { coins: -coinsToDeduct } },
      );
    }

    if (isFullReturn && order.voucherApplied) {
      await UserVoucher.findOneAndUpdate(
        {
          userEmail: order.userEmail,
          voucher: order.voucherApplied,
          isUsed: true,
        },
        { $set: { isUsed: false, usedAt: null } },
      );
    }

    order.paymentStatus = isFullReturn ? "Refunded" : "Partially Refunded";
  }

  order.status = "Returned";
  await order.save();

  return {
    statusCode: 200,
    success: true,
    message: "Hoàn tất trả hàng và hoàn tiền",
    data: order,
  };
}

/**
 * Instant Payment Notification (IPN server-to-server)
 * Server Momo thông báo kết quả giao dịch thanh toán về backend
 */
const handleMomoIPN = async (ipnData) => {
  try {
    const {
      orderId,
      resultCode,
      signature,
      amount,
      extraData,
      message,
      transId,
      payType,
      responseTime,
      partnerCode,
      requestId,
    } = ipnData;

    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}
      &amount=${amount}
      &extraData=${extraData}
      &message=${message}
      &orderId=${orderId}
      &partnerCode=${partnerCode}
      &payType=${payType}
      &requestId=${requestId}
      &responseTime=${responseTime}
      &resultCode=${resultCode}
      &transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expectedSignature) {
      return {
        statusCode: 400,
        success: false,
        message: "Chữ ký không hợp lệ",
      };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy đơn hàng",
      };
    }

    if (order.paymentStatus === "Paid" || order.paymentStatus === "Failed") {
      return {
        statusCode: 204,
        success: true,
        message: "Đơn hàng đã được xử lý",
      };
    }

    if (resultCode === 0) {
      order.paymentStatus = "Paid";
      order.momoTransId = transId;
      await order.save();
      await cartService.clearCart(order.userEmail);
      return {
        statusCode: 204,
        success: true,
        message: "Thanh toán thành công",
      };
    } else {
      order.paymentStatus = "Failed";
      await order.save();

      if (order.voucherApplied) {
        await UserVoucher.findOneAndUpdate(
          {
            userEmail: order.userEmail,
            voucher: order.voucherApplied,
            isUsed: true,
          },
          { $set: { isUsed: false, usedAt: null } },
        );
      }
      return { statusCode: 204, success: true, message: "Thanh toán thất bại" };
    }
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi hệ thống khi xử lý IPN: " + error.message,
    };
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
  requestReturn,
  handleReturnAction,
  completeReturn,
};
