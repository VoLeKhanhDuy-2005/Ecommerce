# Implement Voucher System (Accumulate Coins & Redeem)

Implement a voucher/reward system where users accumulate coins (xu) from completed orders and can redeem them for various types of vouchers (discount, free shipping, free items). The system will be reusable and optimized.

> The logic for earning coins: 1 coin for every 10,000 VND spent (after discounts) when an order is successfully delivered.
> Vouchers have an expiration date
> For "Free Item" vouchers, allow admins to specify which item
> Max 1 voucher per order for simplicity

## Proposed Changes

### Database Models

#### [MODIFY] [user.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/user.js)

- Add `coins` field (Number, default 0).

#### [MODIFY] [order.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/order.js)

- Add `voucherApplied` (ObjectId, ref `voucher`, optional).
- Add `discountAmount` (Number, default 0).
- Add `coinsEarned` (Number, default 0).

#### [NEW] [voucher.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/voucher.js)

- Fields: `code`, `type` (DISCOUNT_AMOUNT, DISCOUNT_PERCENT, FREE_SHIP, FREE_ITEM), `value`, `costInCoins`, `isActive`, `minOrderValue`, `maxDiscountAmount`.

#### [NEW] [userVoucher.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/models/userVoucher.js)

- Track which user redeemed which voucher.
- Fields: `userEmail` (String), `voucher` (ObjectId), `isUsed` (Boolean, default false).

---

### Backend Services & Controllers

#### [NEW] [voucherController.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/controllers/voucherController.js)

- APIs for: List active vouchers, Redeem voucher with coins, Get my vouchers.

#### [NEW] [voucherService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/voucherService.js)

- Logic for redeeming vouchers (check coin balance, deduct coins, create `userVoucher`).

#### [MODIFY] [orderService.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/services/orderService.js)

- `createOrder`: Calculate discount based on `userVoucherId`, validate voucher, mark `userVoucher` as used.
- `markOrderAsReceived`: Calculate `coinsEarned` and add to User's `coins` balance.
- `cancelOrder`: If cancelled, refund `userVoucher`.

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/routes/api.js)

- Add routes for vouchers (e.g., `GET /vouchers`, `POST /vouchers/redeem`, `GET /my-vouchers`).

---

### Frontend Components

#### [NEW] [RewardsPage.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/rewards.jsx)

- A new page for users to view their coin balance and available vouchers to redeem.
- Modern, dynamic design with animations for redeeming coins.

#### [MODIFY] [cart.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/pages/user/cart.jsx)

- Add a "Select Voucher" section in Step 2.
- Fetch user's unused vouchers and allow applying one to the order.
- Update total calculations to display the discount dynamically.

#### [MODIFY] [api.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/util/api.js)

- Add frontend API methods for vouchers.

## Verification Plan

### Manual Verification

1. User logs in, has 0 coins.
2. User places an order for 100k VND, receives order -> User gets 10 coins.
3. Admin creates a voucher (cost: 10 coins, type: DISCOUNT_AMOUNT, value: 20000).
4. User goes to Rewards page, redeems 10 coins for the voucher. Coin balance -> 0.
5. User goes to cart, applies the voucher, total price decreases by 20k.
6. Order placed successfully, voucher is marked as used.
