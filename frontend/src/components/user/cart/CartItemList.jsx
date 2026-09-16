import { Link } from 'react-router-dom';
import { InputNumber } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const CartItemList = ({ cartItems, handleQuantityChange, handleDeleteItem, formatCurrency }) => {
  return (
    <div className='bg-white rounded-3xl border border-gray-100 p-6 shadow-sm divide-y divide-gray-100'>
      <h2 className='text-lg font-bold text-gray-800 pb-4 flex items-center gap-2'>
        <ShoppingCartOutlined className='text-orange-500' /> Chi tiết giỏ hàng ({cartItems.length}{' '}
        món)
      </h2>

      {cartItems.map((item) => {
        const isDiscounted = item.product.price != item.product.discountPrice;
        const activePrice = isDiscounted ? item.product.discountPrice : item.product.price;
        const originalPrice = item.product.price;

        return (
          <div key={item.product._id} className='py-4 flex items-center gap-4'>
            <img
              src={item.product.images?.[0] || 'https://placehold.co/100'}
              alt={item.product.name}
              className='w-16 h-16 rounded-xl object-cover border border-gray-100'
            />

            <div className='flex-grow'>
              <Link
                to={`/product/${item.product._id}`}
                className='font-bold text-gray-800 hover:text-orange-500 transition-colors text-sm line-clamp-1'
              >
                {item.product.name}
              </Link>

              <div className='flex items-center gap-2 mt-1'>
                <span className='text-xs text-gray-500'>Giá:</span>
                <span className='text-sm font-bold text-orange-600'>
                  {formatCurrency(activePrice)}
                </span>
                {isDiscounted && (
                  <span className='text-xs text-gray-400 line-through'>
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className='flex flex-col items-center gap-1.5'>
              <InputNumber
                min={1}
                max={item.product.stock}
                value={item.quantity}
                onChange={(value) => handleQuantityChange(item.product._id, value)}
                size='small'
                className='w-16 rounded-lg text-center'
              />
              <span className='text-[10px] text-gray-400'>Kho: {item.product.stock}</span>
            </div>

            <button
              onClick={() => handleDeleteItem(item.product._id)}
              className='p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors'
            >
              <DeleteOutlined />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default CartItemList;
