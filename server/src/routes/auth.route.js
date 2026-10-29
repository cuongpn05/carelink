const express = require('express');
const router = express.Router();

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  registerCaregiver,
  getMe,
  refreshToken,
} = require('../controllers/auth.controller');

const {
  verifyToken,
  checkAccountActive,
} = require('../middlewares/auth.middleware');

// Luồng Đăng ký & Xác thực OTP
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Luồng Đăng nhập, Đăng xuất & Refresh Token
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyToken, logout);

// Lấy thông tin tài khoản đang đăng nhập
router.get('/me', verifyToken, getMe);

// Luồng Đăng ký trở thành Cộng tác viên (Caregiver)
router.post(
  '/register-caregiver',
  verifyToken,
  checkAccountActive,
  registerCaregiver
);

module.exports = router;

