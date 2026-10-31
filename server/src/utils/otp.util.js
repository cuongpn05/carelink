const jwt = require('jsonwebtoken');
const sendEmail = require('./sendEmail');

/**
 * Sinh mã OTP ngẫu nhiên gồm các chữ số (mặc định 6 số)
 * @param {number} length
 * @returns {string}
 */
const generateOTP = (length = 6) => {
  let digits = '';
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
};

/**
 * Gửi email chứa mã OTP xác thực
 * @param {string} email
 * @param {string} otpCode
 * @param {string} purpose
 */
const sendOtpEmail = async (email, otpCode, purpose = 'Đăng ký tài khoản CareLink') => {
  const subject = `[CareLink] Mã xác thực OTP cho ${purpose}`;
  const text = `Mã xác thực CareLink của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`;

  console.log('\n====================================================');
  console.log(`[CareLink OTP Log] Gửi tới: ${email}`);
  console.log(`[CareLink OTP Log] Mục đích: ${purpose}`);
  console.log(`[CareLink OTP Log] 🔑 MÃ XÁC THỰC (OTP): ${otpCode}`);
  console.log('====================================================\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1d4ed8; margin: 0 0 6px 0; font-size: 26px;">CareLink</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">Chăm sóc tận tâm • Kết nối yêu thương</p>
      </div>

      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
          Xin chào bạn,
        </p>
        <p style="color: #334155; font-size: 14.5px; line-height: 1.6; margin: 0 0 20px 0;">
          Bạn vừa yêu cầu mã xác thực OTP để <strong>${purpose}</strong> trên hệ thống CareLink. Vui lòng sử dụng mã bên dưới để hoàn tất:
        </p>

        <div style="background-color: #eff6ff; border: 1px dashed #93c5fd; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; display: inline-block;">
            ${otpCode}
          </span>
        </div>

        <p style="color: #64748b; font-size: 13.5px; line-height: 1.5; margin: 0;">
          ⏰ Mã xác thực này có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} CareLink Platform. Mọi quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject, html, text });
  } catch (err) {
    console.error(`⚠️ [Nodemailer] Không thể gửi email tới ${email}:`, err.message);
    return { error: err.message, mock: true };
  }
};

/**
 * Sinh Access Token JWT
 * @param {Object} payload { accountId, role, status }
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'carelink_jwt_access_secret_key_2026_xyz';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Sinh Refresh Token JWT
 * @param {Object} payload { accountId }
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'carelink_jwt_refresh_secret_key_2026_abc';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Xác thực Refresh Token
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'carelink_jwt_refresh_secret_key_2026_abc';
  return jwt.verify(token, secret);
};

module.exports = {
  generateOTP,
  sendOtpEmail,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};

