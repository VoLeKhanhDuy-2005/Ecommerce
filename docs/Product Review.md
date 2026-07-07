# Tính năng Đánh giá sản phẩm

Tính năng này cho phép người dùng đã đăng nhập có thể đánh giá (từ 1 đến 5 sao) và để lại bình luận cho các sản phẩm. Điểm số trung bình (rating) của sản phẩm sẽ được tự động tính toán lại và cập nhật dựa trên các đánh giá.

> Cần đảm bảo rằng mỗi người dùng chỉ có thể đánh giá một sản phẩm tối đa một lần để tránh spam. Nếu họ đánh giá lại, hệ thống sẽ cập nhật (ghi đè) đánh giá cũ của họ

> middleware `auth` đảm bảo API tạo đánh giá (`POST /products/:id/reviews`) bắt buộc phải có token đăng nhập, trong khi API lấy danh sách đánh giá (`GET /products/:id/reviews`) thì ai cũng có thể xem.

## Proposed Changes

### Backend (ExpressJS)

#### [NEW] `ExpressJS01/src/models/review.js`

Tạo model `Review` với các trường:

- `user`: ObjectId tham chiếu đến bảng `user`
- `product`: ObjectId tham chiếu đến bảng `product`
- `rating`: Number (1-5)
- `comment`: String
- Index unique cho cặp `(user, product)` để mỗi người dùng chỉ đánh giá 1 lần cho mỗi sản phẩm.

#### [MODIFY] `ExpressJS01/src/models/product.js`

- Giữ nguyên trường `rating`.
- Thêm trường `reviewCount` (số lượng đánh giá) với mặc định là `0` để hiển thị trên UI.

#### [NEW] `ExpressJS01/src/services/reviewService.js`

Tạo logic xử lý nghiệp vụ:

- Lấy danh sách đánh giá của sản phẩm kèm thông tin người dùng (tên, avatar).
- Thêm mới hoặc cập nhật đánh giá (Upsert).
- Tính toán và cập nhật lại `rating` và `reviewCount` cho bảng Product mỗi khi có thay đổi đánh giá.

#### [NEW] `ExpressJS01/src/controllers/reviewController.js`

- Xử lý request lấy danh sách bình luận (`getProductReviews`).
- Xử lý request gửi bình luận (`addReview`).

#### [MODIFY] `ExpressJS01/src/routes/api.js`

Thêm các route:

- `GET /products/:id/reviews`: Lấy danh sách đánh giá.
- `POST /products/:id/reviews`: Gửi đánh giá.

#### [MODIFY] `ExpressJS01/src/middleware/auth.js`

- Cập nhật lại logic whitelist cho `/products` để phân biệt rõ `GET` thì không cần auth, nhưng `POST` (như tạo đánh giá) thì bắt buộc phải có auth.

---

### Frontend (ReactJS)

#### [MODIFY] `ReactJS01/src/util/api.js`

Thêm các API call:

- `getProductReviewsApi(productId)`
- `submitReviewApi(productId, rating, comment)`

#### [NEW] `ReactJS01/src/components/product/ProductReviews.jsx`

Tạo component hiển thị khu vực đánh giá, bao gồm:

- Danh sách các bình luận hiện tại.
- Form cho phép người dùng chọn sao và nhập bình luận (chỉ hiển thị nếu đã đăng nhập).

#### [MODIFY] `ReactJS01/src/pages/productDetail.jsx`

- Nhúng component `ProductReviews` vào giao diện chi tiết sản phẩm.
- Hiển thị số lượng đánh giá (`reviewCount`) cạnh số sao trung bình trên khối thông tin chính.

### Manual Verification

1.  Đăng nhập bằng một tài khoản bất kỳ.
2.  Truy cập trang chi tiết sản phẩm.
3.  Viết đánh giá với số sao và bình luận, sau đó ấn Gửi.
4.  Xác minh bình luận mới xuất hiện trong danh sách.
5.  Xác minh số điểm trung bình của sản phẩm được cập nhật theo trung bình cộng.
6.  Đăng xuất và kiểm tra xem danh sách bình luận vẫn hiển thị (nhưng không được phép bình luận).
