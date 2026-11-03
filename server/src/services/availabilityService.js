const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CareRequest = require('../models/CareRequest');
const CaregiverProfile = require('../models/CaregiverProfile');

/**
 * Thu thập tất cả các ID liên kết của người chăm sóc (accountId, profileId, userId)
 * để đảm bảo query trùng khớp 100% dù đầu vào là bất kỳ ID nào.
 *
 * @param {string|mongoose.Types.ObjectId} caregiverId
 * @returns {Promise<mongoose.Types.ObjectId[]>}
 */
const resolveCaregiverIdentityIds = async (caregiverId) => {
  if (!caregiverId) return [];

  const rawId = caregiverId._id || caregiverId;
  const idList = [rawId];

  try {
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      const profile = await CaregiverProfile.findOne({
        $or: [
          { _id: rawId },
          { accountId: rawId },
          { userId: rawId },
        ],
      }).select('_id accountId userId').lean();

      if (profile) {
        if (profile._id) idList.push(profile._id);
        if (profile.accountId) idList.push(profile.accountId);
        if (profile.userId) idList.push(profile.userId);
      }
    }
  } catch (err) {
    console.warn('Lỗi khi phân giải danh tính caregiver:', err.message);
  }

  // Khử trùng lặp chuỗi ID
  const uniqueMap = new Map();
  idList.forEach((id) => {
    if (id) {
      uniqueMap.set(id.toString(), new mongoose.Types.ObjectId(id.toString()));
    }
  });

  return Array.from(uniqueMap.values());
};

/**
 * Tìm chi tiết xung đột lịch của Caregiver trên cả 2 Luồng:
 * - Luồng A: Booking trực tiếp (status: CONFIRMED, IN_PROGRESS)
 * - Luồng B: CareRequest mở trên Marketplace (status: ASSIGNED, ACCEPTED, IN_PROGRESS)
 *
 * Điều kiện giao thoa thời gian (Time Overlap):
 * startTime < newEndTime && endTime > newStartTime
 *
 * @param {string|mongoose.Types.ObjectId} caregiverId
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @param {Object} [options]
 * @param {string|mongoose.Types.ObjectId} [options.excludeBookingId] - Bỏ qua booking này (khi cập nhật hoặc xác nhận chính nó)
 * @param {string|mongoose.Types.ObjectId} [options.excludeCareRequestId] - Bỏ qua careRequest này (khi cập nhật chính nó)
 * @returns {Promise<{ isAvailable: boolean, conflictingBooking: Object|null, conflictingCareRequest: Object|null, reason?: string }>}
 */
const getCaregiverConflictDetails = async (caregiverId, startTime, endTime, options = {}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Thời gian startTime hoặc endTime không hợp lệ.');
  }

  if (start >= end) {
    throw new Error('Thời gian bắt đầu (startTime) phải trước thời gian kết thúc (endTime).');
  }

  const caregiverIds = await resolveCaregiverIdentityIds(caregiverId);
  if (caregiverIds.length === 0) {
    return {
      isAvailable: true,
      conflictingBooking: null,
      conflictingCareRequest: null,
    };
  }

  // 1. Bộ lọc cho Collection Booking
  const bookingFilter = {
    $or: [
      { caregiverId: { $in: caregiverIds } },
      { caregiverProfileId: { $in: caregiverIds } },
    ],
    status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };

  if (options.excludeBookingId) {
    bookingFilter._id = { $ne: options.excludeBookingId };
  }

  // 2. Bộ lọc cho Collection CareRequest
  const careRequestFilter = {
    $or: [
      { acceptedCaregiverId: { $in: caregiverIds } },
      { acceptedCaregiverProfileId: { $in: caregiverIds } },
    ],
    status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };

  if (options.excludeCareRequestId) {
    careRequestFilter._id = { $ne: options.excludeCareRequestId };
  }

  // 3. Quét đồng thời trên cả 2 Collection
  const [conflictingBooking, conflictingCareRequest] = await Promise.all([
    Booking.findOne(bookingFilter).select('_id startTime endTime status serviceAddress packageType').lean(),
    CareRequest.findOne(careRequestFilter).select('_id startTime endTime status title location schedule').lean(),
  ]);

  if (conflictingBooking) {
    return {
      isAvailable: false,
      conflictingBooking,
      conflictingCareRequest: null,
      reason: `Trùng với lịch đặt trực tiếp (Mã đơn: ${conflictingBooking._id}) từ ${new Date(conflictingBooking.startTime).toLocaleString('vi-VN')} đến ${new Date(conflictingBooking.endTime).toLocaleString('vi-VN')}`,
    };
  }

  if (conflictingCareRequest) {
    return {
      isAvailable: false,
      conflictingBooking: null,
      conflictingCareRequest,
      reason: `Trùng với yêu cầu chăm sóc trên bảng tin (Mã: ${conflictingCareRequest._id}) từ ${new Date(conflictingCareRequest.startTime).toLocaleString('vi-VN')} đến ${new Date(conflictingCareRequest.endTime).toLocaleString('vi-VN')}`,
    };
  }

  return {
    isAvailable: true,
    conflictingBooking: null,
    conflictingCareRequest: null,
  };
};

/**
 * Hàm kiểm tra rảnh lịch dùng chung (Availability Checker):
 * Trả về true nếu người chăm sóc rảnh hoàn toàn trên cả 2 luồng Booking và CareRequest,
 * trả về false nếu bị trùng bất kỳ ca nào.
 *
 * @param {string|mongoose.Types.ObjectId} caregiverId - ID của người chăm sóc (Account hoặc Profile)
 * @param {Date|string} startTime - Thời gian bắt đầu
 * @param {Date|string} endTime - Thời gian kết thúc
 * @param {Object} [options] - Tùy chọn bỏ qua ID ca đang xét
 * @param {string|mongoose.Types.ObjectId} [options.excludeBookingId]
 * @param {string|mongoose.Types.ObjectId} [options.excludeCareRequestId]
 * @returns {Promise<boolean>}
 */
const checkCaregiverAvailability = async (caregiverId, startTime, endTime, options = {}) => {
  const result = await getCaregiverConflictDetails(caregiverId, startTime, endTime, options);
  return result.isAvailable;
};

module.exports = {
  checkCaregiverAvailability,
  getCaregiverConflictDetails,
  resolveCaregiverIdentityIds,
};
