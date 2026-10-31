const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CaregiverProfile = require('../models/CaregiverProfile');
const User = require('../models/User');
const Account = require('../models/Account');
const ReputationLog = require('../models/ReputationLog');
const { calculateBookingDetails } = require('../utils/booking.util');

/**
 * Helper gắn thông tin hồ sơ của Người chăm sóc và Khách hàng vào Booking
 * Ẩn số điện thoại khi đơn còn PENDING và mở khóa khi CONFIRMED/IN_PROGRESS/COMPLETED
 */
const enrichBooking = async (bookingDoc, requesterAccountId) => {
  const b = bookingDoc.toObject ? bookingDoc.toObject() : { ...bookingDoc };
  const reqIdStr = requesterAccountId ? requesterAccountId.toString() : '';

  // 1. Thông tin Người chăm sóc
  if (b.caregiverId) {
    const caregiverUser = await User.findOne({ accountId: b.caregiverId });
    const caregiverProfile = await CaregiverProfile.findOne({ accountId: b.caregiverId });
    const caregiverAccount = await Account.findById(b.caregiverId).select('reputationScore status');

    const canSeeCaregiverPhone =
      ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status) ||
      reqIdStr === b.caregiverId.toString();

    b.caregiver = {
      accountId: b.caregiverId,
      fullName: caregiverProfile?.fullName || caregiverUser?.fullName || 'Người chăm sóc CareLink',
      avatarUrl: caregiverProfile?.avatarUrl || caregiverUser?.avatarUrl || '',
      phone: canSeeCaregiverPhone
        ? caregiverProfile?.phone || caregiverUser?.phone || ''
        : '09******** (Mở khi nhận việc)',
      isPhoneRevealed: canSeeCaregiverPhone,
      ratingAvg: caregiverProfile?.ratingAvg || 5.0,
      totalReviews: caregiverProfile?.totalReviews || 0,
      experienceYears: caregiverProfile?.experienceYears || 0,
      serviceAreas: caregiverProfile?.serviceAreas || [],
      reputationScore: caregiverAccount?.reputationScore !== undefined ? caregiverAccount.reputationScore : 100,
    };
  }

  // 2. Thông tin Khách hàng
  if (b.customerId) {
    const customerUser = await User.findOne({ accountId: b.customerId });
    const customerAccount = await Account.findById(b.customerId).select('email reputationScore status');

    const canSeeCustomerPhone =
      ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status) ||
      reqIdStr === b.customerId.toString();

    const customerReputation = customerAccount?.reputationScore !== undefined ? customerAccount.reputationScore : 100;

    b.customer = {
      accountId: b.customerId,
      fullName: customerUser?.fullName || 'Khách hàng CareLink',
      avatarUrl: customerUser?.avatarUrl || '',
      phone: canSeeCustomerPhone
        ? customerUser?.phone || ''
        : '09******** (Mở khi nhận việc)',
      isPhoneRevealed: canSeeCustomerPhone,
      email: customerAccount?.email || '',
      reputationScore: customerReputation,
      status: customerAccount?.status || 'ACTIVE',
      isLowReputation: customerReputation < 60,
    };
  }

  return b;
};

/**
 * Tạo lịch đặt chăm sóc mới
 */
const createBooking = async (req, res) => {
  try {
    const {
      caregiverId,
      packageType,
      durationValue,
      startTime,
      serviceArea,
      serviceAddress,
      preferredGender,
      requiredSkills,
      note,
      paymentMethod,
    } = req.body;

    if (!caregiverId || !serviceArea || !serviceAddress || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp caregiverId, startTime, serviceArea và serviceAddress.',
      });
    }

    if (!mongoose.isValidObjectId(caregiverId)) {
      return res.status(400).json({
        success: false,
        message: 'caregiverId không hợp lệ.',
      });
    }

    if (
      typeof serviceArea !== 'string' ||
      typeof serviceAddress !== 'string' ||
      !serviceArea.trim() ||
      !serviceAddress.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'serviceArea và serviceAddress không được để trống.',
      });
    }

    if (
      requiredSkills !== undefined &&
      (!Array.isArray(requiredSkills) ||
        requiredSkills.some((skill) => typeof skill !== 'string'))
    ) {
      return res.status(400).json({
        success: false,
        message: 'requiredSkills phải là danh sách các chuỗi.',
      });
    }

    const caregiver = await CaregiverProfile.findOne({
      $or: [{ _id: caregiverId }, { accountId: caregiverId }],
    });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người chăm sóc.',
      });
    }

    const isApproved =
      caregiver.approvalStatus === 'APPROVED' ||
      caregiver.get('verificationStatus') === 'VERIFIED';

    if (!isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Người chăm sóc chưa được duyệt nhận lịch.',
      });
    }

    let caregiverAccountId = caregiver.accountId;
    if (!caregiverAccountId && caregiver.userId) {
      const caregiverUser = await User.findById(caregiver.userId).select('accountId');
      caregiverAccountId = caregiverUser?.accountId;
    }

    if (!caregiverAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Hồ sơ người chăm sóc chưa liên kết tài khoản. Vui lòng liên hệ quản trị viên.',
      });
    }

    if (!caregiver.accountId) {
      caregiver.accountId = caregiverAccountId;
      await caregiver.save();
    }

    if (caregiverAccountId.toString() === req.account._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự đặt lịch cho chính mình.',
      });
    }

    let bookingDetails;
    try {
      bookingDetails = calculateBookingDetails({
        startTime,
        packageType,
        durationValue: Number(durationValue),
        pricing: {
          hourlyRate: caregiver.pricing?.hourlyRate ?? caregiver.get('hourlyRate'),
          dailyRate: caregiver.pricing?.dailyRate ?? caregiver.get('dailyRate'),
          weeklyRate: caregiver.pricing?.weeklyRate ?? caregiver.get('weeklyRate'),
          monthlyRate: caregiver.pricing?.monthlyRate ?? caregiver.get('monthlyRate'),
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (bookingDetails.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu phải nằm trong tương lai.',
      });
    }

    const overlappingBooking = await Booking.findOne({
      caregiverId: caregiverAccountId,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      startTime: { $lt: bookingDetails.endTime },
      endTime: { $gt: bookingDetails.startTime },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Người chăm sóc đã có lịch trong khoảng thời gian này.',
      });
    }

    const booking = await Booking.create({
      customerId: req.account._id,
      caregiverId: caregiverAccountId,
      bookingType: 'DIRECT',
      packageType,
      durationValue: Number(durationValue),
      ...bookingDetails,
      serviceArea: serviceArea.trim(),
      serviceAddress: serviceAddress.trim(),
      preferredGender,
      requiredSkills,
      note,
      paymentMethod,
    });

    const enriched = await enrichBooking(booking, req.account._id);

    return res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công.',
      data: enriched,
    });
  } catch (error) {
    console.error('createBooking error:', error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo lịch đặt.',
    });
  }
};

/**
 * Lấy danh sách lịch đặt của tài khoản hiện tại (Khách hàng hoặc Người chăm sóc)
 */
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { customerId: req.account._id },
        { caregiverId: req.account._id },
      ],
    }).sort({ createdAt: -1 });

    const enrichedBookings = await Promise.all(
      bookings.map((b) => enrichBooking(b, req.account._id))
    );

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch đặt thành công.',
      data: enrichedBookings,
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch đặt.',
    });
  }
};

/**
 * Lấy chi tiết một lịch đặt theo ID
 */
const getBookingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã lịch đặt không hợp lệ.',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (
      !booking ||
      (booking.customerId.toString() !== req.account._id.toString() &&
        booking.caregiverId?.toString() !== req.account._id.toString() &&
        req.account.role !== 'ADMIN')
    ) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt.',
      });
    }

    const enriched = await enrichBooking(booking, req.account._id);

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin lịch đặt thành công.',
      data: enriched,
    });
  } catch (error) {
    console.error('getBookingById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin lịch đặt.',
    });
  }
};

/**
 * Hủy lịch đặt theo quy tắc & trừ điểm uy tín (Reputation Penalty)
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã lịch đặt không hợp lệ.',
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do hủy lịch rõ ràng (tối thiểu 3 ký tự).',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt.',
      });
    }

    const currentAccountIdStr = req.account._id.toString();
    const isCustomer = booking.customerId?.toString() === currentAccountIdStr;
    const isCaregiver = booking.caregiverId?.toString() === currentAccountIdStr;

    if (!isCustomer && !isCaregiver && req.account.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên lịch đặt này.',
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Lịch đặt này đã được hủy trước đó.',
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Ca làm việc đã hoàn thành, không thể hủy lịch.',
      });
    }

    if (booking.status === 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Ca làm việc đang diễn ra, không thể hủy ngang trực tiếp. Vui lòng liên hệ hỗ trợ viên.',
      });
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const diffMs = startTime.getTime() - now.getTime();
    const hoursUntilStart = diffMs / (1000 * 60 * 60);

    let penalty = 0;
    let ruleExplanation = '';

    if (booking.status === 'PENDING') {
      // Đơn đang chờ xác nhận: Không trừ điểm uy tín
      penalty = 0;
      ruleExplanation = 'Hủy đơn đang chờ xác nhận: Miễn trừ điểm uy tín (0 điểm).';
    } else if (booking.status === 'CONFIRMED') {
      if (isCustomer) {
        // Khách hàng hủy lịch đã xác nhận
        if (hoursUntilStart < 2) {
          penalty = 15;
          ruleExplanation = 'Khách hủy sát giờ hẹn (< 2 giờ): Trừ 15 điểm uy tín.';
        } else {
          penalty = 5;
          ruleExplanation = 'Khách hủy trước giờ hẹn: Trừ 5 điểm uy tín.';
        }
      } else if (isCaregiver) {
        // Cộng tác viên hủy lịch đã nhận
        if (hoursUntilStart < 12) {
          penalty = 15;
          ruleExplanation = 'Người chăm sóc hủy sát giờ hẹn (< 12 giờ): Trừ 15 điểm uy tín.';
        } else {
          penalty = 5;
          ruleExplanation = 'Người chăm sóc hủy trước giờ hẹn >= 12 giờ: Trừ 5 điểm uy tín.';
        }
      }
    }

    let updatedReputationScore = req.account.reputationScore !== undefined ? req.account.reputationScore : 100;
    if (penalty > 0) {
      const prevScore = updatedReputationScore;
      updatedReputationScore = Math.max(0, prevScore - penalty);
      req.account.reputationScore = updatedReputationScore;
      await req.account.save();

      // Ghi log vào ReputationLog
      await ReputationLog.create({
        accountId: req.account._id,
        bookingId: booking._id,
        changeAmount: -penalty,
        previousScore: prevScore,
        newScore: updatedReputationScore,
        reason: `Hủy lịch ca ${booking.packageType} #${booking._id.toString().slice(-6)}: ${reason.trim()} (${ruleExplanation})`,
        createdAt: now,
      });

      // Nếu người hủy là caregiver -> trừ thêm priorityScore trong CaregiverProfile để đẩy tụt thứ hạng tìm kiếm
      if (isCaregiver) {
        await CaregiverProfile.findOneAndUpdate(
          { accountId: req.account._id },
          { $inc: { priorityScore: -penalty } }
        );
      }
    }

    // Cập nhật trạng thái Booking
    booking.status = 'CANCELLED';
    booking.cancellationInfo = {
      cancelledBy: req.account._id,
      cancelledByRole: isCustomer ? 'CUSTOMER' : 'CAREGIVER',
      reason: reason.trim(),
      cancelledAt: now,
      penaltyPointsDeducted: penalty,
    };
    await booking.save();

    const enriched = await enrichBooking(booking, req.account._id);

    return res.status(200).json({
      success: true,
      message: penalty > 0
        ? `Đã hủy lịch thành công. Do hủy theo quy tắc, bạn bị trừ ${penalty} điểm uy tín.`
        : 'Đã hủy lịch thành công. Bạn không bị trừ điểm uy tín.',
      data: {
        booking: enriched,
        penaltyDeducted: penalty,
        currentReputationScore: updatedReputationScore,
        ruleExplanation,
      },
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy lịch đặt.',
      error: error.message,
    });
  }
};

/**
 * Cập nhật vòng đời trạng thái lịch (CONFIRMED, IN_PROGRESS, COMPLETED)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã lịch đặt không hợp lệ.',
      });
    }

    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái chuyển tiếp không hợp lệ.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt.',
      });
    }

    const currentAccountIdStr = req.account._id.toString();
    const isCustomer = booking.customerId?.toString() === currentAccountIdStr;
    const isCaregiver = booking.caregiverId?.toString() === currentAccountIdStr;

    if (!isCustomer && !isCaregiver && req.account.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên lịch đặt này.',
      });
    }

    // 1. Nhận việc: PENDING -> CONFIRMED (Người chăm sóc)
    if (status === 'CONFIRMED') {
      if (booking.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `Không thể nhận việc khi đơn đang ở trạng thái ${booking.status}.`,
        });
      }
      if (!isCaregiver && req.account.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ người chăm sóc được chỉ định mới có thể bấm nhận ca làm này.',
        });
      }
      booking.status = 'CONFIRMED';
    }
    // 2. Bắt đầu ca: CONFIRMED -> IN_PROGRESS (Người chăm sóc)
    else if (status === 'IN_PROGRESS') {
      if (booking.status !== 'CONFIRMED') {
        return res.status(400).json({
          success: false,
          message: `Chỉ có thể bắt đầu ca khi đơn đã ở trạng thái ĐÃ XÁC NHẬN (CONFIRMED). Hiện tại: ${booking.status}.`,
        });
      }
      if (!isCaregiver && req.account.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ người chăm sóc mới có thể bấm bắt đầu ca làm.',
        });
      }
      booking.status = 'IN_PROGRESS';
    }
    // 3. Hoàn thành ca: IN_PROGRESS hoặc CONFIRMED -> COMPLETED
    else if (status === 'COMPLETED') {
      if (booking.status !== 'IN_PROGRESS' && booking.status !== 'CONFIRMED') {
        return res.status(400).json({
          success: false,
          message: `Không thể chuyển sang hoàn thành khi đơn đang ở trạng thái ${booking.status}.`,
        });
      }
      booking.status = 'COMPLETED';

      // Tăng số ca đã hoàn thành cho Người chăm sóc
      if (booking.caregiverId) {
        await CaregiverProfile.findOneAndUpdate(
          { accountId: booking.caregiverId },
          { $inc: { totalCompletedBookings: 1 } }
        );
      }
    }
    // 4. Từ chối nhận đơn khi PENDING
    else if (status === 'CANCELLED') {
      if (booking.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể từ chối đơn khi đơn đang ở trạng thái Chờ xác nhận (PENDING). Vui lòng dùng chức năng hủy lịch theo quy tắc.',
        });
      }
      booking.status = 'CANCELLED';
      booking.cancellationInfo = {
        cancelledBy: req.account._id,
        cancelledByRole: isCustomer ? 'CUSTOMER' : 'CAREGIVER',
        reason: req.body.reason || (isCaregiver ? 'Người chăm sóc từ chối nhận việc' : 'Khách hàng hủy đơn chờ'),
        cancelledAt: new Date(),
        penaltyPointsDeducted: 0,
      };
    }

    await booking.save();

    const enriched = await enrichBooking(booking, req.account._id);

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn sang ${booking.status} thành công.`,
      data: enriched,
    });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái lịch.',
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
};
