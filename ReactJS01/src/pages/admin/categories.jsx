import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  notification,
  Upload,
  Radio,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../../util/api";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageOption, setImageOption] = useState("upload");
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi();
      if (res && res.EC === 0) {
        setCategories(res.data);
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.EM || "Không thể tải danh mục",
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
    setImageOption("upload");
    setFileList([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (category) => {
    setIsEditMode(true);
    setEditingCategory(category);
    form.setFieldsValue({
      categoryId: category.categoryId,
      name: category.name,
      imageUrl:
        category.image &&
        category.image.startsWith("http") &&
        !category.image.includes("amazonaws.com")
          ? category.image
          : "",
    });
    if (
      category.image &&
      category.image.startsWith("http") &&
      !category.image.includes("amazonaws.com")
    ) {
      setImageOption("url");
    } else {
      setImageOption("upload");
    }
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await deleteCategoryApi(id);
      if (res && res.EC === 0) {
        notification.success({
          message: "Xóa danh mục thành công",
          description: res.EM,
        });
        fetchCategories();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.EM || "Không thể xóa danh mục",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.EM || "Lỗi khi xóa danh mục",
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("categoryId", values.categoryId);
      formData.append("name", values.name);

      if (imageOption === "upload" && fileList.length > 0) {
        formData.append("image", fileList[0].originFileObj);
      } else if (imageOption === "url" && values.imageUrl) {
        formData.append("imageUrl", values.imageUrl);
      }

      let res;
      if (isEditMode) {
        res = await updateCategoryApi(editingCategory._id, formData);
      } else {
        res = await createCategoryApi(formData);
      }

      if (res && res.EC === 0) {
        notification.success({
          message: "Lưu thành công",
          description: res.EM,
        });
        setIsModalVisible(false);
        fetchCategories();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.EM || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.EM || "Lỗi khi lưu danh mục",
      });
    }
  };

  const columns = [
    {
      title: "Mã Danh Mục",
      dataIndex: "categoryId",
      key: "categoryId",
    },
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (text) =>
        text ? (
          <img
            src={text}
            alt="category"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
        ) : (
          "Không có ảnh"
        ),
    },
    {
      title: "Tên Danh Mục",
      dataIndex: "name",
      key: "name",
      width: "35%",
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      width: "15%",
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
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDeleteCategory(record._id)}
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
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <TagsOutlined className="text-purple-600" />
            <span>Quản Lý Danh Mục Sản Phẩm</span>
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600 border-none"
        >
          Thêm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 6 }}
        className="bg-white shadow-sm rounded-lg overflow-hidden"
      />

      <Modal
        title={isEditMode ? "Cập nhật Danh mục" : "Thêm mới Danh mục"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="categoryId"
            label="Mã Danh mục"
            rules={[
              { required: true, message: "Vui lòng nhập mã danh mục!" },
              {
                pattern: /^[a-zA-Z0-9-_]+$/,
                message:
                  "Mã danh mục chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới!",
              },
            ]}
          >
            <Input placeholder="Ví dụ: do-uong" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên Danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Ví dụ: Đồ uống" />
          </Form.Item>

          <Form.Item label="Phương thức ảnh">
            <Radio.Group
              value={imageOption}
              onChange={(e) => setImageOption(e.target.value)}
            >
              <Radio value="upload">Tải file lên</Radio>
              <Radio value="url">Nhập URL</Radio>
            </Radio.Group>
          </Form.Item>

          {imageOption === "url" ? (
            <Form.Item
              name="imageUrl"
              label="URL Hình ảnh"
              rules={[{ required: true, message: "Vui lòng nhập URL!" }]}
            >
              <Input placeholder="https://..." />
            </Form.Item>
          ) : (
            <Form.Item label="Tải ảnh lên" required={!isEditMode}>
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-orange-500 hover:bg-orange-600 border-none"
              >
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
