import React from "react";
import { Card, Select, Typography } from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../../utils/formatter";

const { Title } = Typography;

const RevenueChart = ({ year, setYear, data }) => {
  const currentYear = new Date().getFullYear();

  // Tạo options chọn năm động (vd 10 năm gần nhất)
  const yearOptions = Array.from({ length: 10 }, (_, index) => {
    const y = currentYear - index;
    return {
      value: y,
      label: `Năm ${y}`,
    };
  });

  return (
    <Card bordered={false} className="shadow-sm rounded-2xl h-full">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0 !text-gray-700">
          Doanh thu theo năm
        </Title>
        <Select
          value={year}
          onChange={(value) => setYear(value)}
          style={{ width: 130 }}
          options={yearOptions}
        />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => `${value / 1000000}M`}
              width={80}
            />
            <RechartsTooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="Revenue"
              stroke="#ea580c"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default RevenueChart;
