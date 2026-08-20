import React, { useEffect, useState } from "react";
import { Button, Form, notification } from "antd";
import { PlusOutlined, TagsOutlined } from "@ant-design/icons";
import {
  getAllAdminVouchersApi,
  createVoucherApi,
  updateVoucherApi,
  deleteVoucherApi,
  getAdminProductsApi,
} from "../../apis";
import moment from "moment";
import VoucherTable from "../../components/admin/vouchers/VoucherTable";
import VoucherModal from "../../components/admin/vouchers/VoucherModal";

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();

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
      if (res && res.success) {
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

      <VoucherTable
        vouchers={vouchers}
        loading={loading}
        handleOpenEditModal={handleOpenEditModal}
        handleDelete={handleDelete}
      />

      <VoucherModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        isEditMode={isEditMode}
        editingVoucher={editingVoucher}
        form={form}
        handleSubmit={handleSubmit}
        products={products}
      />
    </div>
  );
};

export default AdminVouchersPage;
