import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { putProfileSchema } from "./user.schemas";
import { AuthContext } from "../../components/context/auth.context";
import { getCurrentUserApi, updateProfileApi } from "../../util/api";
import { EditOutlined } from "@ant-design/icons";
import { Spin } from "antd";

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
  });

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
            <div className="w-full md:w-2/3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.fullname
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-orange-500"
                    } focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    placeholder="Nhập họ tên của bạn"
                  />
                  {fieldErrors.fullname && (
                    <p className="text-red-500 text-sm mt-1.5 font-medium">
                      {fieldErrors.fullname}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-orange-500"
                    } focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1.5 font-medium">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-700"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  rows="4"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ nhà"
                />
              </div>
            </div>

            <div className="w-full md:w-1/3 flex flex-col items-center justify-start pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Ảnh đại diện
              </label>
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-orange-50 shadow-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-300">👤</span>
                  )}
                </div>

                <label
                  htmlFor="avatar-input"
                  className="absolute bottom-1 right-1 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-orange-600 transition-colors border-2 border-white"
                  title="Thay đổi ảnh"
                >
                  <EditOutlined className="text-lg" />
                </label>

                <input
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg, image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Cho phép định dạng JPG, PNG. <br />
                Kích thước tối đa 2MB.
              </p>
            </div>
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
