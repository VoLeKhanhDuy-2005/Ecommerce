# Kế hoạch Tích hợp Bản đồ và Lưu vị trí User

Để đáp ứng yêu cầu hiển thị bản đồ trực quan giống Google Maps và cho phép User lưu vị trí của họ vào DB, chúng ta sẽ sử dụng thư viện **Leaflet** (thông qua `react-leaflet`) - một thư viện mã nguồn mở miễn phí, rất phổ biến cho bản đồ (sử dụng OpenStreetMap) để tránh các vấn đề về API Key mất phí của Google Maps.

## Đề xuất Thay đổi

### 1. Frontend: Cài đặt thư viện bản đồ

- Cài đặt `leaflet` và `react-leaflet` cho Frontend (`npm install leaflet react-leaflet`).
- Cập nhật `index.html` hoặc `index.css` để load file CSS chuẩn của Leaflet.

### 2. Frontend: Component Bản đồ (`MapSelector`)

#### [NEW] [MapSelector.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/components/MapSelector.jsx)

- Tạo một component có thể tái sử dụng, hiển thị bản đồ trực quan.
- Khi người dùng (Admin hoặc User) click vào bản đồ, sẽ có một "ghim" (Marker) rớt xuống và cập nhật lại tọa độ Lat/Lng.

### 3. Backend: Lưu vị trí người dùng vào Profile

#### [MODIFY] [user.js (Model)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/user.js)

- Thêm trường `location` (dạng đối tượng `{ lat: Number, lng: Number }`) vào `userSchema`.

#### [MODIFY] [userController.js / userService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/userService.js)

- Điều chỉnh hàm cập nhật profile để nhận thêm tham số `location` (từ `lat`, `lng` phía frontend) và lưu vào database.

### 4. Frontend: Cập nhật Trang cấu hình Admin

#### [MODIFY] [settings.jsx (Admin)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/admin/settings.jsx)

- Nhúng `MapSelector` vào trang. Thay vì chỉ nhập số, Admin có thể click thẳng lên bản đồ để chọn tọa độ cửa hàng.

### 5. Frontend: Cập nhật Trang cá nhân User

#### [MODIFY] [editProfile.jsx (User)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/editProfile.jsx)

- Nhúng `MapSelector` vào form cập nhật hồ sơ để User ghim sẵn vị trí nhà của mình.
- Truyền tọa độ này qua API cập nhật profile.

### 6. Frontend: Tối ưu trang Giỏ Hàng (Cart)

#### [MODIFY] [cart.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/cart.jsx)

- Nếu User đã lưu vị trí trong Profile, khi vào giỏ hàng sẽ tự lấy vị trí đó tính phí ship ngay lập tức, không cần User phải bấm "Lấy vị trí hiện tại" nữa (vẫn hiển thị nút phòng khi họ muốn lấy vị trí chỗ khác).

## Verification Plan

1. Chạy lệnh cài thư viện (`npm install leaflet react-leaflet`) tại Frontend.
2. Dùng tài khoản User vào trang Cập nhật Profile, xem có bản đồ không, ghim 1 vị trí và lưu.
3. Vào Giỏ Hàng (Cart), xem phí ship có tự động tính dựa vào vị trí vừa lưu hay không.
4. Đăng nhập Admin, vào trang Cấu hình hệ thống, xem có bản đồ không và ghim vị trí cửa hàng mới trên bản đồ.
