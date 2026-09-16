import ProductCard from '../../../common/products/ProductCard';
import { formatCurrency } from '../../../../utils/formatter';

const SimilarProducts = ({ similarProducts }) => {
  if (!similarProducts || similarProducts.length === 0) return null;

  return (
    <section>
      <div className='flex items-center gap-3 mb-8'>
        <div className='w-1 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded-full' />
        <h3 className='text-2xl font-black text-gray-900'>Có Thể Bạn Sẽ Thích</h3>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {similarProducts.map((item) => (
          <ProductCard
            key={item._id}
            id={item._id}
            name={item.name}
            price={formatCurrency(
              item.discountPrice && item.discountPrice !== 0 ? item.discountPrice : item.price
            )}
            image={item.images[0]}
            categoryName={item.categoryName}
            rating={item.rating}
            sold={item.sold}
            views={item.views}
          />
        ))}
      </div>
    </section>
  );
};

export default SimilarProducts;
