import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "../../../utils/formatter";

const SummaryCards = ({ totalUsers, totalOrders, totalRevenue }) => {
  return (
    <Row gutter={[24, 24]} className="mb-8">
      <Col xs={24} sm={8}>
        <Card
          bordered={false}
          className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">
              <UserOutlined />
            </div>
            <Statistic
              title={
                <span className="text-gray-500 font-medium">
                  Tổng Người Dùng
                </span>
              }
              value={totalUsers}
              valueStyle={{
                color: "#1f2937",
                fontWeight: 700,
                fontSize: "28px",
              }}
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card
          bordered={false}
          className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-2xl">
              <ShoppingOutlined />
            </div>
            <Statistic
              title={
                <span className="text-gray-500 font-medium">Tổng Đơn Hàng</span>
              }
              value={totalOrders}
              valueStyle={{
                color: "#1f2937",
                fontWeight: 700,
                fontSize: "28px",
              }}
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card
          bordered={false}
          className="shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-2xl">
              <DollarOutlined />
            </div>
            <Statistic
              title={
                <span className="text-gray-500 font-medium">
                  Tổng Doanh Thu
                </span>
              }
              value={totalRevenue}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{
                color: "#1f2937",
                fontWeight: 700,
                fontSize: "24px",
              }}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;
