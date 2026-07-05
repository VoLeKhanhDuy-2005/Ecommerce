require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, type) => {
  try {
    let subject = "";
    let htmlContent = "";

    if (type === "register") {
      subject = "Mã xác thực đăng ký tài khoản";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xác thực địa chỉ email</h2>
          <p>Chào bạn,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình đăng ký:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; text-align: center;">${otp}</h1>
          <p>Mã này sẽ hết hạn trong vòng 5 phút.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
      `;
    } else if (type === "forgot") {
      subject = "Mã xác thực lấy lại mật khẩu";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Yêu cầu lấy lại mật khẩu</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu lấy lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây để xác thực:</p>
          <h1 style="color: #FF5722; font-size: 32px; letter-spacing: 5px; text-align: center;">${otp}</h1>
          <p>Mã này sẽ hết hạn trong vòng 5 phút.</p>
          <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Hệ Thống" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
};
