const nodemailer = require('nodemailer');

/**
 * Tạo transporter nodemailer dựa trên cấu hình môi trường (.env)
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;

  // Nếu chưa cấu hình email thật hoặc đang dùng giá trị mẫu
  const isMockConfig =
    !user ||
    !pass ||
    user.includes('your_email') ||
    pass.includes('your_app_password');

  if (isMockConfig) {
    return null;
  }

  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: { user, pass },
  });
};

/**
 * Gửi email chung
 * @param {Object} options { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  // Chế độ dự phòng khi chạy local / dev mà chưa cấu hình SMTP
  if (!transporter) {
    console.log('====================================================');
    console.log(`[CareLink Mock Mailer] Gửi tới: ${to}`);
    console.log(`[CareLink Mock Mailer] Tiêu đề: ${subject}`);
    if (text) console.log(`[CareLink Mock Mailer] Nội dung: ${text}`);
    console.log('====================================================');
    return { mock: true, success: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"CareLink" <no-reply@carelink.vn>',
    to,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

