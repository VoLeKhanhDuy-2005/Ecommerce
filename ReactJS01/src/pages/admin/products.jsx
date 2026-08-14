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
  const [fileList, setFileList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
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
    setFileList([]);
    setPreviewUrls([]);
    form.resetFields();
    // Default values
    form.setFieldsValue({ discountPercent: 0, stock: 0, imageUrls: [""] });
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setEditingProduct(product);

    // Xử lý imageUrls nếu có ảnh từ url ngoài
    let imageUrls = [""];
    if (product.images && product.images.length > 0) {
      const urls = product.images.filter(
        (img) => img.startsWith("http") && !img.includes("amazonaws.com"),
      );
      const s3Urls = product.images.filter(
        (img) => !img.startsWith("http") || img.includes("amazonaws.com"),
      );

      if (urls.length > 0) {
        imageUrls = urls;
        setPreviewUrls(urls);
      } else {
        setPreviewUrls([]);
      }
      
      if (s3Urls.length > 0) {
        const initialFileList = s3Urls.map((img, index) => ({
          uid: `-${index}`,
          name: `image-${index}`,
          status: "done",
          url: img,
        }));
        setFileList(initialFileList);
        form.setFieldsValue({ uploadFiles: initialFileList });
      } else {
        setFileList([]);
        form.setFieldsValue({ uploadFiles: [] });
      }
    } else {
      setPreviewUrls([]);
      setFileList([]);
      form.setFieldsValue({ uploadFiles: [] });
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

      const currentFileList = fileList.filter(f => f.status !== "removed" && f.status !== "error");
      const currentUrls = values.imageUrls ? values.imageUrls.filter((u) => u && u.trim()) : [];

      if (currentFileList.length === 0 && currentUrls.length === 0) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng cung cấp ít nhất 1 hình ảnh cho sản phẩm!",
        });
        return;
      }

      // Gather all image URLs and old S3 keys
      let finalImageUrls = [...currentUrls];
      
      // Keep old S3 images by sending their keys in imageUrls
      currentFileList.forEach(file => {
        if (!file.originFileObj && file.url) {
          try {
            const urlObj = new URL(file.url);
            const key = decodeURIComponent(urlObj.pathname.substring(1));
            finalImageUrls.push(key);
          } catch(e) {
            finalImageUrls.push(file.url);
          }
        }
      });

      if (finalImageUrls.length > 0) {
        formData.append("imageUrls", finalImageUrls.join(","));
      }

      // Append new files
      currentFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj);
        }
      });

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
        description:
          error.response?.data?.EM ||
          error.message ||
          "Có lỗi xảy ra khi submit",
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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Input.Search
            placeholder="Tìm kiếm sản phẩm theo tên..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
          >
            Thêm Sản Phẩm
          </Button>
        </div>
      </div>

      <Table
        dataSource={products.filter((p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase())
        )}
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

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="mb-4">
              <span className="font-semibold block mb-1">Quản lý hình ảnh (Tối đa 5 ảnh tổng cộng)</span>
              <span className="text-gray-500 text-sm">Hiện có: {previewUrls.length + fileList.length}/5 ảnh</span>
            </div>
            
            <Form.List name="imageUrls" initialValue={[""]}>
                {(fields, { add, remove }) => (
                  <>
                    <div className="mb-2 font-medium">URLs Hình ảnh</div>
                    {fields.map((field) => (
                      <Form.Item
                        required={false}
                        key={field.key}
                        className="mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Form.Item
                            {...field}
                            validateTrigger={["onChange", "onBlur"]}
                            noStyle
                          >
                            <Input
                              placeholder="https://example.com/image.jpg"
                              onChange={() => {
                                setTimeout(() => {
                                  const currentUrls = form.getFieldValue("imageUrls") || [];
                                  setPreviewUrls(currentUrls.filter((url) => url && url.trim()));
                                }, 0);
                              }}
                            />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                remove(field.name);
                                setTimeout(() => {
                                  const currentUrls = form.getFieldValue("imageUrls") || [];
                                  setPreviewUrls(currentUrls.filter((url) => url && url.trim()));
                                }, 0);
                              }}
                            />
                          ) : null}
                        </div>
                      </Form.Item>
                    ))}
                    {(fields.length + fileList.length) < 5 && (
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Thêm URL Hình ảnh
                        </Button>
                      </Form.Item>
                    )}
                  </>
                )}
              </Form.List>

              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {previewUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`preview-${index}`}
                      className="w-20 h-20 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/80?text=Error";
                      }}
                    />
                  ))}
                </div>
              )}

            <Form.Item
              label="Tải ảnh lên từ máy tính"
              name="uploadFiles"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) return e;
                return e?.fileList;
              }}
            >
              <Upload
                listType="picture-card"
                beforeUpload={() => false}
                multiple
                maxCount={5}
                fileList={fileList}
                onChange={({ fileList }) => {
                  const limit = 5 - previewUrls.length;
                  setFileList(fileList.slice(0, limit));
                }}
                accept="image/*"
              >
                {(fileList.length + previewUrls.length) >= 5 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </div>

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
