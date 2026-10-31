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
  approveCaregiver,
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

// Luồng Đăng ký trở thành Đối tác Caregiver (Nộp hồ sơ chờ phỏng vấn)
router.post(
  '/register-caregiver',
  verifyToken,
  checkAccountActive,
  registerCaregiver
);

// Phê duyệt hồ sơ đối tác Caregiver (Sau khi phỏng vấn thành công)
router.patch('/approve-caregiver/:caregiverProfileId', approveCaregiver);

module.exports = router;
