# Kế hoạch Triển khai tính năng Livestream (Admin Live, User Watch + Chat)

Xây dựng một hệ thống Livestream (1-N) với khả năng tương tác qua chat, đáp ứng tiêu chí chuẩn production và kiến trúc tái sử dụng (reusable hooks/components).

## ⚠️ User Review Required

**1. Kiến trúc WebRTC cho Livestream:** 
Thiết kế mô hình **Star Topology (WebRTC Mesh 1-N)** kết hợp Socket.io. Trong mô hình này, Browser của Admin sẽ trực tiếp tạo `PeerConnection` tới từng User đang xem (phù hợp cho quy mô vừa và nhỏ). 

- **Quy mô của Livestream:** Phục vụ số lượng lớn người xem (hàng ngàn người cùng lúc), việc Admin tải lên hàng ngàn stream từ browser sẽ gây quá tải mạng -> sử dụng một dịch vụ bên thứ 3 **LiveKit**
- **Tên Component / URL:** `/livestream`

---

## Changes

### Backend (ExpressJS01)

#### [MODIFY] [server.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/server.js)
- Nâng cấp logic Socket.io để hỗ trợ phòng Livestream 1-N:
  - `join-livestream`: Người dùng tham gia phòng (phân biệt role `admin` - broadcaster và `user` - viewer)
  - `viewer-ready`: User thông báo sẵn sàng xem, Admin sẽ nhận được và tạo `offer` riêng cho User đó.
  - `chat-message`: Lắng nghe và phát lại tin nhắn chat trong phòng.

---

### Frontend (reactjs01)

#### 1. Components & Pages

#### [MODIFY] [videoCall.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/reactjs01/src/pages/videoCall.jsx) (hoặc đổi tên thành livestream.jsx)
- Xây giao diện:
  - Dành 70% màn hình bên trái để hiển thị Video Player. 
  - Dành 30% bên phải là cửa sổ Live Chat.
- Áp dụng pattern: Gọi các Custom Hooks bên trên dựa vào `auth.user.role`. Nếu là `admin` thì kích hoạt Broadcaster, là User thì kích hoạt Viewer.

---

## Verification Plan

### Hướng kiểm thử thủ công
1. Đăng nhập 1 tài khoản `admin` (Broadcaster) trên trình duyệt thứ nhất, truy cập trang Livestream. Cấp quyền Camera/Mic.
2. Đăng nhập 1 tài khoản `user` (Viewer) trên trình duyệt (hoặc tab ẩn danh) thứ 2, truy cập trang Livestream. Xác nhận User thấy được hình/tiếng của Admin nhưng máy không đòi quyền Camera/Mic.
3. Đăng nhập thêm tài khoản `user` thứ 3 (Viewer) để xác nhận kiến trúc 1-N hoạt động tốt, Admin phát cho nhiều người cùng lúc.
4. Chat giữa các user và admin để kiểm tra real-time chat.

### Hướng kiểm thử tải (Load Test) 1000 Users
Việc mở 1000 tab trình duyệt trên 1 máy tính để test WebRTC là không khả thi (sẽ gây treo máy do cạn kiệt CPU/RAM). Do đó, chúng ta chia thành 2 phần test:

##### Test hiệu năng Backend API (Tạo Token)**
Chạy script tự động sinh 1000 token cùng lúc để đo thời gian phản hồi của Server:
```bash
cd ExpressJS01/src/tests
node livestream_load_test.js
```
*(Kết quả thực tế: NodeJS có thể tạo 1000 tokens chỉ trong ~50-60ms).*
