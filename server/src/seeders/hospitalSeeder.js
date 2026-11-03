const Hospital = require('../models/Hospital');

const defaultHospitals = [
  {
    code: 'BVDKTWCT',
    name: 'Bệnh viện Đa khoa Trung ương Cần Thơ',
    provinceCode: 'CT',
    provinceName: 'Cần Thơ',
    wardCode: 'AK',
    wardName: 'An Khánh',
    address: '315 Nguyễn Văn Linh, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ',
    location: {
      type: 'Point',
      coordinates: [105.7538, 10.0345],
    },
    departments: [
      'Hồi sức tích cực - Chống độc (ICU)',
      'Nội tim mạch & Can thiệp',
      'Nội thần kinh & Đột quỵ',
      'Lão khoa - Chăm sóc người cao tuổi',
      'Nội tiết & Tiểu đường',
      'Chấn thương chỉnh hình',
      'Ngoại tổng hợp',
      'Hô hấp',
    ],
    rules: {
      visitingHours: '06:00 - 21:00',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Người chăm sóc phải đeo thẻ nuôi bệnh, test sàng lọc theo quy định của viện.',
    },
    isActive: true,
  },
  {
    code: 'BVDKTPCT',
    name: 'Bệnh viện Đa khoa Thành phố Cần Thơ',
    provinceCode: 'CT',
    provinceName: 'Cần Thơ',
    wardCode: 'NK',
    wardName: 'Ninh Kiều',
    address: '04 Châu Văn Liêm, Phường An Lạc, Quận Ninh Kiều, TP. Cần Thơ',
    location: {
      type: 'Point',
      coordinates: [105.7828, 10.0321],
    },
    departments: [
      'Cấp cứu - Hồi sức tích cực',
      'Nội tim mạch',
      'Nội tổng hợp',
      'Lão học',
      'Y học cổ truyền - Phục hồi chức năng',
      'Thận nhân tạo - Lọc máu',
    ],
    rules: {
      visitingHours: '06:30 - 20:30',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Mỗi bệnh nhân chỉ được 1 người chăm sóc ở lại ban đêm.',
    },
    isActive: true,
  },
  {
    code: 'BVQY121',
    name: 'Bệnh viện Quân Y 121 (Quân khu 9)',
    provinceCode: 'CT',
    provinceName: 'Cần Thơ',
    wardCode: 'NK',
    wardName: 'Ninh Kiều',
    address: '01 Đường 30/4, Phường An Lạc, Quận Ninh Kiều, TP. Cần Thơ',
    location: {
      type: 'Point',
      coordinates: [105.7812, 10.0298],
    },
    departments: [
      'Nội khoa chung',
      'Hồi sức cấp cứu',
      'Ngoại chấn thương - Chỉnh hình',
      'Vật lý trị liệu & Phục hồi chức năng',
      'Khoa Lão khoa',
    ],
    rules: {
      visitingHours: '07:00 - 21:00',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Khuôn viên quân đội, yêu cầu xuất trình CCCD tại cổng bảo vệ.',
    },
    isActive: true,
  },
  {
    code: 'BVUBCT',
    name: 'Bệnh viện Ung Bướu TP. Cần Thơ',
    provinceCode: 'CT',
    provinceName: 'Cần Thơ',
    wardCode: 'CR',
    wardName: 'Cái Răng',
    address: 'Đường Trần Chiên, Phường Lê Bình, Quận Cái Răng, TP. Cần Thơ',
    location: {
      type: 'Point',
      coordinates: [105.7482, 10.0025],
    },
    departments: [
      'Nội ung bướu',
      'Chăm sóc giảm nhẹ (Palliative Care)',
      'Xạ trị',
      'Ngoại ung bướu',
    ],
    rules: {
      visitingHours: '06:00 - 20:00',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Cần tuân thủ quy định vô trùng đối với bệnh nhân suy giảm miễn dịch.',
    },
    isActive: true,
  },
  {
    code: 'BVCR',
    name: 'Bệnh viện Chợ Rẫy TP.HCM',
    provinceCode: 'SG',
    provinceName: 'TP. Hồ Chí Minh',
    wardCode: 'Q5',
    wardName: 'Quận 5',
    address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
    location: {
      type: 'Point',
      coordinates: [106.6598, 10.7578],
    },
    departments: [
      'Hồi sức cấp cứu',
      'Tim mạch can thiệp',
      'Thần kinh - Đột quỵ',
      'Lão khoa',
      'Chấn thương chỉnh hình',
    ],
    rules: {
      visitingHours: '07:00 - 21:00',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Thẻ nuôi bệnh do Khoa cấp phát, đổi ca tại bàn trực điều dưỡng.',
    },
    isActive: true,
  },
  {
    code: 'BVDHYD',
    name: 'Bệnh viện Đại học Y Dược TP.HCM',
    provinceCode: 'SG',
    provinceName: 'TP. Hồ Chí Minh',
    wardCode: 'Q5',
    wardName: 'Quận 5',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    location: {
      type: 'Point',
      coordinates: [106.6601, 10.7554],
    },
    departments: [
      'Nội tiết - Đái tháo đường',
      'Lão khoa',
      'Tim mạch',
      'Thần kinh',
      'Hô hấp',
    ],
    rules: {
      visitingHours: '06:00 - 21:30',
      overnightAllowed: true,
      caregiverPassRequired: true,
      notes: 'Bệnh viện thông minh có đăng ký người nuôi bệnh qua ứng dụng hoặc quầy lễ tân.',
    },
    isActive: true,
  },
];

const seedHospitals = async () => {
  for (const item of defaultHospitals) {
    await Hospital.findOneAndUpdate(
      { code: item.code },
      { $set: item },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Đã seed thành công ${defaultHospitals.length} bệnh viện tiêu chuẩn.`);
};

module.exports = {
  seedHospitals,
  defaultHospitals,
};

