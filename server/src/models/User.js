const mongoose = require('mongoose');

const addressItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ['Nhà riêng', 'Công ty', 'Khác'],
      default: 'Nhà riêng',
      trim: true,
    },

    recipientName: {
      type: String,
      required: [true, 'Tên người nhận là bắt buộc'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Số điện thoại người nhận là bắt buộc'],
      trim: true,
    },

    provinceCode: {
      type: String,
      default: '',
      trim: true,
    },

    provinceName: {
      type: String,
      required: [true, 'Tỉnh/Thành phố là bắt buộc'],
      trim: true,
    },

    wardCode: {
      type: String,
      default: '',
      trim: true,
    },

    wardName: {
      type: String,
      required: [true, 'Phường/Xã là bắt buộc'],
      trim: true,
    },

    detail: {
      type: String,
      required: [true, 'Địa chỉ chi tiết là bắt buộc'],
      trim: true,
    },

    fullAddress: {
      type: String,
      required: [true, 'Địa chỉ đầy đủ là bắt buộc'],
      trim: true,
    },

    // GeoJSON Point tùy chọn (longitude, latitude)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
        validate: {
          validator: function (val) {
            if (!val) return true;
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              typeof val[0] === 'number' &&
              typeof val[1] === 'number' &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Tọa độ coordinates phải là mảng [kinh độ, vĩ độ] hợp lệ.',
        },
      },
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    // Đánh dấu địa chỉ được chuyển đổi từ cấu trúc cũ
    isLegacyMigrated: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 với Accounts
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'accountId là bắt buộc'],
      unique: true,
      sparse: true,
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

    // Sổ nhiều địa chỉ của người dùng
    addresses: {
      type: [addressItemSchema],
      default: [],
    },

    // Giữ trường defaultAddress cũ để đảm bảo 100% backward-compatibility
    defaultAddress: {
      city: {
        type: String,
        trim: true,
        default: '',
      },
      district: {
        type: String,
        trim: true,
        default: '',
      },
      ward: {
        type: String,
        trim: true,
        default: '',
      },
      detail: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Sparse 2dsphere index phục vụ tìm kiếm địa lý
userSchema.index({ 'addresses.location': '2dsphere' }, { sparse: true });

// Pre-validate hook để dọn dẹp location nếu không có tọa độ hợp lệ (giữ strict undefined cho sparse 2dsphere index)
userSchema.pre('validate', function (next) {
  if (this.addresses && Array.isArray(this.addresses)) {
    this.addresses.forEach((addr) => {
      if (
        addr.location &&
        (!addr.location.coordinates ||
          !Array.isArray(addr.location.coordinates) ||
          addr.location.coordinates.length !== 2 ||
          typeof addr.location.coordinates[0] !== 'number' ||
          typeof addr.location.coordinates[1] !== 'number' ||
          isNaN(addr.location.coordinates[0]) ||
          isNaN(addr.location.coordinates[1]))
      ) {
        addr.location = undefined;
      }
    });
  }
  next();
});

// Pre-save hook đảm bảo tối đa 1 địa chỉ mặc định và đồng bộ sang defaultAddress
userSchema.pre('save', function (next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter((a) => a.isDefault);

    // Nếu không có địa chỉ nào là default -> chọn địa chỉ đầu tiên làm default
    if (defaultAddresses.length === 0) {
      this.addresses[0].isDefault = true;
    } else if (defaultAddresses.length > 1) {
      // Nếu có nhiều hơn 1 default -> chỉ giữ địa chỉ cuối cùng được set
      let foundOne = false;
      for (let i = this.addresses.length - 1; i >= 0; i--) {
        if (this.addresses[i].isDefault) {
          if (!foundOne) {
            foundOne = true;
          } else {
            this.addresses[i].isDefault = false;
          }
        }
      }
    }

    // Đồng bộ sang trường legacy defaultAddress
    const activeDefault = this.addresses.find((a) => a.isDefault);
    if (activeDefault) {
      this.defaultAddress = {
        city: activeDefault.provinceName || '',
        district: '',
        ward: activeDefault.wardName || '',
        detail: activeDefault.detail || '',
      };
    }
  }

  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
if (!mongoose.models.Users) {
  mongoose.model('Users', userSchema);
}

module.exports = User;
