import React, { useMemo } from "react";
import { Card, Table, Tag, Typography } from "antd";
import moment from "moment";
import { formatCurrency } from "../../../utils/formatter";

const { Title } = Typography;

const RecentOrdersTable = ({ orders }) => {
  const columns = useMemo(
    () => [
      {
        title: "Mã Đơn",
        dataIndex: "_id",
        key: "_id",
        render: (text) => (
          <span className="text-gray-500 font-mono">
            {text.substring(0, 8)}...
          </span>
        ),
      },
      {
        title: "Khách Hàng",
        dataIndex: "customerName",
        key: "customerName",
        render: (text) => (
          <span className="font-semibold text-gray-700">{text}</span>
        ),
      },
      {
        title: "Tổng Tiền",
        dataIndex: "totalAmount",
        key: "totalAmount",
        render: (amount) => (
          <span className="text-orange-500 font-bold">
            {formatCurrency(amount)}
          </span>
        ),
      },
      {
        title: "Thanh Toán",
        dataIndex: "paymentMethod",
        key: "paymentMethod",
        render: (method) => (
          <Tag color={method === "MOMO" ? "purple" : "cyan"}>{method}</Tag>
        ),
      },
      {
        title: "Trạng Thái",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          let color = "blue";
          if (status === "Delivered") color = "green";
          if (status === "Cancelled") color = "red";
          if (status === "Shipping") color = "gold";
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: "Ngày Đặt",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => (
          <span className="text-gray-500">
            {moment(date).format("DD/MM/YYYY HH:mm")}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <Card bordered={false} className="shadow-sm rounded-2xl">
      <Title level={4} className="!mb-6 !text-gray-700">
        Đơn hàng gần đây
      </Title>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        pagination={false}
        className="border border-gray-100 rounded-xl overflow-hidden"
      />
    </Card>
  );
};

export default RecentOrdersTable;
