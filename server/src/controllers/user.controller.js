const bcrypt = require('bcryptjs');
const { User, Account, CaregiverProfile, ReputationLog } = require('../models');
const {
  formatFullAddress,
} = require('../data/vietnamAdministrative');
const {
  getAdministrativeProvinces: fetchAdministrativeProvinces,
  getAdministrativeWards: fetchAdministrativeWards,
} = require('../services/administrativeService');
const { migrateSingleUserAddresses } = require('../utils/userAddressMigration');

// Regex kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)
const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/**
 * 1. Lấy thông tin hồ sơ người dùng hiện tại
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const account = req.account;
    let user = await User.findOne({ accountId: account._id });

    // Tự động chuyển đổi địa chỉ cũ nếu user chưa có sổ địa chỉ mới
    if (user) {
      const migrated = await migrateSingleUserAddresses(user);
      if (migrated) {
        user = await User.findOne({ accountId: account._id });
      }
    }

    const caregiverProfile = req.caregiverProfile;

    return res.status(200).json({
      success: true,
      data: {
        account: {
          _id: account._id,
          email: account.email,
          role: account.role,
          status: account.status,
          reputationScore: account.reputationScore,
          isEmailVerified: account.isEmailVerified,
          lastLoginAt: account.lastLoginAt,
          createdAt: account.createdAt,
        },
        user,
        caregiverProfile: caregiverProfile || null,
      },
    });
  } catch (error) {
    console.error('Lỗi getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin hồ sơ.',
      error: error.message,
    });
  }
};

/**
 * 2. Cập nhật thông tin hồ sơ cá nhân
 * PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const account = req.account;
    const { fullName, phone, avatarUrl, gender, dateOfBirth } = req.body;

    // Validate họ và tên
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên không được để trống.',
      });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên phải có ít nhất 2 ký tự.',
      });
    }

    // Validate số điện thoại
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không được để trống.',
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!VIETNAMESE_PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567).',
      });
    }

    // Validate giới tính
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    const chosenGender = validGenders.includes(gender) ? gender : 'OTHER';

    // Validate ngày sinh
    let parsedDOB = null;
    if (dateOfBirth) {
      parsedDOB = new Date(dateOfBirth);
      if (isNaN(parsedDOB.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ.',
        });
      }
      if (parsedDOB > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không thể nằm trong tương lai.',
        });
      }
    }

    // Cập nhật thông tin User (không can thiệp role, reputationScore)
    const updatedUser = await User.findOneAndUpdate(
      { accountId: account._id },
      {
        fullName: fullName.trim(),
        phone: cleanPhone,
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : (req.user?.avatarUrl || ''),
        gender: chosenGender,
        dateOfBirth: parsedDOB,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Đồng bộ sang CaregiverProfile nếu tài khoản này là đối tác
    let updatedCaregiver = null;
    if (account.role === 'CAREGIVER') {
      updatedCaregiver = await CaregiverProfile.findOneAndUpdate(
        { accountId: account._id },
        {
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
          avatarUrl: updatedUser.avatarUrl,
          gender: updatedUser.gender,
        },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      data: {
        user: updatedUser,
        caregiverProfile: updatedCaregiver,
      },
    });
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật hồ sơ.',
      error: error.message,
    });
  }
};

/**
 * 3. Lấy danh sách địa chỉ của User
 * GET /api/user/addresses
 */
const getAddresses = async (req, res) => {
  try {
    const account = req.account;
    let user = await User.findOne({ accountId: account._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ người dùng không tồn tại.',
      });
    }

    await migrateSingleUserAddresses(user);

    return res.status(200).json({
      success: true,
      data: {
        addresses: user.addresses || [],
      },
    });
  } catch (error) {
    console.error('Lỗi getAddresses:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách địa chỉ.',
      error: error.message,
    });
  }
};

/**
 * 4. Thêm địa chỉ mới vào sổ địa chỉ
 * POST /api/user/addresses
 */
const addAddress = async (req, res) => {
  try {
    const account = req.account;
    const user = await User.findOne({ accountId: account._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ người dùng không tồn tại.',
      });
    }

    const {
      label = 'Nhà riêng',
      recipientName,
      phone,
      provinceCode,
      provinceName,
      wardCode,
      wardName,
      detail,
      location,
      isDefault,
    } = req.body;

    // Validation
    if (!recipientName || !recipientName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên người nhận.',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại người nhận.',
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!VIETNAMESE_PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không đúng định dạng Việt Nam.',
      });
    }

    if (!provinceName || !provinceName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn Tỉnh / Thành phố.',
      });
    }

    if (!wardName || !wardName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn Phường / Xã.',
      });
    }

    if (!detail || !detail.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).',
      });
    }

    // Xử lý tọa độ GeoJSON Point tùy chọn
    let geoPoint;
    if (
      location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2 &&
      typeof location.coordinates[0] === 'number' &&
      typeof location.coordinates[1] === 'number' &&
      !isNaN(location.coordinates[0]) &&
      !isNaN(location.coordinates[1])
    ) {
      const [lng, lat] = location.coordinates;
      if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        geoPoint = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    const fullAddress = formatFullAddress({
      detail: detail.trim(),
      wardName: wardName.trim(),
      provinceName: provinceName.trim(),
    });

    const isFirstAddress = !user.addresses || user.addresses.length === 0;
    const shouldBeDefault = Boolean(isDefault || isFirstAddress);

    // Nếu địa chỉ mới là mặc định, bỏ cờ default của các địa chỉ cũ
    if (shouldBeDefault && Array.isArray(user.addresses)) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddressItem = {
      label: ['Nhà riêng', 'Công ty', 'Khác'].includes(label) ? label : 'Nhà riêng',
      recipientName: recipientName.trim(),
      phone: cleanPhone,
      provinceCode: provinceCode ? String(provinceCode).trim() : '',
      provinceName: provinceName.trim(),
      wardCode: wardCode ? String(wardCode).trim() : '',
      wardName: wardName.trim(),
      detail: detail.trim(),
      fullAddress,
      location: geoPoint || undefined,
      isDefault: shouldBeDefault,
      isLegacyMigrated: false,
    };

    user.addresses.push(newAddressItem);
    await user.save();

    const createdAddress = user.addresses[user.addresses.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công!',
      data: {
        address: createdAddress,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('Lỗi addAddress:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thêm địa chỉ.',
      error: error.message,
    });
  }
};

/**
 * 5. Cập nhật địa chỉ trong sổ địa chỉ
 * PUT /api/user/addresses/:addressId
 */
const updateAddress = async (req, res) => {
  try {
    const account = req.account;
    const { addressId } = req.params;
    const user = await User.findOne({ accountId: account._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ người dùng không tồn tại.',
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ cần cập nhật.',
      });
    }

    const {
      label,
      recipientName,
      phone,
      provinceCode,
      provinceName,
      wardCode,
      wardName,
      detail,
      location,
      isDefault,
    } = req.body;

    if (recipientName !== undefined) {
      if (!recipientName.trim()) {
        return res.status(400).json({ success: false, message: 'Tên người nhận không được để trống.' });
      }
      address.recipientName = recipientName.trim();
    }

    if (phone !== undefined) {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      if (!VIETNAMESE_PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không đúng định dạng.' });
      }
      address.phone = cleanPhone;
    }

    if (label !== undefined && ['Nhà riêng', 'Công ty', 'Khác'].includes(label)) {
      address.label = label;
    }

    if (provinceName !== undefined) {
      if (!provinceName.trim()) {
        return res.status(400).json({ success: false, message: 'Tỉnh/Thành phố không được để trống.' });
      }
      address.provinceName = provinceName.trim();
    }
    if (provinceCode !== undefined) address.provinceCode = String(provinceCode).trim();

    if (wardName !== undefined) {
      if (!wardName.trim()) {
        return res.status(400).json({ success: false, message: 'Phường/Xã không được để trống.' });
      }
      address.wardName = wardName.trim();
    }
    if (wardCode !== undefined) address.wardCode = String(wardCode).trim();

    if (detail !== undefined) {
      if (!detail.trim()) {
        return res.status(400).json({ success: false, message: 'Địa chỉ chi tiết không được để trống.' });
      }
      address.detail = detail.trim();
    }

    // Cập nhật lại fullAddress
    address.fullAddress = formatFullAddress({
      detail: address.detail,
      wardName: address.wardName,
      provinceName: address.provinceName,
    });

    // Cập nhật tọa độ
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      const [lng, lat] = location.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number' && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        address.location = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    // Đánh dấu đã chuẩn hóa nếu người dùng sửa địa chỉ cũ
    if (address.isLegacyMigrated) {
      address.isLegacyMigrated = false;
    }

    // Xử lý cờ isDefault
    if (isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (isDefault === false && address.isDefault) {
      // Không cho phép bỏ mặc định nếu đây là địa chỉ duy nhất
      if (user.addresses.length > 1) {
        address.isDefault = false;
        const another = user.addresses.find((a) => a._id.toString() !== addressId);
        if (another) another.isDefault = true;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công!',
      data: {
        address,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('Lỗi updateAddress:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật địa chỉ.',
      error: error.message,
    });
  }
};

/**
 * 6. Xóa địa chỉ khỏi sổ địa chỉ
 * DELETE /api/user/addresses/:addressId
 */
const deleteAddress = async (req, res) => {
  try {
    const account = req.account;
    const { addressId } = req.params;
    const user = await User.findOne({ accountId: account._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ người dùng không tồn tại.',
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại hoặc đã bị xóa.',
      });
    }

    const wasDefault = address.isDefault;

    // Xóa địa chỉ
    user.addresses.pull({ _id: addressId });

    // Nếu địa chỉ bị xóa là địa chỉ mặc định, tự động gán địa chỉ đầu tiên còn lại làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công!',
      data: {
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('Lỗi deleteAddress:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa địa chỉ.',
      error: error.message,
    });
  }
};

/**
 * 7. Đặt địa chỉ làm mặc định
 * PATCH /api/user/addresses/:addressId/default
 */
const setDefaultAddress = async (req, res) => {
  try {
    const account = req.account;
    const { addressId } = req.params;
    const user = await User.findOne({ accountId: account._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ người dùng không tồn tại.',
      });
    }

    const targetAddress = user.addresses.id(addressId);
    if (!targetAddress) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại.',
      });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đã đặt làm địa chỉ mặc định thành công!',
      data: {
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('Lỗi setDefaultAddress:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đổi địa chỉ mặc định.',
      error: error.message,
    });
  }
};

/**
 * 8. Lấy danh sách tỉnh/thành sau sáp nhập
 * GET /api/user/administrative/provinces
 */
const getAdministrativeProvinces = async (req, res) => {
  try {
    const provinces = await fetchAdministrativeProvinces();
    return res.status(200).json({
      success: true,
      data: { provinces },
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Không thể tải danh mục tỉnh/thành hiện hành. Vui lòng thử lại sau.',
      error: error.message,
    });
  }
};

/**
 * 9. Lấy danh sách Phường / Xã theo Tỉnh/Thành
 * GET /api/user/administrative/wards?provinceCode=...
 */
const getAdministrativeWards = async (req, res) => {
  try {
    const { provinceCode } = req.query;
    if (!provinceCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã tỉnh/thành (provinceCode).',
      });
    }

    const wards = await fetchAdministrativeWards(provinceCode);
    return res.status(200).json({
      success: true,
      data: { wards },
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Không thể tải danh mục phường/xã hiện hành. Vui lòng thử lại sau.',
      error: error.message,
    });
  }
};

/**
 * 10. Đổi mật khẩu tài khoản
 * PUT /api/user/change-password
 */
const changePassword = async (req, res) => {
  try {
    const account = req.account;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
    }

    const fullAccount = await Account.findById(account._id).select('+passwordHash');
    if (!fullAccount) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại.',
      });
    }

    const isMatch = await fullAccount.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ.',
      });
    }

    fullAccount.passwordHash = newPassword;
    await fullAccount.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.',
    });
  } catch (error) {
    console.error('Lỗi changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đổi mật khẩu.',
      error: error.message,
    });
  }
};

/**
 * 11. Lấy lịch sử biến động điểm uy tín
 * GET /api/user/reputation-logs
 */
const getReputationLogs = async (req, res) => {
  try {
    const account = req.account;

    const logs = await ReputationLog.find({ accountId: account._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        currentScore: account.reputationScore,
        accountStatus: account.status,
        logs,
      },
    });
  } catch (error) {
    console.error('Lỗi getReputationLogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch sử điểm uy tín.',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAdministrativeProvinces,
  getAdministrativeWards,
  changePassword,
  getReputationLogs,
};
