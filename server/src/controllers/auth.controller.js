const { Account, User, CaregiverProfile } = require('../models');
const {
  generateOTP,
  sendOtpEmail,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/otp.util');

/**
 * 1. Đăng ký tài khoản người dùng mới (kèm xác thực Email OTP)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate đầu vào bắt buộc
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: email, mật khẩu, họ tên và số điện thoại.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra xem email đã tồn tại chưa
    const existingAccount = await Account.findOne({ email: normalizedEmail });

    if (existingAccount) {
      // Trường hợp 1: Tài khoản đã xác thực email thành công trước đó
      if (existingAccount.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email này đã được đăng ký và xác thực trên hệ thống. Vui lòng đăng nhập.',
        });
      }

      // Trường hợp 2: Tài khoản đã tạo nhưng chưa xác thực email -> Cập nhật mật khẩu mới và sinh lại OTP
      const newOtpCode = generateOTP(6);
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      existingAccount.passwordHash = password; // Sẽ tự băm bởi pre-save hook
      existingAccount.otpCode = newOtpCode;
      existingAccount.otpExpiresAt = otpExpiresAt;
      existingAccount.status = 'UNVERIFIED';
      await existingAccount.save();

      // Cập nhật thông tin User nếu có thay đổi
      await User.findOneAndUpdate(
        { accountId: existingAccount._id },
        { fullName: fullName.trim(), phone: phone.trim() },
        { upsert: true, new: true }
      );

      // Gửi email OTP mới
      await sendOtpEmail(normalizedEmail, newOtpCode, 'Đăng ký tài khoản CareLink');

      return res.status(200).json({
        success: true,
        message: 'Tài khoản chưa được kích hoạt trước đó. Mã OTP mới đã được gửi tới email của bạn.',
        data: {
          email: normalizedEmail,
          otpExpiresAt,
        },
      });
    }

    // Trường hợp 3: Người dùng hoàn toàn mới
    const otpCode = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Tạo bản ghi Account mới
    const newAccount = new Account({
      email: normalizedEmail,
      passwordHash: password,
      role: 'CUSTOMER',
      isEmailVerified: false,
      status: 'UNVERIFIED',
      otpCode,
      otpExpiresAt,
    });
    await newAccount.save();

    // Tạo bản ghi User tương ứng
    const newUser = new User({
      accountId: newAccount._id,
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    await newUser.save();

    // Gửi email chứa mã OTP
    await sendOtpEmail(normalizedEmail, otpCode, 'Đăng ký tài khoản CareLink');

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực (hiệu lực 5 phút).',
      data: {
        email: normalizedEmail,
        otpExpiresAt,
      },
    });
  } catch (error) {
    console.error('Lỗi API register:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ trong quá trình đăng ký tài khoản.',
      error: error.message,
    });
  }
};

/**
 * 2. Xác thực mã OTP và tự động đăng nhập
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã OTP.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const account = await Account.findOne({ email: normalizedEmail });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này.',
      });
    }

    if (account.isEmailVerified && account.status !== 'UNVERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập.',
      });
    }

    // Kiểm tra mã OTP
    if (!account.otpCode || account.otpCode !== otpCode.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
      });
    }

    // Kiểm tra thời hạn OTP
    if (!account.otpExpiresAt || account.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.',
        isExpired: true,
      });
    }

    // Cập nhật trạng thái tài khoản thành ACTIVE
    account.isEmailVerified = true;
    account.status = 'ACTIVE';
    account.otpCode = null;
    account.otpExpiresAt = null;
    account.lastLoginAt = new Date();

    // Sinh cặp Access Token và Refresh Token
    const tokenPayload = {
      accountId: account._id,
      role: account.role,
      status: account.status,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ accountId: account._id });

    account.refreshToken = refreshToken;
    await account.save();

    // Lấy thông tin hồ sơ User
    const userProfile = await User.findOne({ accountId: account._id });

    return res.status(200).json({
      success: true,
      message: 'Xác thực tài khoản thành công! Chào mừng bạn đến với CareLink.',
      data: {
        account: {
          _id: account._id,
          email: account.email,
          role: account.role,
          status: account.status,
          reputationScore: account.reputationScore,
          isEmailVerified: account.isEmailVerified,
          lastLoginAt: account.lastLoginAt,
        },
        user: userProfile,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Lỗi API verifyOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác thực OTP.',
      error: error.message,
    });
  }
};

/**
 * 3. Gửi lại mã OTP
 * POST /api/auth/resend-otp
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email nhận mã OTP.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const account = await Account.findOne({ email: normalizedEmail });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này.',
      });
    }

    if (account.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực email trước đó. Bạn có thể đăng nhập ngay.',
      });
    }

    // Sinh mã OTP 6 số mới và gia hạn 5 phút
    const otpCode = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    account.otpCode = otpCode;
    account.otpExpiresAt = otpExpiresAt;
    await account.save();

    // Gửi email OTP
    await sendOtpEmail(normalizedEmail, otpCode, 'Xác thực tài khoản CareLink');

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực OTP mới đã được gửi tới email của bạn.',
      data: {
        email: normalizedEmail,
        otpExpiresAt,
      },
    });
  } catch (error) {
    console.error('Lỗi API resendOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gửi lại mã OTP.',
      error: error.message,
    });
  }
};

/**
 * 4. Đăng nhập hệ thống (Kiểm tra nghiêm ngặt 6 bước)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email và mật khẩu.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Kiểm tra email và password với passwordHash
    const account = await Account.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // 2. Kiểm tra xác thực email (chưa OTP -> 403 needVerification)
    if (!account.isEmailVerified || account.status === 'UNVERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa hoàn tất xác thực email. Vui lòng nhập mã OTP để kích hoạt.',
        needVerification: true,
        data: {
          email: account.email,
        },
      });
    }

    // 3. Kiểm tra khóa nick vĩnh viễn (BANNED)
    if (account.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm nghiêm trọng chính sách của CareLink.',
        isBanned: true,
      });
    }

    // 4. Kiểm tra tạm khóa (SUSPENDED do uy tín < 50)
    // Vẫn cho đăng nhập để xem lịch sử nhưng gửi cờ cảnh báo isSuspended
    const isSuspended = account.status === 'SUSPENDED' || account.reputationScore < 50;

    // 5. Cập nhật lastLoginAt, sinh accessToken & refreshToken
    account.lastLoginAt = new Date();

    const tokenPayload = {
      accountId: account._id,
      role: account.role,
      status: account.status,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ accountId: account._id });

    account.refreshToken = refreshToken;
    await account.save();

    // 6. Lấy thông tin User và CaregiverProfile (nếu có)
    const userProfile = await User.findOne({ accountId: account._id });
    const caregiverProfile = await CaregiverProfile.findOne({ accountId: account._id });

    return res.status(200).json({
      success: true,
      message: isSuspended
        ? 'Đăng nhập thành công (Lưu ý: Tài khoản của bạn đang bị tạm khóa tính năng do điểm uy tín dưới 50).'
        : 'Đăng nhập thành công!',
      isSuspended,
      data: {
        account: {
          _id: account._id,
          email: account.email,
          role: account.role,
          status: account.status,
          reputationScore: account.reputationScore,
          isEmailVerified: account.isEmailVerified,
          lastLoginAt: account.lastLoginAt,
        },
        user: userProfile,
        caregiverProfile: caregiverProfile || null,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Lỗi API login:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập.',
      error: error.message,
    });
  }
};

/**
 * 5. Đăng xuất tài khoản
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    if (req.account) {
      req.account.refreshToken = null;
      await req.account.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công.',
    });
  } catch (error) {
    console.error('Lỗi API logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng xuất.',
      error: error.message,
    });
  }
};

/**
 * 6. Đăng ký trở thành Cộng tác viên (Caregiver)
 * POST /api/auth/register-caregiver
 * Yêu cầu: Đã đăng nhập (verifyToken) & Tài khoản ACTIVE (checkAccountActive)
 */
const registerCaregiver = async (req, res) => {
  try {
    const account = req.account;
    const user = req.user;

    const {
      idCardNumber,
      idCardImages,
      experienceYears,
      skills,
      serviceAreas,
      pricing,
      bio,
      gender,
      age,
    } = req.body;

    // Validate các trường bắt buộc
    if (!idCardNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số CMND/CCCD.',
      });
    }

    if (!pricing || pricing.hourlyRate === undefined || pricing.dailyRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cấu hình bảng giá tối thiểu: giá theo giờ (hourlyRate) và giá theo ngày (dailyRate).',
      });
    }

    // Kiểm tra xem accountId này đã có hồ sơ trong CaregiverProfile chưa
    const existingProfile = await CaregiverProfile.findOne({ accountId: account._id });

    if (existingProfile) {
      if (existingProfile.approvalStatus === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Hồ sơ đăng ký Cộng tác viên của bạn đang trong trạng thái chờ xét duyệt. Vui lòng kiên nhẫn đợi quản trị viên xử lý.',
          data: existingProfile,
        });
      }

      if (existingProfile.approvalStatus === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản của bạn đã được duyệt làm Cộng tác viên chính thức của CareLink.',
          data: existingProfile,
        });
      }

      // Nếu hồ sơ từng bị REJECTED -> Cho phép cập nhật lại thông tin để gửi duyệt lại
      existingProfile.fullName = req.body.fullName || (user ? user.fullName : '');
      existingProfile.phone = req.body.phone || (user ? user.phone : '');
      existingProfile.avatarUrl = req.body.avatarUrl || (user ? user.avatarUrl : '');
      existingProfile.idCardNumber = idCardNumber.trim();
      existingProfile.idCardImages = Array.isArray(idCardImages) ? idCardImages : [];
      existingProfile.experienceYears = Number(experienceYears) || 0;
      existingProfile.skills = Array.isArray(skills) ? skills : [];
      existingProfile.serviceAreas = Array.isArray(serviceAreas) ? serviceAreas : [];
      existingProfile.pricing = {
        hourlyRate: Number(pricing.hourlyRate) || 0,
        dailyRate: Number(pricing.dailyRate) || 0,
        weeklyRate: pricing.weeklyRate ? Number(pricing.weeklyRate) : null,
        monthlyRate: pricing.monthlyRate ? Number(pricing.monthlyRate) : null,
      };
      existingProfile.bio = bio ? bio.trim() : '';
      if (gender) existingProfile.gender = gender;
      if (age) existingProfile.age = Number(age);
      existingProfile.approvalStatus = 'PENDING'; // Chuyển lại về PENDING để Admin duyệt lại

      await existingProfile.save();

      return res.status(200).json({
        success: true,
        message: 'Đã gửi lại hồ sơ đăng ký Cộng tác viên thành công! Vui lòng chờ quản trị viên xét duyệt.',
        data: existingProfile,
      });
    }

    // Tạo bản ghi mới trong CaregiverProfile
    const newCaregiverProfile = new CaregiverProfile({
      accountId: account._id,
      userId: user ? user._id : null,
      fullName: req.body.fullName || (user ? user.fullName : ''),
      phone: req.body.phone || (user ? user.phone : ''),
      avatarUrl: req.body.avatarUrl || (user ? user.avatarUrl : ''),
      idCardNumber: idCardNumber.trim(),
      idCardImages: Array.isArray(idCardImages) ? idCardImages : [],
      experienceYears: Number(experienceYears) || 0,
      skills: Array.isArray(skills) ? skills : [],
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      pricing: {
        hourlyRate: Number(pricing.hourlyRate) || 0,
        dailyRate: Number(pricing.dailyRate) || 0,
        weeklyRate: pricing.weeklyRate ? Number(pricing.weeklyRate) : null,
        monthlyRate: pricing.monthlyRate ? Number(pricing.monthlyRate) : null,
      },
      bio: bio ? bio.trim() : '',
      gender: gender || (user ? user.gender : 'OTHER'),
      age: age ? Number(age) : undefined,
      approvalStatus: 'PENDING', // Mặc định chờ Admin duyệt
    });

    await newCaregiverProfile.save();

    // Lưu ý: role trong Account vẫn giữ là 'CUSTOMER' cho đến khi Admin chuyển thành 'APPROVED'
    return res.status(201).json({
      success: true,
      message: 'Nộp hồ sơ đăng ký Cộng tác viên thành công! Quản trị viên sẽ kiểm tra hồ sơ và phê duyệt trong thời gian sớm nhất.',
      data: newCaregiverProfile,
    });
  } catch (error) {
    console.error('Lỗi API registerCaregiver:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký trở thành Cộng tác viên.',
      error: error.message,
    });
  }
};

/**
 * 7. Lấy thông tin tài khoản hiện tại (Me Profile)
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        account: {
          _id: req.account._id,
          email: req.account.email,
          role: req.account.role,
          status: req.account.status,
          reputationScore: req.account.reputationScore,
          isEmailVerified: req.account.isEmailVerified,
          lastLoginAt: req.account.lastLoginAt,
        },
        user: req.user,
        caregiverProfile: req.caregiverProfile || null,
      },
    });
  } catch (error) {
    console.error('Lỗi API getMe:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin người dùng.',
      error: error.message,
    });
  }
};

/**
 * 8. Làm mới Access Token (Refresh Token)
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Refresh Token.',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Refresh Token không hợp lệ hoặc đã hết hạn.',
      });
    }

    const account = await Account.findById(decoded.accountId);
    if (!account || account.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh Token đã bị thu hồi hoặc không khớp.',
      });
    }

    const newAccessToken = generateAccessToken({
      accountId: account._id,
      role: account.role,
      status: account.status,
    });

    return res.status(200).json({
      success: true,
      message: 'Cấp mới Access Token thành công.',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Lỗi API refreshToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cấp lại token.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  registerCaregiver,
  getMe,
  refreshToken,
};
