import React from "react";
import { Link } from "react-router-dom";
import { StarFilled } from "@ant-design/icons";

/**
 * ProductCard — Thẻ hiển thị sản phẩm
 *
 * Props:
 *   id           - ID sản phẩm (dùng cho link điều hướng)
 *   name         - Tên sản phẩm
 *   price        - Giá đã format (VD: "65.000 đ")
 *   image        - URL ảnh
 *   categoryName - Tên danh mục
 *   badge        - Chuỗi label nổi bật (VD: "Hot", "New", "Sale")
 *   rating       - Điểm đánh giá (số từ 0–5)
 *   sold         - Số lượng đã bán
 */
export default function ProductCard({
  id,
  name,
  price,
  image,
  categoryName,
  badge,
  rating,
  sold,
}) {
  // Xác định màu badge (Hot = đỏ-cam, còn lại = xanh lá)
  const isHot = badge?.toLowerCase().includes("hot");

  return (
    <div className="food-card relative flex flex-col overflow-hidden group bg-white">
      {/* Badge nổi ở góc trên phải */}
      {badge && (
        <span
          className={
            isHot
              ? "badge-hot absolute top-0 right-0 z-10"
              : "badge-new absolute top-0 right-0 z-10"
          }
        >
          {badge}
        </span>
      )}

      {/* Khu vực hình ảnh sản phẩm */}
      <div className="relative h-52 overflow-hidden bg-amber-50">
        <img
          src={
            image || "https://placehold.co/400x300/FFF7ED/F97316?text=Món+Ăn"
          }
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-500 ease-out"
          style={{ transformOrigin: "center" }}
        />

        {/* Lớp phủ mờ (Overlay) khi hover - hiện nút Xem chi tiết */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <Link
            to={`/product/${id}`}
            className="bg-white text-orange-600 font-bold text-sm px-6 py-2.5 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 hover:bg-orange-50"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>

      {/* Khu vực thông tin sản phẩm */}
      <div className="p-4 flex flex-col flex-grow">
        {categoryName && (
          <span className="text-[11px] font-semibold text-orange-500 mb-1.5 uppercase tracking-widest">
            {categoryName}
          </span>
        )}

        <h4 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 min-h-[42px] mb-3 hover:text-orange-600 transition-colors">
          <Link to={`/product/${id}`}>{name}</Link>
        </h4>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
            <StarFilled />
            <span className="text-gray-700">{rating || "-"}</span>
            {sold != null && (
              <span className="text-gray-400 font-normal ml-1">
                ({sold} đã bán)
              </span>
            )}
          </div>
          <p className="text-orange-600 font-black text-base">{price}</p>
        </div>
      </div>
    </div>
  );
}
