import React, { useEffect, useState, useCallback } from "react";
import { Button, Typography, Spin, message, Row, Col } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  getDashboardStatsApi,
  getProductsApi,
  getCategoriesApi,
  exportDashboardStatsApi,
} from "../../util/api";
import SummaryCards from "../../components/admin/dashboard/SummaryCards";
import RevenueChart from "../../components/admin/dashboard/RevenueChart";
import OrderStatusChart from "../../components/admin/dashboard/OrderStatusChart";
import RecentOrdersTable from "../../components/admin/dashboard/RecentOrdersTable";
import ExportModal from "../../components/admin/dashboard/ExportModal";
import DashboardProductStats from "../../components/admin/dashboard/DashboardProductStats";

const { Title } = Typography;

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    summary: { totalUsers: 0, totalOrders: 0, totalRevenue: 0 },
    orderStatusData: [],
    recentOrders: [],
    monthlyRevenue: [],
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [products, setProducts] = useState({
    newest: [],
    bestSelling: [],
    mostViewed: [],
  });
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportYears, setSelectedExportYears] = useState([
    new Date().getFullYear(),
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStatsApi(year);
      if (res && res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    //sửa triệt để cảnh báo useEffect missing dependencies bằng hook useCallback
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategoriesApi(),
          getProductsApi(),
        ]);

        let fetchedCategories = [];
        if (catRes && catRes.success) {
          fetchedCategories = catRes.data;
        }

        if (prodRes && prodRes.data) {
          const mapCategoryName = (productsList) =>
            productsList.map((p) => ({
              ...p,
              categoryName:
                fetchedCategories.find((c) => c.categoryId === p.category)
                  ?.name || p.category,
            }));

          setProducts({
            newest: mapCategoryName(prodRes.data.newest || []),
            bestSelling: mapCategoryName(prodRes.data.bestSelling || []),
            mostViewed: mapCategoryName(prodRes.data.mostViewed || []),
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      }
    };

    fetchProducts();
  }, []);

  const handleExport = async () => {
    if (selectedExportYears.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 năm để xuất báo cáo");
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportDashboardStatsApi(selectedExportYears);

      // Axios interceptor returns response.data directly, so res is already the Blob
      const url = window.URL.createObjectURL(res); // tạo một URL tạm thời trỏ tới Blob (file Excel) trong bộ nhớ trình duyệt.
      const link = document.createElement("a"); // Tạo thẻ a ẩn
      link.href = url;
      link.setAttribute("download", "Bao_Cao_Thong_Ke.xlsx");
      document.body.appendChild(link);
      link.click(); // Kích hoạt click để tải file
      document.body.removeChild(link);

      message.success("Xuất báo cáo Excel thành công!");
      setIsExportModalVisible(false);
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      message.error("Có lỗi xảy ra khi xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">
            Tổng quan
          </Title>
          <p className="text-gray-500">Các chỉ số quan trọng của FoodShop</p>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="large"
          className="bg-green-600 hover:bg-green-700 border-none"
          onClick={() => setIsExportModalVisible(true)}
        >
          Xuất Excel
        </Button>
      </div>

      <SummaryCards
        totalUsers={stats.summary.totalUsers}
        totalOrders={stats.summary.totalOrders}
        totalRevenue={stats.summary.totalRevenue}
      />

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <RevenueChart
            year={year}
            setYear={setYear}
            data={stats.monthlyRevenue}
          />
        </Col>
        <Col xs={24} lg={8}>
          <OrderStatusChart data={stats.orderStatusData} />
        </Col>
      </Row>

      <RecentOrdersTable orders={stats.recentOrders} />

      <DashboardProductStats products={products} />

      <ExportModal
        isVisible={isExportModalVisible}
        isExporting={isExporting}
        selectedExportYears={selectedExportYears}
        setSelectedExportYears={setSelectedExportYears}
        onExport={handleExport}
        onCancel={() => setIsExportModalVisible(false)}
      />
    </div>
  );
};

export default AdminDashboardPage;
