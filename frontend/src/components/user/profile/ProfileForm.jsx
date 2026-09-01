import React from 'react';
import { Button } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import MapSelector from '../../common/settings/MapSelector';

const ProfileForm = ({
  formData,
  fieldErrors,
  handleChange,
  handleGetLocation,
  isGettingLocation,
  handleSearchAddress,
  isSearchingAddress,
  setFormData,
}) => {
  return (
    <div className='w-full md:w-2/3 space-y-6'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Họ tên</label>
          <input
            type='text'
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.fullname
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:ring-orange-500'
            } focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            name='fullname'
            value={formData.fullname}
            onChange={handleChange}
            placeholder='Nhập họ tên của bạn'
          />
          {fieldErrors.fullname && (
            <p className='text-red-500 text-sm mt-1.5 font-medium'>{fieldErrors.fullname}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Giới tính</label>
          <select
            className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white'
            name='gender'
            value={formData.gender}
            onChange={handleChange}
          >
            <option value=''>Chọn giới tính</option>
            <option value='MALE'>Nam</option>
            <option value='FEMALE'>Nữ</option>
          </select>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Số điện thoại</label>
          <input
            type='text'
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.phone
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:ring-orange-500'
            } focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            name='phone'
            value={formData.phone}
            onChange={handleChange}
            placeholder='Nhập số điện thoại'
          />
          {fieldErrors.phone && (
            <p className='text-red-500 text-sm mt-1.5 font-medium'>{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Ngày sinh</label>
          <input
            type='date'
            className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-700'
            name='birthday'
            value={formData.birthday}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>
          Địa chỉ (Hoặc dán Link Google Maps)
        </label>
        <textarea
          className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none'
          rows='3'
          name='address'
          value={formData.address}
          onChange={handleChange}
          placeholder='Địa chỉ nhà hoặc link Google Maps...'
        />
      </div>

      <div>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>
          <EnvironmentOutlined className='mr-1 text-orange-500' /> Vị trí trên bản đồ (Dùng để tính
          phí giao hàng)
        </label>
        <p className='text-xs text-gray-500 mb-3'>
          Bạn có thể nhấp vào bản đồ để chọn tọa độ chính xác của mình.
        </p>
        <MapSelector
          defaultLat={formData.lat || 10.850438}
          defaultLng={formData.lng || 106.772596}
          onChange={({ lat, lng }) => {
            setFormData((prev) => ({ ...prev, lat, lng }));
          }}
        />
        <Button
          type='dashed'
          icon={<EnvironmentOutlined />}
          onClick={handleGetLocation}
          loading={isGettingLocation}
          className='w-full !text-orange-500 !border-orange-500 hover:!bg-orange-50 hover:!text-orange-500 hover:!border-orange-500 mt-3'
        >
          Lấy vị trí hiện tại của tôi (GPS)
        </Button>
        <Button
          type='default'
          icon={<SearchOutlined />}
          onClick={handleSearchAddress}
          loading={isSearchingAddress}
          className='w-full !text-blue-600 !border-blue-500 hover:!bg-blue-50 hover:!text-blue-600 hover:!border-blue-500 mt-2'
        >
          Tìm từ Link / Địa chỉ
        </Button>
      </div>
    </div>
  );
};

export default ProfileForm;
