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
import ProductSection from "../components/product/ProductSection";
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
    products.promotions.length > 0 ? products.promotions[0].discountPercent : 0;

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
  // Mảng [] ở cuối useEffect là dependency array -> kiểm soát khi nào effect sẽ chạy lại
  // useEffect(() => {}): hạy sau mỗi lần render
  // useEffect(() => {}, []): Chỉ chạy 1 lần duy nhất khi component mount
  // useEffect(() => {}, [count]): Chạy lại mỗi khi count thay đổi
  // useEffect(() => {}, [a, b]): Chạy lại khi a hoặc b thay đổi
  // Nếu không có [] -> mỗi lần render lại sẽ gọi API lại -> vòng lặp vô tận
  // vì setProducts trigger render -> render trigger fetchData -> lại setProducts...

  // Vòng đời của một component:
  // 1. Mount -> component xuất hiện lần đầu trên màn hình
  // 2. Update -> component re-render khi state/props thay đổi
  // 3. Unmount -> component bị xóa khỏi màn hình

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
                autoplay={{ delay: 3000 }}
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
                      price={formatPrice(
                        item.discountPrice && item.discountPrice !== 0
                          ? item.discountPrice
                          : item.price,
                      )}
                      image={item.images[0]}
                      categoryName={item.categoryName}
                      badge="Sale"
                      rating={item.rating}
                      sold={item.sold}
                      views={item.views}
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

      <ProductSection
        smallHeader={"Vừa ra lò"}
        bigHeader={"Khám Phá Món Mới ✨"}
        productData={products.newest}
        badge={"New"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-300 my-10"></div>
      </div>

      <ProductSection
        smallHeader={"Được yêu thích nhất"}
        bigHeader={"Bán Chạy Nhất 🏆"}
        productData={products.bestSelling}
        badge={"Hot"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-300 my-10"></div>
      </div>

      <ProductSection
        smallHeader={"Xu hướng quan tâm"}
        bigHeader={"Xem Nhiều Nhất 👀"}
        productData={products.mostViewed}
        badge={"Trending"}
      />
    </div>
  );
}
