# Register / Forgot Password với OTP qua Email (Sử dụng Redis)

Hệ thống sẽ gửi mã OTP gồm 6 chữ số đến email người dùng để xác minh khi Register / Forgot Password. Mã OTP được lưu trong bộ nhớ đệm Redis để tự động hết hạn và dễ dàng kiểm tra.

## Proposed Changes

### Dependency
#### [NEW] Cài đặt `nodemailer`
Sử dụng thư viện `nodemailer` để gửi email. (Lệnh `npm install nodemailer` sẽ được thực thi trong quá trình triển khai).

### Configuration
#### [MODIFY] [.env.example](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/.env.example)
Thêm các biến môi trường cấu hình gửi Email và OTP TTL:
```env
# Email Config
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
# OTP TTL in seconds (Ví dụ: 5 phút = 300s)
OTP_TTL=300
```

### Services Layer

#### [NEW] [emailService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/emailService.js)
Tạo service khởi tạo kết nối `nodemailer` và định nghĩa hàm `sendOTPEmail(email, otp, type)` (type = 'register' hoặc 'forgot').

#### [NEW] [otpService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/otpService.js)
- `generateOTP(email, type)`: Tạo ngẫu nhiên chuỗi 6 số, lưu vào Redis với key `otp:${type}:${email}` và TTL là 5 phút.
- `verifyOTP(email, type, otp)`: Kiểm tra mã OTP gửi lên với dữ liệu trong Redis. Nếu đúng thì xoá key Redis và trả về `true`.

#### [MODIFY] [userService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/userService.js)
- Cập nhật hàm `registerService` để nhận thêm `otp`, gọi `verifyOTP` trước khi tạo tài khoản.
- Bổ sung hàm `sendRegisterOTP(email)` (Kiểm tra email trùng lặp -> Tạo OTP -> Gửi mail).
- Bổ sung hàm `sendForgotPasswordOTP(email)` (Kiểm tra email tồn tại -> Tạo OTP -> Gửi mail).
- Bổ sung hàm `resetPasswordService(email, otp, newPassword)` (Kiểm tra OTP -> Hash mật khẩu mới -> Lưu DB).

### Controllers Layer
#### [MODIFY] [userController.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/controllers/userController.js)
Thêm các handler tương ứng: `handleSendRegisterOTP`, `handleSendForgotOTP`, `handleResetPassword`. Sửa đổi `register`.

### Routes & Middleware
#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)
Thêm các route:
- `POST /register/send-otp`
- `POST /forgot-password/send-otp`
- `POST /forgot-password`

#### [MODIFY] [auth.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/middleware/auth.js)
- Thêm `"/forgot-password"` vào biến `white_lists` để các request này không bị bắt kiểm tra JWT.

## Verification Plan

### Automated Tests
- Không có (do chưa cài đặt test framework).

### Manual Verification
1. **Đăng ký**: Gọi POST `/register/send-otp`, kiểm tra console và email xem có nhận được OTP không. Sau đó gọi POST `/register` với OTP đúng và OTP sai để test xác thực.
2. **Quên mật khẩu**: Gọi POST `/forgot-password/send-otp`, nhận OTP và gọi POST `/forgot-password` với mật khẩu mới. Đăng nhập lại với mật khẩu mới để kiểm chứng.
3. **Mã hết hạn**: Chờ quá 5 phút để đảm bảo OTP thực sự bị xoá khỏi Redis và không còn khả dụng.
