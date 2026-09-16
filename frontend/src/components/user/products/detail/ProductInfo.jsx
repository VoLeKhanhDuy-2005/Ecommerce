import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, StarFilled } from '@ant-design/icons';

const ProductInfo = ({ product, inStock }) => {
  return (
    <>
      <div className='flex items-center gap-2 mb-4'>
        <Tag color='orange' className='rounded-lg font-medium'>
          {product.categoryName}
        </Tag>
        {inStock ? (
          <Tag icon={<CheckCircleOutlined />} color='success' className='rounded-lg font-medium'>
            Còn hàng
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color='error' className='rounded-lg font-medium'>
            Hết hàng
          </Tag>
        )}
      </div>

      <h1 className='text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4'>
        {product.name}
      </h1>

      <div className='flex flex-wrap items-center gap-4 mb-6 text-sm'>
        <div className='flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100'>
          <StarFilled className='text-yellow-400' />
          <span className='font-bold text-gray-800'>
            {product.rating}{' '}
            <span className='text-gray-500 font-normal'>({product.reviewCount || 0} đánh giá)</span>
          </span>
        </div>
        <div className='text-gray-500'>
          Đã bán: <span className='font-bold text-gray-800'>{product.sold} phần</span>
        </div>
        <div className='text-gray-500'>
          Kho còn:{' '}
          <span className={`font-bold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `${product.stock} phần` : 'Tạm hết'}
          </span>
        </div>
        <div className='text-gray-500'>
          Lượt xem: <span className='font-bold text-gray-800'>{product.views}</span>
        </div>
      </div>

      <div className='mb-8 flex-grow'>
        <h3 className='font-bold text-gray-900 mb-2'>Mô tả</h3>
        <p className='text-gray-600 text-sm leading-relaxed'>
          {product.description || 'Chưa có mô tả.'}
        </p>
      </div>
    </>
  );
};

export default ProductInfo;
