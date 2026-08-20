import React, { useEffect, useState } from "react";
import { notification } from "antd";
import { UnorderedListOutlined } from "@ant-design/icons";
import { getCategoriesApi, deleteCategoryApi } from "../../apis";
import CategoryTable from "../../components/admin/categories/CategoryTable";
import CategoryModal from "../../components/admin/categories/CategoryModal";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi();
      if (res && res.success) {
        setCategories(res.data);
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể tải danh mục",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi server khi tải danh mục",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingCategory(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (category) => {
    setIsEditMode(true);
    setEditingCategory(category);
    setIsModalVisible(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await deleteCategoryApi(id);
      if (res && res.success) {
        notification.success({
          message: "Xóa danh mục thành công",
          description: res.message,
        });
        fetchCategories();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể xóa danh mục",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.EM || "Lỗi khi xóa danh mục",
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <UnorderedListOutlined className="text-purple-600" />
            <span>Quản Lý Danh Mục Sản Phẩm</span>
          </h1>
        </div>
      </div>

      <CategoryTable
        categories={categories}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteCategory}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <CategoryModal
        isVisible={isModalVisible}
        isEditMode={isEditMode}
        editingCategory={editingCategory}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchCategories();
        }}
      />
    </div>
  );
};

export default AdminCategoriesPage;
