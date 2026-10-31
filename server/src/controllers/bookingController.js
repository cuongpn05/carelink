const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CaregiverProfile = require('../models/CaregiverProfile');
const User = require('../models/User');
const { calculateBookingDetails } = require('../utils/booking.util');

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

    // Older caregiver records use verificationStatus=VERIFIED; new records use approvalStatus=APPROVED.
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
      console.error('Booking blocked: caregiver profile has no linked account.', {
        caregiverProfileId: caregiver._id.toString(),
        caregiverUserId: caregiver.userId?.toString(),
      });
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

    return res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công.',
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

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { customerId: req.account._id },
        { caregiverId: req.account._id },
      ],
    }).sort({ startTime: -1 });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch đặt thành công.',
      data: bookings,
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch đặt.',
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId không hợp lệ.',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (
      !booking ||
      (booking.customerId.toString() !== req.account._id.toString() &&
        booking.caregiverId?.toString() !== req.account._id.toString())
    ) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin lịch đặt thành công.',
      data: booking,
    });
  } catch (error) {
    console.error('getBookingById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin lịch đặt.',
    });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById };
