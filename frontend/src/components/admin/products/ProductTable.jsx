import React, { useMemo, useState } from 'react';
import { Table, Button, Space, Popconfirm, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const ProductTable = ({ products, categories, loading, onEdit, onDelete, onOpenCreateModal }) => {
  const [searchText, setSearchText] = useState('');

  const filteredProducts = useMemo(() => {
    /*
      useMemo ở đây dùng để ghi nhớ (memoize) kết quả của việc lọc sản phẩm,
       để React không phải chạy .filter() lại ở mỗi lần render 
       nếu products và searchText không thay đổi.
    */
    return products.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [products, searchText]);

  const columns = useMemo(
    () => [
      {
        title: 'Hình ảnh',
        dataIndex: 'images', // lấy field images
        key: 'images', // định danh duy nhất column trong Ant Design.
        width: 100,
        render: (images) =>
          images && images.length > 0 ? (
            <img
              src={images[0]}
              alt='product'
              style={{
                width: 50,
                height: 50,
                objectFit: 'cover',
                // co giãn bên trong kích thước đã đặt
                //-> ảnh sẽ có kích thước đồng đều trong Table mà không bị
                // Phần ảnh thừa ở hai bên sẽ bị cắt (crop)
                borderRadius: '8px',
              }}
            />
          ) : (
            'Không có ảnh'
          ),
      },
      {
        title: 'Tên Sản Phẩm',
        dataIndex: 'name',
        key: 'name',
        width: '25%',
      },
      {
        title: 'Giá bán (VNĐ)',
        dataIndex: 'discountPrice',
        key: 'price',
        render: (price) => price.toLocaleString('vi-VN') + 'đ',
      },
      {
        title: 'Giảm giá',
        dataIndex: 'discountPercent',
        key: 'discountPercent',
        render: (percent) => percent + '%',
      },
      {
        title: 'Danh mục',
        dataIndex: 'category',
        key: 'category',
        render: (categoryId) => {
          const cat = categories.find((c) => c.categoryId === categoryId);
          return cat ? cat.name : categoryId;
        },
      },
      {
        title: 'Kho',
        dataIndex: 'stock',
        key: 'stock',
      },
      {
        title: 'Hành động',
        key: 'action',
        width: '15%',
        render: (_, record) => (
          <Space size='middle'>
            <Button type='primary' icon={<EditOutlined />} onClick={() => onEdit(record)}>
              {/* type="primary" làm cho button có màu xanh, 
            để báo rằng đây là hành động chính, 
            thường dùng cho các hành động quan trọng như "Lưu", "Thêm", "Gửi"... 
            cũng tạo ra hover state*/}
              Sửa
            </Button>
            <Popconfirm
              title='Bạn có chắc chắn muốn xóa sản phẩm này?'
              onConfirm={() => onDelete(record._id)}
              okText='Đồng ý'
              cancelText='Hủy'
            >
              <Button danger icon={<DeleteOutlined />}>
                {/* danger làm cho button có màu đỏ,
              để báo rằng đây là hành động nguy hiểm hoặc có tính phá hủy*/}
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [categories, onEdit, onDelete]
  );

  return (
    <>
      <div className='flex flex-col sm:flex-row justify-end items-center gap-4 mb-4 w-full sm:w-auto'>
        <Input
          placeholder='Tìm kiếm sản phẩm theo tên...'
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          className='w-full sm:w-64'
        />
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={onOpenCreateModal}
          className='bg-orange-500 hover:bg-orange-600 w-full sm:w-auto'
        >
          Thêm Sản Phẩm
        </Button>
      </div>

      <Table
        dataSource={filteredProducts}
        columns={columns}
        rowKey='_id'
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
        className='bg-white rounded-lg shadow-sm'
      />
      {/*_id: field _id của product
      bordered: Các ô sẽ có đường viền, giúp bảng nhìn rõ ràng hơn
      rounded-lg: class của Tailwind CSS, Tạo bo góc lớn vừa phải
      shadow-sm: class của Tailwind CSS, phần tử sẽ có một lớp bóng rất nhẹ
       xung quanh, giúp nó nổi lên khỏi nền.*/}
    </>
  );
};

export default ProductTable;
