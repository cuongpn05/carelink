const PACKAGE_DURATION_MS = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

const HOURLY_DURATIONS = [2, 4, 6, 8, 10, 12];

const calculateBookingDetails = ({
  startTime,
  packageType,
  durationValue,
  pricing,
}) => {
  const start = new Date(startTime);

  if (!Number.isFinite(start.getTime())) {
    throw new Error('startTime không hợp lệ.');
  }

  if (!Object.prototype.hasOwnProperty.call(PACKAGE_DURATION_MS, packageType)) {
    throw new Error('packageType không hợp lệ.');
  }

  if (!Number.isInteger(durationValue) || durationValue < 1) {
    throw new Error('durationValue phải là số nguyên lớn hơn 0.');
  }

  if (packageType === 'HOURLY' && !HOURLY_DURATIONS.includes(durationValue)) {
    throw new Error('Gói theo giờ chỉ hỗ trợ 2, 4, 6, 8, 10 hoặc 12 giờ.');
  }

  const rateField = {
    HOURLY: 'hourlyRate',
    DAILY: 'dailyRate',
    WEEKLY: 'weeklyRate',
    MONTHLY: 'monthlyRate',
  }[packageType];
  const rate = pricing && pricing[rateField];

  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) {
    throw new Error(`Người chăm sóc chưa cấu hình giá cho gói ${packageType}.`);
  }

  const endTime = new Date(
    start.getTime() + PACKAGE_DURATION_MS[packageType] * durationValue,
  );
  const totalPrice = rate * durationValue;

  if (!Number.isFinite(totalPrice)) {
    throw new Error('Không thể tính tổng chi phí cho lịch này.');
  }

  return { startTime: start, endTime, totalPrice };
};

module.exports = { calculateBookingDetails };
