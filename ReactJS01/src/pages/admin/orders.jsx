import React, { useState, useEffect, useContext } from "react";
import {
  Button,
  Tag,
  notification,
  Empty,
  Spin,
  Card,
  Pagination,
  Modal,
  Select,
  Image,
  Input,
} from "antd";
import {
  HistoryOutlined,
  CheckOutlined,
  SendOutlined,
  GiftOutlined,
  CloseOutlined,
  DoubleRightOutlined,
  ShoppingOutlined,
  UserOutlined,
  ReloadOutlined,
  EyeOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../components/context/auth.context";
import {
  getShopOrdersApi,
  updateShopOrderStatusApi,
  handleShopCancelRequestApi,
  exportInvoiceApi,
  adminApproveReturnApi,
  adminRejectReturnApi,
  adminCompleteReturnApi,
} from "../../util/api";

export default function AdminOrdersPage() {
  const { auth } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOrderId, setRejectOrderId] = useState(null);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Empty description="Vui lòng đăng nhập tài khoản Quản trị viên" />
      </div>
    );
  }

  const fetchShopOrders = async (
    isAutoRefresh = false,
    page = pagination.current,
    limit = pagination.pageSize,
    status = statusFilter,
  ) => {
    if (!isAutoRefresh) setIsLoading(true);
    try {
      const res = await getShopOrdersApi(page, limit, status);
      if (res && res.success) {
        setOrders(res.data);
        if (res.meta) {
          setPagination({
            current: res.meta.page,
            pageSize: res.meta.limit,
            total: res.meta.total,
          });
        }
      } else {
        notification.error({
          message: "Lỗi tải đơn hàng",
          description: res?.message || "Không thể tải danh sách đơn hàng.",
          placement: "bottomLeft",
        });
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng admin:", error);
      notification.error({
        message: "Lỗi kết nối",
        description: error.message || "Đã xảy ra lỗi kết nối.",
        placement: "bottomLeft",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders(false, 1, pagination.pageSize, statusFilter);
  }, [statusFilter]);

  // TỰ ĐỘNG TẢI LẠI TRANG CHẠY NGẦM MỖI 10 GIÂY
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const autoRefreshTimer = setInterval(() => {
      fetchShopOrders(
        true,
        pagination.current,
        pagination.pageSize,
        statusFilter,
      );
    }, 10 * 1000);

    return () => clearInterval(autoRefreshTimer);
  }, [
    auth.isAuthenticated,
    pagination.current,
    pagination.pageSize,
    statusFilter,
  ]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await updateShopOrderStatusApi(orderId, newStatus);
      if (res && res.success) {
        notification.success({
          title: "Cập nhật thành công",
          description: `Đơn hàng đã chuyển sang trạng thái "${newStatus}"`,
          placement: "bottomLeft",
        });
        fetchShopOrders();

        // Phát tín hiệu đồng bộ trạng thái thực tế sang các tab/trang đang mở khác
        window.dispatchEvent(
          new CustomEvent("orderStatusChanged", { detail: { orderId } }),
        );
      }
    } catch (error) {
      notification.error({
        title: "Lỗi cập nhật đơn hàng",
        description: error.message,
        placement: "bottomLeft",
      });
    }
  };

  const handleApproveRejectCancel = async (orderId, action) => {
    try {
      const res = await handleShopCancelRequestApi(orderId, action);
      if (res && res.success) {
        notification.success({
          title: "Xử lý yêu cầu hủy đơn",
          description:
            action === "approve"
              ? "Đã chấp nhận yêu cầu hủy đơn."
              : "Đã từ chối yêu cầu hủy đơn.",
          placement: "bottomLeft",
        });
        fetchShopOrders();
        window.dispatchEvent(
          new CustomEvent("orderStatusChanged", { detail: { orderId } }),
        );
      }
    } catch (error) {
      notification.error({
        title: "Lỗi xử lý hủy đơn",
        description: error.message,
        placement: "bottomLeft",
      });
    }
  };

  const [returnLoading, setReturnLoading] = useState(false);

  const handleApproveReturn = async (orderId) => {
    setReturnLoading(true);
    try {
      const res = await adminApproveReturnApi(orderId);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: "Đã chấp nhận yêu cầu khiếu nại & hoàn tiền.",
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
      } else {
        notification.error({ message: "Lỗi", description: res.message });
      }
    } catch (err) {
      notification.error({ message: "Lỗi", description: "Đã xảy ra sự cố." });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleRejectReturn = (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const submitRejectReturn = async () => {
    if (!rejectReason.trim()) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập lý do từ chối hoàn tiền.",
      });
      return;
    }

    setReturnLoading(true);
    try {
      const res = await adminRejectReturnApi(rejectOrderId, rejectReason);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: "Đã từ chối yêu cầu hoàn tiền.",
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
        setIsRejectModalOpen(false);
      } else {
        notification.error({ message: "Lỗi", description: res.message });
      }
    } catch (err) {
      notification.error({ message: "Lỗi", description: "Đã xảy ra sự cố." });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleCompleteReturn = async (orderId) => {
    if (
      !window.confirm(
        "Xác nhận đã nhận được hàng trả về và hoàn tiền cho khách?",
      )
    )
      return;

    setReturnLoading(true);
    try {
      const res = await adminCompleteReturnApi(orderId);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: "Đã hoàn tất quá trình trả hàng và hoàn tiền.",
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
      } else {
        notification.error({ message: "Lỗi", description: res.message });
      }
    } catch (err) {
      notification.error({ message: "Lỗi", description: "Đã xảy ra sự cố." });
    } finally {
      setReturnLoading(false);
    }
  };

  const getStatusTag = (status) => {
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
        return <Tag color="error">Đã hủy</Tag>;
      case "Return Requested":
        return <Tag color="orange">Yêu cầu hoàn tiền</Tag>;
      case "Returned":
        return <Tag color="default">Đã hoàn tiền</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleExportInvoice = async (orderId) => {
    try {
      const res = await exportInvoiceApi(orderId);
      const url = window.URL.createObjectURL(new Blob([res]));
      //Blob là một object đại diện cho dữ liệu file dạng nhị phân
      //-> new Blob([res]) chứa dữ liệu PDF
      //Trình duyệt tạo ra một URL tạm thời, dạng: blob:http://localhost:5173/8b7c...-xxxx
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notification.success({ message: "Xuất hóa đơn thành công" });
    } catch (error) {
      notification.error({
        message: "Lỗi xuất hóa đơn",
        description: "Không thể tải hóa đơn. Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <HistoryOutlined className="text-purple-600" />
            <span>Quản Lý Đơn Hàng</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-semibold text-sm">
            Trạng thái:
          </span>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className="w-44"
            options={[
              { value: "All", label: "Tất cả đơn hàng" },
              { value: "New", label: "Đơn hàng mới" },
              { value: "Confirmed", label: "Đã xác nhận" },
              { value: "Preparing", label: "Đang chuẩn bị" },
              { value: "Shipping", label: "Đang giao hàng" },
              { value: "Delivered", label: "Đã giao thành công" },
              { value: "Cancelled", label: "Đã hủy" },
              { value: "Return Requested", label: "Yêu cầu hoàn tiền" },
              { value: "Returned", label: "Đã hoàn tiền" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" tip="Đang tải dữ liệu hệ thống..." />
        </div>
      ) : orders.length === 0 ? (
        <Card className="rounded-3xl border-gray-100 text-center py-12 shadow-sm">
          <Empty description="Hiện tại không có đơn hàng nào tồn tại trong hệ thống." />
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-gray-900 tracking-wide">
                      Mã đơn: #{ord._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      ({ord._id})
                    </span>
                    <a
                      className="text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                      onClick={() => openDetailModal(ord)}
                    >
                      <EyeOutlined /> Chi tiết
                    </a>
                    {(ord.status == "Shipping" ||
                      ord.status === "Delivered") && (
                      <a
                        className="text-green-600 hover:text-green-700 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md transition-colors ml-1"
                        onClick={() => handleExportInvoice(ord._id)}
                      >
                        <PrinterOutlined /> Xuất hóa đơn
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <UserOutlined className="text-gray-400" /> {ord.userEmail}
                    </span>
                    <span>•</span>
                    <span>
                      Ngày đặt:{" "}
                      {new Date(ord.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 text-right">
                  {getStatusTag(ord.status)}
                  {ord.shippingFee > 0 && (
                    <span className="text-xs text-gray-500 font-medium mt-1">
                      + Phí ship ({ord.distance}km):{" "}
                      {formatPrice(ord.shippingFee)}
                    </span>
                  )}
                  <span className="text-base font-black text-orange-600">
                    Tổng: {formatPrice(ord.totalAmount)}
                  </span>
                </div>
              </div>

              {ord.cancelRequest && (
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/70 text-xs space-y-3">
                  <div className="space-y-1">
                    <p className="font-bold text-red-800 flex items-center gap-1 text-sm">
                      ⚠️ Người mua đang gửi yêu cầu hủy đơn này!
                    </p>
                    <p className="text-gray-600 italic">
                      Lý do khách hàng đưa ra: "
                      {ord.cancelReason || "Không có lý do cụ thể"}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<CheckOutlined />}
                      className="rounded-xl text-xs h-8 font-bold px-4"
                      onClick={() =>
                        handleApproveRejectCancel(ord._id, "approve")
                      }
                    >
                      Chấp nhận và Hủy đơn
                    </Button>
                    <Button
                      size="small"
                      className="rounded-xl text-xs h-8 font-semibold px-4"
                      onClick={() =>
                        handleApproveRejectCancel(ord._id, "reject")
                      }
                    >
                      Từ chối yêu cầu
                    </Button>
                  </div>
                </div>
              )}

              {ord.status !== "Cancelled" &&
                ord.status !== "Delivered" &&
                ord.status !== "Shipping" &&
                ord.status !== "Return Requested" &&
                ord.status !== "Returned" && (
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/70 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <ShoppingOutlined /> Thao tác xử lý quy trình vận đơn
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ord.status === "New" && (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<CheckOutlined />}
                          className="text-xs rounded-xl h-8 font-bold px-4 border-purple-500 text-purple-600 hover:text-purple-700 hover:border-purple-600"
                          onClick={() =>
                            handleUpdateStatus(ord._id, "Confirmed")
                          }
                        >
                          Xác nhận đơn
                        </Button>
                      )}

                      {ord.status === "Confirmed" && (
                        <Button
                          size="small"
                          type="dashed"
                          icon={<SendOutlined />}
                          className="text-xs rounded-xl h-8 font-semibold px-4 border-orange-400 text-orange-600 hover:text-orange-700"
                          onClick={() =>
                            handleUpdateStatus(ord._id, "Preparing")
                          }
                        >
                          Chuẩn bị món
                        </Button>
                      )}

                      {ord.status === "Preparing" && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<DoubleRightOutlined />}
                          className="text-xs rounded-xl h-8 font-bold px-4 bg-indigo-600 border-none hover:bg-indigo-700"
                          onClick={() =>
                            handleUpdateStatus(ord._id, "Shipping")
                          }
                        >
                          Đang giao
                        </Button>
                      )}

                      {ord.status !== "Delivered" &&
                        ord.status !== "Shipping" && (
                          <Button
                            size="small"
                            danger
                            ghost
                            icon={<CloseOutlined />}
                            className="text-xs rounded-xl h-8 font-semibold px-4"
                            onClick={() =>
                              handleUpdateStatus(ord._id, "Cancelled")
                            }
                          >
                            Hủy đơn
                          </Button>
                        )}
                    </div>
                  </div>
                )}
            </div>
          ))}

          <div className="flex justify-end mt-6">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page, pageSize) =>
                fetchShopOrders(false, page, pageSize)
              }
              showSizeChanger
              showTotal={(total) => `Tổng số ${total} đơn hàng`}
            />
          </div>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <EyeOutlined className="text-blue-600" />
            <span>
              Chi Tiết Đơn Hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          selectedOrder?.status !== "Cancelled" && (
            <Button
              key="export"
              icon={<PrinterOutlined />}
              className="text-green-600 hover:text-green-700 text-xs font-semibold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md transition-colors ml-1"
              onClick={() => handleExportInvoice(selectedOrder._id)}
            >
              Xuất hóa đơn
            </Button>
          ),
          <Button
            key="close"
            className="rounded-xl font-semibold"
            onClick={() => setIsDetailModalOpen(false)}
          >
            Đóng
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedOrder && (
          <div className="space-y-6 pt-4 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="space-y-2">
                <p className="font-bold text-gray-800 text-base mb-3 border-b pb-2">
                  Thông tin khách hàng
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">Tên:</span>{" "}
                  <span className="font-medium">
                    {selectedOrder.customerName || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">SĐT:</span>{" "}
                  <span className="font-medium">
                    {selectedOrder.phoneNumber || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-medium">{selectedOrder.userEmail}</span>
                </p>
                {selectedOrder.note && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-gray-500 mb-1">Ghi chú:</p>
                    <p className="font-medium text-orange-600 bg-orange-50 p-2 rounded-lg text-sm">{selectedOrder.note}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="font-bold text-gray-800 text-base mb-3 border-b pb-2">
                  Giao hàng & Thanh toán
                </p>
                <p className="flex flex-col">
                  <span className="text-gray-500">Địa chỉ:</span>{" "}
                  <span className="font-medium line-clamp-2">
                    {selectedOrder.shippingAddress || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between mt-1">
                  <span className="text-gray-500">Phương thức:</span>{" "}
                  <span className="font-medium">
                    {selectedOrder.paymentMethod === "MOMO"
                      ? "Ví MoMo"
                      : "Thanh toán khi nhận hàng"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>{" "}
                  <span className="font-medium">
                    {selectedOrder.paymentStatus === "Paid" ? (
                      <span className="text-green-600 font-bold">
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="text-orange-500 font-bold">
                        Chưa thanh toán
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <p className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                <ShoppingOutlined className="text-orange-500" /> Sản phẩm đã đặt
              </p>
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || "https://placehold.co/100"}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                      />
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-700">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100/50 space-y-2 text-right">
                <p className="text-sm text-gray-600">
                  Phí giao hàng: {formatPrice(selectedOrder.shippingFee || 0)}
                </p>
                <p className="text-lg font-black text-orange-600 flex justify-end items-center gap-2">
                  <span className="text-sm text-gray-700 font-semibold">
                    Tổng cộng:
                  </span>{" "}
                  {formatPrice(selectedOrder.totalAmount)}
                </p>
              </div>
            </div>

            {selectedOrder.returnRequests &&
              selectedOrder.returnRequests.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mt-6">
                  <h3 className="font-bold text-orange-800 mb-3 text-lg">
                    Yêu Cầu Hoàn Tiền
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.returnRequests.map((req, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-orange-100 flex flex-col gap-2"
                      >
                        <div className="flex justify-between font-semibold text-sm text-gray-700">
                          <span>Sản phẩm:</span>
                          <span className="text-right">
                            {
                              selectedOrder.items.find(
                                (i) => i.product === req.item,
                              )?.name
                            }{" "}
                            x {req.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Lý do:</span>
                          <span className="text-right italic">
                            {req.reason}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Trạng thái:</span>
                          <span className="font-bold">
                            {req.status === "Pending"
                              ? "Chưa giải quyết"
                              : "Đã giải quyết"}
                          </span>
                        </div>
                        {req.images && req.images.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto">
                            <Image.PreviewGroup>
                              {req.images.map((img, i) => (
                                <Image
                                  key={i}
                                  src={`${img}`}
                                  alt="proof"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ))}
                            </Image.PreviewGroup>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedOrder.status === "Return Requested" && (
                    <div className="mt-4 flex gap-3">
                      <Button
                        type="primary"
                        className="bg-orange-500 hover:bg-orange-600"
                        loading={returnLoading}
                        onClick={() => handleApproveReturn(selectedOrder._id)}
                      >
                        Chấp Nhận Hoàn Tiền
                      </Button>
                      <Button
                        danger
                        loading={returnLoading}
                        onClick={() => handleRejectReturn(selectedOrder._id)}
                      >
                        Từ Chối
                      </Button>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <CloseOutlined />
            <span>Từ chối yêu cầu hoàn tiền</span>
          </div>
        }
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={submitRejectReturn}
        okText="Từ chối hoàn tiền"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: returnLoading }}
      >
        <div className="mb-2 text-gray-700">
          Vui lòng nhập lý do từ chối yêu cầu hoàn trả này:
        </div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Sản phẩm không đạt yêu cầu hoàn trả..."
          className="rounded-xl"
        />
      </Modal>
    </div>
  );
}
