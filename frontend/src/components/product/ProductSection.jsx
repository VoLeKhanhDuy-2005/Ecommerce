import { useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "swiper/css";

export default function ProductSection({
  smallHeader,
  bigHeader,
  productData,
  badge,
}) {
  const swiperRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Cập nhật chỉ số trang khi Swiper thay đổi
  const handleSlideChange = (swiper) => {
    setCurrentPage(swiper.realIndex / swiper.params.slidesPerGroup + 1);
  };

  // Tính tổng số trang sau khi Swiper khởi tạo
  const handleInit = (swiper) => {
    const spg = swiper.params.slidesPerGroup || 1;
    setTotalPages(Math.ceil(productData.length / spg));
    setCurrentPage(1);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      {/* Header + điều hướng trang */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label text-orange-500 mb-1">{smallHeader}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
            {bigHeader}
          </h3>
        </div>

        {/* Nút điều hướng + bộ đếm trang */}
        {productData.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500 select-none min-w-[36px] text-center">
              {currentPage} / {totalPages}
            </span>

            <button
              ref={prevRef}
              aria-label="Trang trước"
              className="w-9 h-9 rounded-full border-2 border-orange-400 text-orange-500 flex items-center justify-center
                         hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-orange-400 disabled:hover:border-orange-400
                         transition-all duration-200"
            >
              <LeftOutlined style={{ fontSize: 12 }} />
            </button>

            <button
              ref={nextRef}
              aria-label="Trang sau"
              className="w-9 h-9 rounded-full border-2 border-orange-400 text-orange-500 flex items-center justify-center
                         hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-orange-400 disabled:hover:border-orange-400
                         transition-all duration-200"
            >
              <RightOutlined style={{ fontSize: 12 }} />
            </button>
          </div>
        )}
      </div>

      {/* Danh sách sản phẩm */}
      {productData.length > 0 ? (
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            // Gắn nút điều hướng tuỳ chỉnh
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
            handleInit(swiper);
          }}
          onSlideChange={handleSlideChange}
          modules={[Navigation]}
          spaceBetween={24}
          /* Mặc định mobile: 2 sản phẩm/trang */
          slidesPerView={2}
          slidesPerGroup={2}
          /* Không trượt liên tục - dừng ở đầu & cuối */
          loop={false}
          breakpoints={{
            640: { slidesPerView: 3, slidesPerGroup: 3 },
            1024: { slidesPerView: 4, slidesPerGroup: 4 },
            1280: { slidesPerView: 5, slidesPerGroup: 5 },
          }}
          /* Tắt navigation built-in để dùng nút tuỳ chỉnh */
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          className="product-section-swiper"
        >
          {productData.map((item) => (
            <SwiperSlide
              key={item._id}
              style={{ display: "flex", height: "auto" }}
            >
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
                badge={badge}
                rating={item.rating}
                sold={item.sold}
                views={item.views}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed">
          Chưa có dữ liệu.
        </p>
      )}
    </section>
  );
}
