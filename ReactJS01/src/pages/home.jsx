import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import {
  ArrowRightOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../components/context/auth.context";
import ProductCard from "../components/product/ProductCard";
import ProductSection from "../components/product/ProductSection"
import axios from "../util/axios.customize";
import { foodCategories } from "../util/constants";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Home() {
  const { auth } = useContext(AuthContext);
  const [products, setProducts] = useState({
    newest: [],
    bestSelling: [],
    promotions: [],
    mostViewed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const maxDiscountPercent =
    products.promotions.length > 0
      ? Math.max(
          ...products.promotions.map((product) =>
            Math.round(
              ((product.price - product.discountPrice) / product.price) * 100,
            ),
          ),
        )
      : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/v1/api/products");
        if (res && res.data) {
          const mapCategoryName = (products) =>
            products.map((p) => ({
              ...p,
              categoryName:
                foodCategories.find((c) => c.id === p.category)?.name ||
                p.category,
            }));
          const mappedPromotions = mapCategoryName(res.data.promotions || []);
          setProducts({
            newest: mapCategoryName(res.data.newest || []),
            bestSelling: mapCategoryName(res.data.bestSelling || []),
            promotions: mappedPromotions,
            mostViewed: mapCategoryName(res.data.mostViewed || []),
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-16 text-center max-w-md w-full border border-orange-100 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-orange-100 opacity-60" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-red-100 opacity-50" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-3xl">
              🔒
            </div>
            <h2 className="text-2xl font-black mb-2 text-gray-900">
              Bạn Chưa Đăng Nhập
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Đăng nhập để xem thực đơn đầy đủ, ưu đãi độc quyền và đặt món
              nhanh chóng.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Đăng nhập ngay <ArrowRightOutlined />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Spin size="large" />
        </div>
        <p className="text-gray-500 font-medium animate-pulse">
          Đang chuẩn bị thực đơn hôm nay...
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* 1. HERO BANNER — Khuyến mãi chính*/}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-2xl min-h-[320px] sm:min-h-[400px] flex flex-col lg:flex-row items-center">
          {/* Nội dung chính bên trái */}
          <div className="relative z-10 p-8 sm:p-14 w-full lg:w-1/3 flex-shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-5 uppercase tracking-widest border border-white/25">
              <FireOutlined /> Ưu đãi giới hạn
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5 drop-shadow">
              Siêu Sale
              <br />
              Ẩm Thực 🍜
            </h2>
            <p className="text-base sm:text-lg text-orange-100 mb-8">
              Giảm đến{" "}
              <strong className="text-white">{maxDiscountPercent}%</strong>
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-orange-50 transition-all hover:-translate-y-0.5"
            >
              Khám phá ngay <ArrowRightOutlined />
            </Link>
          </div>

          {/* Swiper Khuyến mãi bên phải */}
          <div className="relative z-10 w-full lg:w-2/3 p-6 sm:p-10 lg:pl-0">
            {products.promotions && products.promotions.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.2}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                breakpoints={{
                  640: { slidesPerView: 2.2 },
                  1024: { slidesPerView: 2.5 },
                  1280: { slidesPerView: 3 },
                }}
                className="pb-12 promotions-hero-swiper"
              >
                {products.promotions.map((item) => (
                  <SwiperSlide key={item._id} className="h-auto">
                    <ProductCard
                      id={item._id}
                      name={item.name}
                      price={formatPrice(item.price)}
                      image={item.images[0]}
                      categoryName={item.categoryName}
                      badge="Sale"
                      rating={item.rating}
                      sold={item.sold}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                Đang tải món khuyến mãi...
              </div>
            )}
          </div>

          {/* Các vòng trang trí */}
          <div className="absolute left-[30%] bottom-0 w-24 h-24 rounded-full bg-white/10 blur-xl hidden lg:block" />
          <div className="absolute -bottom-8 right-[30%] w-40 h-40 rounded-full bg-yellow-300/20 blur-2xl hidden lg:block" />
        </div>
      </section>

      {/* 2. DANH MỤC MÓN ĂN*/}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {foodCategories.map((cat, idx) => {
            const catEmojis = ["🍔", "🍜", "🧋", "🍮"];
            return (
              <Link
                key={cat.id}
                to={`/search?category=${cat.id}`}
                className="group bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all text-center"
              >
                <span className="text-3xl">{catEmojis[idx] || "🍽️"}</span>
                <span className="font-semibold text-gray-700 text-sm group-hover:text-orange-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. MÓN MỚI NHẤT*/}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label text-orange-500 mb-1">Vừa ra lò</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              Khám Phá Món Mới ✨
            </h3>
          </div>
          <Link
            to="/search"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors"
          >
            Xem tất cả <ArrowRightOutlined />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.newest.length > 0 ? (
            products.newest.map((item) => (
              <ProductCard
                key={item._id}
                id={item._id}
                name={item.name}
                price={formatPrice(item.price)}
                image={item.images[0]}
                categoryName={item.categoryName}
                badge="New"
                rating={item.rating}
                sold={item.sold}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed">
              Chưa có món mới.
            </p>
          )}
        </div>
      </section> */}

      <ProductSection
        smallHeader={"Vừa ra lò"}
        bigHeader={"Khám Phá Món Mới ✨"}
        buttonText={"Xem tất cả"}
        productData={products.newest}
      />

      {/*4. BÁN CHẠY NHẤT*/}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-label text-red-500 mb-1">
                Được yêu thích nhất
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                Bán Chạy Nhất 🏆
              </h3>
            </div>
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-white hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors border border-orange-100"
            >
              Xem tất cả <ArrowRightOutlined />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.bestSelling.length > 0 ? (
            products.bestSelling.map((item) => (
              <ProductCard
                key={item._id}
                id={item._id}
                name={item.name}
                price={formatPrice(item.price)}
                image={item.images[0]}
                categoryName={item.categoryName}
                badge="Hot"
                rating={item.rating}
                sold={item.sold}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed">
              Đang cập nhật...
            </p>
          )}
        </div>
      </section>

      {/*5. XEM NHIỀU NHẤT*/}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8 border-y border-indigo-100">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-label text-blue-500 mb-1">
                Thu hút sự chú ý
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                Xem Nhiều Nhất 👀
              </h3>
            </div>
            {/* <Link
              to="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors border border-indigo-100"
            > */}
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors"
            >
              Xem tất cả <ArrowRightOutlined />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.mostViewed.length > 0 ? (
            products.mostViewed.map((item) => (
              <ProductCard
                key={item._id}
                id={item._id}
                name={item.name}
                price={formatPrice(item.price)}
                image={item.images[0]}
                categoryName={item.categoryName}
                badge="Trending"
                rating={item.rating}
                sold={item.sold}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed">
              Đang cập nhật...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
