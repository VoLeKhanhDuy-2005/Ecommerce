import React from "react";
import { Typography } from "antd";
import ProductSection from "../../../components/product/ProductSection";

const { Title } = Typography;

const DashboardProductStats = ({ products }) => {
  return (
    <div className="mt-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <Title level={4} className="!mb-6 !text-gray-700">
        Thống Kê Sản Phẩm
      </Title>
      <ProductSection
        smallHeader={"Món ăn mới nhất"}
        bigHeader={"Top 10 Món Mới"}
        productData={products.newest}
        badge={"New"}
      />
      <div className="border-t border-gray-100 my-8 w-full max-w-4xl mx-auto"></div>
      <ProductSection
        smallHeader={"Doanh số cao nhất"}
        bigHeader={"Top 10 Bán Chạy"}
        productData={products.bestSelling}
        badge={"Hot"}
      />
      <div className="border-t border-gray-100 my-8 w-full max-w-4xl mx-auto"></div>
      <ProductSection
        smallHeader={"Lượt xem nhiều nhất"}
        bigHeader={"Top 10 Quan Tâm"}
        productData={products.mostViewed}
        badge={"Trending"}
      />
    </div>
  );
};

export default DashboardProductStats;
