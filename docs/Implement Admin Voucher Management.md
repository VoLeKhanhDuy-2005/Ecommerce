# Implement Voucher Management for Admin

This section will add functionality for Admin accounts to view, create, edit, and disable Vouchers (discount codes, gifts) in the system.

## Proposed Changes

### Backend (NodeJS/Express)

1. Update **`voucherController.js`** & **`voucherService.js`**:

- Add feature to **Get all Vouchers list** (including expired or inactive vouchers) for admin.
- Add feature to **Update Voucher**.
- Add feature to **Disable Voucher**.

2. Update **`src/routes/api.js`**:

- Add routes: `GET /admin/vouchers`, `PUT /admin/vouchers/:id`, `DELETE /admin/vouchers/:id`.

### Frontend (ReactJS)

1. Update **`ReactJS01/src/util/api.js`**:

- Declare APIs to fetch all vouchers list, edit and disable vouchers for admin.

2. Create new file **`ReactJS01/src/pages/admin/vouchers.jsx`**:

- A table interface displaying existing vouchers (similar to category or product management).
- Modal form to create and edit voucher fields (`title`, `code`, `type`, `value`, `minOrderValue`, `maxDiscountAmount`, `costInCoins`, `expirationDate`, `isActive`).

3. Update **`ReactJS01/src/components/layout/adminLayout.jsx`**:

- Add `Voucher Management` link to the Admin Sidebar navigation bar.

4. Update routing in **`ReactJS01/src/main.jsx`**:

- Add route configuration for `/admin/vouchers`.

## Test Plan

- Log in with an admin account and access the "Voucher Management" menu.
- Try creating, editing, and disabling vouchers with different promotion types.
- Switch to a regular user account to verify that changes appear correctly in the Rewards Redemption section.
