# Unit Tests cho CRUD Product và Category

Bộ Unit Test tự động cho các luồng hoạt động Create, Read, Update và Delete của sản phẩm (phía Admin) và danh mục.

## Các thay đổi chính

Hai bộ Test Suites mới đã được bổ sung và cấu hình sử dụng Jest:

### 1. Admin Product Controller Tests

- **File**: `ExpressJS01/src/tests/adminProductController.test.js`
- **Mocks**: Đã giả lập (mock) toàn bộ database `Product` (Mongoose) và dịch vụ file `fileService` (S3).
- **Test cases đã bao phủ**:
  - `getAllProducts`: Kiểm tra lấy danh sách thành công và đính kèm presigned URLs hợp lệ. Kiểm tra phản hồi lỗi 500 khi server/database gặp sự cố.
  - `createProduct`: Trả về lỗi 400 nếu thiếu dữ liệu đầu vào hoặc thiếu ảnh. Xử lý thành công việc tạo sản phẩm mới và gọi hàm upload S3.
  - `updateProduct`: Trả về lỗi 404 nếu không tồn tại sản phẩm. Xử lý luồng thành công trong các trường hợp: (1) Cập nhật thông tin cơ bản giữ nguyên ảnh; (2) Xóa bớt ảnh và tải ảnh mới lên (đảm bảo hàm xóa ảnh S3 được gọi chính xác số lần).
  - `deleteProduct`: Xóa sản phẩm và đồng thời tự động xóa tất cả ảnh liên quan trên S3 bucket.

### 2. Admin Category Controller Tests

- **File**: `ExpressJS01/src/tests/categoryController.test.js`
- **Mocks**: Đã mock các models `Category`, `Product` (để đếm sản phẩm) và dịch vụ `fileService`.
- **Test cases đã bao phủ**:
  - `createCategory`: Xác thực chống trùng mã danh mục (`categoryId`). Xử lý upload ảnh danh mục mới vào S3 thành công.
  - `getAllCategories`: Kiểm tra lấy danh sách kết hợp với presigned URL.
  - `updateCategory`: Xử lý cập nhật thông tin và cập nhật hình ảnh danh mục khi tải ảnh mới.
  - `deleteCategory`: **Quan trọng** - Đảm bảo rằng hệ thống sẽ chặn hành động xóa (trả về lỗi 400) nếu vẫn còn sản phẩm đang thuộc danh mục đó, và chỉ cho phép xóa thành công nếu danh mục đang trống.

## Kết quả kiểm thử

Tất cả các Test Suites (bao gồm cả suite hiện tại và 2 suites vừa mới tạo) đều chạy qua thành công (`PASS`).
Tổng số test cases đã được thực thi và xác nhận: **22/22 (Passed)**.

Có thể tự chạy lại bộ test trên terminal bất cứ lúc nào bằng lệnh:

```bash
cd ExpressJS01
npm test
```
