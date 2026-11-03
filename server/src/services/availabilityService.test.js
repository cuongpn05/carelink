const mongoose = require('mongoose');
const {
  checkCaregiverAvailability,
  getCaregiverConflictDetails,
} = require('./availabilityService');
const Booking = require('../models/Booking');
const CareRequest = require('../models/CareRequest');
const CaregiverProfile = require('../models/CaregiverProfile');

jest.mock('../models/Booking');
jest.mock('../models/CareRequest');
jest.mock('../models/CaregiverProfile');

describe('Availability Service (Shared Time-Conflict Checker)', () => {
  const caregiverId = new mongoose.Types.ObjectId();
  const caregiverProfileId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();

    CaregiverProfile.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: caregiverProfileId,
          accountId: caregiverId,
          userId: new mongoose.Types.ObjectId(),
        }),
      }),
    });
  });

  it('trả về true khi không có bất kỳ ca nào trùng lịch (cả Booking và CareRequest đều rảnh)', async () => {
    Booking.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    CareRequest.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const isAvailable = await checkCaregiverAvailability(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z'
    );

    expect(isAvailable).toBe(true);
  });

  it('trả về false khi bị trùng với đơn Booking trực tiếp (CONFIRMED hoặc IN_PROGRESS)', async () => {
    Booking.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          startTime: new Date('2027-01-01T09:00:00.000Z'),
          endTime: new Date('2027-01-01T11:00:00.000Z'),
          status: 'CONFIRMED',
        }),
      }),
    });

    CareRequest.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const isAvailable = await checkCaregiverAvailability(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z'
    );

    expect(isAvailable).toBe(false);

    const details = await getCaregiverConflictDetails(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z'
    );
    expect(details.isAvailable).toBe(false);
    expect(details.conflictingBooking).not.toBeNull();
  });

  it('trả về false khi bị trùng với bài đăng CareRequest trên Marketplace (ACCEPTED hoặc ASSIGNED)', async () => {
    Booking.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    CareRequest.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          startTime: new Date('2027-01-01T10:00:00.000Z'),
          endTime: new Date('2027-01-01T14:00:00.000Z'),
          status: 'ACCEPTED',
        }),
      }),
    });

    const isAvailable = await checkCaregiverAvailability(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z'
    );

    expect(isAvailable).toBe(false);

    const details = await getCaregiverConflictDetails(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z'
    );
    expect(details.isAvailable).toBe(false);
    expect(details.conflictingCareRequest).not.toBeNull();
  });

  it('hỗ trợ excludeBookingId khi cập nhật chính ca đó', async () => {
    const existingBookingId = new mongoose.Types.ObjectId();

    Booking.findOne.mockImplementation((filter) => {
      // Nếu filter có $ne đúng ID bị loại trừ -> không tìm thấy xung đột
      if (filter._id && filter._id.$ne && filter._id.$ne.toString() === existingBookingId.toString()) {
        return {
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: existingBookingId }),
        }),
      };
    });

    CareRequest.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const isAvailable = await checkCaregiverAvailability(
      caregiverId,
      '2027-01-01T08:00:00.000Z',
      '2027-01-01T12:00:00.000Z',
      { excludeBookingId: existingBookingId }
    );

    expect(isAvailable).toBe(true);
  });

  it('báo lỗi khi startTime >= endTime hoặc thời gian không hợp lệ', async () => {
    await expect(
      checkCaregiverAvailability(
        caregiverId,
        '2027-01-01T12:00:00.000Z',
        '2027-01-01T08:00:00.000Z'
      )
    ).rejects.toThrow('Thời gian bắt đầu (startTime) phải trước thời gian kết thúc (endTime)');

    await expect(
      checkCaregiverAvailability(
        caregiverId,
        'invalid-date',
        '2027-01-01T08:00:00.000Z'
      )
    ).rejects.toThrow('Thời gian startTime hoặc endTime không hợp lệ');
  });
});
