const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword,
  getReputationLogs,
} = require('../controllers/user.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

// Tất cả các route về user profile đều yêu cầu đăng nhập
router.use(verifyToken);

// 1. Lấy thông tin hồ sơ
router.get('/profile', getProfile);

// 2. Cập nhật thông tin hồ sơ
router.put('/profile', updateProfile);

// 3. Đổi mật khẩu
router.put('/change-password', changePassword);

// 4. Lịch sử điểm uy tín
router.get('/reputation-logs', getReputationLogs);

module.exports = router;
