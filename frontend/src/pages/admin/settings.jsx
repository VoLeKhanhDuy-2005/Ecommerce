import { useState, useEffect, useContext } from 'react';
import { notification, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { getSettingsApi } from '../../apis';
import { AuthContext } from '../../components/common/context/auth.context';
import StoreLocationCard from '../../components/admin/settings/StoreLocationCard';
import ShippingFeeCard from '../../components/admin/settings/ShippingFeeCard';

export default function AdminSettingsPage() {
  const { auth } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [storeLocation, setStoreLocation] = useState(null);
  const [shippingFeeConfig, setShippingFeeConfig] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await getSettingsApi();
        if (res && res.success) {
          if (res.data.store_location) {
            setStoreLocation(res.data.store_location);
          }
          if (res.data.default_shipping_fee) {
            setShippingFeeConfig(res.data.default_shipping_fee);
          }
        }
      } catch (error) {
        console.error(error);
        notification.error({
          message: 'Lỗi tải cấu hình',
          description: 'Không thể lấy thông tin cấu hình từ máy chủ.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);
  // Khi component được render lần đầu (mount), gọi hàm fetchSettings() đúng một lần mảng dependencies [] rỗng.

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 pb-20'>
      <div className='flex items-center gap-3 mb-8'>
        <div className='w-1.5 h-8 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full' />
        <h1 className='text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2'>
          <SettingOutlined className='text-blue-600' />
          <span>Cấu Hình Hệ Thống</span>
        </h1>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-10'>
          <Spin size='large' />
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <StoreLocationCard initialLat={storeLocation?.lat} initialLng={storeLocation?.lng} />
          <ShippingFeeCard
            initialBaseFee={shippingFeeConfig?.baseFee}
            initialBaseDistance={shippingFeeConfig?.baseDistance}
            initialExtraFeePerKm={shippingFeeConfig?.extraFeePerKm}
          />
          {/* Thêm các thẻ Cấu hình khác ở đây trong tương lai */}
        </div>
      )}
    </div>
  );
}
