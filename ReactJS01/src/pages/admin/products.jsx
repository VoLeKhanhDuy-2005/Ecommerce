import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
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
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCategoriesApi,
} from "../../util/api";

const { TextArea } = Input;
const { Option } = Select;

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageOption, setImageOption] = useState("upload");
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getAdminProductsApi();
      if (res && res.EC === 0) {
        setProducts(res.data);
      } else {
        notification.error({
          message: "Lỗi",
          description: res.EM || "Không thể tải danh sách sản phẩm",
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

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingProduct(null);
    setImageOption("upload");
    setFileList([]);
    form.resetFields();
    // Default values
    form.setFieldsValue({ discountPercent: 0, stock: 0 });
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setEditingProduct(product);

    // Xử lý imageUrls nếu có ảnh từ url ngoài
    let imageUrls = "";
    if (product.images && product.images.length > 0) {
      const urls = product.images.filter((img) => img.startsWith("http") && !img.includes("amazonaws.com"));
      if (urls.length > 0) {
        imageUrls = urls.join(", ");
        setImageOption("url");
      } else {
        setImageOption("upload");
        // Convert S3 keys/URLs to Ant Design fileList format
        const initialFileList = product.images.map((img, index) => ({
          uid: `-${index}`,
          name: `image-${index}`,
          status: "done",
          url: img,
        }));
        setFileList(initialFileList);
        form.setFieldsValue({ uploadFiles: initialFileList });
      }
    } else {
      setImageOption("upload");
    }

    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercent: product.discountPercent,
      category: product.category,
      stock: product.stock,
      imageUrls: imageUrls,
    });

    setIsModalVisible(true);
  };

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

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("discountPercent", values.discountPercent);
      formData.append("category", values.category);
      formData.append("stock", values.stock);

      if (imageOption === "upload" && fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("images", file.originFileObj);
        });
      } else if (imageOption === "url" && values.imageUrls) {
        formData.append("imageUrls", values.imageUrls);
      }

      let res;
      if (isEditMode) {
        res = await updateProductApi(editingProduct._id, formData);
      } else {
        res = await createProductApi(formData);
      }

      if (res && res.EC === 0) {
        notification.success({
          message: "Thành công",
          description: isEditMode
            ? "Cập nhật sản phẩm thành công"
            : "Tạo sản phẩm thành công",
        });
        setIsModalVisible(false);
        fetchProducts();
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.EM || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      notification.error({
        message: "Lỗi",
        description: error.response?.data?.EM || error.message || "Có lỗi xảy ra khi submit",
      });
    }
  };

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "images",
      key: "images",
      width: 100,
      render: (images) =>
        images && images.length > 0 ? (
          <img
            src={images[0]}
            alt="product"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        ) : (
          "Không có ảnh"
        ),
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: "name",
      key: "name",
      width: "25%",
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      render: (price) => price.toLocaleString("vi-VN") + "đ",
    },
    {
      title: "Giảm giá",
      dataIndex: "discountPercent",
      key: "discountPercent",
      render: (percent) => percent + "%",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (categoryId) => {
        const cat = categories.find((c) => c.categoryId === categoryId);
        return cat ? cat.name : categoryId;
      },
    },
    {
      title: "Kho",
      dataIndex: "stock",
      key: "stock",
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
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDeleteProduct(record._id)}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingOutlined className="text-purple-600" />
            <span>Quản Lý Sản Phẩm</span>
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Thêm Sản Phẩm
        </Button>
      </div>

      <Table
        dataSource={products}
        columns={columns}
        rowKey="_id"
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
        className="bg-white rounded-lg shadow-sm"
      />

      <Modal
        title={isEditMode ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên Sản Phẩm"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm!" },
              ]}
              className="col-span-2"
            >
              <Input placeholder="Ví dụ: Cơm gà Hải Nam" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Danh Mục"
              rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
            >
              <Select placeholder="Chọn danh mục">
                {categories.map((cat) => (
                  <Option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá Bán (VNĐ)"
              rules={[{ required: true, message: "Vui lòng nhập giá bán!" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Ví dụ: 50000"
              />
            </Form.Item>

            <Form.Item
              name="discountPercent"
              label="Giảm Giá (%)"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập phần trăm giảm giá!",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0} max={100} />
            </Form.Item>

            <Form.Item
              name="stock"
              label="Số Lượng Tồn Kho"
              rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Mô Tả Sản Phẩm"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả sản phẩm..." />
          </Form.Item>

          <Form.Item label="Phương thức ảnh">
            <Radio.Group
              value={imageOption}
              onChange={(e) => setImageOption(e.target.value)}
            >
              <Radio value="upload">Tải file lên</Radio>
              <Radio value="url">
                Nhập URL (Nhiều ảnh cách nhau bằng dấu phẩy)
              </Radio>
            </Radio.Group>
          </Form.Item>

          {imageOption === "url" ? (
            <Form.Item 
            name="imageUrls" 
            label="URLs Hình ảnh"
            rules={[{ required: true, message: "Vui lòng nhập ít nhất 1 link ảnh sản phẩm!" }]}
            >
              <Input placeholder="https://image1.jpg, https://image2.png" />
            </Form.Item>
          ) : (
            <Form.Item 
            label="Tải ảnh lên"
            name="uploadFiles"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e?.fileList;
            }}
            rules={[
              { 
                required: true, 
                type: 'array',
                message: "Vui lòng chọn ít nhất 1 ảnh sản phẩm!" 
              }
            ]}
            >
              <Upload
                beforeUpload={() => false}
                multiple
                maxCount={5}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>
                  Chọn ảnh (Tối đa 5 file)
                </Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isEditMode ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
