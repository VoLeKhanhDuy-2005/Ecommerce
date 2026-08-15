import React, { useState, useEffect, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import { Input, Spin, Empty, Radio, Divider, Pagination } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import ProductCard from "../components/product/ProductCard";
import axios from "../util/axios.customize";
import { getCategoriesApi } from "../util/api";

const { Search } = Input;

export default function SearchFilterPage() {
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 8;
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu là true để load ngay khi vào trang

  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = {
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    priceRange: searchParams.get("price") || "all",
    currentPage: parseInt(searchParams.get("page")) || 1,
  };
  const filterReducer = (state, action) => {
    switch (action.type) {
      case "SET_QUERY":
        return { ...state, query: action.payload, currentPage: 1 };
      case "SET_CATEGORY":
        return { ...state, category: action.payload, currentPage: 1 };
      case "SET_PRICE":
        return { ...state, priceRange: action.payload, currentPage: 1 };
      case "SET_PAGE":
        return { ...state, currentPage: action.payload };
      case "RESET":
        return initialFilters;
      default:
        return state;
    }
  };
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);
  const { query, category, priceRange, currentPage } = filters;

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
        params.page = currentPage;

        const [res, catRes] = await Promise.all([
          axios.get("/v1/api/products/search", { params }),
          categories.length === 0
            ? getCategoriesApi()
            : Promise.resolve({ EC: 0, data: categories }),
        ]);

        let currentCategories = categories;
        if (categories.length === 0 && catRes && catRes.EC === 0) {
          currentCategories = catRes.data;
          setCategories(currentCategories);
        }

        if (res && res.data) {
          const mapCategoryName = (products) =>
            products.map((p) => ({
              ...p,
              categoryName:
                currentCategories.find((c) => c.categoryId === p.category)
                  ?.name || p.category,
            }));
          setResults(mapCategoryName(res.data.products || []));
          setTotalItems(res.data.total || 0);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [query, category, priceRange, currentPage]);

  // Cập nhật query + URL khi gõ tìm kiếm
  const handleSearch = (value) => {
    dispatch({ type: "SET_QUERY", payload: value });
    const params = new URLSearchParams(searchParams);
    value ? params.set("q", value) : params.delete("q");
    params.set("page", 1);
    setSearchParams(params);
  };

  // Cập nhật bộ lọc danh mục + URL
  const handleCategoryChange = (value) => {
    dispatch({ type: "SET_CATEGORY", payload: value });
    const params = new URLSearchParams(searchParams);
    value !== "all" ? params.set("category", value) : params.delete("category");
    params.set("page", 1);
    setSearchParams(params);
  };

  // Cập nhật bộ lọc giá + URL
  const handlePriceChange = (value) => {
    dispatch({ type: "SET_PRICE", payload: value });
    const params = new URLSearchParams(searchParams);
    value !== "all" ? params.set("price", value) : params.delete("price");
    params.set("page", 1);
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    dispatch({ type: "SET_PAGE", payload: page });
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    dispatch({ type: "RESET" });
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <div className="pb-20">
      {/* ── Khu vực tìm kiếm (Search Header) ── */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center text-white mb-6">
          <h2 className="text-3xl font-black mb-2">Tìm Món Ngon 🍽️</h2>
        </div>
        <div className="max-w-xl mx-auto">
          <Input
            placeholder="Hôm nay bạn muốn ăn gì?..."
            allowClear
            size="large"
            onChange={(e) => handleSearch(e.target.value)}
            value={query}
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
                  {categories.map((cat) => {
                    return (
                      <Radio
                        key={cat._id}
                        value={cat.categoryId}
                        className="py-2 px-3 hover:bg-orange-50 rounded-xl transition-colors w-full"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-6 h-6 object-contain"
                          />
                          <span>{cat.name}</span>
                        </div>
                      </Radio>
                    );
                  })}
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
                    Từ 50.000đ trở xuống
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
                    Từ 100.000đ trở lên
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
                {totalItems}
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
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((item) => (
                  <ProductCard
                    key={item._id}
                    id={item._id}
                    name={item.name}
                    price={formatPrice(
                      item.discountPrice && item.discountPrice !== 0
                        ? item.discountPrice
                        : item.price,
                    )}
                    image={item.images[0]}
                    categoryName={item.categoryName}
                    badge={item.isHot ? "Hot 🔥" : item.isNew ? "New" : null}
                    rating={item.rating}
                    sold={item.sold}
                    views={item.views}
                  />
                ))}
              </div>

              {totalItems > pageSize && (
                <div className="mt-10 mb-6 flex justify-center">
                  <Pagination
                    current={currentPage}
                    total={totalItems}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    className="custom-pagination"
                  />
                </div>
              )}
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
