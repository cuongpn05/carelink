const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAdministrativeProvinces,
  getAdministrativeWards,
  changePassword,
  getReputationLogs,
} = require('../controllers/user.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

// Các route hành chính có thể xem mà không nhất thiết phải xác thực hoặc có xác thực
router.get('/administrative/provinces', getAdministrativeProvinces);
router.get('/administrative/wards', getAdministrativeWards);

// Tất cả các route thao tác tài khoản & sổ địa chỉ đều yêu cầu đăng nhập
router.use(verifyToken);

// 1. Hồ sơ cá nhân
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// 2. Sổ địa chỉ (Address Management)
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

// 3. Đổi mật khẩu
router.put('/change-password', changePassword);

// 4. Lịch sử điểm uy tín
router.get('/reputation-logs', getReputationLogs);

module.exports = router;
