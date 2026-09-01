import React from 'react';
import { Card, Typography } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f26c6d'];

const STATUS_MAP = {
  Confirmed: 'Đã xác nhận',
  Preparing: 'Đang chuẩn bị hàng',
  Shipping: 'Đang giao',
  Delivered: 'Đã giao',
  Cancelled: 'Đã hủy',
  Returned: 'Đã hoàn tiền',
};

const OrderStatusChart = ({ data }) => {
  const mappedData = data
    ? data.map((item) => ({
        ...item,
        name: STATUS_MAP[item.name] || item.name,
      }))
    : [];

  return (
    <Card bordered={false} className='shadow-sm rounded-2xl h-full'>
      <Title level={4} className='!mb-6 !text-gray-700'>
        Trạng thái đơn hàng
      </Title>
      <div className='h-[300px] w-full flex items-center justify-center'>
        {mappedData.length > 0 ? (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={mappedData}
                cx='50%'
                cy='45%'
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey='value'
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend verticalAlign='bottom' height={36} iconType='circle' />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className='text-gray-400'>Không có dữ liệu</div>
        )}
      </div>
    </Card>
  );
};

export default OrderStatusChart;
