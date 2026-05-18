import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input, Spin, Empty, Radio, Divider } from "antd";
import { FilterOutlined, StarFilled } from "@ant-design/icons";
import ProductCard from "../components/product/ProductCard";
import axios from "../util/axios.customize";
import { foodCategories } from "../util/constants";

const { Search } = Input;

export default function SearchFilterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Trạng thái bộ lọc - đồng bộ với URL params
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [priceRange, setPriceRange] = useState(
    searchParams.get("price") || "all",
  );

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu là true để load ngay khi vào trang

  // Gọi tìm kiếm mỗi khi bộ lọc thay đổi
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        let minPrice = null;
        let maxPrice = null;
        if (priceRange === "under50") maxPrice = 50000;
        else if (priceRange === "50to100") {
          minPrice = 50000;
          maxPrice = 100000;
        } else if (priceRange === "over100") minPrice = 100000;

        const params = {};
        if (query) params.search = query;
        if (category !== "all") params.category = category;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await axios.get("/v1/api/products/search", { params });
        if (res && res.data) {
          const mapCategoryName = (products) =>
            products.map((p) => ({
              ...p,
              categoryName:
                foodCategories.find((c) => c.id === p.category)?.name ||
                p.category,
            }));
          setResults(mapCategoryName(res.data.products || []));
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [query, category, priceRange]);

  // Cập nhật query + URL khi gõ tìm kiếm
  const handleSearch = (value) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams);
    value ? params.set("q", value) : params.delete("q");
    setSearchParams(params);
  };

  // Cập nhật bộ lọc danh mục + URL
  const handleCategoryChange = (value) => {
    setCategory(value);
    const params = new URLSearchParams(searchParams);
    value !== "all" ? params.set("category", value) : params.delete("category");
    setSearchParams(params);
  };

  // Cập nhật bộ lọc giá + URL
  const handlePriceChange = (value) => {
    setPriceRange(value);
    const params = new URLSearchParams(searchParams);
    value !== "all" ? params.set("price", value) : params.delete("price");
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setQuery("");
    setCategory("all");
    setPriceRange("all");
    setSearchParams({});
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Danh sách emoji ứng với các danh mục
  const catEmojis = { c1: "🍔", c2: "🍜", c3: "🧋", c4: "🍮" };

  return (
    <div className="pb-20">
      {/* ── Khu vực tìm kiếm (Search Header) ── */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center text-white mb-6">
          <h2 className="text-3xl font-black mb-2">Tìm Món Ngon 🍽️</h2>
          <p className="text-orange-100 text-sm">
            Tìm kiếm theo tên, lọc theo danh mục và mức giá
          </p>
        </div>
        <div className="max-w-xl mx-auto">
          <Search
            placeholder="Hôm nay bạn muốn ăn gì?..."
            allowClear
            enterButton="Tìm ngay"
            size="large"
            onSearch={handleSearch}
            defaultValue={query}
            className="rounded-2xl overflow-hidden shadow-lg"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Cột trái: Bộ lọc (Sidebar)*/}
        <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center gap-2">
              <FilterOutlined className="text-orange-500 text-base" />
              <span className="font-black text-gray-800 text-base">Bộ lọc</span>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <h4 className="section-label text-gray-500 mb-3">
                  Danh mục món ăn
                </h4>
                <Radio.Group
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  value={category}
                  className="flex flex-col gap-1 w-full"
                >
                  <Radio
                    value="all"
                    className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors w-full"
                  >
                    Tất cả
                  </Radio>
                  {foodCategories.map((cat) => (
                    <Radio
                      key={cat.id}
                      value={cat.id}
                      className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors w-full"
                    >
                      <span>
                        {catEmojis[cat.id] || "🍽️"} {cat.name}
                      </span>
                    </Radio>
                  ))}
                </Radio.Group>
              </div>

              <Divider className="my-0" />

              <div>
                <h4 className="section-label text-gray-500 mb-3">Khoảng giá</h4>
                <Radio.Group
                  onChange={(e) => handlePriceChange(e.target.value)}
                  value={priceRange}
                  className="flex flex-col gap-1 w-full"
                >
                  <Radio
                    value="all"
                    className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    Tất cả
                  </Radio>
                  <Radio
                    value="under50"
                    className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    Dưới 50.000đ
                  </Radio>
                  <Radio
                    value="50to100"
                    className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    Từ 50.000đ đến 100.000đ
                  </Radio>
                  <Radio
                    value="over100"
                    className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    Trên 100.000đ
                  </Radio>
                </Radio.Group>
              </div>

              <Divider className="my-0" />

              <button
                onClick={handleResetFilters}
                className="w-full py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 font-semibold rounded-xl transition-colors text-sm border border-gray-200 hover:border-red-100"
              >
                ✕ Xóa bộ lọc
              </button>
            </div>
          </div>
        </aside>

        {/* Cột phải: Kết quả tìm kiếm */}
        <div className="flex-grow min-w-0">
          {/* Thanh trạng thái kết quả */}
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm mb-6">
            <p className="text-gray-700 font-semibold text-sm">
              Tìm thấy{" "}
              <span className="text-orange-600 font-black text-base">
                {results.length}
              </span>{" "}
              món ăn
              {query && <span className="text-gray-400"> cho "{query}"</span>}
            </p>
            {(query || category !== "all" || priceRange !== "all") && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Nội dung kết quả */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
              <Spin size="large" />
              <p className="mt-4 text-gray-400 text-sm animate-pulse">
                Đang tìm món ngon...
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((item) => (
                <ProductCard
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  price={formatPrice(item.price)}
                  image={item.images[0]}
                  categoryName={item.categoryName}
                  badge={item.isHot ? "Hot 🔥" : item.isNew ? "New" : null}
                  rating={item.rating}
                  sold={item.sold}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="text-center">
                    <p className="text-gray-600 font-semibold mb-1">
                      Không tìm thấy món phù hợp
                    </p>
                    <p className="text-gray-400 text-sm">
                      Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                  </div>
                }
              />
              <button
                onClick={handleResetFilters}
                className="mt-6 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Xem tất cả món ăn
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
