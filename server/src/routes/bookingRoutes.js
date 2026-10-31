const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getCustomerBookings,
  getCustomerBookingNotifications,
  markCustomerBookingNotificationRead,
  getIncomingCaregiverBookings,
  confirmCaregiverBooking,
  rejectCaregiverBooking,
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
router.get('/incoming', getIncomingCaregiverBookings);
router.patch('/:id/confirm', confirmCaregiverBooking);
router.patch('/:id/reject', rejectCaregiverBooking);
router.get('/mine', getMyBookings);
router.get('/customer', authorizeRoles('CUSTOMER'), getCustomerBookings);
router.get('/notifications', authorizeRoles('CUSTOMER'), getCustomerBookingNotifications);
router.patch(
  '/notifications/:id/read',
  authorizeRoles('CUSTOMER'),
  markCustomerBookingNotificationRead,
);
router.get('/:id', getBookingById);

// Hủy lịch theo quy tắc & phạt uy tín
router.patch('/:id/cancel', cancelBooking);

// Cập nhật trạng thái vòng đời lịch (CONFIRMED, IN_PROGRESS, COMPLETED)
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
