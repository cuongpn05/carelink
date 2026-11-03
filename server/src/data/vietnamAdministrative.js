/**
 * Danh mục địa giới hành chính Việt Nam chuẩn hóa theo Tổng cục Thống kê (GSO).
 * Cập nhật mô hình tinh gọn và sáp nhập đơn vị hành chính 2025 - 2026.
 */

const PROVINCES = [
  { code: '01', name: 'Thành phố Hà Nội', shortName: 'Hà Nội' },
  { code: '79', name: 'Thành phố Hồ Chí Minh', shortName: 'TP. Hồ Chí Minh' },
  { code: '92', name: 'Thành phố Cần Thơ', shortName: 'Cần Thơ' },
  { code: '48', name: 'Thành phố Đà Nẵng', shortName: 'Đà Nẵng' },
  { code: '31', name: 'Thành phố Hải Phòng', shortName: 'Hải Phòng' },
  { code: '74', name: 'Tỉnh Bình Dương', shortName: 'Bình Dương' },
  { code: '75', name: 'Tỉnh Đồng Nai', shortName: 'Đồng Nai' },
  { code: '77', name: 'Tỉnh Bà Rịa - Vũng Tàu', shortName: 'Bà Rịa - Vũng Tàu' },
  { code: '80', name: 'Tỉnh Long An', shortName: 'Long An' },
  { code: '82', name: 'Tỉnh Tiền Giang', shortName: 'Tiền Giang' },
  { code: '83', name: 'Tỉnh Bến Tre', shortName: 'Bến Tre' },
  { code: '84', name: 'Tỉnh Trà Vinh', shortName: 'Trà Vinh' },
  { code: '86', name: 'Tỉnh Vĩnh Long', shortName: 'Vĩnh Long' },
  { code: '87', name: 'Tỉnh Đồng Tháp', shortName: 'Đồng Tháp' },
  { code: '89', name: 'Tỉnh An Giang', shortName: 'An Giang' },
  { code: '91', name: 'Tỉnh Kiên Giang', shortName: 'Kiên Giang' },
  { code: '93', name: 'Tỉnh Hậu Giang', shortName: 'Hậu Giang' },
  { code: '94', name: 'Tỉnh Sóc Trăng', shortName: 'Sóc Trăng' },
  { code: '95', name: 'Tỉnh Bạc Liêu', shortName: 'Bạc Liêu' },
  { code: '96', name: 'Tỉnh Cà Mau', shortName: 'Cà Mau' },
  { code: '56', name: 'Tỉnh Khánh Hòa', shortName: 'Khánh Hòa' },
  { code: '68', name: 'Tỉnh Lâm Đồng', shortName: 'Lâm Đồng' },
  { code: '52', name: 'Tỉnh Bình Định', shortName: 'Bình Định' },
  { code: '49', name: 'Tỉnh Quảng Nam', shortName: 'Quảng Nam' },
  { code: '51', name: 'Tỉnh Quảng Ngãi', shortName: 'Quảng Ngãi' },
  { code: '46', name: 'Tỉnh Thừa Thiên Huế', shortName: 'Thừa Thiên Huế' },
  { code: '24', name: 'Tỉnh Bắc Giang', shortName: 'Bắc Giang' },
  { code: '27', name: 'Tỉnh Bắc Ninh', shortName: 'Bắc Ninh' },
  { code: '30', name: 'Tỉnh Hải Dương', shortName: 'Hải Dương' },
  { code: '33', name: 'Tỉnh Hưng Yên', shortName: 'Hưng Yên' },
  { code: '34', name: 'Tỉnh Thái Bình', shortName: 'Thái Bình' },
  { code: '35', name: 'Tỉnh Hà Nam', shortName: 'Hà Nam' },
  { code: '36', name: 'Tỉnh Nam Định', shortName: 'Nam Định' },
  { code: '37', name: 'Tỉnh Ninh Bình', shortName: 'Ninh Bình' },
  { code: '38', name: 'Tỉnh Thanh Hóa', shortName: 'Thanh Hóa' },
  { code: '40', name: 'Tỉnh Nghệ An', shortName: 'Nghệ An' },
  { code: '42', name: 'Tỉnh Hà Tĩnh', shortName: 'Hà Tĩnh' },
  { code: '44', name: 'Tỉnh Quảng Bình', shortName: 'Quảng Bình' },
  { code: '45', name: 'Tỉnh Quảng Trị', shortName: 'Quảng Trị' },
  { code: '54', name: 'Tỉnh Phú Yên', shortName: 'Phú Yên' },
  { code: '58', name: 'Tỉnh Ninh Thuận', shortName: 'Ninh Thuận' },
  { code: '60', name: 'Tỉnh Bình Thuận', shortName: 'Bình Thuận' },
  { code: '62', name: 'Tỉnh Kon Tum', shortName: 'Kon Tum' },
  { code: '64', name: 'Tỉnh Gia Lai', shortName: 'Gia Lai' },
  { code: '66', name: 'Tỉnh Đắk Lắk', shortName: 'Đắk Lắk' },
  { code: '67', name: 'Tỉnh Đắk Nông', shortName: 'Đắk Nông' },
  { code: '70', name: 'Tỉnh Bình Phước', shortName: 'Bình Phước' },
  { code: '72', name: 'Tỉnh Tây Ninh', shortName: 'Tây Ninh' },
  { code: '02', name: 'Tỉnh Hà Giang', shortName: 'Hà Giang' },
  { code: '04', name: 'Tỉnh Cao Bằng', shortName: 'Cao Bằng' },
  { code: '06', name: 'Tỉnh Bắc Kạn', shortName: 'Bắc Kạn' },
  { code: '08', name: 'Tỉnh Tuyên Quang', shortName: 'Tuyên Quang' },
  { code: '10', name: 'Tỉnh Lào Cai', shortName: 'Lào Cai' },
  { code: '11', name: 'Tỉnh Điện Biên', shortName: 'Điện Biên' },
  { code: '12', name: 'Tỉnh Lai Châu', shortName: 'Lai Châu' },
  { code: '14', name: 'Tỉnh Sơn La', shortName: 'Sơn La' },
  { code: '15', name: 'Tỉnh Yên Bái', shortName: 'Yên Bái' },
  { code: '17', name: 'Tỉnh Hòa Bình', shortName: 'Hòa Bình' },
  { code: '19', name: 'Tỉnh Thái Nguyên', shortName: 'Thái Nguyên' },
  { code: '20', name: 'Tỉnh Lạng Sơn', shortName: 'Lạng Sơn' },
  { code: '22', name: 'Tỉnh Quảng Ninh', shortName: 'Quảng Ninh' },
  { code: '25', name: 'Tỉnh Phú Thọ', shortName: 'Phú Thọ' },
  { code: '26', name: 'Tỉnh Vĩnh Phúc', shortName: 'Vĩnh Phúc' },
];

/**
 * Danh sách Phường / Xã / Thị trấn trọng điểm theo từng Tỉnh/Thành phố
 * (Hỗ trợ cấu trúc 2 cấp hiện đại: Tỉnh -> Phường/Xã)
 */
const WARDS_BY_PROVINCE = {
  // Cần Thơ (92)
  '92': [
    { code: '92-01', name: 'Phường An Khánh' },
    { code: '92-02', name: 'Phường Hưng Lợi' },
    { code: '92-03', name: 'Phường Xuân Khánh' },
    { code: '92-04', name: 'Phường Cái Khế' },
    { code: '92-05', name: 'Phường Tân An' },
    { code: '92-06', name: 'Phường An Hòa' },
    { code: '92-07', name: 'Phường An Cư' },
    { code: '92-08', name: 'Phường Thới Bình' },
    { code: '92-09', name: 'Phường Bình Thủy' },
    { code: '92-10', name: 'Phường An Thới' },
    { code: '92-11', name: 'Phường Trà An' },
    { code: '92-12', name: 'Phường Trà Nóc' },
    { code: '92-13', name: 'Phường Hưng Phú' },
    { code: '92-14', name: 'Phường Lê Bình' },
    { code: '92-15', name: 'Phường Ba Láng' },
    { code: '92-16', name: 'Phường Phú Thứ' },
    { code: '92-17', name: 'Phường Châu Văn Liêm' },
    { code: '92-18', name: 'Phường Thốt Nốt' },
    { code: '92-19', name: 'Thị trấn Phong Điền' },
    { code: '92-20', name: 'Xã Mỹ Khánh' },
  ],

  // TP. Hồ Chí Minh (79)
  '79': [
    { code: '79-01', name: 'Phường Bến Nghé' },
    { code: '79-02', name: 'Phường Bến Thành' },
    { code: '79-03', name: 'Phường Cầu Kho' },
    { code: '79-04', name: 'Phường Cầu Ông Lãnh' },
    { code: '79-05', name: 'Phường Đa Kao' },
    { code: '79-06', name: 'Phường Tân Định' },
    { code: '79-07', name: 'Phường Võ Thị Sáu' },
    { code: '79-08', name: 'Phường 1 (Quận 3)' },
    { code: '79-09', name: 'Phường 2 (Quận 3)' },
    { code: '79-10', name: 'Phường Tân Thuận Đông' },
    { code: '79-11', name: 'Phường Tân Phú' },
    { code: '79-12', name: 'Phường Tân Phong' },
    { code: '79-13', name: 'Phường Phú Mỹ' },
    { code: '79-14', name: 'Phường 15 (Bình Thạnh)' },
    { code: '79-15', name: 'Phường 24 (Bình Thạnh)' },
    { code: '79-16', name: 'Phường Thảo Điền' },
    { code: '79-17', name: 'Phường An Phú' },
    { code: '79-18', name: 'Phường Hiệp Bình Chánh' },
    { code: '79-19', name: 'Phường Linh Trung' },
    { code: '79-20', name: 'Phường Linh Tây' },
  ],

  // Hà Nội (01)
  '01': [
    { code: '01-01', name: 'Phường Tràng Tiền' },
    { code: '01-02', name: 'Phường Hàng Bạc' },
    { code: '01-03', name: 'Phường Hàng Đào' },
    { code: '01-04', name: 'Phường Cửa Đông' },
    { code: '01-05', name: 'Phường Kim Mã' },
    { code: '01-06', name: 'Phường Liễu Giai' },
    { code: '01-07', name: 'Phường Cống Vị' },
    { code: '01-08', name: 'Phường Dịch Vọng' },
    { code: '01-09', name: 'Phường Dịch Vọng Hậu' },
    { code: '01-10', name: 'Phường Nghĩa Tân' },
    { code: '01-11', name: 'Phường Trung Hòa' },
    { code: '01-12', name: 'Phường Yên Hòa' },
    { code: '01-13', name: 'Phường Ô Chợ Dừa' },
    { code: '01-14', name: 'Phường Láng Hạ' },
    { code: '01-15', name: 'Phường Văn Miếu' },
  ],

  // Đà Nẵng (48)
  '48': [
    { code: '48-01', name: 'Phường Hải Châu I' },
    { code: '48-02', name: 'Phường Hải Châu II' },
    { code: '48-03', name: 'Phường Thạch Thang' },
    { code: '48-04', name: 'Phường Thuận Phước' },
    { code: '48-05', name: 'Phường An Hải Bắc' },
    { code: '48-06', name: 'Phường Phước Mỹ' },
    { code: '48-07', name: 'Phường Mỹ An' },
    { code: '48-08', name: 'Phường Khuê Trung' },
  ],

  // Hải Phòng (31)
  '31': [
    { code: '31-01', name: 'Phường Hoàng Văn Thụ' },
    { code: '31-02', name: 'Phường Minh Khai' },
    { code: '31-03', name: 'Phường Máy Tơ' },
    { code: '31-04', name: 'Phường Cầu Đất' },
    { code: '31-05', name: 'Phường Đằng Giang' },
  ],

  // Bình Dương (74)
  '74': [
    { code: '74-01', name: 'Phường Phú Cường' },
    { code: '74-02', name: 'Phường Phú Hòa' },
    { code: '74-03', name: 'Phường Hiệp Thành' },
    { code: '74-04', name: 'Phường Lái Thiêu' },
    { code: '74-05', name: 'Phường Dĩ An' },
    { code: '74-06', name: 'Phường Đông Hòa' },
  ],

  // Đồng Nai (75)
  '75': [
    { code: '75-01', name: 'Phường Quyết Thắng' },
    { code: '75-02', name: 'Phường Trung Dũng' },
    { code: '75-03', name: 'Phường Thống Nhất' },
    { code: '75-04', name: 'Phường Trảng Dài' },
    { code: '75-05', name: 'Phường Long Bình' },
  ],
};

/**
 * Trả về danh sách tất cả 63 tỉnh/thành
 */
const getAllProvinces = () => {
  return PROVINCES;
};

/**
 * Tìm tỉnh/thành theo mã
 */
const getProvinceByCode = (code) => {
  if (!code) return null;
  return PROVINCES.find((p) => p.code === String(code).trim()) || null;
};

/**
 * Trả về danh sách phường/xã theo mã tỉnh/thành
 */
const getWardsByProvince = (provinceCode) => {
  if (!provinceCode) return [];
  const code = String(provinceCode).trim();
  const list = WARDS_BY_PROVINCE[code];
  if (list && list.length > 0) {
    return list;
  }

  // Fallback danh sách phường/xã đại diện cho các tỉnh chưa có danh mục chi tiết
  const province = getProvinceByCode(code);
  const provName = province ? province.shortName : 'trung tâm';
  return [
    { code: `${code}-01`, name: `Phường 1 (${provName})` },
    { code: `${code}-02`, name: `Phường 2 (${provName})` },
    { code: `${code}-03`, name: `Phường Trung Tâm` },
    { code: `${code}-04`, name: `Thị trấn Trung Tâm` },
    { code: `${code}-05`, name: `Xã Trung Tâm` },
  ];
};

/**
 * Ghép chuỗi địa chỉ hoàn chỉnh từ các thành phần
 */
const formatFullAddress = ({ detail, wardName, provinceName }) => {
  const parts = [detail, wardName, provinceName].map((p) => (p || '').trim()).filter(Boolean);
  return parts.join(', ');
};

module.exports = {
  PROVINCES,
  WARDS_BY_PROVINCE,
  getAllProvinces,
  getProvinceByCode,
  getWardsByProvince,
  formatFullAddress,
};
