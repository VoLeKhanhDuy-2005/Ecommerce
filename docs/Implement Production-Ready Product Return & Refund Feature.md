# Implement Production-Ready Product Return & Refund Feature

This plan outlines the architecture and implementation steps for a robust product return and refund feature. The feature allows users to request returns with valid reasons and proofs (images), and enables admins to review, approve/reject, and process refunds.

> **Database Schema Changes**
> Modify the `Order` model to track return statuses and reasons. Existing orders will not be affected, but any new order logic must account for these new statuses.

> **Financial & Inventory Rollbacks**
> When a return is completed, we will automatically restock the inventory and revert the user's earned coins. We need to decide how to handle refunds for MOMO payments.
>
> 1. **MoMo Refunds:** Integrate the official MoMo Refund API for automated money returns
> 2. **Vouchers:** If a user used a voucher on a returned order, the voucher should be given back to them
> 3. **Time Window:** During one hours after the `Delivered` status can a user request a return
> 4. **Partial Returns:** Support returning specific items in an order

## Changes

### Database Schema

#### [MODIFY] [order.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/order.js)

- Update `status` enum to include: `"Return Requested"`, `"Returned"`.
- Update `paymentStatus` enum to include: `"Refunded"`.
- Add new fields:
  - `returnReason`: `String` (Required if returned).
  - `returnImages`: `[String]` (Array of image URLs for proof).
  - `returnRejectedReason`: `String` (If admin rejects the return).
  - `returnRequestedAt`: `Date`.

### Backend Implementation

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)

- `POST /orders/:id/return` (User): Request a return with reason and images.
- `PUT /admin/orders/:id/return-action` (Admin): Approve or Reject the return request.
- `PUT /admin/orders/:id/return-complete` (Admin): Mark the return as completed, refund money, and restock.

#### [MODIFY] [orderController.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/controllers/orderController.js)

- Add controller methods to handle the new routes.
- Validate that user return requests only happen if `status === "Delivered"` and within the allowed time window.

#### [MODIFY] [orderService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/orderService.js)

- `requestReturn(orderId, userId, reason, files)`: Use `fileService.uploadFileToS3` to save proofs. Update order status.
- `handleReturnAction(orderId, action, rejectReason)`: Update status to `Returned` (if approved) or `Delivered` (if rejected). Send notification emails.
- `completeReturn(orderId)`:
  - Deduct `coinsEarned` from `user.coins`.
  - Update `paymentStatus` to `Refunded`.
  - (Optional) Call MoMo Refund API.

### Frontend Implementation (ReactJS01)

#### [MODIFY] [orders.jsx (User)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/orders.jsx)

- **UI Elements:**
  - Add "Yêu cầu hoàn trả" button for `Delivered` orders.
  - Create a `ReturnModal` with a form:
    - Reason selection (e.g., Lỗi sản phẩm, Giao sai hàng, Khác...).
    - File upload (Multi-image up to 3-5 images).
  - Display Return status and Admin's rejection reason if applicable.

#### [MODIFY] [orders.jsx (Admin)](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/admin/orders.jsx)

- **UI Elements:**
  - Add a "Returns" tab or filter to easily find orders requesting returns.
  - In order details: Show `returnReason` and click to view `returnImages`.
  - Add Action Buttons: "Chấp nhận hoàn trả", "Từ chối hoàn trả" (prompts for reason).
  - Add "Hoàn tất Hoàn tiền" button for `Return Requested` orders.

## Verification Plan

### Automated/Unit Tests

- Can add unit tests for `orderService.js` return logic later.

### Manual Verification

1. **User Flow:** Order a product, wait for delivery, then request a return with images. Verify S3 image uploads.
2. **Admin Flow:** View the return request, test rejecting it (user sees rejection reason). Test approving it.
3. **Completion Flow:** Complete the return and verify that inventory is restocked and user coins/balance are correctly adjusted.
