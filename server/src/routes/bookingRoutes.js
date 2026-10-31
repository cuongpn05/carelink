const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
} = require('../controllers/bookingController');
const {
  verifyToken,
  checkAccountActive,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

router.use(verifyToken, checkAccountActive);

// Tạo lịch đặt (Chỉ dành cho vai trò CUSTOMER)
router.post('/', authorizeRoles('CUSTOMER'), createBooking);

// Lấy danh sách lịch đặt của tài khoản hiện tại (Khách hàng hoặc CTV)
router.get('/mine', getMyBookings);

// Lấy chi tiết lịch đặt
router.get('/:id', getBookingById);

// Hủy lịch theo quy tắc & phạt uy tín
router.patch('/:id/cancel', cancelBooking);

// Cập nhật trạng thái vòng đời lịch (CONFIRMED, IN_PROGRESS, COMPLETED)
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
