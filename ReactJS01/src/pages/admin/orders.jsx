import React, { useState, useEffect, useContext } from "react";
import { Button, Tag, notification, Empty, Spin, Card } from "antd";
import {
  AppstoreOutlined,
  CheckOutlined,
  SendOutlined,
  GiftOutlined,
  CloseOutlined,
  DoubleRightOutlined,
  ShoppingOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../components/context/auth.context";
import {
  getShopOrdersApi,
  updateShopOrderStatusApi,
  handleShopCancelRequestApi,
} from "../../util/api";

export default function AdminOrdersPage() {
  const { auth } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Empty description="Vui lòng đăng nhập tài khoản Quản trị viên" />
      </div>
    );
  }

  const fetchShopOrders = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setIsLoading(true);
    try {
      const res = await getShopOrdersApi();
      if (res && res.success) {
        setOrders(res.data);
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
    fetchShopOrders();
  }, []);

  // TỰ ĐỘNG TẢI LẠI TRANG CHẠY NGẦM MỖI 10 GIÂY
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const autoRefreshTimer = setInterval(() => {
      fetchShopOrders(true);
    }, 10 * 1000);

    return () => clearInterval(autoRefreshTimer);
  }, [auth.isAuthenticated]);

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
        return <Tag color="error">Đã hủy đơn</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <AppstoreOutlined className="text-purple-600" />
            <span>Quản Lý Đơn Hàng Cửa Hàng</span>
          </h1>
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
                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5">
                  {getStatusTag(ord.status)}
                  <span className="text-base font-black text-orange-600">
                    {formatPrice(ord.totalAmount)}
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

              {ord.status !== "Cancelled" && ord.status !== "Delivered" && (
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
                        onClick={() => handleUpdateStatus(ord._id, "Confirmed")}
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
                        onClick={() => handleUpdateStatus(ord._id, "Preparing")}
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
                        onClick={() => handleUpdateStatus(ord._id, "Shipping")}
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
        </div>
      )}
    </div>
  );
}
