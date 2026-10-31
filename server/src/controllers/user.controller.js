const bcrypt = require('bcryptjs');
const { User, Account, CaregiverProfile, ReputationLog } = require('../models');

/**
 * 1. Lấy thông tin hồ sơ người dùng hiện tại
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const account = req.account;
    const user = req.user;
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
    const {
      fullName,
      phone,
      avatarUrl,
      gender,
      dateOfBirth,
      defaultAddress,
    } = req.body;

    // Validate họ tên và số điện thoại
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên không được để trống.',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không được để trống.',
      });
    }

    // Cập nhật hoặc tạo mới bản ghi User
    const updatedUser = await User.findOneAndUpdate(
      { accountId: account._id },
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : (req.user?.avatarUrl || ''),
        gender: gender || 'OTHER',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        defaultAddress: {
          city: defaultAddress?.city?.trim() || '',
          district: defaultAddress?.district?.trim() || '',
          ward: defaultAddress?.ward?.trim() || '',
          detail: defaultAddress?.detail?.trim() || '',
        },
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
 * 3. Đổi mật khẩu tài khoản
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

    // Lấy account kèm passwordHash
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

    // Gán mật khẩu mới (pre-save hook trong Account.js sẽ tự băm bcrypt)
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
 * 4. Lấy lịch sử biến động điểm uy tín
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
  changePassword,
  getReputationLogs,
};
