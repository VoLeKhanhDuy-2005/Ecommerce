import React from 'react';
import { Empty } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import { getVoucherTypeIcon, getVoucherDescription } from './voucherUtils';

const MyVouchers = ({ myVouchers }) => {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-2'>
        <TagOutlined className='text-green-500' /> Kho Voucher Của Tôi
      </h2>
      {myVouchers.length === 0 ? (
        <Empty description='Bạn chưa có voucher nào' />
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {myVouchers.map((uv) => {
            const v = uv.voucher;
            if (!v) return null;
            return (
              <div
                key={uv._id}
                className='bg-white border border-green-100 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden group'
              >
                <div className='absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10'>
                  Chưa sử dụng
                </div>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-xl shrink-0 border border-green-100 text-green-500'>
                    {getVoucherTypeIcon(v.type)}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-gray-800 text-sm'>{v.title}</h3>
                    <p className='text-xs text-gray-500 mb-1'>{getVoucherDescription(v)}</p>
                    <p className='text-[10px] text-gray-400'>
                      HSD: {new Date(v.expirationDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyVouchers;
