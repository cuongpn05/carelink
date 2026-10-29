const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 với Accounts
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'accountId là bắt buộc'],
      unique: true,
      index: true,
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

    avatarUrl: {
      type: String,
      default: '',
    },

    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'OTHER',
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    // Địa chỉ mặc định để tự động điền (auto-fill) khi khách bấm Đặt lịch chăm sóc
    defaultAddress: {
      city: {
        type: String,
        trim: true,
        default: '',
      }, // VD: 'Cần Thơ'
      district: {
        type: String,
        trim: true,
        default: '',
      }, // VD: 'Ninh Kiều'
      ward: {
        type: String,
        trim: true,
        default: '',
      }, // VD: 'An Khánh'
      detail: {
        type: String,
        trim: true,
        default: '',
      }, // Số nhà, tên đường
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
if (!mongoose.models.Users) {
  mongoose.model('Users', userSchema);
}

module.exports = User;
