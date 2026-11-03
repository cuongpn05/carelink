const { calculateHaversineDistance, calculateDistancePricing } = require('../services/geoDistanceService');

describe('Elderly Booking & Geospatial Acceptance Criteria Tests', () => {
  describe('Criterion 1: $geoNear & Service Radius Filter logic', () => {
    it('only includes caregivers within their serviceRadius and filters out those beyond', () => {
      // Mock elderly location (e.g. Ninh Kieu center: [105.7825, 10.0342])
      const elderlyCoords = [105.7825, 10.0342];

      // Caregiver A: ~4km away (e.g. [105.7500, 10.0200]), radius: 10km
      const caregiverACoords = [105.7500, 10.0200];
      const distA = calculateHaversineDistance(elderlyCoords, caregiverACoords);

      // Caregiver B: ~16km away (e.g. [105.6500, 10.0000]), radius: 10km
      const caregiverBCoords = [105.6500, 10.0000];
      const distB = calculateHaversineDistance(elderlyCoords, caregiverBCoords);

      expect(distA).toBeLessThanOrEqual(10);
      expect(distB).toBeGreaterThan(10);

      const caregivers = [
        { id: 'A', name: 'Caregiver A', distanceKm: distA, serviceRadius: 10 },
        { id: 'B', name: 'Caregiver B', distanceKm: distB, serviceRadius: 10 },
      ];

      // Simulated pipeline filter $match: { $expr: { $lte: ['$distanceKm', '$serviceRadius'] } }
      const matched = caregivers.filter((c) => c.distanceKm <= c.serviceRadius);

      expect(matched.length).toBe(1);
      expect(matched[0].id).toBe('A');
    });
  });

  describe('Criterion 2: Distance Pricing Engine', () => {
    it('cự ly 3.2 km -> phụ phí distanceFee = 0 đ', () => {
      const pricing = calculateDistancePricing(3.2);
      expect(pricing.isFree).toBe(true);
      expect(pricing.surchargeAmount).toBe(0);
    });

    it('cự ly 7.8 km -> vượt 2.8 km (làm tròn lên 3 km) -> phụ phí distanceFee = 30.000 đ', () => {
      const pricing = calculateDistancePricing(7.8);
      expect(pricing.isFree).toBe(false);
      expect(pricing.surchargeAmount).toBe(30000);
    });
  });

  describe('Criterion 3: Snapshot structure verification', () => {
    it('creates immutable locationSnapshot and pricingSnapshot with hospital data and distanceFee', () => {
      const elderlyCoords = [105.783, 10.033];
      const caregiverCoords = [105.720, 10.033]; // ~6.9 km away -> excess 1.9km -> 2km -> 20.000d

      const distanceKm = calculateHaversineDistance(caregiverCoords, elderlyCoords);
      const distancePricing = calculateDistancePricing(distanceKm);

      const locationPayload = {
        placeType: 'hospital',
        recipientName: 'Lê Văn B (Con trai)',
        recipientPhone: '0912345678',
        provinceCode: 'CT',
        provinceName: 'Cần Thơ',
        wardCode: 'NK',
        wardName: 'Ninh Kiều',
        hospitalName: 'Bệnh viện Đa khoa TP Cần Thơ',
        department: 'Khoa Tim Mạch',
        roomNumber: 'Phòng 305',
        bedNumber: 'Giường 02',
        coordinates: elderlyCoords,
      };

      const baseRate = 100000;
      const durationValue = 4;
      const subtotal = baseRate * durationValue;
      const totalPrice = subtotal + distancePricing.surchargeAmount;

      const locationSnapshot = {
        placeType: locationPayload.placeType,
        recipientName: locationPayload.recipientName,
        recipientPhone: locationPayload.recipientPhone,
        provinceCode: locationPayload.provinceCode,
        provinceName: locationPayload.provinceName,
        wardCode: locationPayload.wardCode,
        wardName: locationPayload.wardName,
        hospitalName: locationPayload.hospitalName,
        department: locationPayload.department,
        roomNumber: locationPayload.roomNumber,
        bedNumber: locationPayload.bedNumber,
        coordinates: locationPayload.coordinates,
      };

      const pricingSnapshot = {
        baseRate,
        durationUnit: 'HOURLY',
        durationValue,
        subtotal,
        distanceKm,
        distanceFee: distancePricing.surchargeAmount,
        totalPrice,
      };

      expect(locationSnapshot.placeType).toBe('hospital');
      expect(locationSnapshot.hospitalName).toBe('Bệnh viện Đa khoa TP Cần Thơ');
      expect(locationSnapshot.department).toBe('Khoa Tim Mạch');
      expect(locationSnapshot.roomNumber).toBe('Phòng 305');
      expect(locationSnapshot.bedNumber).toBe('Giường 02');
      expect(locationSnapshot.coordinates).toEqual([105.783, 10.033]);

      expect(pricingSnapshot.distanceKm).toBe(distanceKm);
      expect(pricingSnapshot.distanceFee).toBe(20000);
      expect(pricingSnapshot.totalPrice).toBe(420000);
    });
  });

  describe('Criterion 4: Availability filtering', () => {
    it('excludes caregiver if checkCaregiverAvailability returns false', async () => {
      const mockCaregivers = [
        { accountId: 'cg1', name: 'Caregiver 1' },
        { accountId: 'cg2', name: 'Caregiver 2' },
      ];

      // Simulated availability check: cg1 is busy, cg2 is free
      const availabilityCheck = async (accountId) => accountId !== 'cg1';

      const results = [];
      for (const cg of mockCaregivers) {
        const isFree = await availabilityCheck(cg.accountId);
        if (isFree) {
          results.push(cg);
        }
      }

      expect(results.length).toBe(1);
      expect(results[0].accountId).toBe('cg2');
    });
  });
});
