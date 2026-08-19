import React from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Space,
  Button,
} from "antd";

const { Option } = Select;

const VoucherModal = ({
  isModalVisible,
  setIsModalVisible,
  isEditMode,
  editingVoucher,
  form,
  handleSubmit,
  products,
}) => {
  const voucherType = Form.useWatch("type", form);

  return (
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
            <Input placeholder="Ví dụ: SUMMER2026" disabled={isEditMode} />
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
            rules={[{ required: true, message: "Vui lòng chọn ngày hết hạn!" }]}
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

          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
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
  );
};

export default VoucherModal;
