import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Space,
  Popconfirm,
  notification,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  DollarCircleFilled,
  GiftOutlined,
} from "@ant-design/icons";
import {
  getAllAdminVouchersApi,
  createVoucherApi,
  updateVoucherApi,
  deleteVoucherApi,
  getAdminProductsApi,
} from "../../util/api";
import moment from "moment";

const { Option } = Select;

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();

  const voucherType = Form.useWatch("type", form);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await getAllAdminVouchersApi();
      if (res && res.success) {
        setVouchers(res.data);
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể tải danh sách voucher",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi kết nối khi tải voucher",
      });
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await getAdminProductsApi();
      if (res && res.EC === 0) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingVoucher(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      maxRedeems: 0,
      minOrderValue: 0,
    });
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (voucher) => {
    setIsEditMode(true);
    setEditingVoucher(voucher);
    form.setFieldsValue({
      ...voucher,
      expirationDate: moment(voucher.expirationDate),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteVoucherApi(id);
      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: "Xóa voucher thành công",
        });
        fetchVouchers();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể xóa voucher",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi kết nối khi xóa voucher",
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        expirationDate: values.expirationDate.toISOString(),
      };

      if (payload.type !== "FREE_ITEM") {
        payload.freeItemId = null;
      }
      if (payload.type !== "DISCOUNT_PERCENT") {
        payload.maxDiscountAmount = null;
      }

      let res;
      if (isEditMode) {
        res = await updateVoucherApi(editingVoucher._id, payload);
      } else {
        res = await createVoucherApi(payload);
      }

      if (res && res.success) {
        notification.success({
          message: "Thành công",
          description: res.message,
        });
        setIsModalVisible(false);
        fetchVouchers();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi kết nối khi lưu voucher",
      });
    }
  };

  const columns = [
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
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-orange-400 to-red-500 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <TagsOutlined className="text-orange-500" />
            <span>Quản Lý Voucher</span>
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600 border-none"
        >
          Thêm Voucher
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={vouchers}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        className="bg-white shadow-sm rounded-lg overflow-hidden"
      />

      <Modal
        title={isEditMode ? "Cập nhật Voucher" : "Thêm mới Voucher"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {isEditMode && editingVoucher?.redeemedCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg mb-4 text-sm">
            Voucher này đã có người đổi nên một số thông tin quan trọng sẽ bị
            khóa. Bạn chỉ có thể sửa tiêu đề, mô tả, ngày hết hạn và giới hạn số
            lượng.
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="code"
              label="Mã Voucher"
              rules={[{ required: true, message: "Vui lòng nhập mã voucher!" }]}
            >
              <Input placeholder="Ví dụ: SUMMER2024" disabled={isEditMode} />
            </Form.Item>

            <Form.Item
              name="title"
              label="Tiêu đề hiển thị"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
            >
              <Input placeholder="Ví dụ: Giảm 20K cho đơn từ 100K" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Loại Khuyến Mãi"
              rules={[{ required: true, message: "Vui lòng chọn loại!" }]}
            >
              <Select
                placeholder="Chọn loại khuyến mãi"
                disabled={isEditMode && editingVoucher?.redeemedCount > 0}
              >
                <Option value="DISCOUNT_AMOUNT">Giảm tiền mặt</Option>
                <Option value="DISCOUNT_PERCENT">Giảm phần trăm</Option>
                <Option value="FREE_SHIP">Miễn phí vận chuyển</Option>
                <Option value="FREE_ITEM">Tặng quà</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="value"
              label={
                voucherType === "FREE_ITEM"
                  ? "Số lượng quà tặng"
                  : "Giá trị (VND hoặc %)"
              }
              rules={[{ required: true, message: "Vui lòng nhập giá trị!" }]}
            >
              <InputNumber
                className="w-full"
                min={1}
                disabled={isEditMode && editingVoucher?.redeemedCount > 0}
              />
            </Form.Item>

            {voucherType === "FREE_ITEM" && (
              <Form.Item
                name="freeItemId"
                label="Chọn Sản Phẩm Quà Tặng"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn sản phẩm quà tặng!",
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn sản phẩm"
                  optionFilterProp="children"
                  disabled={isEditMode && editingVoucher?.redeemedCount > 0}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={products.map((p) => ({
                    value: p._id,
                    label: p.name,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="costInCoins"
              label="Giá bán bằng Xu"
              rules={[
                { required: true, message: "Vui lòng nhập giá bán bằng Xu!" },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
                disabled={isEditMode && editingVoucher?.redeemedCount > 0}
              />
            </Form.Item>

            <Form.Item
              name="maxRedeems"
              label="Giới hạn số lượng (0 = vô hạn)"
              rules={[{ required: true, message: "Vui lòng nhập giới hạn!" }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>

            <Form.Item name="minOrderValue" label="Giá trị đơn hàng tối thiểu">
              <InputNumber
                className="w-full"
                min={0}
                disabled={isEditMode && editingVoucher?.redeemedCount > 0}
              />
            </Form.Item>

            {voucherType === "DISCOUNT_PERCENT" && (
              <Form.Item name="maxDiscountAmount" label="Giảm tối đa (VND)">
                <InputNumber
                  className="w-full"
                  min={0}
                  disabled={isEditMode && editingVoucher?.redeemedCount > 0}
                />
              </Form.Item>
            )}

            <Form.Item
              name="expirationDate"
              label="Ngày hết hạn"
              rules={[
                { required: true, message: "Vui lòng chọn ngày hết hạn!" },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả chi tiết"
              className="md:col-span-3"
            >
              <Input.TextArea rows={3} placeholder="Mô tả voucher..." />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Kích hoạt"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-orange-500 hover:bg-orange-600 border-none"
              >
                Lưu Voucher
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminVouchersPage;
