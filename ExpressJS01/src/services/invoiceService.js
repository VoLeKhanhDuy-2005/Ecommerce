const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers)); // bind(buffers) tạo ra một function mới và cố định this = buffers
      // Mỗi khi doc phát ra một chunk dữ liệu, thêm chunk đó vào mảng buffers

      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Define fonts
      const regularFontPath = path.join(
        __dirname,
        "../assets/fonts/Roboto-Regular.ttf",
      );
      const boldFontPath = path.join(
        __dirname,
        "../assets/fonts/Roboto-Bold.ttf",
      );

      if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
        doc.registerFont("Roboto", regularFontPath);
        doc.registerFont("Roboto-Bold", boldFontPath);
        doc.font("Roboto");
      }

      const fontRegular = "Roboto";
      const fontBold = "Roboto-Bold";

      // --- Header ---
      doc
        .font(fontBold)
        .fontSize(20)
        .text("FOOD SHOP", { align: "center" })
        .moveDown(0.2);

      doc
        .font(fontRegular)
        .fontSize(10)
        .text("123 Đường Ẩm Thực, xã Bình Hưng, TP. HCM", { align: "center" })
        .text("Điện thoại: 0123 456 789", { align: "center" })
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(16)
        .text("HÓA ĐƠN MUA HÀNG", { align: "center" })
        .moveDown(1);

      // --- Order Info ---
      doc.font(fontRegular).fontSize(10);
      doc.text(`Mã đơn hàng: ${order._id}`);
      doc.text(
        `Ngày đặt: ${new Date(order.createdAt).toLocaleString("vi-VN")}`,
      );
      doc.text(`Phương thức thanh toán: ${order.paymentMethod}`);
      doc.text(
        `Trạng thái thanh toán: ${order.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}`,
      );
      doc.moveDown(0.5);

      // --- Customer Info ---
      doc.font(fontBold).text("Thông tin khách hàng:");
      doc.font(fontRegular);
      doc.text(`Họ tên: ${order.customerName}`);
      doc.text(`Điện thoại: ${order.phoneNumber}`);
      doc.text(`Địa chỉ giao hàng: ${order.shippingAddress}`);
      doc.moveDown(1);

      // --- Table Header ---
      const tableTop = doc.y;
      doc.font(fontBold);
      doc.text("Sản phẩm", 50, tableTop);
      doc.text("Số lượng", 300, tableTop);
      doc.text("Đơn giá", 350, tableTop, { width: 90, align: "right" });
      doc.text("Thành tiền", 450, tableTop, { width: 90, align: "right" });

      doc
        .moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke(); // vẽ đường kẻ ngang

      let itemY = doc.y + 10;
      doc.font(fontRegular);

      // --- Items ---
      let subtotal = 0;
      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        doc.text(item.name, 50, itemY, { width: 240 });
        doc.text(item.quantity.toString(), 300, itemY);
        doc.text(`${item.price.toLocaleString("vi-VN")} đ`, 350, itemY, {
          width: 90,
          align: "right",
        });
        doc.text(`${itemTotal.toLocaleString("vi-VN")} đ`, 450, itemY, {
          width: 90,
          align: "right",
        });
        itemY = doc.y + 5; // Move down based on the height of the current line
      });

      doc.moveTo(50, itemY).lineTo(550, itemY).stroke();

      let summaryY = itemY + 10;

      // --- Summary ---
      doc.font(fontRegular);
      doc.text("Tạm tính:", 350, summaryY, { width: 90, align: "right" });
      doc.text(`${subtotal.toLocaleString("vi-VN")} đ`, 450, summaryY, {
        width: 90,
        align: "right",
      });
      summaryY += 15;

      doc.text("Phí vận chuyển:", 350, summaryY, { width: 90, align: "right" });
      doc.text(
        `${order.shippingFee.toLocaleString("vi-VN")} đ`,
        450,
        summaryY,
        { width: 90, align: "right" },
      );
      summaryY += 15;

      if (order.discountAmount > 0) {
        doc.text("Giảm giá:", 350, summaryY, { width: 90, align: "right" });
        doc.text(
          `-${order.discountAmount.toLocaleString("vi-VN")} đ`,
          450,
          summaryY,
          { width: 90, align: "right" },
        );
        summaryY += 15;
      }

      doc.font(fontBold);
      doc.text("Tổng tiền:", 350, summaryY, { width: 90, align: "right" });
      doc.text(
        `${order.totalAmount.toLocaleString("vi-VN")} đ`,
        450,
        summaryY,
        { width: 90, align: "right" },
      );

      doc.moveDown(3);
      doc
        .font(fontRegular)
        .fontSize(10)
        .text("Cảm ơn quý khách, hẹn gặp lại!", 50, doc.y, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
