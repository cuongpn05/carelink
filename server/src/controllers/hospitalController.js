const Hospital = require('../models/Hospital');

/**
 * Lấy danh sách bệnh viện (có thể lọc theo tỉnh/thành)
 * GET /api/hospitals?provinceCode=...
 */
const getHospitals = async (req, res) => {
  try {
    const { provinceCode, keyword } = req.query;

    const query = { isActive: true };

    if (provinceCode && typeof provinceCode === 'string') {
      query.provinceCode = provinceCode.trim().toUpperCase();
    }

    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      const searchRegex = new RegExp(keyword.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { code: searchRegex },
      ];
    }

    const hospitals = await Hospital.find(query)
      .select('code name provinceCode provinceName wardCode wardName address location departments rules isActive')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error('getHospitals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bệnh viện.',
    });
  }
};

/**
 * Lấy chi tiết bệnh viện theo ID hoặc Mã viện
 * GET /api/hospitals/:id
 */
const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { code: id.toUpperCase() };

    const hospital = await Hospital.findOne(query).lean();

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện.',
      });
    }

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error('getHospitalById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bệnh viện.',
    });
  }
};

module.exports = {
  getHospitals,
  getHospitalById,
};

