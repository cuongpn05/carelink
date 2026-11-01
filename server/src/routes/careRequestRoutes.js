const express = require('express');
const router = express.Router();

const {
  createCareRequest,
  getMyCareRequests,
  getOpenCareRequests,
  getCareRequestById,
  acceptCareRequest,
  cancelCareRequest,
  updateCareRequestStatus,
  getCustomerCareRequestNotifications,
  markCustomerCareRequestNotificationRead,
} = require('../controllers/careRequestController');

const {
  verifyToken,
  checkAccountActive,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

// Áp dụng xác thực cho toàn bộ các endpoint của Care Request
router.use(verifyToken, checkAccountActive);

// 1. Customer: Đăng yêu cầu chăm sóc mới
router.post('/', authorizeRoles('CUSTOMER'), createCareRequest);

// 2. Customer: Lấy danh sách yêu cầu của bản thân
router.get('/mine', authorizeRoles('CUSTOMER'), getMyCareRequests);

// 3. Customer: Lấy thông báo khi có Caregiver nhận việc
router.get('/notifications', authorizeRoles('CUSTOMER'), getCustomerCareRequestNotifications);
router.patch('/notifications/:id/read', authorizeRoles('CUSTOMER'), markCustomerCareRequestNotificationRead);

// 4. Caregiver: Bảng tin yêu cầu mở (Marketplace)
router.get('/open', authorizeRoles('CAREGIVER', 'ADMIN', 'CUSTOMER'), getOpenCareRequests);

// 5. Chi tiết một yêu cầu
router.get('/:id', getCareRequestById);

// 6. Caregiver: Tiếp nhận yêu cầu chăm sóc (Atomic conditional update)
router.patch('/:id/accept', authorizeRoles('CAREGIVER'), acceptCareRequest);

// 7. Customer: Hủy yêu cầu khi còn trạng thái OPEN
router.patch('/:id/cancel', authorizeRoles('CUSTOMER'), cancelCareRequest);

// 8. Cập nhật trạng thái tiến độ (IN_PROGRESS, COMPLETED)
router.patch('/:id/status', updateCareRequestStatus);

module.exports = router;
