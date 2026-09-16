import { Input, Button } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  SearchOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import MapSelector from '../../common/settings/MapSelector';

const DeliveryForm = ({
  deliveryInfo,
  handleInputChange,
  handleSearchAddress,
  isSearchingAddress,
  handleGetLocation,
  isGettingLocation,
  coordinates,
  handleMapChange,
  distance,
}) => {
  return (
    <div className='bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4'>
      <h2 className='text-lg font-bold text-gray-800 border-b border-gray-100 pb-3'>
        Thông tin giao hàng
      </h2>

      <div className='space-y-3'>
        <div>
          <label className='text-xs font-semibold text-gray-500 block mb-1'>
            Họ và tên người nhận
          </label>
          <Input
            name='customerName'
            prefix={<UserOutlined className='text-gray-400' />}
            placeholder='Nhập họ tên đầy đủ'
            value={deliveryInfo.customerName}
            onChange={handleInputChange}
            className='rounded-xl h-11'
          />
        </div>

        <div>
          <label className='text-xs font-semibold text-gray-500 block mb-1'>Số điện thoại</label>
          <Input
            name='phoneNumber'
            prefix={<PhoneOutlined className='text-gray-400' />}
            placeholder='Nhập số điện thoại nhận hàng'
            value={deliveryInfo.phoneNumber}
            onChange={handleInputChange}
            className='rounded-xl h-11'
          />
        </div>

        <div>
          <label className='text-xs font-semibold text-gray-500 block mb-1'>
            Địa chỉ nhận hàng (Hoặc dán Link Google Maps)
          </label>
          <Input.TextArea
            name='shippingAddress'
            placeholder='Địa chỉ cụ thể hoặc dán link Google Maps (ngắn/dài đều được)...'
            value={deliveryInfo.shippingAddress}
            onChange={handleInputChange}
            className='rounded-xl mb-2'
            rows={2}
          />
          <div className='flex flex-col sm:flex-row gap-2 mb-2'>
            <Button
              type='default'
              icon={<SearchOutlined />}
              onClick={handleSearchAddress}
              loading={isSearchingAddress}
              className='flex-1 !text-blue-600 !border-blue-500 hover:!bg-blue-50 hover:!text-blue-600 hover:!border-blue-500'
            >
              Tìm từ Link / Địa chỉ
            </Button>
            <Button
              type='dashed'
              icon={<EnvironmentOutlined />}
              onClick={handleGetLocation}
              loading={isGettingLocation}
              className='flex-1 text-orange-500 border-orange-500 hover:bg-orange-50'
            >
              Dùng GPS của tôi
            </Button>
          </div>

          <div className='mt-4'>
            <label className='text-xs font-semibold text-gray-500 block mb-2'>
              Hoặc chọn vị trí trực tiếp trên bản đồ:
            </label>
            <MapSelector
              defaultLat={coordinates?.lat || 10.850438}
              defaultLng={coordinates?.lng || 106.772596}
              onChange={handleMapChange}
            />
          </div>

          {distance > 0 && (
            <div className='mt-2 text-xs text-green-600 font-medium'>
              Khoảng cách ước tính: {distance} km
            </div>
          )}
        </div>

        <div>
          <label className='text-xs font-semibold text-gray-500 block mb-1'>
            Ghi chú đơn hàng (Tùy chọn)
          </label>
          <Input.TextArea
            name='note'
            placeholder='Ví dụ: không hành, ít cay, giao ngoài giờ hành chính...'
            value={deliveryInfo.note}
            onChange={handleInputChange}
            className='rounded-xl'
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveryForm;
