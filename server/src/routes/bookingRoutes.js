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
} = require('../controllers/bookingController');
const {
  verifyToken,
  checkAccountActive,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

router.use(verifyToken, checkAccountActive);
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

module.exports = router;
