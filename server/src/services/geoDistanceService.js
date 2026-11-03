/**
 * Module Dịch vụ Địa lý & Tính toán Khoảng cách (Haversine & Distance Pricing Engine)
 * Dự án CareLink
 */

/**
 * Tính khoảng cách đường chim bay giữa 2 tọa độ GeoJSON [longitude, latitude] theo công thức Haversine
 * @param {[number, number]} coord1 - [kinh độ 1, vĩ độ 1]
 * @param {[number, number]} coord2 - [kinh độ 2, vĩ độ 2]
 * @returns {number} Khoảng cách tính bằng kilomet (km), làm tròn 1 chữ số thập phân
 */
const calculateHaversineDistance = (coord1, coord2) => {
  if (
    !Array.isArray(coord1) ||
    !Array.isArray(coord2) ||
    coord1.length < 2 ||
    coord2.length < 2
  ) {
    return 0;
  }

  const [lon1, lat1] = coord1.map(Number);
  const [lon2, lat2] = coord2.map(Number);

  if (
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon2) ||
    !Number.isFinite(lat2)
  ) {
    return 0;
  }

  // Bán kính Trái Đất (km)
  const EARTH_RADIUS_KM = 6371;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Làm tròn 1 chữ số thập phân
  return Math.round(distance * 10) / 10;
};

/**
 * Tính phụ phí di chuyển theo khoảng cách
 * Quy tắc:
 * - Cự ly <= 5 km: 0 VNĐ (Miễn phí di chuyển)
 * - Cự ly > 5 km: Mỗi km vượt thêm tính 10.000 VNĐ/km (Làm tròn lên theo từng km: Math.ceil(distanceKm - 5) * 10000)
 * @param {number} distanceKm - Khoảng cách tính bằng kilomet
 * @returns {{ distanceKm: number, isFree: boolean, surchargeAmount: number }}
 */
const calculateDistancePricing = (distanceKm) => {
  const dist = Number.isFinite(Number(distanceKm)) && Number(distanceKm) > 0 ? Number(distanceKm) : 0;
  const roundedDist = Math.round(dist * 10) / 10;

  if (roundedDist <= 5) {
    return {
      distanceKm: roundedDist,
      isFree: true,
      surchargeAmount: 0,
    };
  }

  const excessKm = roundedDist - 5;
  const billableKm = Math.ceil(excessKm);
  const surchargeAmount = billableKm * 10000;

  return {
    distanceKm: roundedDist,
    isFree: false,
    surchargeAmount,
  };
};

module.exports = {
  calculateHaversineDistance,
  calculateDistancePricing,
};
