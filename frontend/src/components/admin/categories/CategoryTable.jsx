import { useMemo } from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const CategoryTable = ({ categories, loading, onEdit, onDelete, onOpenCreateModal }) => {
  const columns = useMemo(
    () => [
      {
        title: 'Mã Danh Mục',
        dataIndex: 'categoryId',
        key: 'categoryId',
      },
      {
        title: 'Hình ảnh',
        dataIndex: 'image',
        key: 'image',
        render: (text) =>
          text ? (
            <img src={text} alt='category' className='w-10 h-10 object-contain rounded' />
          ) : (
            'Không có ảnh'
          ),
      },
      {
        title: 'Tên Danh Mục',
        dataIndex: 'name',
        key: 'name',
        width: '35%',
      },
      {
        title: 'Ngày Tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (text) => new Date(text).toLocaleString('vi-VN'),
      },
      {
        title: 'Hành động',
        key: 'action',
        width: '15%',
        render: (_, record) => (
          <Space size='middle'>
            <Button type='primary' icon={<EditOutlined />} onClick={() => onEdit(record)}>
              Sửa
            </Button>
            <Popconfirm
              title='Bạn có chắc chắn muốn xóa danh mục này?'
              onConfirm={() => onDelete(record._id)}
              okText='Đồng ý'
              cancelText='Hủy'
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <>
      <div className='flex flex-col sm:flex-row justify-end sm:items-center gap-4 mb-4'>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={onOpenCreateModal}
          className='bg-orange-500 hover:bg-orange-600 border-none w-full sm:w-auto'
        >
          Thêm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey='_id'
        loading={loading}
        pagination={{ pageSize: 6 }}
        className='bg-white shadow-sm rounded-lg overflow-hidden'
      />
    </>
  );
};

export default CategoryTable;
