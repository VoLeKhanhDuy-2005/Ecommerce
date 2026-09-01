import React from 'react';
import { Link } from 'react-router-dom';

const CartRecommendations = ({ recommendations, handleAddRecommendation, formatCurrency }) => {
  if (!recommendations || !recommendations.products || recommendations.products.length === 0)
    return null;

  return (
    <div className='bg-white rounded-3xl border border-gray-100 p-6 shadow-sm'>
      <h2 className='text-lg font-bold text-gray-800 pb-4'>{recommendations.title}</h2>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {recommendations.products.map((item) => {
          const price =
            item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
          return (
            <div
              key={item._id}
              className='border border-gray-100 rounded-2xl p-3 flex flex-col gap-2 hover:border-orange-300 transition-colors shadow-sm hover:shadow-md'
            >
              <img
                src={item.images?.[0]}
                alt={item.name}
                className='w-full h-28 object-cover rounded-xl'
              />
              <Link
                to={`/product/${item._id}`}
                className='font-bold text-gray-800 text-sm hover:text-orange-500 line-clamp-1'
              >
                {item.name}
              </Link>
              <div className='flex justify-between items-center mt-auto pt-2'>
                <span className='text-orange-600 font-bold text-sm'>{formatCurrency(price)}</span>
                <button
                  onClick={() => handleAddRecommendation(item._id)}
                  className='bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors'
                >
                  + Thêm
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartRecommendations;
