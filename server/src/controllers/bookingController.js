const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CaregiverProfile = require('../models/CaregiverProfile');
const User = require('../models/User');
const Account = require('../models/Account');
const ReputationLog = require('../models/ReputationLog');
const {
  calculateBookingDetails,
  calculateCancellationPenalty,
} = require('../utils/booking.util');
const { checkCaregiverAvailability } = require('../services/availabilityService');
const {
  calculateHaversineDistance,
  calculateDistancePricing,
} = require('../services/geoDistanceService');

const enrichBooking = async (booking, viewerAccountId) => {
  const bookingData = typeof booking.toObject === 'function' ? booking.toObject() : booking;
  const customerAccountId = bookingData.customerId?._id || bookingData.customerId;
  const caregiverId = bookingData.caregiverId?._id || bookingData.caregiverId;
  const caregiverProfileId = bookingData.caregiverProfileId?._id || bookingData.caregiverProfileId;

  const [customerAccount, caregiverProfile] = await Promise.all([
    customerAccountId ? Account.findById(customerAccountId).lean() : null,
    caregiverProfileId || caregiverId
      ? CaregiverProfile.findOne({
          $or: [
            ...(caregiverProfileId ? [{ _id: caregiverProfileId }] : []),
            ...(caregiverId
              ? [{ accountId: caregiverId }, { _id: caregiverId }, { userId: caregiverId }]
              : []),
          ],
        }).lean()
      : null,
  ]);

  const caregiverAccountId = caregiverProfile?.accountId || caregiverId;
  const [customerUser, caregiverAccount, caregiverUser] = await Promise.all([
    customerAccountId ? User.findOne({ accountId: customerAccountId }).lean() : null,
    caregiverAccountId ? Account.findById(caregiverAccountId).lean() : null,
    caregiverAccountId ? User.findOne({ accountId: caregiverAccountId }).lean() : null,
  ]);
  const phoneIsRevealed =
    Boolean(bookingData.confirmedAt) ||
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(bookingData.status);

  return {
    ...bookingData,
    customer: customerAccount
      ? {
          accountId: customerAccount._id,
          fullName: customerUser?.fullName || '',
          avatarUrl: customerUser?.avatarUrl || '',
          phone: customerUser?.phone || '',
          isPhoneRevealed: phoneIsRevealed || customerAccount._id.toString() === viewerAccountId.toString(),
          email: customerAccount.email || '',
          reputationScore: customerAccount.reputationScore ?? 100,
          status: customerAccount.status || '',
          isLowReputation: (customerAccount.reputationScore ?? 100) < 70,
        }
      : null,
    caregiver: caregiverProfile
      ? {
          profileId: caregiverProfile._id,
          accountId: caregiverAccount?._id || caregiverAccountId,
          fullName: caregiverProfile.fullName || caregiverUser?.fullName || '',
          avatarUrl: caregiverProfile.avatarUrl || caregiverUser?.avatarUrl || '',
          phone: caregiverProfile.phone || caregiverUser?.phone || '',
          isPhoneRevealed:
            phoneIsRevealed ||
            caregiverAccount?._id?.toString() === viewerAccountId.toString(),
          ratingAvg: caregiverProfile.ratingAvg ?? 5,
          totalReviews: caregiverProfile.totalReviews ?? 0,
          experienceYears: caregiverProfile.experienceYears ?? 0,
          serviceAreas: caregiverProfile.serviceAreas || [],
          reputationScore: caregiverAccount?.reputationScore ?? 100,
        }
      : null,
  };
};

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
      careNotes,
      paymentMethod,
      location,
    } = req.body;

    const targetServiceAddress = (
      location?.fullAddress ||
      location?.detail ||
      serviceAddress ||
      ''
    ).trim();

    const targetServiceArea = (
      serviceArea ||
      location?.wardName ||
      location?.provinceName ||
      'Cần Thơ'
    ).trim();

    if (!caregiverId || !targetServiceArea || !targetServiceAddress || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp caregiverId, startTime, địa điểm hoặc địa chỉ chăm sóc.',
      });
    }

    if (!mongoose.isValidObjectId(caregiverId)) {
      return res.status(400).json({
        success: false,
        message: 'caregiverId không hợp lệ.',
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

    const caregiverIds = [caregiverAccountId, caregiver._id, caregiverId]
      .filter(Boolean)
      .map((id) => id.toString());
    const duplicateBooking = await Booking.findOne({
      customerId: req.account._id,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      startTime: bookingDetails.startTime,
      packageType,
      durationValue: Number(durationValue),
      serviceAddress: targetServiceAddress,
      $or: [
        { caregiverId: { $in: caregiverIds } },
        { caregiverProfileId: { $in: caregiverIds } },
      ],
    })
      .select('_id')
      .lean();

    if (duplicateBooking) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã gửi yêu cầu đặt lịch giống hệt cho người chăm sóc này. Hãy kiểm tra lịch đặt của bạn hoặc thay đổi thông tin lịch.',
      });
    }

    // Kiểm tra rảnh lịch chéo qua Availability Service (quét cả Booking và CareRequest)
    const isAvailable = await checkCaregiverAvailability(
      caregiverAccountId,
      bookingDetails.startTime,
      bookingDetails.endTime
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Người chăm sóc đã có ca làm việc khác trong khoảng thời gian này (trên đơn trực tiếp hoặc marketplace).',
      });
    }

    // Tính toán phụ phí di chuyển độc lập tại backend (Geospatial & Distance Pricing Engine)
    let distanceKm = 0;
    let distanceFee = 0;
    const destCoords = location?.coordinates;

    if (
      Array.isArray(destCoords) &&
      destCoords.length === 2 &&
      Number.isFinite(Number(destCoords[0])) &&
      Number.isFinite(Number(destCoords[1])) &&
      caregiver.serviceLocation?.coordinates &&
      Array.isArray(caregiver.serviceLocation.coordinates) &&
      caregiver.serviceLocation.coordinates.length === 2
    ) {
      distanceKm = calculateHaversineDistance(
        caregiver.serviceLocation.coordinates,
        [Number(destCoords[0]), Number(destCoords[1])]
      );
      const distancePricing = calculateDistancePricing(distanceKm);
      distanceFee = distancePricing.surchargeAmount;
    }

    const subtotal = bookingDetails.subtotal || bookingDetails.totalPrice || 0;
    const finalTotalPrice = subtotal + distanceFee;

    const locationSnapshot = {
      placeType: location?.placeType || 'home',
      recipientName: location?.recipientName || '',
      recipientPhone: location?.recipientPhone || '',
      provinceCode: location?.provinceCode || '',
      provinceName: location?.provinceName || '',
      wardCode: location?.wardCode || '',
      wardName: location?.wardName || '',
      detail: location?.detail || targetServiceAddress,
      fullAddress: location?.fullAddress || targetServiceAddress,
      hospitalId: location?.hospitalId || null,
      hospitalName: location?.hospitalName || '',
      department: location?.department || '',
      roomNumber: location?.roomNumber || '',
      bedNumber: location?.bedNumber || '',
      coordinates:
        Array.isArray(destCoords) &&
        destCoords.length === 2 &&
        Number.isFinite(Number(destCoords[0])) &&
        Number.isFinite(Number(destCoords[1]))
          ? [Number(destCoords[0]), Number(destCoords[1])]
          : undefined,
    };

    const baseRate =
      packageType === 'DAILY'
        ? (caregiver.pricing?.dailyRate ?? caregiver.get('dailyRate') ?? 800000)
        : (caregiver.pricing?.hourlyRate ?? caregiver.get('hourlyRate') ?? 100000);

    const pricingSnapshot = {
      baseRate,
      durationUnit: packageType,
      durationValue: Number(durationValue),
      subtotal,
      serviceFee: 0,
      discountAmount: 0,
      distanceKm,
      distanceFee,
      totalPrice: finalTotalPrice,
      currency: 'VND',
    };

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
      totalPrice: finalTotalPrice,
      serviceArea: targetServiceArea,
      serviceAddress: targetServiceAddress,
      locationSnapshot,
      pricingSnapshot,
      preferredGender,
      requiredSkills,
      note: note || careNotes || '',
      careNotes: careNotes || note || '',
      paymentMethod: paymentMethod || 'CASH',
    });

    const enriched = await enrichBooking(booking, req.account._id);

    return res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đặt lịch. Người chăm sóc cần xác nhận.',
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
    const enrichedBookings = await Promise.all(
      bookings.map((booking) => enrichBooking(booking, req.account._id)),
    );

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch của bạn thành công.',
      data: enrichedBookings,
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

    // Kiểm tra rảnh lịch chéo qua Availability Service (quét cả Booking và CareRequest)
    const isAvailable = await checkCaregiverAvailability(
      caregiverIdentity.profileIds[0] || req.account._id,
      requestedBooking.startTime,
      requestedBooking.endTime,
      { excludeBookingId: requestedBooking._id }
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã có một lịch làm việc khác trùng với thời gian này (trên đơn trực tiếp hoặc chợ việc).',
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

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'bookingId không hợp lệ.' });
    }
    if (reason.length < 3) {
      return res.status(400).json({ success: false, message: 'Lý do hủy phải có ít nhất 3 ký tự.' });
    }

    let ownerFilter;
    if (req.account.role === 'CUSTOMER') {
      ownerFilter = { customerId: req.account._id };
    } else if (req.account.role === 'CAREGIVER') {
      const caregiverIdentity = await getCaregiverIdentity(req);
      if (!caregiverIdentity) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ người chăm sóc đã được duyệt mới có thể hủy lịch.',
        });
      }
      ownerFilter = getCaregiverBookingOwnerFilter(caregiverIdentity);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ khách hàng hoặc người chăm sóc của lịch mới được hủy.',
      });
    }

    const requestedBooking = await Booking.findOne({
      _id: id,
      ...ownerFilter,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }).select('customerId caregiverId caregiverProfileId startTime status');

    if (!requestedBooking) {
      const existingBooking = await Booking.findById(id).select('customerId status');
      if (!existingBooking || existingBooking.customerId.toString() !== req.account._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch đặt thuộc về bạn hoặc lịch không còn tồn tại.',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Chỉ có thể hủy lịch đang chờ hoặc đã xác nhận.',
      });
    }

    let cancellationCount = null;
    if (requestedBooking.status === 'CONFIRMED') {
      cancellationCount = (await Booking.countDocuments({
        status: 'CANCELLED',
        confirmedAt: { $ne: null },
        'cancellationInfo.cancelledBy': req.account._id,
        'cancellationInfo.cancelledByRole': req.account.role,
      })) + 1;
    }

    let penaltyPoints = 0;
    if (requestedBooking.status === 'CONFIRMED') {
      penaltyPoints = calculateCancellationPenalty(cancellationCount);
    }

    const now = new Date();
    const booking = await Booking.findOneAndUpdate(
      {
        _id: requestedBooking._id,
        ...ownerFilter,
        status: requestedBooking.status,
      },
      {
        $set: {
          status: 'CANCELLED',
          'cancellationInfo.cancelledBy': req.account._id,
          'cancellationInfo.cancelledByRole': req.account.role,
          'cancellationInfo.reason': reason,
          'cancellationInfo.cancelledAt': now,
          'cancellationInfo.penaltyPointsDeducted': penaltyPoints,
        },
      },
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: 'Lịch vừa được cập nhật. Vui lòng tải lại danh sách.',
      });
    }

    let currentReputationScore = req.account.reputationScore;
    if (penaltyPoints > 0) {
      const penalizedAccount = await Account.findById(req.account._id);
      if (!penalizedAccount) {
        throw new Error('Không tìm thấy tài khoản để cập nhật điểm uy tín.');
      }

      const previousScore = penalizedAccount.reputationScore;
      currentReputationScore = Math.max(0, previousScore - penaltyPoints);
      penalizedAccount.reputationScore = currentReputationScore;
      await penalizedAccount.save();
      await ReputationLog.create({
        accountId: req.account._id,
        bookingId: booking._id,
        changeAmount: currentReputationScore - previousScore,
        previousScore,
        newScore: currentReputationScore,
        reason: `${
          req.account.role === 'CUSTOMER' ? 'Khách hàng' : 'Người chăm sóc'
        } hủy lịch #${booking._id.toString().slice(-8)}: ${reason}`,
      });
    }

    const cancellationActorLabel =
      req.account.role === 'CUSTOMER' ? 'khách hàng' : 'caregiver';

    return res.status(200).json({
      success: true,
      message: penaltyPoints
        ? `Đã hủy lịch lần ${cancellationCount} và trừ ${penaltyPoints} điểm uy tín của tài khoản ${cancellationActorLabel}.`
        : 'Đã hủy lịch thành công, không bị trừ điểm uy tín.',
      data: {
        booking: await enrichBooking(booking, req.account._id),
        currentReputationScore,
        cancellationCount,
        caregiverCancellationCount:
          req.account.role === 'CAREGIVER' ? cancellationCount : null,
        penaltyPointsDeducted: penaltyPoints,
      },
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy lịch đặt.',
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'bookingId không hợp lệ.' });
    }
    if (!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái lịch không hợp lệ.' });
    }

    if (status === 'CONFIRMED' && req.account.role === 'CAREGIVER') {
      return confirmCaregiverBooking(req, res);
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch đặt.' });
    }

    const isCustomer = booking.customerId.toString() === req.account._id.toString();
    let isCaregiver = false;
    if (req.account.role === 'CAREGIVER') {
      const caregiverIdentity = await getCaregiverIdentity(req);
      isCaregiver = Boolean(
        caregiverIdentity &&
          (caregiverIdentity.bookingIds.some(
            (caregiverId) => caregiverId.toString() === booking.caregiverId?.toString(),
          ) ||
            caregiverIdentity.profileIds.some(
              (profileId) => profileId.toString() === booking.caregiverProfileId?.toString(),
            )),
      );
    }

    if (!isCustomer && !isCaregiver) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch đặt này.',
      });
    }

    const allowedTransitions = isCaregiver
      ? {
          CONFIRMED: ['IN_PROGRESS'],
          IN_PROGRESS: ['COMPLETED'],
        }
      : {
          IN_PROGRESS: ['COMPLETED'],
        };
    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: 'Không thể chuyển lịch sang trạng thái được yêu cầu.',
      });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: 'Lịch vừa được cập nhật. Vui lòng tải lại danh sách.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái lịch đặt.',
      data: await enrichBooking(updatedBooking, req.account._id),
    });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái lịch đặt.',
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
  cancelBooking,
  updateBookingStatus,
  getBookingById,
};
