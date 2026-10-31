const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
} = require('../controllers/bookingController');
const {
  verifyToken,
  checkAccountActive,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

router.use(verifyToken, checkAccountActive);
router.post('/', authorizeRoles('CUSTOMER'), createBooking);
router.get('/mine', getMyBookings);
router.get('/:id', getBookingById);

module.exports = router;
