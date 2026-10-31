const { calculateBookingDetails } = require('./booking.util');

describe('calculateBookingDetails', () => {
  const startTime = '2027-01-01T08:00:00.000Z';

  it('calculates the end time and total for hourly bookings', () => {
    const result = calculateBookingDetails({
      startTime,
      packageType: 'HOURLY',
      durationValue: 4,
      pricing: { hourlyRate: 100000 },
    });

    expect(result.endTime.toISOString()).toBe('2027-01-01T12:00:00.000Z');
    expect(result.totalPrice).toBe(400000);
  });

  it('uses the package rate for daily, weekly, and monthly bookings', () => {
    const cases = [
      ['DAILY', 2, 'dailyRate', 200000, 400000, 48],
      ['WEEKLY', 1, 'weeklyRate', 1000000, 1000000, 168],
      ['MONTHLY', 1, 'monthlyRate', 3000000, 3000000, 720],
    ];

    cases.forEach(([packageType, durationValue, rateField, rate, total, hours]) => {
      const result = calculateBookingDetails({
        startTime,
        packageType,
        durationValue,
        pricing: { [rateField]: rate },
      });

      expect(result.totalPrice).toBe(total);
      expect(result.endTime.getTime() - result.startTime.getTime()).toBe(
        hours * 60 * 60 * 1000,
      );
    });
  });

  it('rejects unsupported hourly durations', () => {
    expect(() =>
      calculateBookingDetails({
        startTime,
        packageType: 'HOURLY',
        durationValue: 3,
        pricing: { hourlyRate: 100000 },
      }),
    ).toThrow('Gói theo giờ chỉ hỗ trợ');
  });

  it('rejects invalid dates and missing package prices', () => {
    expect(() =>
      calculateBookingDetails({
        startTime: 'not-a-date',
        packageType: 'DAILY',
        durationValue: 1,
        pricing: { dailyRate: 200000 },
      }),
    ).toThrow('startTime không hợp lệ');

    expect(() =>
      calculateBookingDetails({
        startTime,
        packageType: 'MONTHLY',
        durationValue: 1,
        pricing: { monthlyRate: null },
      }),
    ).toThrow('chưa cấu hình giá');
  });
});
