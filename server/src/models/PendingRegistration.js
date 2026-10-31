const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'passwordHash là bắt buộc'],
    },
    fullName: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },
    otpCode: {
      type: String,
      required: [true, 'Mã OTP là bắt buộc'],
    },
    otpExpiresAt: {
      type: Date,
      required: [true, 'Thời hạn OTP là bắt buộc'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Tự động xóa bản ghi sau 300 giây (5 phút) nếu người dùng không xác thực
      expires: 300,
    },
  },
  {
    timestamps: false,
  }
);

const PendingRegistration =
  mongoose.models.PendingRegistration ||
  mongoose.model('PendingRegistration', pendingRegistrationSchema);

module.exports = PendingRegistration;
