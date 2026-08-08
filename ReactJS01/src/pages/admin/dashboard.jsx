import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Typography, Spin, Select } from "antd";
import ProductSection from "../../components/product/ProductSection";
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getDashboardStatsApi, getProductsApi, getCategoriesApi } from "../../util/api";
import moment from "moment";

const { Title } = Typography;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#f26c6d"];

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

  useEffect(() => {
    fetchStats();
  }, [year]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        getCategoriesApi(),
        getProductsApi(),
      ]);

      let fetchedCategories = [];
      if (catRes && catRes.EC === 0) {
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStatsApi(year);
      if (res && res.EC === 0) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const columns = [
    {
      title: "Mã Đơn",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <span className="text-gray-500 font-mono">{text.substring(0, 8)}...</span>,
    },
    {
      title: "Khách Hàng",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => <span className="font-semibold text-gray-700">{text}</span>,
    },
    {
      title: "Tổng Tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span className="text-orange-500 font-bold">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: "Thanh Toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => (
        <Tag color={method === "MOMO" ? "purple" : "cyan"}>{method}</Tag>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "Delivered") color = "green";
        if (status === "Cancelled") color = "red";
        if (status === "Shipping") color = "gold";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Ngày Đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => <span className="text-gray-500">{moment(date).format("DD/MM/YYYY HH:mm")}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Title level={2} className="!mb-1 !text-gray-800">
          Tổng quan
        </Title>
        <p className="text-gray-500">Các chỉ số quan trọng của FoodShop</p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">
                <UserOutlined />
              </div>
              <Statistic
                title={<span className="text-gray-500 font-medium">Tổng Người Dùng</span>}
                value={stats.summary.totalUsers}
                valueStyle={{ color: "#1f2937", fontWeight: 700, fontSize: "28px" }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-2xl">
                <ShoppingOutlined />
              </div>
              <Statistic
                title={<span className="text-gray-500 font-medium">Tổng Đơn Hàng</span>}
                value={stats.summary.totalOrders}
                valueStyle={{ color: "#1f2937", fontWeight: 700, fontSize: "28px" }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-2xl">
                <DollarOutlined />
              </div>
              <Statistic
                title={<span className="text-gray-500 font-medium">Tổng Doanh Thu</span>}
                value={stats.summary.totalRevenue}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ color: "#1f2937", fontWeight: 700, fontSize: "24px" }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card bordered={false} className="shadow-sm rounded-2xl h-full">
            <div className="flex justify-between items-center mb-6">
              <Title level={4} className="!mb-0 !text-gray-700">
                Doanh thu theo năm
              </Title>
              <Select
                value={year}
                onChange={(value) => setYear(value)}
                style={{ width: 130 }}
                options={[
                  { value: new Date().getFullYear(), label: `Năm ${new Date().getFullYear()}` },
                  { value: new Date().getFullYear() - 1, label: `Năm ${new Date().getFullYear() - 1}` },
                  { value: new Date().getFullYear() - 2, label: `Năm ${new Date().getFullYear() - 2}` },
                  { value: new Date().getFullYear() - 3, label: `Năm ${new Date().getFullYear() - 3}` },
                  { value: new Date().getFullYear() - 4, label: `Năm ${new Date().getFullYear() - 4}` },
                ]}
              />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `${value / 1000000}M`}
                    width={80}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-2xl h-full">
            <Title level={4} className="!mb-6 !text-gray-700">
              Trạng thái đơn hàng
            </Title>
            <div className="h-[300px] w-full flex items-center justify-center">
              {stats.orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.orderStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400">Không có dữ liệu</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Card bordered={false} className="shadow-sm rounded-2xl">
        <Title level={4} className="!mb-6 !text-gray-700">
          Đơn hàng gần đây
        </Title>
        <Table
          columns={columns}
          dataSource={stats.recentOrders}
          rowKey="_id"
          pagination={false}
          className="border border-gray-100 rounded-xl overflow-hidden"
        />
      </Card>

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
    </div>
  );
};

export default AdminDashboardPage;
