import { Form, Input, Select, DatePicker, Button } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import MapSelector from '../../common/settings/MapSelector';

const ProfileForm = ({
  coords,
  setCoords,
  handleGetLocation,
  isGettingLocation,
  handleSearchAddress,
  isSearchingAddress,
}) => {
  return (
    <div className='w-full md:w-2/3 space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Form.Item
          label={<span className='font-semibold text-gray-700'>Họ tên</span>}
          name='fullname'
          rules={[{ max: 50, message: 'Họ tên không được quá 50 ký tự' }]}
        >
          <Input size='large' placeholder='Nhập họ tên của bạn' className='rounded-xl' />
        </Form.Item>

        <Form.Item
          label={<span className='font-semibold text-gray-700'>Giới tính</span>}
          name='gender'
          initialValue='OTHER'
        >
          <Select
            size='large'
            placeholder='Chọn giới tính'
            allowClear={false}
            className='rounded-xl'
            options={[
              { value: 'MALE', label: 'Nam' },
              { value: 'FEMALE', label: 'Nữ' },
              { value: 'OTHER', label: 'Khác' },
            ]}
          />
        </Form.Item>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Form.Item
          label={<span className='font-semibold text-gray-700'>Số điện thoại</span>}
          name='phone'
          rules={[
            { pattern: /^\d*$/, message: 'Số điện thoại chỉ được chứa chữ số' },
            { max: 11, message: 'Tối đa 11 số' },
          ]}
        >
          <Input size='large' placeholder='Nhập số điện thoại' className='rounded-xl' />
        </Form.Item>

        <Form.Item
          label={<span className='font-semibold text-gray-700'>Ngày sinh</span>}
          name='birthday'
        >
          <DatePicker
            size='large'
            className='w-full rounded-xl'
            format='DD-MM-YYYY'
            placeholder='Chọn ngày sinh'
            allowClear={false}
          />
        </Form.Item>
      </div>

      <Form.Item
        label={
          <span className='font-semibold text-gray-700'>Địa chỉ (Hoặc dán Link Google Maps)</span>
        }
        name='address'
      >
        <Input.TextArea
          rows={3}
          placeholder='Địa chỉ nhà hoặc link Google Maps...'
          className='rounded-xl resize-none'
        />
      </Form.Item>

      <div>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>
          <EnvironmentOutlined className='mr-1 text-orange-500' /> Vị trí trên bản đồ (Dùng để tính
          phí giao hàng)
        </label>
        <p className='text-xs text-gray-500 mb-3'>
          Bạn có thể nhấp vào bản đồ để chọn tọa độ chính xác của mình.
        </p>
        <MapSelector
          defaultLat={coords?.lat || 10.850438}
          defaultLng={coords?.lng || 106.772596}
          onChange={({ lat, lng }) => {
            setCoords({ lat, lng });
          }}
        />
        <Button
          type='dashed'
          icon={<EnvironmentOutlined />}
          onClick={handleGetLocation}
          loading={isGettingLocation}
          className='w-full !text-orange-500 !border-orange-500 hover:!bg-orange-50 hover:!text-orange-500 hover:!border-orange-500 mt-3 rounded-xl'
        >
          Lấy vị trí hiện tại của tôi (GPS)
        </Button>
        <Button
          type='default'
          icon={<SearchOutlined />}
          onClick={handleSearchAddress}
          loading={isSearchingAddress}
          className='w-full !text-blue-600 !border-blue-500 hover:!bg-blue-50 hover:!text-blue-600 hover:!border-blue-500 mt-2 rounded-xl'
        >
          Tìm từ Link / Địa chỉ
        </Button>
      </div>
    </div>
  );
};

export default ProfileForm;
