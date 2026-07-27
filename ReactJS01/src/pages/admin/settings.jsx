import React, { useState, useEffect, useContext } from "react";
import { Button, Input, notification, Card, Spin } from "antd";
import {
  EnvironmentOutlined,
  SaveOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  getSettingsApi,
  updateSettingApi,
  resolveMapLinkApi,
} from "../../util/api";
import { AuthContext } from "../../components/context/auth.context";
import MapSelector from "../../components/MapSelector";

export default function AdminSettingsPage() {
  const { auth } = useContext(AuthContext);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);
  // Khi component được render lần đầu (mount), gọi hàm fetchSettings() đúng một lần mảng dependencies [] rỗng.

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getSettingsApi();
      if (res && res.success) {
        const storeLoc = res.data.store_location;
        if (storeLoc) {
          setLat(storeLoc.lat);
          setLng(storeLoc.lng);
        }
      }
    } catch (error) {
      notification.error({
        message: "Lỗi tải cấu hình",
        description: "Không thể lấy thông tin cấu hình từ máy chủ.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lat || !lng) {
      notification.warning({
        message: "Vui lòng chọn đầy đủ Vĩ độ và Kinh độ",
      });
      return;
    }
    setIsSaving(true);
    try {
      const value = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const res = await updateSettingApi("store_location", value);
      if (res && res.success) {
        notification.success({ message: "Lưu cấu hình thành công" });
      } else {
        notification.error({ message: "Lỗi khi lưu cấu hình" });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể lưu cấu hình.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setIsGettingLocation(false);
          notification.success({ message: "Lấy vị trí thành công!" });
        },
        (error) => {
          setIsGettingLocation(false);
          notification.error({
            message: "Lỗi lấy vị trí",
            description: "Vui lòng cấp quyền truy cập vị trí.",
          });
        },
      );
    } else {
      notification.error({ message: "Trình duyệt không hỗ trợ định vị" });
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      notification.warning({
        message: "Vui lòng nhập địa chỉ hoặc link Google Maps",
      });
      return;
    }

    setIsSearchingAddress(true);
    try {
      let newLat, newLng;
      const isUrl =
        searchAddress.includes("http://") || searchAddress.includes("https://");

      if (isUrl) {
        const response = await resolveMapLinkApi(searchAddress);
        if (response && response.success && response.data) {
          newLat = response.data.lat;
          newLng = response.data.lng;
        } else {
          notification.warning({
            message: "Không tìm thấy tọa độ",
            description:
              response.message || "Vui lòng kiểm tra lại link Google Maps.",
          });
          setIsSearchingAddress(false);
          return;
        }
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchAddress,
          )}`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          newLat = parseFloat(data[0].lat);
          newLng = parseFloat(data[0].lon);
        } else {
          notification.warning({
            message: "Không tìm thấy địa chỉ",
            description:
              "Vui lòng ghi rõ tên đường, quận/huyện hoặc nhập link Google Maps.",
          });
          setIsSearchingAddress(false);
          return;
        }
      }

      if (newLat && newLng) {
        setLat(newLat);
        setLng(newLng);
        notification.success({
          message: "Tìm thấy vị trí",
          description: "Vị trí trên bản đồ đã được cập nhật.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi kết nối khi tìm kiếm vị trí" });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full" />
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <SettingOutlined className="text-blue-600" />
          <span>Cấu Hình Hệ Thống</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            className="rounded-3xl shadow-sm border-gray-100"
            title="📍 Vị trí cửa hàng (GPS)"
          >
            <p className="text-sm text-gray-500 mb-4">
              Dùng để tính khoảng cách và phí giao hàng cho khách.
            </p>
            <div className="space-y-4">
              <MapSelector
                defaultLat={lat || 10.850438}
                defaultLng={lng || 106.772596}
                onChange={({ lat, lng }) => {
                  setLat(lat);
                  setLng(lng);
                }}
              />

              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Tìm vị trí theo địa chỉ / Link Google Maps
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tên đường, quận/huyện hoặc dán link Google Maps..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="rounded-xl h-10 flex-1"
                    onPressEnter={handleSearchAddress}
                  />
                  <Button
                    type="default"
                    icon={<SearchOutlined />}
                    onClick={handleSearchAddress}
                    loading={isSearchingAddress}
                    className="!text-blue-600 !border-blue-500 hover:!bg-blue-50 hover:!text-blue-600 hover:!border-blue-500 rounded-xl h-10"
                  >
                    Tìm
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="dashed"
                  icon={<EnvironmentOutlined />}
                  onClick={handleGetLocation}
                  loading={isGettingLocation}
                  className="w-full text-blue-600 border-blue-500 hover:bg-blue-50 rounded-xl h-10"
                >
                  Lấy vị trí hiện tại của tôi
                </Button>
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
        </div>
      )}
    </div>
  );
}
