import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import ProductReviews from '../../components/user/products/review/ProductReviews';
import ProductGallery from '../../components/user/products/detail/ProductGallery';
import ProductInfo from '../../components/user/products/detail/ProductInfo';
import ProductAction from '../../components/user/products/detail/ProductAction';
import SimilarProducts from '../../components/user/products/detail/SimilarProducts';

import axios from '../../apis/axios.customize';
import { getCategoriesApi, addToCartApi } from '../../apis';
import { AuthContext } from '../../components/common/context/auth.context';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);

  const viewCounted = useRef(false);

  const { auth, setCartCount } = useContext(AuthContext);

  useEffect(() => {
    // Reset flag khi chuyển sang sản phẩm khác
    viewCounted.current = false;

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const [res, catRes] = await Promise.all([
          axios.get(`/v1/api/products/${id}`),
          getCategoriesApi(),
        ]);

        if (res && res.data && res.data.product) {
          const prod = res.data.product;
          const related = res.data.relatedProducts || [];

          let fetchedCategories = [];
          if (catRes && catRes.success) {
            fetchedCategories = catRes.data;
          }

          const cat = fetchedCategories.find((c) => c.categoryId === prod.category);
          prod.categoryName = cat ? cat.name : prod.category;

          related.forEach((r) => {
            const rCat = fetchedCategories.find((c) => c.categoryId === r.category);
            r.categoryName = rCat ? rCat.name : r.category;
          });

          setProduct(prod);
          setSimilarProducts(related);
          setQuantity(1);

          // Tăng view đúng 1 lần - kiểm tra flag trước khi gọi
          if (!viewCounted.current) {
            viewCounted.current = true;
            try {
              const resView = await axios.patch(`/v1/api/products/${id}/view`);
              if (resView?.views !== undefined) {
                setProduct((prev) => ({ ...prev, views: resView.views }));
              }
            } catch (error) {
              console.error(error);
            }
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = async () => {
    if (!auth.isAuthenticated) {
      notification.warning({
        message: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập tài khoản để đặt mua sản phẩm này!',
        placement: 'topRight',
      });
      return;
    }

    if (quantity > product.stock) {
      notification.error({
        message: 'Không đủ hàng',
        description: `Chỉ còn ${product.stock} phần trong kho, vui lòng chọn số lượng phù hợp.`,
        placement: 'topRight',
      });
      return;
    }

    try {
      const res = await addToCartApi(product._id, quantity);
      if (res && res.success) {
        notification.success({
          message: '🛒 Đã thêm vào giỏ hàng',
          description: `Đã thêm ${quantity} phần "${product.name}" vào giỏ hàng thành công!`,
          placement: 'topRight',
        });

        if (res.data && res.data.items) {
          const totalItems = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalItems);
        }
      } else {
        notification.error({
          message: 'Lỗi thêm giỏ hàng',
          description: res.message || 'Không thể thêm sản phẩm vào giỏ hàng.',
          placement: 'topRight',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: error.message || 'Đã xảy ra lỗi khi kết nối đến server.',
        placement: 'topRight',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-[80vh] flex flex-col items-center justify-center'>
        <Spin size='large' />
        <p className='mt-4 text-gray-500 animate-pulse'>Đang tải thông tin món...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-[80vh] flex flex-col items-center justify-center px-4'>
        <div className='bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100'>
          <p className='text-6xl mb-4'>🍽️</p>
          <h2 className='text-xl font-bold text-gray-800 mb-2'>Không tìm thấy món ăn</h2>
          <p className='text-gray-500 text-sm mb-6'>Món bạn tìm không tồn tại hoặc đã bị xóa.</p>
          <Link
            to='/'
            className='inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors'
          >
            <ArrowLeftOutlined /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className='pb-20'>
      <main className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10'>
        {/* Breadcrumb điều hướng */}
        <nav className='flex items-center gap-2 text-sm text-gray-500 mb-8'>
          <Link to='/' className='hover:text-orange-500 transition-colors'>
            Trang chủ
          </Link>
          <span className='text-gray-300'>›</span>
          <Link
            to={`/search?category=${product.category}`}
            className='hover:text-orange-500 transition-colors'
          >
            {product.categoryName}
          </Link>
          <span className='text-gray-300'>›</span>
          <span className='text-gray-800 font-medium truncate max-w-[200px]'>{product.name}</span>
        </nav>

        <div className='bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-10 mb-14'>
          <div className='flex flex-col lg:flex-row gap-10 lg:gap-14'>
            <ProductGallery product={product} />

            <div className='w-full lg:w-1/2 flex flex-col'>
              <ProductInfo product={product} inStock={inStock} />

              <ProductAction
                product={product}
                inStock={inStock}
                quantity={quantity}
                setQuantity={setQuantity}
                handleAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>

        <ProductReviews
          productId={product._id}
          onReviewAdded={() => {
            axios.get(`/v1/api/products/${product._id}`).then((res) => {
              if (res?.data?.product) {
                setProduct((prev) => ({
                  ...prev,
                  rating: res.data.product.rating,
                  reviewCount: res.data.product.reviewCount,
                }));
              }
            });
          }}
        />

        <SimilarProducts similarProducts={similarProducts} />
      </main>
    </div>
  );
}
