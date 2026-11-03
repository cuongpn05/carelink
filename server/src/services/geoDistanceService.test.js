const {
  calculateHaversineDistance,
  calculateDistancePricing,
} = require('./geoDistanceService');

describe('GeoDistanceService Unit Tests', () => {
  describe('calculateHaversineDistance', () => {
    it('returns 0 for missing or invalid coordinates', () => {
      expect(calculateHaversineDistance(null, [105.78, 10.03])).toBe(0);
      expect(calculateHaversineDistance([105.78], [105.78, 10.03])).toBe(0);
      expect(calculateHaversineDistance(['abc', 10], [105.78, 10.03])).toBe(0);
    });

    it('returns 0 for identical points', () => {
      const coord = [105.7825, 10.0342];
      expect(calculateHaversineDistance(coord, coord)).toBe(0);
    });

    it('calculates approximately correct distance between known points in Can Tho', () => {
      // Ninh Kieu [105.7825, 10.0342] to Cai Rang [105.7500, 10.0050]
      // Estimated distance is around 4.8 - 5.0 km
      const ninhKieu = [105.7825, 10.0342];
      const caiRang = [105.7500, 10.005];
      const dist = calculateHaversineDistance(ninhKieu, caiRang);
      expect(dist).toBeGreaterThan(4.5);
      expect(dist).toBeLessThan(5.5);
    });
  });

  describe('calculateDistancePricing', () => {
    it('cự ly 0 km -> phụ phí 0 đ, isFree = true', () => {
      const result = calculateDistancePricing(0);
      expect(result).toEqual({
        distanceKm: 0,
        isFree: true,
        surchargeAmount: 0,
      });
    });

    it('cự ly 3.2 km -> phụ phí 0 đ, isFree = true (theo Acceptance Criteria)', () => {
      const result = calculateDistancePricing(3.2);
      expect(result).toEqual({
        distanceKm: 3.2,
        isFree: true,
        surchargeAmount: 0,
      });
    });

    it('cự ly đúng 5.0 km -> phụ phí 0 đ, isFree = true', () => {
      const result = calculateDistancePricing(5.0);
      expect(result).toEqual({
        distanceKm: 5.0,
        isFree: true,
        surchargeAmount: 0,
      });
    });

    it('cự ly 5.1 km -> vượt 0.1 km (làm tròn lên 1 km) -> phụ phí 10.000 đ', () => {
      const result = calculateDistancePricing(5.1);
      expect(result).toEqual({
        distanceKm: 5.1,
        isFree: false,
        surchargeAmount: 10000,
      });
    });

    it('cự ly 7.8 km -> vượt 2.8 km (làm tròn lên 3 km) -> phụ phí 30.000 đ (theo Acceptance Criteria)', () => {
      const result = calculateDistancePricing(7.8);
      expect(result).toEqual({
        distanceKm: 7.8,
        isFree: false,
        surchargeAmount: 30000,
      });
    });

    it('cự ly 10.0 km -> vượt 5.0 km -> phụ phí 50.000 đ', () => {
      const result = calculateDistancePricing(10.0);
      expect(result).toEqual({
        distanceKm: 10.0,
        isFree: false,
        surchargeAmount: 50000,
      });
    });
  });
});

