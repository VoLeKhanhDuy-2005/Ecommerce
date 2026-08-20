import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { putProfileSchema } from "./profile.schemas";

import { AuthContext } from "../../../components/common/context/auth.context";

import {
  getCurrentUserApi,
  updateProfileApi,
  resolveMapLinkApi,
  searchNominatim,
} from "../../../apis";

import { Spin, notification } from "antd";

import ProfileForm from "../../../components/user/profile/ProfileForm";
import AvatarUpload from "../../../components/user/profile/AvatarUpload";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { auth, setAuth } = useContext(AuthContext);
  const user = auth.user;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    gender: "",
    address: "",
    birthday: "",
    lat: null,
    lng: null,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Giải phóng bộ nhớ preview URL tránh memory leak
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!mounted) return;
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const res = await getCurrentUserApi();
        if (res && res.user) {
          const profile = res.user;
          setFormData({
            fullname: profile.name || "",
            phone: profile.phone || "",
            gender: profile.gender || "",
            address: profile.address || "",
            birthday: profile.birthday || "",
            lat: profile.location?.lat || null,
            lng: profile.location?.lng || null,
          });

          setPreview(profile.avatarURL);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [mounted, user?.id]); // user?.id tránh fetch khi user undefined khi load lại trang

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Xóa lỗi của field đó khi người dùng bắt đầu sửa
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Kích thước ảnh quá lớn (tối đa 2MB)");
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
    if ("geolocation" in navigator) {
      //Kiểm tra xem trình duyệt có hỗ trợ Geolocation API hay không
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          //Hàm callback sẽ được gọi khi lấy được vị trí
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData((prev) => ({ ...prev, lat, lng }));
          setIsGettingLocation(false);
          setSuccess("Đã lấy vị trí hiện tại thành công!");
          setTimeout(() => setSuccess(""), 3000);
        },
        (err) => {
          setIsGettingLocation(false);
          setError("Không thể lấy vị trí. Vui lòng cấp quyền GPS.");
        },
      );
    } else {
      setError("Trình duyệt không hỗ trợ GPS.");
    }
  };

  const handleSearchAddress = async () => {
    const address = formData.address;
    if (!address?.trim()) {
      notification.warning({
        message: "Vui lòng nhập địa chỉ hoặc dán link Google Maps",
      });
      return;
    }

    setIsSearchingAddress(true);
    try {
      let lat, lng;
      const isUrl = address.includes("http://") || address.includes("https://");

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
              message: "Không tìm thấy tọa độ",
              description: `Không thể định vị được địa điểm: ${response.placeName}.`,
            });
            setIsSearchingAddress(false);
            return;
          }
        } else {
          notification.warning({
            message: "Không tìm thấy tọa độ",
            description:
              response?.message || "Vui lòng kiểm tra lại link Google Maps.",
          });
          setIsSearchingAddress(false);
          return;
        }
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          notification.warning({
            message: "Không tìm thấy địa chỉ",
            description:
              "Vui lòng ghi rõ tên đường, quận/huyện hoặc tìm thủ công trên bản đồ.",
          });
          setIsSearchingAddress(false);
          return;
        }
      }

      if (lat && lng) {
        setFormData((prev) => ({ ...prev, lat, lng }));
        notification.success({
          message: "Tìm thấy vị trí",
          description: "Vị trí trên bản đồ đã được cập nhật.",
        });
      }
    } catch (err) {
      console.error(err);
      notification.error({ message: "Lỗi kết nối khi tìm kiếm vị trí" });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess("");

    //Validate bằng Zod ở Frontend
    const validation = putProfileSchema.safeParse({
      ...formData,
      userId: String(user?.id), // Ép kiểu vì schema yêu cầu string
    });

    if (!validation.success) {
      // Chuyển đổi lỗi Zod thành object { fieldName: message }
      const errors = {};
      validation.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      return; // Dừng lại không call API
    }

    try {
      const form = new FormData();

      form.append("fullname", formData.fullname);
      form.append("phone", formData.phone);
      form.append("gender", formData.gender);
      form.append("address", formData.address);
      form.append("birthday", formData.birthday);
      if (formData.lat && formData.lng) {
        form.append("lat", formData.lat);
        form.append("lng", formData.lng);
      }

      if (avatar) {
        form.append("avatar", avatar);
      }

      const res = await updateProfileApi(form);

      if (res && res.success) {
        setSuccess("Cập nhật hồ sơ thành công");
        setAuth({
          ...auth,
          user: {
            ...auth.user,
            name: formData.fullname,
            phone: formData.phone,
            address: formData.address,
            location: { lat: formData.lat, lng: formData.lng },
            avatar: res.data?.avatarURL || auth.user.avatar,
          },
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setError(res?.message || "Cập nhật thất bại");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Spin size="large" />
        </div>
        <p className="text-gray-500 font-medium animate-pulse">
          Đang tải dữ liệu hồ sơ...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white shadow-xl rounded-3xl p-8 sm:p-10 border border-gray-100">
        <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-8">
          Cập Nhật Hồ Sơ
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-medium border border-red-100 flex items-center gap-2">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 font-medium border border-green-100 flex items-center gap-2">
            <span className="text-xl">✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            <ProfileForm
              formData={formData}
              fieldErrors={fieldErrors}
              handleChange={handleChange}
              handleGetLocation={handleGetLocation}
              isGettingLocation={isGettingLocation}
              handleSearchAddress={handleSearchAddress}
              isSearchingAddress={isSearchingAddress}
              setFormData={setFormData}
            />
            <AvatarUpload
              preview={preview}
              handleFileChange={handleFileChange}
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              type="submit"
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Lưu thay đổi
            </button>
            <button
              type="button"
              className="px-8 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              onClick={() => navigate("/")}
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
