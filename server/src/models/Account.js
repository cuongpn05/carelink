const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema(
  {
    // Thông tin đăng nhập
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Email không hợp lệ',
      ],
    },

    passwordHash: {
      type: String,
      required: [true, 'passwordHash là bắt buộc'],
      select: false,
    },

    // Phân quyền hệ thống
    role: {
      type: String,
      enum: ['CUSTOMER', 'CAREGIVER', 'ADMIN'],
      default: 'CUSTOMER',
    },

    // Xử lý xác thực Email OTP lúc đăng ký / quên mật khẩu
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: null,
    }, // Mã OTP 6 số
    otpExpiresAt: {
      type: Date,
      default: null,
    }, // Thời hạn OTP (VD: now + 5 phút)

    // Quản lý phiên đăng nhập / Đăng xuất (Nếu dùng Refresh Token)
    refreshToken: {
      type: String,
      default: null,
    },

    // HỆ THỐNG UY TÍN & TRẠNG THÁI TÀI KHOẢN (Quản lý chung cho cả Khách & Cộng tác viên)
    reputationScore: {
      type: Number,
      default: 100,
      min: [0, 'reputationScore tối thiểu là 0'],
      max: [100, 'reputationScore tối đa là 100'],
    },
    status: {
      type: String,
      enum: [
        'UNVERIFIED', // Mới nhập email, chưa nhập đúng OTP
        'ACTIVE', // Hoạt động bình thường (Uy tín >= 70)
        'WARNING', // Cảnh báo (Uy tín từ 50 - 69)
        'SUSPENDED', // Tạm khóa chức năng đặt/nhận lịch (Uy tín < 50 do hủy lịch nhiều)
        'BANNED', // Admin khóa vĩnh viễn
      ],
      default: 'UNVERIFIED',
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Mã hóa password & Tự động cập nhật status theo reputationScore
accountSchema.pre('save', async function (next) {
  try {
    // 1. Mã hóa passwordHash nếu có thay đổi và chưa được hash
    if (this.isModified('passwordHash')) {
      if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
      }
    }

    // 2. Kích hoạt tài khoản khi hoàn tất xác thực OTP email
    if (this.isModified('isEmailVerified') && this.isEmailVerified && this.status === 'UNVERIFIED') {
      this.status = 'ACTIVE';
    }

    // 3. Tự động kiểm tra reputationScore để chuyển trạng thái tài khoản
    if (this.isModified('reputationScore')) {
      if (this.status !== 'BANNED' && this.status !== 'UNVERIFIED') {
        if (this.reputationScore < 50) {
          this.status = 'SUSPENDED';
        } else if (this.reputationScore < 70) {
          this.status = 'WARNING';
        } else {
          this.status = 'ACTIVE';
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// So sánh password khi đăng nhập
accountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
if (!mongoose.models.Accounts) {
  mongoose.model('Accounts', accountSchema);
}

module.exports = Account;

