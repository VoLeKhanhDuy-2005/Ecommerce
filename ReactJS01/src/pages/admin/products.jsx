import React, { useEffect, useState } from "react";
import { notification } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import {
  getAdminProductsApi,
  deleteProductApi,
  getCategoriesApi,
} from "../../util/api";
import ProductTable from "../../components/admin/products/ProductTable";
import ProductModal from "../../components/admin/products/ProductModal";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getAdminProductsApi();
      if (res && res.EC === 0) {
        setProducts(res.data);
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.EM || "Không thể tải danh sách sản phẩm",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi gọi API",
      });
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi();
      if (res && res.EC === 0) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleDeleteProduct = async (id) => {
    try {
      const res = await deleteProductApi(id);
      if (res && res.EC === 0) {
        notification.success({
          message: "Thành công",
          description: "Đã xóa sản phẩm",
        });
        fetchProducts();
      } else {
        notification.error({ message: "Lỗi", description: res.EM });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi gọi API",
      });
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingProduct(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setEditingProduct(product);
    setIsModalVisible(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingOutlined className="text-purple-600" />
            <span>Quản Lý Sản Phẩm</span>
          </h1>
        </div>
      </div>

      <ProductTable
        products={products}
        categories={categories}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProduct}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <ProductModal
        isVisible={isModalVisible}
        isEditMode={isEditMode}
        editingProduct={editingProduct}
        categories={categories}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchProducts();
        }}
      />
    </div>
  );
};

export default AdminProductsPage;
