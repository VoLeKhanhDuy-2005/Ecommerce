import React, { useMemo } from 'react';
import { Table, Tag } from 'antd';

const UserTable = ({ dataSource, loading }) => {
  const columns = useMemo(
    () => [
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        render: (text) => <span className='font-medium text-gray-700'>{text}</span>,
      },
      {
        title: 'Tên',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Điện thoại',
        dataIndex: 'phone',
        key: 'phone',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          let color = 'default';
          if (status === 'ACTIVE') color = 'green';
          if (status === 'BANNED') color = 'red';
          return <Tag color={color}>{status || 'N/A'}</Tag>;
        },
      },
    ],
    []
  );

  return (
    <Table
      bordered
      dataSource={dataSource}
      columns={columns}
      rowKey={'_id'}
      loading={loading}
      pagination={{ pageSize: 10 }}
      className='bg-white rounded-lg shadow-sm'
    />
  );
};

export default UserTable;
