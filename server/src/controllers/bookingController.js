const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CaregiverProfile = require('../models/CaregiverProfile');
const User = require('../models/User');
const Account = require('../models/Account');
const ReputationLog = require('../models/ReputationLog');
const { calculateBookingDetails } = require('../utils/booking.util');

const getCaregiverIdentity = async (req, { requireApproval = true } = {}) => {
  const profileFilter = [{ accountId: req.account._id }];
  if (req.user?._id) profileFilter.push({ userId: req.user._id });

  const caregiverProfiles = await CaregiverProfile.find({ $or: profileFilter });
  if (
    req.caregiverProfile &&
    !caregiverProfiles.some(
      (profile) => profile._id.toString() === req.caregiverProfile._id.toString(),
    )
  ) {
    caregiverProfiles.push(req.caregiverProfile);
  }
  const approvedProfiles = caregiverProfiles.filter(
    (profile) =>
      profile.approvalStatus === 'APPROVED' ||
      profile.get('verificationStatus') === 'VERIFIED',
  );
  const isCaregiverAccount = req.account.role === 'CAREGIVER';

  if (requireApproval && approvedProfiles.length === 0) return null;
  if (!requireApproval && approvedProfiles.length === 0 && !isCaregiverAccount) {
    return null;
  }

  const bookingIds = new Set([req.account._id.toString()]);
  if (req.user?._id) bookingIds.add(req.user._id.toString());

  const profilesToInclude = requireApproval ? approvedProfiles : caregiverProfiles;
  for (const profile of profilesToInclude) {
    bookingIds.add(profile._id.toString());

    if (profile.accountId) {
      bookingIds.add(profile.accountId.toString());
    } else if (profile.userId) {
      const user = await User.findById(profile.userId).select('accountId');
      if (user?.accountId) {
        if (approvedProfiles.includes(profile) && !profile.accountId) {
          profile.accountId = user.accountId;
          await profile.save();
        }
        bookingIds.add(user.accountId.toString());
      }
    }

    if (profile.userId) {
      bookingIds.add(profile.userId.toString());
    }
  }

  return {
    accountId: req.account._id,
    bookingIds: Array.from(bookingIds),
    profileIds: caregiverProfiles.map((profile) => profile._id),
    profileCount: caregiverProfiles.length,
    approvedProfileCount: approvedProfiles.length,
  };
};

const getCaregiverBookingOwnerFilter = (caregiverIdentity) => ({
  $or: [
    { caregiverId: { $in: caregiverIdentity.bookingIds } },
    { caregiverProfileId: { $in: caregiverIdentity.profileIds } },
  ],
});

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

    const caregiverBookingIds = [
      caregiverAccountId,
      caregiver._id,
      caregiver.userId,
      req.account._id,
      req.user?._id,
    ].filter(Boolean);
    const overlappingBooking = await Booking.findOne({
      caregiverId: { $in: caregiverBookingIds },
      status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
      startTime: { $lt: bookingDetails.endTime },
      endTime: { $gt: bookingDetails.startTime },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Người chăm sóc đã xác nhận lịch trong khoảng thời gian này.',
      });
    }

    const booking = await Booking.create({
      customerId: req.account._id,
      caregiverId: caregiverAccountId,
      caregiverProfileId: caregiver._id,
      bookingType: 'DIRECT',
      status: 'PENDING',
      confirmedAt: null,
      caregiverRejectedAt: null,
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
      message: 'Đã gửi yêu cầu đặt lịch. Người chăm sóc cần xác nhận.',
      data: booking,
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

const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.account._id }).sort({
      startTime: -1,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch của bạn thành công.',
      data: bookings,
    });
  } catch (error) {
    console.error('getCustomerBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch của bạn.',
    });
  }
};

const getCustomerBookingNotifications = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.account._id,
      $or: [
        { confirmedAt: { $ne: null } },
        { caregiverRejectedAt: { $ne: null } },
      ],
    })
      .select('_id startTime status confirmedAt caregiverRejectedAt customerNotificationReadAt')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy thông báo lịch đặt thành công.',
      data: bookings.map((booking) => ({
        bookingId: booking._id,
        message: booking.caregiverRejectedAt
          ? 'Người chăm sóc đã từ chối lịch đặt của bạn.'
          : 'Người chăm sóc đã xác nhận lịch đặt của bạn.',
        startTime: booking.startTime,
        status: booking.status,
        createdAt: booking.caregiverRejectedAt || booking.confirmedAt,
        isRead: Boolean(booking.customerNotificationReadAt),
      })),
    });
  } catch (error) {
    console.error('getCustomerBookingNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông báo.',
    });
  }
};

const markCustomerBookingNotificationRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId không hợp lệ.',
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        customerId: req.account._id,
        $or: [
          { confirmedAt: { $ne: null } },
          { caregiverRejectedAt: { $ne: null } },
        ],
        customerNotificationReadAt: null,
      },
      { $set: { customerNotificationReadAt: new Date() } },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: booking
        ? 'Đã đánh dấu thông báo đã đọc.'
        : 'Thông báo đã được đọc hoặc không tồn tại.',
    });
  } catch (error) {
    console.error('markCustomerBookingNotificationRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo.',
    });
  }
};

const getIncomingCaregiverBookings = async (req, res) => {
  try {
    const caregiverIdentity = await getCaregiverIdentity(req, { requireApproval: false });
    if (!caregiverIdentity) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản người chăm sóc mới xem được lịch đặt.',
      });
    }

    // Include all statuses so the caregiver can see pending, confirmed, rejected,
    // and older bookings associated with any linked caregiver identifier.
    const bookings = await Booking.find(getCaregiverBookingOwnerFilter(caregiverIdentity))
      .populate({ path: 'customerId', select: 'email' })
      .sort({ createdAt: -1 })
      .lean();

    const customerAccountIds = bookings
      .map((booking) => booking.customerId?._id)
      .filter(Boolean);
    const customerUsers = await User.find({
      accountId: { $in: customerAccountIds },
    })
      .select('accountId fullName phone')
      .lean();
    const customerByAccountId = new Map(
      customerUsers.map((user) => [user.accountId.toString(), user]),
    );
    const statusCounts = bookings.reduce((counts, booking) => {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
      return counts;
    }, {});
    const debug = process.env.NODE_ENV === 'development'
      ? {
          databaseName: mongoose.connection.name,
          collectionName: Booking.collection.name,
          accountId: caregiverIdentity.accountId.toString(),
          userId: req.user?._id?.toString() || null,
          linkedProfileCount: caregiverIdentity.profileCount,
          approvedProfileCount: caregiverIdentity.approvedProfileCount,
          searchedCaregiverIds: caregiverIdentity.bookingIds,
          searchedCaregiverProfileIds: caregiverIdentity.profileIds.map((id) => id.toString()),
          matchedBookingCount: bookings.length,
          matchedCaregiverIds: Array.from(
            new Set(bookings.map((booking) => booking.caregiverId?.toString()).filter(Boolean)),
          ),
          matchedCaregiverProfileIds: Array.from(
            new Set(bookings.map((booking) => booking.caregiverProfileId?.toString()).filter(Boolean)),
          ),
          statusCounts,
        }
      : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.info('Incoming caregiver bookings loaded:', debug);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch khách đặt thành công.',
      data: bookings.map((booking) => ({
        ...booking,
        customer: booking.customerId
          ? {
              _id: booking.customerId._id,
              email: booking.customerId.email,
              fullName:
                customerByAccountId.get(booking.customerId._id.toString())?.fullName ||
                'Khách hàng',
              phone:
                customerByAccountId.get(booking.customerId._id.toString())?.phone || '',
            }
          : null,
      })),
      ...(debug ? { debug } : {}),
    });
  } catch (error) {
    console.error('getIncomingCaregiverBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch đặt của khách.',
    });
  }
};

const confirmCaregiverBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId không hợp lệ.',
      });
    }

    const caregiverIdentity = await getCaregiverIdentity(req);
    if (!caregiverIdentity) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ người chăm sóc đã được duyệt mới xác nhận lịch.',
      });
    }

    const requestedBooking = await Booking.findOne({
      _id: req.params.id,
      ...getCaregiverBookingOwnerFilter(caregiverIdentity),
      status: 'PENDING',
    }).select('startTime endTime');

    if (!requestedBooking) {
      const existingBooking = await Booking.findById(req.params.id).select(
        'caregiverId caregiverProfileId status',
      );
      if (
        !existingBooking ||
        (!caregiverIdentity.bookingIds.some(
          (id) => id.toString() === existingBooking.caregiverId?.toString(),
        ) &&
          !caregiverIdentity.profileIds.some(
            (id) => id.toString() === existingBooking.caregiverProfileId?.toString(),
          ))
      ) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch đặt thuộc về bạn.',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Lịch này không còn ở trạng thái chờ xác nhận.',
      });
    }

    const conflictingBooking = await Booking.findOne({
      _id: { $ne: requestedBooking._id },
      ...getCaregiverBookingOwnerFilter(caregiverIdentity),
      status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
      startTime: { $lt: requestedBooking.endTime },
      endTime: { $gt: requestedBooking.startTime },
    }).select('_id');

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã xác nhận một lịch khác trùng thời gian này.',
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: requestedBooking._id,
        ...getCaregiverBookingOwnerFilter(caregiverIdentity),
        status: 'PENDING',
      },
      {
        $set: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          customerNotificationReadAt: null,
        },
      },
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: 'Lịch này vừa được cập nhật. Vui lòng tải lại danh sách.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xác nhận lịch đặt.',
      data: booking,
    });
  } catch (error) {
    console.error('confirmCaregiverBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác nhận lịch đặt.',
    });
  }
};

const rejectCaregiverBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId không hợp lệ.',
      });
    }

    const caregiverIdentity = await getCaregiverIdentity(req);
    if (!caregiverIdentity) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ người chăm sóc đã được duyệt mới từ chối lịch.',
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        ...getCaregiverBookingOwnerFilter(caregiverIdentity),
        status: 'PENDING',
      },
      {
        $set: {
          status: 'CANCELLED',
          caregiverRejectedAt: new Date(),
          customerNotificationReadAt: null,
          'cancellationInfo.cancelledBy': req.account._id,
          'cancellationInfo.cancelledByRole': 'CAREGIVER',
          'cancellationInfo.reason': 'Người chăm sóc từ chối yêu cầu đặt lịch.',
          'cancellationInfo.cancelledAt': new Date(),
          'cancellationInfo.penaltyPointsDeducted': 0,
        },
      },
      { new: true, runValidators: true },
    );

    if (!booking) {
      const existingBooking = await Booking.findById(req.params.id).select(
        'caregiverId caregiverProfileId status',
      );
      if (
        !existingBooking ||
        (!caregiverIdentity.bookingIds.some(
          (id) => id.toString() === existingBooking.caregiverId?.toString(),
        ) &&
          !caregiverIdentity.profileIds.some(
            (id) => id.toString() === existingBooking.caregiverProfileId?.toString(),
          ))
      ) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch đặt thuộc về bạn.',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Chỉ có thể từ chối lịch đang chờ xác nhận.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối lịch đặt. Khách hàng sẽ nhận được thông báo.',
      data: booking,
    });
  } catch (error) {
    console.error('rejectCaregiverBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối lịch đặt.',
    });
  }
};

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

module.exports = {
  createBooking,
  getMyBookings,
  getCustomerBookings,
  getCustomerBookingNotifications,
  markCustomerBookingNotificationRead,
  getIncomingCaregiverBookings,
  confirmCaregiverBooking,
  rejectCaregiverBooking,
  getBookingById,
};
