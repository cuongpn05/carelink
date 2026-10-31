const jwt = require('jsonwebtoken');
const { Account, User, CaregiverProfile } = require('../models');

/**
 * Middleware: Xác thực Access Token JWT từ Header Authorization
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'carelink_jwt_access_secret_key_2026_xyz';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          isExpired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Mã xác thực không hợp lệ.',
      });
    }

    // Tìm tài khoản trong database
    const account = await Account.findById(decoded.accountId);
    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản liên kết không tồn tại hoặc đã bị xóa.',
      });
    }

    // Kiểm tra tài khoản bị cấm
    if (account.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.',
        isBanned: true,
      });
    }

    // Lấy thông tin hồ sơ User và CaregiverProfile nếu có
    const userProfile = await User.findOne({ accountId: account._id });
    const caregiverProfileConditions = [{ accountId: account._id }];
    if (userProfile) caregiverProfileConditions.push({ userId: userProfile._id });
    const caregiverProfile = await CaregiverProfile.findOne({
      $or: caregiverProfileConditions,
    });

    // Gắn thông tin vào request
    req.account = account;
    req.user = userProfile;
    req.caregiverProfile = caregiverProfile;

    next();
  } catch (error) {
    console.error('Lỗi middleware verifyToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác thực phiên đăng nhập.',
      error: error.message,
    });
  }
};

/**
 * Middleware: Kiểm tra tài khoản có đủ điều kiện hoạt động bình thường hay không
 * Chặn các tài khoản có status === 'SUSPENDED' hoặc reputationScore < 50 khi đặt/nhận lịch
 */
const checkAccountActive = (req, res, next) => {
  if (!req.account) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập trước khi thực hiện thao tác này.',
    });
  }

  // 1. Kiểm tra xác thực email
  if (!req.account.isEmailVerified || req.account.status === 'UNVERIFIED') {
    return res.status(403).json({
      success: false,
      message: 'Tài khoản chưa hoàn tất xác thực email. Vui lòng nhập mã OTP.',
      needVerification: true,
    });
  }

  // 2. Kiểm tra trạng thái khóa do điểm uy tín
  if (req.account.status === 'SUSPENDED' || req.account.reputationScore < 50) {
    return res.status(403).json({
      success: false,
      message: 'Tài khoản của bạn đang bị tạm khóa tính năng (điểm uy tín dưới 50 do hủy lịch nhiều lần).',
      isSuspended: true,
      reputationScore: req.account.reputationScore,
    });
  }

  next();
};

/**
 * Middleware: Phân quyền theo vai trò (Role Authorization)
 * @param  {...string} roles - Ví dụ: 'CUSTOMER', 'CAREGIVER', 'ADMIN'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu xác thực tài khoản.',
      });
    }

    if (!roles.includes(req.account.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập chức năng này (yêu cầu vai trò: ${roles.join(', ')}).`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkAccountActive,
  authorizeRoles,
};
