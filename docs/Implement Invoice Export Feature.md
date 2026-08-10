# Implement Invoice Export Feature

This plan covers the implementation of a production-ready "Export Invoice" feature for orders.

## Changes

### Backend (ExpressJS01)

- **Install `pdfkit`**: Run `npm install pdfkit` in `ExpressJS01` to generate PDF documents.

#### [NEW] `ExpressJS01/src/services/invoiceService.js`

- Create a new service dedicated to invoice generation (`generateInvoicePDF`).
- It will accept an `Order` object and return a PDF buffer or stream.
- The invoice will include:
  - Shop info (Food Shop)
  - Order Info (ID, Date)
  - Customer Info (Name, Phone, Address)
  - Items list with Quantity, Price, Subtotal
  - Summary: Subtotal, Shipping Fee, Discount, Final Total
  - Payment Status & Method

#### [MODIFY] `ExpressJS01/src/controllers/orderController.js`

- Add a new controller method `exportInvoice` that fetches the order details, verifies permissions (user owns the order or admin), and calls `invoiceService.generateInvoicePDF`.
- It will set the response headers for downloading a file: `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="invoice-<orderId>.pdf"`.

#### [MODIFY] `ExpressJS01/src/routes/api.js`

- Add a new route `GET /v1/orders/:id/invoice` handled by `orderController.exportInvoice`.

### Frontend (ReactJS01)

#### [MODIFY] `ReactJS01/src/pages/admin/orders.jsx`

- Add a button "Xuất Hóa Đơn" in the admin order actions.
- Call the API endpoint and trigger file download using standard blob handling.

#### [MODIFY] `ReactJS01/src/pages/user/orders.jsx`

- (Optional) Add a button "Xuất Hóa Đơn" for the user to download their own invoice.

## Verification Plan

### Manual Verification

- Start the server and client.
- Go to Admin Orders or User Orders.
- Click "Xuất hóa đơn" and verify the downloaded PDF file opens correctly and displays accurate information (items, total, shipping fee, etc.).
