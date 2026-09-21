import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { AuthContext } from '../../components/common/context/auth.context';

import {
  getCurrentUserApi,
  updateProfileApi,
  resolveMapLinkApi,
  searchNominatim,
} from '../../apis';

import { Form, Button, Spin, notification } from 'antd';

import ProfileForm from '../../components/user/profile/ProfileForm';
import AvatarUpload from '../../components/user/profile/AvatarUpload';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { auth, setAuth, isAuthLoading } = useContext(AuthContext);
  const user = auth.user;
  const userId = user?.id;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Giải phóng bộ nhớ preview URL tránh memory leak
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    // Đợi auth load xong mới kiểm tra - tránh redirect nhầm khi token đang verify
    if (isAuthLoading) return;

    if (!userId) {
      // Auth đã load xong nhưng không có user -> chưa đăng nhập
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const res = await getCurrentUserApi();
        if (res && res.user) {
          const profile = res.user;
          form.setFieldsValue({
            fullname: profile.name || '',
            phone: profile.phone || '',
            gender: profile.gender || undefined,
            address: profile.address || '',
            birthday: profile.birthday ? dayjs(profile.birthday) : null,
          });

          setCoords({
            lat: profile.location?.lat || null,
            lng: profile.location?.lng || null,
          });

          setPreview(profile.avatarURL);
        }
      } catch (err) {
        notification.error({
          message: 'Lỗi',
          description: err.response?.data?.message || 'Không thể tải dữ liệu hồ sơ',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isAuthLoading, navigate, form]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        notification.error({
          message: 'Định dạng không hợp lệ',
          description: 'Chỉ chấp nhận file định dạng JPG, PNG.',
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        notification.error({
          message: 'Dung lượng quá lớn',
          description: 'Kích thước ảnh tối đa 2MB.',
        });
        return;
      }
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    // navigator là một object có sẵn trong trình duyệt, chứa thông tin và các API của trình duyệt
    /*
      {
        userAgent: "...",
        language: "vi-VN",
        geolocation: Geolocation,
        clipboard: Clipboard,
        ...
      }
    */
    if ('geolocation' in navigator) {
      // Kiểm tra xem trình duyệt có hỗ trợ Geolocation API hay không
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Hàm callback sẽ được gọi khi lấy được vị trí
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          setIsGettingLocation(false);
          notification.success({
            message: 'Thành công',
            description: 'Đã lấy vị trí hiện tại của bạn!',
          });
        },
        (err) => {
          setIsGettingLocation(false);
          notification.error({
            message: 'Lỗi GPS',
            description: 'Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí.',
          });
          console.error(err);
        }
      );
    } else {
      notification.error({
        message: 'Lỗi',
        description: 'Trình duyệt không hỗ trợ GPS.',
      });
    }
  };

  const handleSearchAddress = async () => {
    const address = form.getFieldValue('address');
    if (!address?.trim()) {
      notification.warning({
        message: 'Vui lòng nhập địa chỉ hoặc dán link Google Maps',
      });
      return;
    }

    setIsSearchingAddress(true);
    try {
      let lat, lng;
      const isUrl = address.includes('http://') || address.includes('https://');

      if (isUrl) {
        const response = await resolveMapLinkApi(address);
        if (response && response.success && response.data) {
          lat = response.data.lat;
          lng = response.data.lng;
        } else if (response && response.isPlaceName && response.placeName) {
          // Fallback: Nếu backend trích xuất được tên địa điểm nhưng không có tọa độ
          const nomData = await searchNominatim(response.placeName);
          if (nomData && nomData.length > 0) {
            lat = parseFloat(nomData[0].lat);
            lng = parseFloat(nomData[0].lon);
          } else {
            notification.warning({
              message: 'Không tìm thấy tọa độ',
              description: `Không thể định vị được địa điểm: ${response.placeName}.`,
            });
            setIsSearchingAddress(false);
            return;
          }
        } else {
          notification.warning({
            message: 'Không tìm thấy tọa độ',
            description: response?.message || 'Vui lòng kiểm tra lại link Google Maps.',
          });
          setIsSearchingAddress(false);
          return;
        }
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          notification.warning({
            message: 'Không tìm thấy địa chỉ',
            description: 'Vui lòng ghi rõ tên đường, quận/huyện hoặc chọn vị trí trên bản đồ.',
          });
          setIsSearchingAddress(false);
          return;
        }
      }

      if (lat && lng) {
        setCoords({ lat, lng });
        notification.success({
          message: 'Tìm thấy vị trí',
          description: 'Vị trí trên bản đồ đã được cập nhật thành công.',
        });
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Lỗi kết nối',
        description: 'Lỗi khi tìm kiếm vị trí địa chỉ.',
      });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append('fullname', values.fullname?.trim() || '');
      formData.append('phone', values.phone || '');
      formData.append('gender', values.gender || '');
      formData.append('address', values.address || '');
      if (values.birthday) {
        formData.append(
          'birthday',
          dayjs.isDayjs(values.birthday) ? values.birthday.format('YYYY-MM-DD') : values.birthday
        );
      }
      if (coords.lat && coords.lng) {
        formData.append('lat', coords.lat);
        formData.append('lng', coords.lng);
      }

      if (avatar) {
        formData.append('avatar', avatar);
      }

      const res = await updateProfileApi(formData);

      if (res && res.success) {
        notification.success({
          message: 'Thành công',
          description: 'Cập nhật hồ sơ thành công',
        });
        setAuth({
          ...auth,
          user: {
            ...auth.user,
            name: values.fullname?.trim() || auth.user.name,
            phone: values.phone || auth.user.phone,
            address: values.address || auth.user.address,
            location: { lat: coords.lat, lng: coords.lng },
            avatar: res.data?.avatarURL || auth.user.avatar,
          },
        });

        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        notification.error({
          message: 'Cập nhật thất bại',
          description: res?.message || 'Không thể cập nhật hồ sơ.',
        });
      }
    } catch (err) {
      notification.error({
        message: 'Cập nhật thất bại',
        description: err.response?.data?.message || 'Cập nhật hồ sơ thất bại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center'>
        <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4'>
          <Spin size='large' />
        </div>
        <p className='text-gray-500 font-medium animate-pulse'>Đang tải dữ liệu hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <div className='bg-white shadow-xl rounded-3xl p-8 sm:p-10 border border-gray-100'>
        <h1 className='text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-8'>
          Cập Nhật Hồ Sơ
        </h1>

        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          requiredMark={false}
          className='space-y-6'
        >
          <div className='flex flex-col md:flex-row gap-8'>
            <ProfileForm
              coords={coords}
              setCoords={setCoords}
              handleGetLocation={handleGetLocation}
              isGettingLocation={isGettingLocation}
              handleSearchAddress={handleSearchAddress}
              isSearchingAddress={isSearchingAddress}
            />
            <AvatarUpload preview={preview} handleFileChange={handleFileChange} />
          </div>

          <div className='flex gap-4 pt-6 border-t border-gray-100'>
            <Button
              type='primary'
              htmlType='submit'
              loading={isSubmitting}
              size='large'
              className='!px-8 !py-3.5 !h-auto !bg-gradient-to-r !from-orange-500 !to-red-500 !text-white !font-bold !rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all !border-none'
            >
              Lưu thay đổi
            </Button>
            <Button
              type='default'
              size='large'
              className='!px-8 !py-3.5 !h-auto !bg-gray-100 !text-gray-700 !font-bold !rounded-xl hover:!bg-gray-200 transition-all !border-none'
              onClick={() => navigate('/')}
            >
              Quay lại
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
