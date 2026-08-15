import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Button,
  Upload,
  notification,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { createProductApi, updateProductApi } from "../../../../src/util/api";

const { TextArea } = Input;
const { Option } = Select;

/**
 * Hàm helper chuyên xử lý việc tách S3 key từ một URL đầy đủ
 */
const extractS3KeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);

    // Bỏ dấu '/' ở đầu và giải mã các ký tự đặc biệt (vd: %20 -> dấu cách)
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch (e) {
    // Trả về url gốc nếu có lỗi parse để không làm mất data
    return url;
  }
};

const ProductModal = ({
  isVisible,
  isEditMode,
  editingProduct,
  categories,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dùng Form.useWatch để theo dõi sự thay đổi của trường imageUrls trực tiếp
  const imageUrlsWatcher = Form.useWatch("imageUrls", form) || [];
  /*
    || []: fallback khi:
    - Form chưa có giá trị imageUrls
    - Field imageUrls chưa được khởi tạo
    - Form mới render lần đầu
  */
  const previewUrls = imageUrlsWatcher.filter(
    (url) => url && typeof url === "string" && url.trim(),
  );

  useEffect(() => {
    if (isVisible) {
      if (isEditMode && editingProduct) {
        let imageUrls = [""];
        if (editingProduct.images && editingProduct.images.length > 0) {
          const urls = editingProduct.images.filter(
            (img) => img.startsWith("http") && !img.includes("amazonaws.com"),
          );
          const s3Urls = editingProduct.images.filter(
            (img) => !img.startsWith("http") || img.includes("amazonaws.com"),
          );

          if (urls.length > 0) {
            imageUrls = urls;
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
          setFileList([]);
          form.setFieldsValue({ uploadFiles: [] });
        }

        form.setFieldsValue({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          discountPercent: editingProduct.discountPercent,
          category: editingProduct.category,
          stock: editingProduct.stock,
          imageUrls: imageUrls,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ discountPercent: 0, stock: 0, imageUrls: [""] });
        setFileList([]);
      }
    }
  }, [isVisible, isEditMode, editingProduct, form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("discountPercent", values.discountPercent);
      formData.append("category", values.category);
      formData.append("stock", values.stock);

      const currentFileList = fileList.filter(
        (f) => f.status !== "removed" && f.status !== "error",
      );
      const currentUrls = values.imageUrls
        ? values.imageUrls.filter((u) => u && u.trim())
        : [];

      if (currentFileList.length === 0 && currentUrls.length === 0) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng cung cấp ít nhất 1 hình ảnh cho sản phẩm!",
        });
        setIsSubmitting(false);
        return;
      }

      let finalImageUrls = [...currentUrls];

      currentFileList.forEach((file) => {
        if (!file.originFileObj && file.url) {
          // Ảnh cũ
          // Ảnh cũ: có url; ảnh mới: có originFileObj
          // Trích xuất S3 key từ ảnh cũ trên server trước khi gửi lại
          finalImageUrls.push(extractS3KeyFromUrl(file.url));
        }
      });

      if (finalImageUrls.length > 0) {
        formData.append("imageUrls", finalImageUrls.join(","));
      }

      // Thêm file mới vào FormData (chỉ những file mới được chọn, chưa upload)
      currentFileList.forEach((file) => {
        if (file.originFileObj) {
          // file.originFileObj là file vật lý từ máy người dùng
          formData.append("images", file.originFileObj);
          // Các file cũ thì đã có trong imageUrls rồi, không cần append lại
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
        onSuccess();
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
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={isEditMode ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Tên Sản Phẩm"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
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
            <span className="font-semibold block mb-1">
              Quản lý hình ảnh (Tối đa 5 ảnh tổng cộng)
            </span>
            <span className="text-gray-500 text-sm">
              Hiện có: {previewUrls.length + fileList.length}/5 ảnh
            </span>
          </div>

          <Form.List name="imageUrls" initialValue={[""]}>
            {(fields, { add, remove }) => (
              <>
                <div className="mb-2 font-medium">URLs Hình ảnh</div>
                {fields.map((field) => (
                  <Form.Item required={false} key={field.key} className="mb-3">
                    <div className="flex items-center gap-2">
                      <Form.Item
                        {...field}
                        validateTrigger={["onChange", "onBlur"]}
                        noStyle
                      >
                        <Input placeholder="https://example.com/image.jpg" />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      ) : null}
                    </div>
                  </Form.Item>
                ))}
                {fields.length + fileList.length < 5 && (
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
                    e.target.src = "https://via.placeholder.com/80?text=Error";
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
              {fileList.length + previewUrls.length >= 5 ? null : (
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
            <Button onClick={onCancel} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              className="bg-orange-500"
            >
              {/* htmlType="submit" <-> <button type="submit"></button> trong html */}
              {isEditMode ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductModal;
