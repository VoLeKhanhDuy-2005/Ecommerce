import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Spin,
  Steps,
  notification,
  Tag,
  Empty,
  Modal,
  Input,
  Rate,
} from "antd";
import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  LoadingOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../components/context/auth.context";
import {
  getMyOrdersApi,
  getOrderDetailsApi,
  cancelOrderApi,
  verifyMomoPaymentApi,
  getCartApi,
  markOrderAsReceivedApi,
  submitReviewApi,
} from "../../util/api";

export default function OrdersPage() {
  const { auth, setCartCount } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingMomo, setIsVerifyingMomo] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // State phục vụ đếm ngược thời gian hủy đơn (30 phút)
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [canCancel, setCanCancel] = useState(false);
  const hasCalledVerify = React.useRef(false); // useRef cờ hiệu tránh Strict Mode gọi 2 lần liên tục

  // Lấy lịch sử mua hàng
  const fetchOrders = async (selectOrderId = null) => {
    try {
      const res = await getMyOrdersApi();
      if (res && res.success) {
        setOrders(res.data);
        if (res.data.length > 0) {
          // Chọn đơn hàng được chỉ định hoặc mặc định chọn đơn hàng đầu tiên
          if (selectOrderId) {
            const found = res.data.find((o) => o._id === selectOrderId);
            setSelectedOrder(found || res.data[0]);
          } else if (!selectedOrder) {
            setSelectedOrder(res.data[0]);
          } else {
            // Cập nhật lại thông tin đơn hàng đang chọn
            const found = res.data.find((o) => o._id === selectedOrder._id);
            setSelectedOrder(found || res.data[0]);
          }
        }
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi tải đơn hàng",
        description: "Không thể lấy lịch sử đặt hàng của bạn.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCartCount = async () => {
    try {
      const cartRes = await getCartApi();
      if (cartRes && cartRes.success && cartRes.data) {
        const totalItems = cartRes.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật badge giỏ hàng:", error);
    }
  };

  // Xác minh giao dịch MoMo từ URL chuyển hướng về
  useEffect(() => {
    const verifyMomo = async () => {
      const orderId = searchParams.get("orderId");
      const resultCode = searchParams.get("resultCode");

      if (orderId) {
        if (hasCalledVerify.current) return;
        hasCalledVerify.current = true;

        setIsVerifyingMomo(true);
        try {
          if (resultCode === "0") {
            const res = await verifyMomoPaymentApi(orderId);
            if (res && res.success) {
              notification.success({
                message: "💳 Thanh toán MoMo thành công!",
                description:
                  "Đơn hàng của bạn đã được thanh toán và đang chuẩn bị.",
                duration: 6,
              });
            } else {
              notification.error({
                message: "Thanh toán thất bại",
                description:
                  res.message || "Giao dịch MoMo bị hủy hoặc không thành công.",
              });
            }
          } else {
            // Khi MoMo trả về mã lỗi (khác 0)
            const message =
              searchParams.get("message") || "Người dùng hủy thanh toán.";
            await verifyMomoPaymentApi(orderId); // Cập nhật sang Failed
            notification.error({
              message: "Thanh toán MoMo thất bại",
              description: `Giao dịch chưa hoàn thành: ${message}`,
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsVerifyingMomo(false);
          // Xóa các tham số MoMo trên thanh địa chỉ để URL sạch sẽ
          setSearchParams({});
          await refreshCartCount();
          fetchOrders(orderId);
        }
      } else {
        if (auth.isAuthenticated) {
          fetchOrders();
        }
      }
    };

    verifyMomo();
  }, [auth.isAuthenticated, searchParams]);

  // Bộ đếm ngược thời gian hủy đơn (30 phút)
  useEffect(() => {
    if (
      !selectedOrder ||
      selectedOrder.status === "Cancelled" ||
      selectedOrder.status === "Delivered" ||
      selectedOrder.status === "Shipping"
    ) {
      // Kiểm tra xem đơn hàng có thể hủy được không
      setCanCancel(false); // không cho phép hủy
      setTimeLeftStr(""); // xóa hiển thị đếm ngược thời gian
      return;
    }

    const timer = setInterval(() => {
      const createdAtTime = new Date(selectedOrder.createdAt).getTime();
      const elapsedMs = Date.now() - createdAtTime;
      const thirtyMinsMs = 30 * 60 * 1000;
      const remainingMs = thirtyMinsMs - elapsedMs;

      if (remainingMs <= 0) {
        setCanCancel(false);
        setTimeLeftStr("Hết thời gian hủy (Quá 30 phút)");
        clearInterval(timer);
      } else {
        setCanCancel(true);
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeftStr(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedOrder]);

  // TỰ ĐỘNG TẢI LẠI TRANG CHẠY NGẦM MỖI 10 GIÂY
  useEffect(() => {
    if (!auth.isAuthenticated || !selectedOrder) return;
    // Nếu đơn hàng đã hoàn thành (Delivered) hoặc đã hủy (Cancelled), dừng bộ quét để tiết kiệm RAM
    if (
      selectedOrder.status === "Delivered" ||
      selectedOrder.status === "Cancelled"
    )
      return;

    const autoRefreshTimer = setInterval(() => {
      fetchOrders(selectedOrder._id);
    }, 10 * 1000);
    return () => clearInterval(autoRefreshTimer);
  }, [auth.isAuthenticated, selectedOrder?._id, selectedOrder?.status]);

  // Mở modal xác nhận hủy đơn
  const openCancelModal = () => {
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  // Xác nhận hủy đơn hàng qua API
  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await cancelOrderApi(selectedOrder._id, cancelReason);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: res.message,
        });
        setIsCancelModalOpen(false);
        fetchOrders(selectedOrder._id);
      } else {
        notification.error({
          message: "Lỗi hủy đơn",
          description: res.message || "Không thể hủy đơn hàng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể kết nối đến máy chủ.",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Xác nhận đã nhận hàng qua API
  const handleMarkAsReceived = async () => {
    setReceiveLoading(true);
    try {
      const res = await markOrderAsReceivedApi(selectedOrder._id);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: "Cảm ơn bạn đã xác nhận nhận hàng!",
        });
        fetchOrders(selectedOrder._id);
      } else {
        notification.error({
          message: "Lỗi",
          description: res.message || "Không thể xác nhận đơn hàng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể kết nối đến máy chủ.",
      });
    } finally {
      setReceiveLoading(false);
    }
  };

  const openReviewModal = (productItem) => {
    setReviewProduct(productItem);
    setReviewRating(0);
    setReviewComment("");
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewRating) {
      notification.warning({ message: "Vui lòng chọn số sao" });
      return;
    }
    setReviewLoading(true);
    try {
      const res = await submitReviewApi(reviewProduct.product, {
        rating: reviewRating,
        comment: reviewComment,
      });
      if (res && res.EC === 0) {
        notification.success({ message: "Đánh giá thành công!" });
        setIsReviewModalOpen(false);
      } else {
        notification.error({
          message: "Đánh giá thất bại",
          description: res.EM || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error.response?.data?.EM || "Lỗi kết nối",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const getPaymentMethodLabel = (method) => {
    return method === "MOMO"
      ? "Ví điện tử MoMo"
      : "Thanh toán khi nhận hàng (COD)";
  };

  const getPaymentStatusTag = (status) => {
    switch (status) {
      case "Paid":
        return <Tag color="success">Đã thanh toán</Tag>;
      case "Failed":
        return <Tag color="error">Thanh toán lỗi</Tag>;
      default:
        return <Tag color="warning">Chưa thanh toán</Tag>;
    }
  };

  const getOrderStatusTag = (status) => {
    switch (status) {
      case "New":
        return <Tag color="blue">Đơn hàng mới</Tag>;
      case "Confirmed":
        return <Tag color="cyan">Đã xác nhận</Tag>;
      case "Preparing":
        return <Tag color="orange">Đang chuẩn bị</Tag>;
      case "Shipping":
        return <Tag color="processing">Đang giao hàng</Tag>;
      case "Delivered":
        return <Tag color="success">Đã giao thành công</Tag>;
      case "Cancelled":
        return <Tag color="error">Đã hủy đơn</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Ánh xạ trạng thái String sang bước Stepper (0 -> 4)
  const getStepIndex = (status) => {
    const stepsMap = {
      New: 0,
      Confirmed: 1,
      Preparing: 2,
      Shipping: 3,
      Delivered: 4,
    };
    return stepsMap[status] !== undefined ? stepsMap[status] : -1;
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100">
          <p className="text-6xl mb-4">📦</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Chưa đăng nhập
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Vui lòng đăng nhập tài khoản để xem và theo dõi đơn hàng của bạn.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (isVerifyingMomo) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <h2 className="text-xl font-bold text-gray-800 mt-6 mb-2">
          Đang xác thực giao dịch MoMo...
        </h2>
        <p className="text-gray-400 text-sm animate-pulse">
          Vui lòng không đóng trình duyệt hoặc quay lại trang trước.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Đang tải lịch sử mua hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Theo Dõi Đơn Hàng
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <Empty
            description={
              <span className="text-gray-500 text-sm font-medium">
                Bạn chưa đặt mua đơn hàng nào.
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái: Danh sách đơn hàng (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-700 px-1">
              Lịch sử đặt hàng ({orders.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = selectedOrder?._id === ord._id;
                return (
                  <div
                    key={ord._id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-orange-50/50 border-orange-400 shadow-sm"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-gray-800 line-clamp-1">
                        Mã đơn: #{ord._id.slice(-6).toUpperCase()}
                      </span>
                      {getOrderStatusTag(ord.status)}
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarOutlined />
                        <span>
                          {new Date(ord.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="font-medium text-gray-600">
                        {ord.items.length} món • Tổng:{" "}
                        <span className="font-bold text-orange-600">
                          {formatPrice(ord.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột Phải: Theo dõi chi tiết đơn hàng (2/3 width) */}
          <div className="lg:col-span-2">
            {selectedOrder && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8 shadow-sm space-y-8">
                {/* Header Chi Tiết */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Chi Tiết Đơn Hàng #
                      {selectedOrder._id.slice(-6).toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Đặt lúc:{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getPaymentStatusTag(selectedOrder.paymentStatus)}
                    {getOrderStatusTag(selectedOrder.status)}
                  </div>
                </div>

                {/* Tiễn Trình Trạng Thái (Nếu không phải Cancelled) */}
                {selectedOrder.status !== "Cancelled" ? (
                  <div className="bg-orange-50/20 p-5 rounded-2xl border border-orange-100/50">
                    <Steps
                      direction="horizontal"
                      size="small"
                      current={getStepIndex(selectedOrder.status)}
                      items={[
                        { title: "Mới" },
                        { title: "Xác nhận" },
                        { title: "Chuẩn bị" },
                        { title: "Đang giao" },
                        { title: "Đã giao" },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-3">
                    <StopOutlined className="text-red-500 text-lg mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">
                        Đơn hàng này đã bị HỦY
                      </h4>
                      <p className="text-xs text-red-600 mt-1">
                        Lý do hủy đơn:{" "}
                        <span className="font-semibold">
                          {selectedOrder.cancelReason || "Không rõ lý do"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Phần Đếm Ngược & Hủy Đơn / Xác nhận nhận hàng */}
                {selectedOrder.status !== "Cancelled" &&
                  selectedOrder.status !== "Delivered" && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {selectedOrder.status === "Shipping" ? (
                        <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              Đơn hàng đang được giao đến bạn!
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Vui lòng xác nhận sau khi bạn đã nhận được hàng
                              thành công.
                            </p>
                          </div>
                          <button
                            onClick={handleMarkAsReceived}
                            disabled={receiveLoading}
                            className="px-5 py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 hover:shadow-md transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircleOutlined />
                            Đã Nhận Được Hàng
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <ClockCircleOutlined
                              className="text-orange-500 text-lg animate-spin"
                              style={{ animationDuration: "6s" }}
                            />
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Thời gian hủy đơn còn lại
                              </p>
                              <p className="text-base font-black text-gray-700 mt-0.5">
                                {timeLeftStr || "Đang tính toán..."}
                              </p>
                            </div>
                          </div>

                          {canCancel ? (
                            selectedOrder.cancelRequest ? (
                              <div className="flex flex-col items-end gap-1">
                                <Tag
                                  color="warning"
                                  className="m-0 rounded-lg py-1 px-3 font-semibold text-xs animate-pulse"
                                >
                                  ⏳ Đang chờ duyệt hủy đơn
                                </Tag>
                                <span className="text-[10px] text-gray-400">
                                  Shop đang chuẩn bị hàng, đang xử lý yêu cầu
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={openCancelModal}
                                className="px-5 py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 hover:shadow-md transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <CloseCircleOutlined />
                                {selectedOrder.status === "Preparing"
                                  ? "Gửi Yêu Cầu Hủy Đơn"
                                  : "Hủy Đơn Hàng"}
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              🔒 Đơn hàng đã được khóa (không thể hủy)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                {/* Danh Sách Món Ăn Trong Đơn */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <ShoppingOutlined className="text-orange-500" /> Thực đơn đã
                    chọn
                  </h4>

                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl px-4 bg-gray-50/50">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || "https://placehold.co/100"}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 bg-white"
                          />
                          <div className="flex-grow">
                            <p className="font-bold text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-gray-400 text-[10px] mt-0.5">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1">
                          <span className="font-bold text-gray-800">
                            {formatPrice(item.price)}
                          </span>
                          {selectedOrder.status === "Delivered" && (
                            <button
                              onClick={() => openReviewModal(item)}
                              className="text-orange-500 hover:text-orange-600 font-semibold underline text-[10px]"
                            >
                              Đánh giá
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center bg-orange-50/20 px-4 py-3 rounded-2xl border border-orange-100/30">
                    <span className="text-sm font-bold text-gray-700">
                      Tổng cộng hóa đơn:
                    </span>
                    <span className="text-lg font-black text-orange-600">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Thông Tin Giao Nhận & Thanh Toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                  {/* Người nhận */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-gray-800 text-sm">
                      📍 Thông tin giao hàng
                    </h4>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Người nhận:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {selectedOrder.customerName}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Điện thoại:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {selectedOrder.phoneNumber}
                      </span>
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      <span className="text-gray-400">Địa chỉ:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {selectedOrder.shippingAddress}
                      </span>
                    </p>
                  </div>

                  {/* Thanh toán */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-gray-800 text-sm">
                      💳 Chi tiết thanh toán
                    </h4>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Hình thức:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                      </span>
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Trạng thái:</span>
                      {getPaymentStatusTag(selectedOrder.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nhập lý do hủy đơn */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-red-500 font-bold text-base">
            <ExclamationCircleOutlined />
            {selectedOrder?.status === "Preparing"
              ? "Gửi yêu cầu hủy đơn hàng"
              : "Hủy đơn hàng này"}
          </span>
        }
        open={isCancelModalOpen}
        onOk={handleConfirmCancel}
        confirmLoading={cancelLoading}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="Xác nhận"
        cancelText="Quay lại"
        okButtonProps={{ danger: true, className: "rounded-xl font-semibold" }}
        cancelButtonProps={{ className: "rounded-xl" }}
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            {selectedOrder?.status === "Preparing"
              ? "Đơn hàng đang ở bước shop chuẩn bị hàng. Yêu cầu hủy cần được sự chấp thuận của shop. Vui lòng nhập lý do để gửi yêu cầu."
              : "Đơn hàng của bạn sẽ bị hủy trực tiếp và các món ăn trong đơn sẽ được trả lại kho hàng. Vui lòng để lại lý do hủy đơn."}
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Nhập lý do hủy đơn hàng (không bắt buộc)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="rounded-xl placeholder-gray-300 text-xs"
          />
        </div>
      </Modal>

      {/* Modal Đánh giá sản phẩm */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-orange-500 font-bold text-base">
            <span className="text-xl">★</span> Đánh giá sản phẩm
          </span>
        }
        open={isReviewModalOpen}
        onOk={handleReviewSubmit}
        confirmLoading={reviewLoading}
        onCancel={() => setIsReviewModalOpen(false)}
        okText="Gửi đánh giá"
        cancelText="Hủy"
        okButtonProps={{
          className: "bg-orange-500 hover:bg-orange-600 border-none rounded-xl",
        }}
        cancelButtonProps={{ className: "rounded-xl" }}
      >
        {reviewProduct && (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src={reviewProduct.image || "https://placehold.co/100"}
                alt={reviewProduct.name}
                className="w-10 h-10 rounded-lg object-cover border"
              />
              <span className="font-bold text-gray-800 text-sm">
                {reviewProduct.name}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold mb-1">
                Chất lượng:
              </span>
              <Rate
                value={reviewRating}
                onChange={setReviewRating}
                className="text-orange-400"
              />
            </div>
            <div>
              <span className="block text-xs font-semibold mb-1">
                Bình luận:
              </span>
              <Input.TextArea
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
