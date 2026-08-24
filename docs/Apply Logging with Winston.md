# Áp dụng Application Logging với Winston

Bản kế hoạch này nhằm nâng cấp hệ thống ghi log của ứng dụng từ việc dùng `console.log`/`console.error` nguyên thủy sang dùng thư viện **Winston** chuyên nghiệp.

## Lợi ích
- **Phân loại Log rõ ràng**: Có các cấp độ như `info`, `warn`, `error` để dễ filter.
- **Lưu trữ lâu dài**: Log không chỉ in ra màn hình console tạm thời, mà còn được tự động ghi vào các file (ví dụ `logs/application-2026-08-24.log`) bằng cơ chế Daily Rotate File.
- **Định dạng chuẩn hóa**: Format dạng JSON giúp dễ dàng đọc và tích hợp với các hệ thống phân tích Log lớn (như Datadog, ELK stack) sau này.

## Proposed Changes

### 1. Cài đặt thư viện mới
Cài đặt `winston` và `winston-daily-rotate-file`:
`npm install winston winston-daily-rotate-file`

### 2. [NEW] [backend/src/utils/logger.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/backend/src/utils/logger.js)
Tạo file cấu hình Winston trung tâm:
- Định dạng log chứa Timestamp, Level và Message.
- Tạo 2 stream: In ra Console (giúp debug trên local) và Ghi ra file `logs/application-%DATE%.log`, `logs/error-%DATE%.log` (xoay vòng mỗi ngày, giữ tối đa 14 ngày).

## Verification Plan
### Manual Verification
- Chạy ứng dụng `npm run dev`.
- Mở thư mục `backend/logs/`, bạn sẽ thấy file mới có dạng `application-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`.
- Khi server khởi động hoặc có lỗi xảy ra, Log sẽ hiển thị đẹp mắt trên terminal với màu sắc phân biệt `[INFO]` hoặc `[ERROR]`, kèm theo mốc thời gian chi tiết.
