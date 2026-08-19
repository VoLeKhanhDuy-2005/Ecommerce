import React, { useMemo } from "react";
import { Table, Button, Tag, Space, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DollarCircleFilled,
} from "@ant-design/icons";

const VoucherTable = ({
  vouchers,
  loading,
  handleOpenEditModal,
  handleDelete,
}) => {
  const columns = useMemo(
    () => [
      {
        title: "Mã",
        dataIndex: "code",
        key: "code",
        render: (text) => (
          <span className="font-bold text-orange-500">{text}</span>
        ),
      },
      {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
      },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        render: (type) => {
          const typeMap = {
            DISCOUNT_AMOUNT: { color: "green", text: "Giảm tiền mặt" },
            DISCOUNT_PERCENT: { color: "blue", text: "Giảm %" },
            FREE_SHIP: { color: "cyan", text: "Miễn phí vận chuyển" },
            FREE_ITEM: { color: "purple", text: "Tặng quà" },
          };
          const mapped = typeMap[type] || { color: "default", text: type };
          return <Tag color={mapped.color}>{mapped.text}</Tag>;
        },
      },
      {
        title: "Giá trị",
        dataIndex: "value",
        key: "value",
        render: (val, record) => {
          if (record.type === "FREE_ITEM") return `${val} sản phẩm`;
          if (record.type === "DISCOUNT_PERCENT") return `${val}%`;
          return `${new Intl.NumberFormat("vi-VN").format(val)}đ`;
        },
      },
      {
        title: "Giá (Xu)",
        dataIndex: "costInCoins",
        key: "costInCoins",
        render: (val) => (
          <span>
            <DollarCircleFilled style={{ color: "#FFD700", marginRight: 4 }} />
            {val}
          </span>
        ),
      },
      {
        title: "Đã đổi / Giới hạn",
        key: "redeems",
        render: (_, record) => (
          <span>
            {record.redeemedCount} /{" "}
            {record.maxRedeems === 0 ? "Vô hạn" : record.maxRedeems}
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        render: (isActive, record) => {
          const isExpired = new Date(record.expirationDate) < new Date();
          if (isExpired) return <Tag color="red">Hết hạn</Tag>;
          return isActive ? (
            <Tag color="green">Kích hoạt</Tag>
          ) : (
            <Tag color="default">Vô hiệu</Tag>
          );
        },
      },
      {
        title: "Hành động",
        key: "action",
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa voucher này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleOpenEditModal, handleDelete],
  );

  return (
    <Table
      columns={columns}
      dataSource={vouchers}
      rowKey="_id"
      loading={loading}
      pagination={{ pageSize: 8 }}
      className="bg-white shadow-sm rounded-lg overflow-hidden"
    />
  );
};

export default VoucherTable;
