# Cải thiện Background Jobs

Tách riêng logic quét đơn hàng tự động và xử lý vấn đề trùng lặp job khi chạy nhiều instance (scale ứng dụng).

> Phương pháp được đề xuất là sử dụng **`node-cron` kết hợp với Redis Lock**. 
> - **Lý do**: Đã có sẵn kết nối Redis (`src/config/redis.js`). Việc tận dụng lệnh `SET NX` của Redis để khóa (lock) job giúp đảm bảo rằng dù có chạy 2 hay 10 instance của backend, tại một thời điểm (mỗi phút) chỉ có đúng **một instance** được quyền chạy job quét database. Cách này rất nhẹ (lightweight) so với việc cài cả một hệ thống message queue phức tạp như BullMQ, trong khi vẫn đạt chuẩn Production.

## Changes

Cài đặt thêm thư viện `node-cron` để quản lý tiến trình thay vì dùng `setInterval` (rất khó quản lý và dễ gây memory leak nếu không kiểm soát tốt).

### Dependency Updates

#### [MODIFY] `package.json`
- Cài đặt thêm thư viện: `npm install node-cron`

---

### Backend Components

#### [NEW] [cronJobs.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/backend/src/services/cronJobs.js)
Tạo file mới chuyên quản lý các Background Jobs để giữ `server.js` luôn clean.
- Cấu hình một Cron Job chạy mỗi phút (`* * * * *`).
- Bổ sung cơ chế **Redis Distributed Lock**: Job trước khi chạy sẽ thử xin một lock có hạn 50 giây từ Redis. Nếu xin được (nghĩa là chưa có server nào chạy job này), nó sẽ tiến hành truy vấn DB. Nếu không (đã có server khác giữ lock), nó sẽ bỏ qua.

#### [MODIFY] [server.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/backend/src/server.js)
- Import và khởi chạy file `cronJobs.js` ngay sau khi kết nối Database thành công.

## Verification Plan

### Manual Verification
- Chạy ứng dụng (`npm run dev`) và theo dõi log để đảm bảo hệ thống báo `Redis connected` và Background Job vẫn báo tự động xác nhận đơn hàng bình thường.
- (Tùy chọn) Mở 2 terminal chạy cùng lúc 2 instance backend ở 2 port khác nhau. Theo dõi log để xác nhận rằng mỗi phút chỉ có đúng 1 bên log ra kết quả quét đơn hàng.
