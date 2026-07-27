# Tích hợp tính phí giao hàng qua GPS

Tính năng này sẽ sử dụng định vị GPS (HTML5 Geolocation) trên frontend để lấy tọa độ của khách hàng, sau đó tính toán khoảng cách từ cửa hàng đến khách hàng bằng công thức Haversine (đường chim bay) và đưa ra phí giao hàng tương ứng.

> **Công thức tính phí:**
> Tôi đề xuất mức phí: **15,000đ** cho 3km đầu tiên, và thêm **5,000đ** cho mỗi km tiếp theo. Bạn có muốn điều chỉnh công thức này không?

## Proposed Changes

### Backend (ExpressJS01)

#### [MODIFY] [order.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/order.js)

- Thêm trường `shippingFee` (Number, mặc định 0) vào Schema.
- Thêm trường `distance` (Number, lưu khoảng cách km) vào Schema.
- Thêm trường `deliveryCoordinates` để lưu `{ lat: Number, lng: Number }` của khách hàng.

#### [MODIFY] [orderService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/orderService.js)

- Cập nhật hàm `createOrder` để nhận thêm thông tin `lat`, `lng`.
- Áp dụng công thức tính khoảng cách (Haversine) từ cửa hàng đến điểm giao hàng.
- Tính toán phí giao hàng dựa trên khoảng cách.
- Cộng `shippingFee` vào `totalAmount` của đơn hàng (bao gồm cả khi thanh toán qua MoMo).
- Thêm logic tính phí `calculateShippingFee` (có thể export ra để tái sử dụng).

#### [MODIFY] [orderController.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/controllers/orderController.js)

- Bổ sung thêm hàm `calculateShipping` để frontend có thể gọi và hiển thị trước phí giao hàng cho người dùng xem trước khi bấm đặt.

#### [MODIFY] [api.js (Backend Routes)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)

- Thêm route: `POST /orders/calculate-shipping` trỏ đến `orderController.calculateShipping`.

---

### Frontend (ReactJS01)

#### [MODIFY] [api.js (Frontend Utils)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/util/api.js)

- Thêm hàm gọi API `calculateShippingApi(lat, lng)`.

#### [MODIFY] [cart.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/cart.jsx)

- Thêm nút "Định vị vị trí hiện tại của tôi (GPS)" cạnh trường địa chỉ.
- Khi người dùng ấn định vị, gọi hàm `navigator.geolocation.getCurrentPosition`.
- Lấy được `lat`, `lng`, gọi API `calculate-shipping` để hiển thị phí giao hàng (Shipping Fee) và Khoảng cách ước tính lên giao diện (ở mục Tóm tắt đơn hàng).
- Gửi `lat`, `lng` trong payload lên API `createOrder`.

#### [MODIFY] [orders.jsx (User & Admin)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/orders.jsx)

- Hiển thị thêm dòng "Phí giao hàng: ..." trong thông tin chi tiết các đơn hàng đã đặt.

## Verification Plan

### Manual Verification

- Bật trình duyệt, cho phép cấp quyền Location (GPS).
- Tại giỏ hàng, ấn định vị để xem Hệ thống tính toán phí giao hàng + khoảng cách.
- Đặt đơn hàng thử (bằng COD) để đảm bảo Backend cộng chuẩn xác Tổng thanh toán = Tổng tiền hàng + Phí giao hàng.
- Thanh toán thử MoMo xem tổng tiền thanh toán có khớp không.
