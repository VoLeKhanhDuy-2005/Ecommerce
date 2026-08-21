import React from "react";
import { Empty, Button } from "antd";
import { AppstoreAddOutlined, DollarCircleFilled } from "@ant-design/icons";
import { formatCurrency } from "../../../utils/formatter";
import { getVoucherTypeIcon, getVoucherDescription } from "./voucherUtils";

const AvailableVouchers = ({ activeVouchers, handleRedeem, isRedeeming, userCoins }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
        <AppstoreAddOutlined className="text-orange-500" /> Voucher Đổi Thưởng
      </h2>
      {activeVouchers.length === 0 ? (
        <Empty description="Hiện chưa có voucher nào để đổi" />
      ) : (
        <div className="space-y-4">
          {activeVouchers.map((v) => (
            <div
              key={v._id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-orange-100">
                {getVoucherTypeIcon(v.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{v.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{v.description || getVoucherDescription(v)}</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                    Đơn Tối Thiểu: {formatCurrency(v.minOrderValue)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0 border-l border-dashed border-gray-200 pl-4 ml-2">
                <span className="text-orange-500 font-black text-lg">
                  <DollarCircleFilled style={{ color: "#FFD700", marginRight: 4 }} /> {v.costInCoins}
                </span>
                <Button
                  type="primary"
                  className="bg-orange-500 hover:bg-orange-600 border-none rounded-xl text-xs font-bold w-full"
                  onClick={() => handleRedeem(v._id, v.costInCoins)}
                  loading={isRedeeming}
                  disabled={userCoins < v.costInCoins}
                >
                  Đổi Ngay
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableVouchers;
