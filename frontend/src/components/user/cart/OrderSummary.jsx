import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const OrderSummary = ({
  cartItems,
  formatCurrency,
  calculateTotal,
  shippingFee,
  myVouchers,
  selectedVoucherId,
  setSelectedVoucherId,
  calculateDiscount,
  handlePlaceOrder,
  isSubmitting,
  paymentMethod,
  setCurrentStep,
}) => {
  return (
    <div className='bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 sticky top-24'>
      <h2 className='text-base font-bold text-gray-800 border-b border-gray-100 pb-2'>
        Tóm tắt đơn hàng
      </h2>

      <div className='max-h-40 overflow-y-auto space-y-2.5 pr-1'>
        {cartItems.map((item) => {
          const activePrice =
            item.product.discountPrice && item.product.discountPrice > 0
              ? item.product.discountPrice
              : item.product.price;
          return (
            <div key={item.product._id} className='flex justify-between items-center text-xs'>
              <span className='text-gray-600 font-medium line-clamp-1 max-w-[120px]'>
                {item.product.name}
              </span>
              <span className='text-gray-400 text-2xs'>x{item.quantity}</span>
              <span className='text-gray-800 font-bold'>{formatCurrency(activePrice)}</span>
            </div>
          );
        })}
      </div>

      <div className='border-t border-gray-100 pt-3 space-y-2'>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-semibold text-gray-500'>Tiền hàng:</span>
          <span className='text-sm font-black text-gray-700'>
            {formatCurrency(calculateTotal())}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-sm font-semibold text-gray-500'>Phí giao hàng:</span>
          <span className='text-sm font-black text-gray-700'>{formatCurrency(shippingFee)}</span>
        </div>

        {myVouchers.length > 0 && (
          <div className='pt-2'>
            <label className='text-xs font-semibold text-gray-500 block mb-1'>
              Áp dụng Voucher
            </label>
            <select
              className='w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:border-orange-500'
              value={selectedVoucherId || ''}
              onChange={(e) => setSelectedVoucherId(e.target.value || null)}
            >
              <option value=''>-- Không sử dụng voucher --</option>
              {(() => {
                const seen = new Set();
                const uniqueVouchers = [];
                for (const uv of myVouchers) {
                  if (uv.voucher && !seen.has(uv.voucher._id)) {
                    seen.add(uv.voucher._id);
                    uniqueVouchers.push(uv.voucher);
                  }
                }

                return uniqueVouchers.map((v) => {
                  const isEligible = calculateTotal() >= v.minOrderValue;
                  return (
                    <option key={v._id} value={v._id} disabled={!isEligible}>
                      {v.title}{' '}
                      {isEligible ? '' : `(Cần tối thiểu ${formatCurrency(v.minOrderValue)})`}
                    </option>
                  );
                });
              })()}
            </select>
          </div>
        )}

        {calculateDiscount() > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm font-semibold text-orange-500'>Khuyến mãi:</span>
            <span className='text-sm font-black text-orange-500'>
              - {formatCurrency(calculateDiscount())}
            </span>
          </div>
        )}

        <div className='flex justify-between items-center border-t border-gray-50 pt-2'>
          <span className='text-sm font-semibold text-gray-800'>Tổng thanh toán:</span>
          <span className='text-lg font-black text-orange-600'>
            {formatCurrency(Math.max(0, calculateTotal() + shippingFee - calculateDiscount()))}
          </span>
        </div>
      </div>

      <div className='space-y-2 pt-2'>
        <Button
          type='primary'
          onClick={handlePlaceOrder}
          loading={isSubmitting}
          className={`w-full h-11 rounded-xl font-bold border-none ${
            paymentMethod === 'MOMO'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {paymentMethod === 'MOMO' ? 'Thanh toán qua MoMo' : 'Đặt hàng COD'}
        </Button>

        <button
          onClick={() => setCurrentStep(0)}
          disabled={isSubmitting}
          className='w-full h-10 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center gap-1'
        >
          <ArrowLeftOutlined /> Quay lại giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
