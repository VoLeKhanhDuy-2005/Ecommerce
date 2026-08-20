import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Space, Button, Upload, notification } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createCategoryApi, updateCategoryApi } from "../../../apis";

const extractS3KeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch (e) {
    return url;
  }
};

const CategoryModal = ({
  isVisible,
  isEditMode,
  editingCategory,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theo dõi giá trị URL nhập vào
  const imageUrlWatcher = Form.useWatch("imageUrl", form);
  const previewUrl =
    imageUrlWatcher &&
    typeof imageUrlWatcher === "string" &&
    imageUrlWatcher.trim()
      ? imageUrlWatcher
      : null;

  useEffect(() => {
    if (isVisible) {
      if (isEditMode && editingCategory) {
        let imageUrl = "";

        if (editingCategory.image) {
          // Kiểm tra xem có phải link HTTP hay ảnh từ S3
          const isS3 =
            !editingCategory.image.startsWith("http") ||
            editingCategory.image.includes("amazonaws.com");

          if (!isS3) {
            imageUrl = editingCategory.image;
            setFileList([]);
          } else {
            setFileList([
              {
                uid: "-1",
                name: "image.png",
                status: "done",
                url: editingCategory.image,
              },
            ]);
          }
        } else {
          setFileList([]);
        }

        form.setFieldsValue({
          categoryId: editingCategory.categoryId,
          name: editingCategory.name,
          imageUrl: imageUrl,
        });
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [isVisible, isEditMode, editingCategory, form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", values.categoryId);
      formData.append("name", values.name);

      const currentFileList = fileList.filter(
        (f) => f.status !== "removed" && f.status !== "error",
      );
      const hasUrl = values.imageUrl && values.imageUrl.trim();

      if (currentFileList.length === 0 && !hasUrl) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng cung cấp hình ảnh cho danh mục!",
        });
        setIsSubmitting(false);
        return;
      }

      if (currentFileList.length > 0) {
        const file = currentFileList[0];
        if (!file.originFileObj && file.url) {
          // Ảnh cũ từ server, trích xuất S3 Key và gửi lên
          formData.append("imageUrl", extractS3KeyFromUrl(file.url));
        } else if (file.originFileObj) {
          // File tải lên mới
          formData.append("image", file.originFileObj);
        }
      } else if (values.imageUrl && values.imageUrl.trim()) {
        // Nếu không có file trong danh sách, sử dụng URL nhập tay
        // (do category tối đa 1 ảnh)
        formData.append("imageUrl", values.imageUrl.trim());
      }

      let res;
      if (isEditMode) {
        res = await updateCategoryApi(editingCategory._id, formData);
      } else {
        res = await createCategoryApi(formData);
      }

      if (res && res.success) {
        notification.success({
          message: "Lưu thành công",
          description: res.message,
        });
        onSuccess();
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
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={isEditMode ? "Cập nhật Danh mục" : "Thêm mới Danh mục"}
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
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

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <div className="mb-4">
            <span className="font-semibold block mb-1">
              Quản lý hình ảnh (Tối đa 1 ảnh)
            </span>
          </div>

          <Form.Item name="imageUrl" label="URL Hình ảnh">
            <Input
              placeholder="https://example.com/image.jpg"
              disabled={fileList.length > 0}
            />
          </Form.Item>

          {previewUrl && fileList.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <img
                src={previewUrl}
                alt={`preview`}
                className="w-20 h-20 object-cover rounded border border-gray-200"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/80?text=Error";
                }}
              />
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
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => {
                setFileList(fileList);
                // Xóa URL nhập tay nếu người dùng chọn upload file
                if (fileList.length > 0) {
                  form.setFieldsValue({ imageUrl: "" });
                }
              }}
              accept="image/*"
            >
              {fileList.length > 0 || previewUrl ? null : (
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
              className="bg-orange-500 hover:bg-orange-600 border-none"
            >
              Lưu
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
