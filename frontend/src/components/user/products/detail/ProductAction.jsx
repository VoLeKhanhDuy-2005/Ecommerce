import { InputNumber } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../../utils/formatter';

const ProductAction = ({ product, inStock, quantity, setQuantity, handleAddToCart }) => {
  return (
    <>
      <div className='bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl mb-6 border border-orange-100'>
        <p className='text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1'>
          Giá bán
        </p>
        <p className='text-4xl font-black text-orange-600 tracking-tight'>
          {formatCurrency(
            product.discountPrice && product.discountPrice !== 0
              ? product.discountPrice
              : product.price
          )}
        </p>
      </div>

      <div className='bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-4'>
        <div className='flex flex-col'>
          <label className='text-xs font-bold text-gray-600 uppercase tracking-wider mb-2'>
            Số lượng
          </label>
          <InputNumber
            min={1}
            max={Math.max(product.stock, 1)}
            value={quantity}
            onChange={(val) => setQuantity(val)}
            disabled={!inStock}
            size='large'
            className='w-28 rounded-xl'
          />
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`flex-grow flex items-center justify-center gap-2.5 h-12 rounded-2xl font-bold text-base transition-all ${
            inStock
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingCartOutlined className='text-lg' />
          {inStock ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
        </button>
      </div>
    </>
  );
};

export default ProductAction;
