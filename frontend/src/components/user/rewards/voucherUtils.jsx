import React from 'react';
import { DollarOutlined, TagOutlined, CarFilled, GiftOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../utils/formatter';

export const getVoucherTypeIcon = (type) => {
  switch (type) {
    case 'DISCOUNT_AMOUNT':
      return <DollarOutlined className='text-orange-500' />;
    case 'DISCOUNT_PERCENT':
      return <TagOutlined className='text-pink-500' />;
    case 'FREE_SHIP':
      return <CarFilled className='text-blue-500' />;
    case 'FREE_ITEM':
      return <GiftOutlined className='text-purple-500' />;
    default:
      return <TagOutlined />;
  }
};

export const getVoucherDescription = (v) => {
  if (v.type === 'DISCOUNT_AMOUNT') return `Giảm ${formatCurrency(v.value)}`;
  if (v.type === 'DISCOUNT_PERCENT')
    return `Giảm ${v.value}% (Tối đa ${formatCurrency(v.maxDiscountAmount)})`;
  if (v.type === 'FREE_SHIP') return `Giảm ${formatCurrency(v.value)} phí vận chuyển`;
  if (v.type === 'FREE_ITEM') return `Tặng kèm sản phẩm miễn phí`;
  return '';
};
