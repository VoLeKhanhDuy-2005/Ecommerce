# Cải thiện Bảo mật & Dữ liệu (Security & Sanitization)

Bản kế hoạch này nhằm bổ sung các "lớp giáp" tiêu chuẩn cho ứng dụng NodeJS/Express khi chạy trên môi trường Production, bao gồm bảo vệ khỏi XSS, NoSQL Injection, thiết lập HTTP Security Headers và tối ưu dung lượng Response.

---

## Kế hoạch Cải thiện Security & Tối ưu hóa (Proposed Changes)

### 1. Dependency Updates
#### [MODIFY] `package.json`
Cài đặt thêm các package bảo mật cần thiết:
- `helmet`: Tự động thêm các HTTP header bảo mật.
- `express-mongo-sanitize`: Ngăn chặn hacker gửi mã NoSQL Injection (ví dụ truyền `{ "$gt": "" }` vào field username/password).
- `xss-clean`: Chặn mã độc (script) chứa trong body/query gửi lên.
- `compression`: Nén dữ liệu trả về chuẩn GZIP, giúp API nhanh hơn.

Lệnh: `npm install helmet express-mongo-sanitize xss-clean compression`

### 2. Cập nhật file Server
#### [MODIFY] [backend/src/server.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/backend/src/server.js)
Import và đăng ký (app.use) các thư viện này ở vị trí đầu tiên của pipeline xử lý Request để nó có thể chặn mã độc ngay trước khi Request đi tới các Route.

## Verification Plan
### Manual Verification
- Chạy lại ứng dụng `npm run dev`.
- Gọi bất kỳ 1 API nào từ Postman (ví dụ `GET /v1/api/products`), mở tab `Headers` của Response trong Postman, bạn sẽ thấy `X-Powered-By: Express` đã bị ẩn đi, xuất hiện thêm rất nhiều Header lạ như `Content-Security-Policy` và `Content-Encoding: gzip` (nếu response đủ lớn). Điều này chứng tỏ `helmet` và `compression` đang hoạt động tốt.
