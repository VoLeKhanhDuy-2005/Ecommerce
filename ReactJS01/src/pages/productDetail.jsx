import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, InputNumber, notification, Tag } from "antd";
import {
  ShoppingCartOutlined,
  FireOutlined,
  ArrowLeftOutlined,
  StarFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import ProductCard from "../components/product/ProductCard";
import axios from "../util/axios.customize";
import { foodCategories } from "../util/constants";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectFade,
  Thumbs,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "swiper/css/thumbs";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null); // Swiper thumbnail

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setThumbsSwiper(null); // Reset thumbnail khi chuyển sản phẩm
      try {
        const res = await axios.get(`/v1/api/products/${id}`);
        if (res && res.data && res.data.product) {
          const prod = res.data.product;
          const related = res.data.relatedProducts || [];

          // Thêm categoryName cho UI vì backend chỉ trả về category id
          const cat = foodCategories.find((c) => c.id === prod.category);
          prod.categoryName = cat ? cat.name : prod.category;

          related.forEach((r) => {
            const rCat = foodCategories.find((c) => c.id === r.category);
            r.categoryName = rCat ? rCat.name : r.category;
          });

          setProduct(prod);
          setSimilarProducts(related);
          setQuantity(1);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (quantity > product.stock) {
      notification.error({
        message: "Không đủ hàng",
        description: `Chỉ còn ${product.stock} phần, vui lòng chọn số lượng phù hợp.`,
        placement: "topRight",
      });
      return;
    }
    notification.success({
      message: "🛒 Đã thêm vào giỏ hàng",
      description: `${quantity} phần "${product.name}"`,
      placement: "topRight",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500 animate-pulse">
          Đang tải thông tin món...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100">
          <p className="text-6xl mb-4">🍽️</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Không tìm thấy món ăn
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Món bạn tìm không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <ArrowLeftOutlined /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="pb-20">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10">
        {/* Breadcrumb điều hướng */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-orange-500 transition-colors">
            Trang chủ
          </Link>
          <span className="text-gray-300">›</span>
          <Link
            to={`/search?category=${product.categoryId}`}
            className="hover:text-orange-500 transition-colors"
          >
            {product.categoryName}
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Khối thông tin sản phẩm*/}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-10 mb-14">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* Cột trái: Swiper hình ảnh */}
            <div className="w-full lg:w-1/2 space-y-3">
              {/* Swiper chính - hiệu ứng fade */}
              <div className="rounded-2xl overflow-hidden bg-amber-50 border border-gray-100 relative">
                {product.isHot && (
                  <span className="badge-hot absolute top-4 left-4 z-10 !rounded-lg">
                    <FireOutlined className="mr-1" />
                    Bán chạy
                  </span>
                )}
                <Swiper
                  modules={[
                    Navigation,
                    Pagination,
                    Autoplay,
                    EffectFade,
                    Thumbs,
                  ]}
                  effect="fade"
                  navigation
                  pagination={{ clickable: true, dynamicBullets: true }}
                  autoplay={{
                    delay: 3500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  thumbs={{
                    swiper:
                      thumbsSwiper && !thumbsSwiper.destroyed
                        ? thumbsSwiper
                        : null,
                  }}
                  className="w-full h-80 sm:h-[420px]"
                >
                  {product.images?.length > 0 ? (
                    product.images.map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <img
                          src={img}
                          alt={`${product.name} ảnh ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </SwiperSlide>
                    ))
                  ) : (
                    <SwiperSlide>
                      <div className="w-full h-full flex items-center justify-center bg-amber-50 text-6xl">
                        🍽️
                      </div>
                    </SwiperSlide>
                  )}
                </Swiper>
              </div>

              {/* Thumbnail Swiper — chỉ hiển thị khi có nhiều hơn 1 ảnh */}
              {product.images?.length > 1 && (
                <Swiper
                  modules={[Thumbs]}
                  onSwiper={setThumbsSwiper}
                  spaceBetween={8}
                  slidesPerView={Math.min(product.images.length, 4)}
                  watchSlidesProgress
                  className="thumbs-swiper"
                >
                  {product.images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="h-20 rounded-xl overflow-hidden border-2 border-transparent cursor-pointer hover:border-orange-400 transition-colors">
                        <img
                          src={img}
                          alt={`thumb ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* Cột phải: Thông tin & Đặt hàng */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Tag color="orange" className="rounded-lg font-medium">
                  {product.categoryName}
                </Tag>
                {inStock ? (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                    className="rounded-lg font-medium"
                  >
                    Còn hàng
                  </Tag>
                ) : (
                  <Tag
                    icon={<CloseCircleOutlined />}
                    color="error"
                    className="rounded-lg font-medium"
                  >
                    Hết hàng
                  </Tag>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                  <StarFilled className="text-yellow-400" />
                  <span className="font-bold text-gray-800">
                    {product.rating}
                  </span>
                </div>
                <div className="text-gray-500">
                  Đã bán:{" "}
                  <span className="font-bold text-gray-800">
                    {product.sold} phần
                  </span>
                </div>
                <div className="text-gray-500">
                  Kho còn:{" "}
                  <span
                    className={`font-bold ${inStock ? "text-green-600" : "text-red-500"}`}
                  >
                    {inStock ? `${product.stock} phần` : "Tạm hết"}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl mb-6 border border-orange-100">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                  Giá bán
                </p>
                <p className="text-4xl font-black text-orange-600 tracking-tight">
                  {formatPrice(product.price)}
                </p>
                {product.isHot && (
                  <p className="text-orange-500 text-xs font-medium mt-2 flex items-center gap-1">
                    <FireOutlined /> Đang được nhiều người đặt mua!
                  </p>
                )}
              </div>

              <div className="mb-8 flex-grow">
                <h3 className="font-bold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description || "Chưa có mô tả."}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Số lượng
                  </label>
                  <InputNumber
                    min={1}
                    max={Math.max(product.stock, 1)}
                    value={quantity}
                    onChange={(val) => setQuantity(val)}
                    disabled={!inStock}
                    size="large"
                    className="w-28 rounded-xl"
                  />
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-grow flex items-center justify-center gap-2.5 h-12 rounded-2xl font-bold text-base transition-all ${
                    inStock
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCartOutlined className="text-lg" />
                  {inStock ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*Sản phẩm tương tự*/}
        {similarProducts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900">
                Có Thể Bạn Sẽ Thích
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  price={formatPrice(item.price)}
                  image={item.images[0]}
                  categoryName={item.categoryName}
                  rating={item.rating}
                  sold={item.sold}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
