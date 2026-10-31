const bcrypt = require('bcryptjs');
const {
  Account,
  User,
  CaregiverProfile,
  PendingRegistration,
} = require('../models');
const {
  generateOTP,
  sendOtpEmail,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/otp.util');

/**
 * 1. Đăng ký tài khoản người dùng mới (Chỉ lưu vào bảng tạm PendingRegistration)
 * Mặc định tất cả người dùng đăng ký đều là Khách hàng (CUSTOMER).
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

    // Kiểm tra xem email đã được kích hoạt trong bảng Account chính thức chưa
    const existingAccount = await Account.findOne({ email: normalizedEmail });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký và kích hoạt trên hệ thống. Vui lòng đăng nhập.',
      });
    }

    // Băm mật khẩu để lưu an toàn vào bảng tạm
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Sinh mã OTP 6 số và thời hạn 5 phút
    const otpCode = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu / Cập nhật vào bảng tạm PendingRegistration (TTL tự động hủy sau 5 phút)
    // TUYỆT ĐỐI CHƯA LƯU VÀO BẢNG Account VÀ User!
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone.trim(),
        otpCode,
        otpExpiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Gửi email chứa mã OTP
    await sendOtpEmail(normalizedEmail, otpCode, 'Đăng ký tài khoản CareLink');

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực OTP đã được gửi tới email của bạn (hiệu lực 5 phút).',
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
 * 2. Xác thực mã OTP -> LÚC NÀY MỚI CHÍNH THỨC TẠO TÀI KHOẢN VÀO DB
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

    // 1. Kiểm tra nếu tài khoản đã tồn tại trong Account chính thức
    const existingAccount = await Account.findOne({ email: normalizedEmail });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập.',
      });
    }

    // 2. Tìm yêu cầu đăng ký trong bảng tạm PendingRegistration
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu xác thực không tồn tại hoặc đã hết hạn (quá 5 phút). Vui lòng đăng ký lại.',
        isExpired: true,
      });
    }

    // 3. Kiểm tra thời hạn OTP
    if (pending.otpExpiresAt < new Date()) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.',
        isExpired: true,
      });
    }

    // 4. Kiểm tra mã OTP
    if (pending.otpCode !== otpCode.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
      });
    }

    // === 5. BƯỚC QUAN TRỌNG: LÚC NÀY MỚI LƯU CHÍNH THỨC VÀO DB (Account & User) ===
    const newAccount = new Account({
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: 'CUSTOMER',
      isEmailVerified: true,
      status: 'ACTIVE',
      reputationScore: 100,
      lastLoginAt: new Date(),
    });
    await newAccount.save();

    const newUser = new User({
      accountId: newAccount._id,
      fullName: pending.fullName,
      phone: pending.phone,
      role: 'customer',
      isActive: true,
    });
    await newUser.save();

    // 6. Xóa bản ghi trong bảng tạm để làm sạch dữ liệu
    await PendingRegistration.deleteOne({ _id: pending._id });

    // 7. Sinh cặp Access Token và Refresh Token
    const tokenPayload = {
      accountId: newAccount._id,
      role: newAccount.role,
      status: newAccount.status,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ accountId: newAccount._id });

    newAccount.refreshToken = refreshToken;
    await newAccount.save();

    return res.status(200).json({
      success: true,
      message: 'Xác thực tài khoản thành công! Chào mừng bạn đến với CareLink.',
      data: {
        account: {
          _id: newAccount._id,
          email: newAccount.email,
          role: newAccount.role,
          status: newAccount.status,
          reputationScore: newAccount.reputationScore,
          isEmailVerified: newAccount.isEmailVerified,
          lastLoginAt: newAccount.lastLoginAt,
        },
        user: newUser,
        caregiverProfile: null,
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
 * 3. Gửi lại mã OTP (Cho yêu cầu đang chờ trong PendingRegistration)
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

    // Nếu đã có trong bảng Account chính thức
    const existingAccount = await Account.findOne({ email: normalizedEmail });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực trước đó. Bạn có thể đăng nhập ngay.',
      });
    }

    // Tìm trong bảng tạm PendingRegistration
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Yêu cầu đăng ký đã hết hạn (quá 5 phút) hoặc không tồn tại. Vui lòng quay lại đăng ký.',
      });
    }

    // Sinh mã OTP 6 số mới và gia hạn thêm 5 phút
    const otpCode = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    pending.otpCode = otpCode;
    pending.otpExpiresAt = otpExpiresAt;
    pending.createdAt = new Date();
    await pending.save();

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

    // 1. Kiểm tra email trong bảng Account chính thức
    const account = await Account.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!account) {
      // Kiểm tra xem có phải tài khoản đang chờ nhập OTP trong PendingRegistration không
      const pending = await PendingRegistration.findOne({ email: normalizedEmail });
      if (pending) {
        const isPendingMatch = await bcrypt.compare(password, pending.passwordHash);
        if (isPendingMatch) {
          return res.status(403).json({
            success: false,
            message: 'Tài khoản chưa hoàn tất xác thực email. Vui lòng nhập mã OTP để kích hoạt.',
            needVerification: true,
            data: {
              email: pending.email,
            },
          });
        }
      }

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

    // 2. Kiểm tra xác thực email (phòng ngừa dữ liệu cũ)
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
 * 6. Đăng ký trở thành Đối tác Caregiver (Nộp hồ sơ chờ phỏng vấn / duyệt)
 * POST /api/auth/register-caregiver
 * Yêu cầu: Đã đăng nhập (verifyToken) & Tài khoản ACTIVE (checkAccountActive)
 * Lưu ý: Trạng thái ban đầu là PENDING (chờ phỏng vấn & xét duyệt, CHƯA ĐỔI ROLE).
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
        message: 'Vui lòng cung cấp mức giá dịch vụ (ít nhất giá theo giờ và theo ngày).',
      });
    }

    // Kiểm tra hồ sơ đối tác đã tồn tại chưa
    const existingProfile = await CaregiverProfile.findOne({ accountId: account._id });
    if (existingProfile) {
      if (existingProfile.approvalStatus === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Hồ sơ của bạn đang ở trạng thái chờ phỏng vấn và xét duyệt.',
          data: existingProfile,
        });
      }

      if (existingProfile.approvalStatus === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã là đối tác Caregiver chính thức của CareLink.',
          data: existingProfile,
        });
      }
    }

    // Tạo mới hoặc cập nhật hồ sơ với trạng thái PENDING (chờ phỏng vấn)
    // Tài khoản vẫn giữ role CUSTOMER cho đến khi Admin phỏng vấn và duyệt
    const newProfile = await CaregiverProfile.findOneAndUpdate(
      { accountId: account._id },
      {
        accountId: account._id,
        userId: user._id,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl || '',
        idCardNumber: idCardNumber.trim(),
        idCardImages: Array.isArray(idCardImages) ? idCardImages : [],
        experienceYears: Number(experienceYears) || 0,
        skills: Array.isArray(skills) ? skills : [],
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
        pricing: {
          hourlyRate: Number(pricing.hourlyRate) || 0,
          dailyRate: Number(pricing.dailyRate) || 0,
          weeklyRate: Number(pricing.weeklyRate) || 0,
          monthlyRate: Number(pricing.monthlyRate) || 0,
        },
        bio: bio ? bio.trim() : '',
        gender: gender || user.gender || 'OTHER',
        age: Number(age) || undefined,
        approvalStatus: 'PENDING',
        verificationStatus: 'PENDING',
        ratingAvg: 5.0,
        priorityScore: 100,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Nộp hồ sơ thành công! Ban Quản Trị sẽ liên hệ để phỏng vấn trong vòng 24h.',
      data: newProfile,
    });
  } catch (error) {
    console.error('Lỗi API registerCaregiver:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký trở thành đối tác.',
      error: error.message,
    });
  }
};

/**
 * 7. Lấy thông tin tài khoản hiện tại
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

/**
 * 9. Phê duyệt hồ sơ đối tác Caregiver (Sau khi phỏng vấn thành công)
 * PATCH /api/auth/approve-caregiver/:caregiverProfileId
 * Admin duyệt -> Chuyển role Account thành CAREGIVER và approvalStatus thành APPROVED
 */
const approveCaregiver = async (req, res) => {
  try {
    const { caregiverProfileId } = req.params;

    const profile = await CaregiverProfile.findById(caregiverProfileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người chăm sóc.',
      });
    }

    profile.approvalStatus = 'APPROVED';
    profile.verificationStatus = 'VERIFIED';
    await profile.save();

    // Cấp quyền CAREGIVER cho Account
    if (profile.accountId) {
      await Account.findByIdAndUpdate(profile.accountId, { role: 'CAREGIVER' });
    }

    return res.status(200).json({
      success: true,
      message: 'Phê duyệt hồ sơ đối tác thành công! Tài khoản đã được cấp quyền CAREGIVER.',
      data: profile,
    });
  } catch (error) {
    console.error('Lỗi API approveCaregiver:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi phê duyệt hồ sơ.',
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
  approveCaregiver,
};
