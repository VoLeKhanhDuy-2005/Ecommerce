import React from "react";
import { Button, Tag } from "antd";
import {
  EyeOutlined,
  PrinterOutlined,
  UserOutlined,
  CheckOutlined,
  SendOutlined,
  DoubleRightOutlined,
  CloseOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "../../../utils/formatter";
import { ORDER_STATUS_MAP } from "../../../utils/constants";

const OrderCard = ({
  ord,
  openDetailModal,
  handleExportInvoice,
  handleApproveRejectCancel,
  handleUpdateStatus,
}) => {
  const getStatusTag = (status) => {
    const statusConfig = ORDER_STATUS_MAP[status];
    if (statusConfig) {
      return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>;
    }
    return <Tag color="default">{status}</Tag>;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-gray-900 tracking-wide">
              Mã đơn: #{ord._id.slice(-6).toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 font-mono">({ord._id})</span>
            <a
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
              onClick={() => openDetailModal(ord)}
            >
              <EyeOutlined /> Chi tiết
            </a>
            {(ord.status == "Shipping" || ord.status === "Delivered") && (
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
              Ngày đặt: {new Date(ord.createdAt).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 text-right">
          {getStatusTag(ord.status)}
          {ord.shippingFee > 0 && (
            <span className="text-xs text-gray-500 font-medium mt-1">
              + Phí ship ({ord.distance}km): {formatCurrency(ord.shippingFee)}
            </span>
          )}
          <span className="text-base font-black text-orange-600">
            Tổng: {formatCurrency(ord.totalAmount)}
          </span>
          <div className="mt-1">
            {ord.paymentStatus === "Paid" ? (
              <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-md border border-green-200">
                Đã thanh toán (MoMo)
              </span>
            ) : ord.paymentMethod === "MOMO" ? (
              <span className="text-orange-500 font-bold text-xs bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                Chờ thanh toán (MoMo)
              </span>
            ) : (
              <span className="text-gray-500 font-bold text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                Thanh toán khi nhận hàng (COD)
              </span>
            )}
          </div>
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
              onClick={() => handleApproveRejectCancel(ord._id, "approve")}
            >
              Chấp nhận và Hủy đơn
            </Button>
            <Button
              size="small"
              className="rounded-xl text-xs h-8 font-semibold px-4"
              onClick={() => handleApproveRejectCancel(ord._id, "reject")}
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

              {ord.status !== "Delivered" && ord.status !== "Shipping" && (
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<CloseOutlined />}
                  className="text-xs rounded-xl h-8 font-semibold px-4"
                  onClick={() => handleUpdateStatus(ord._id, "Cancelled")}
                >
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default OrderCard;
