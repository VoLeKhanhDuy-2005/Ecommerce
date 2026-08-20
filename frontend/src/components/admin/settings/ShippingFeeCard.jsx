import React, { useState, useEffect } from "react";
import { Button, Input, notification, Card } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { updateSettingApi } from "../../../apis";

const ShippingFeeCard = ({
  initialBaseFee,
  initialBaseDistance,
  initialExtraFeePerKm,
}) => {
  const [baseFee, setBaseFee] = useState(15000);
  const [baseDistance, setBaseDistance] = useState(3);
  const [extraFeePerKm, setExtraFeePerKm] = useState(5000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialBaseFee !== undefined) setBaseFee(initialBaseFee);
    if (initialBaseDistance !== undefined) setBaseDistance(initialBaseDistance);
    if (initialExtraFeePerKm !== undefined)
      setExtraFeePerKm(initialExtraFeePerKm);
  }, [initialBaseFee, initialBaseDistance, initialExtraFeePerKm]);

  const handleSave = async () => {
    if (baseFee === "" || baseDistance === "" || extraFeePerKm === "") {
      notification.warning({
        message:
          "Vui lòng nhập đầy đủ các trường mục 'Phí vận chuyển mặc định'",
      });
      return;
    }

    if (
      Number(baseFee) < 0 ||
      Number(baseDistance) < 0 ||
      Number(extraFeePerKm) < 0
    ) {
      notification.warning({
        message: "Các giá trị cấu hình phí vận chuyển không được nhỏ hơn 0",
      });
      return;
    }

    setIsSaving(true);
    try {
      const value = {
        baseFee: Number(baseFee),
        baseDistance: Number(baseDistance),
        extraFeePerKm: Number(extraFeePerKm),
      };
      const res = await updateSettingApi("default_shipping_fee", value);
      if (res && res.success) {
        notification.success({
          message: "Lưu cấu hình phí vận chuyển thành công",
        });
      } else {
        notification.error({
          message: "Lỗi khi lưu cấu hình phí vận chuyển",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể lưu thông tin cấu hình.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      className="rounded-3xl shadow-sm border-gray-100 h-full"
      title="🚚 Phí vận chuyển mặc định"
    >
      <p className="text-sm text-gray-500 mb-4">
        Cấu hình mức phí vận chuyển dựa trên khoảng cách từ vị trí cửa hàng đến
        khách hàng.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Phí cơ bản (VNĐ)
          </label>
          <Input
            type="number"
            value={baseFee}
            onChange={(e) => setBaseFee(e.target.value)}
            className="rounded-xl h-10 w-full"
            min={0}
            step={1000}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Mức phí áp dụng cho khoảng cách cơ bản.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Khoảng cách cơ bản (km)
          </label>
          <Input
            type="number"
            value={baseDistance}
            onChange={(e) => setBaseDistance(e.target.value)}
            className="rounded-xl h-10 w-full"
            min={0}
            step={0.1}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Khoảng cách tối đa (km) để áp dụng mức phí cơ bản.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Phí cho mỗi km tiếp theo (VNĐ)
          </label>
          <Input
            type="number"
            value={extraFeePerKm}
            onChange={(e) => setExtraFeePerKm(e.target.value)}
            className="rounded-xl h-10 w-full"
            min={0}
            step={1000}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Mức phí cộng thêm cho mỗi km vượt quá khoảng cách cơ bản.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-10 font-bold"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ShippingFeeCard;
