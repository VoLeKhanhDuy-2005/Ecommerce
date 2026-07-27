# Kế hoạch triển khai cấu hình vị trí cửa hàng

Cho phép Admin thay đổi vị trí cửa hàng trực tiếp trên giao diện thay vì fix cứng trong code.

## Changes

### Backend (ExpressJS01)

#### [NEW] [setting.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/setting.js)

- Tạo model `Setting` với cấu trúc `key` (String, unique) và `value` (Mixed/Object).

#### [NEW] [settingService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/settingService.js)

- Viết hàm `getSettings()` để lấy tất cả cấu hình (đặc biệt là `store_location`).
- Viết hàm `updateSetting(key, value)` để admin cập nhật cấu hình.

#### [NEW] [settingController.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/controllers/settingController.js)

- Viết controller cho API cấu hình.

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)

- Thêm route `GET /settings`
- Thêm route `PUT /admin/settings` (yêu cầu quyền Admin).

#### [MODIFY] [orderService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/orderService.js)

- Thay đổi hằng số `STORE_LAT` và `STORE_LNG` cứng thành hàm truy vấn vào database `Setting` để lấy tọa độ cấu hình mới nhất mỗi khi tính phí ship. Nếu DB trống, dùng tọa độ mặc định (SPKT).

---

### Frontend (ReactJS01)

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/util/api.js)

- Thêm hàm `getSettingsApi()` và `updateSettingApi()`.

#### [NEW] [settings.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/admin/settings.jsx)

- Thêm trang "Cấu Hình" cho Admin.
- Trang này có form hiển thị Vị trí cửa hàng (Latitude, Longitude).
- Có nút "Định vị hiện tại" (GPS) để Admin tự cập nhật vị trí cửa hàng bằng chính vị trí đang đứng, hoặc nhập tay.

#### [MODIFY] [App.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/App.jsx)

- Khai báo route mới `/admin/settings`.

#### [MODIFY] [adminLayout.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/components/layout/adminLayout.jsx)

- Thêm menu item "Cấu Hình Hệ Thống" vào thanh điều hướng bên trái của Admin.

## Verification Plan

- Đăng nhập quyền Admin.
- Vào trang **Cấu Hình**, nhập một tọa độ cửa hàng mới (Ví dụ đổi sang một vị trí cách vị trí cũ 5km).
- Quay về trang Giỏ hàng bằng tài khoản User, bấm định vị và xem phí giao hàng có thay đổi cho phù hợp với khoảng cách tới cửa hàng mới hay không.
