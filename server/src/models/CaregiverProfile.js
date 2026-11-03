const mongoose = require('mongoose');

const caregiverProfileSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 với Accounts & Users
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'accountId là bắt buộc'],
      unique: true,
      sparse: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      default: null,
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

    // Thông tin từ Form đăng ký Cộng tác viên
    idCardNumber: {
      type: String,
      required: [true, 'idCardNumber là bắt buộc'],
      trim: true,
    }, // CCCD/CMND

    idCardImages: {
      type: [String],
      default: [],
    }, // Ảnh chụp CCCD/Chứng chỉ hành nghề

    bio: {
      type: String,
      trim: true,
      default: '',
    }, // Giới thiệu bản thân

    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    }, // Admin duyệt mới được hiện lên danh sách tìm kiếm

    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: undefined,
      index: true,
    },

    // Các trường phục vụ BỘ LỌC (Filter)
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'OTHER',
    },

    age: {
      type: Number,
      min: [18, 'Tuổi tối thiểu là 18'],
      max: [80, 'Tuổi tối đa là 80'],
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'experienceYears không được âm'],
    },

    // VỊ TRÍ & BÁN KÍNH HOẠT ĐỘNG
    serviceLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
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

    serviceRadius: {
      type: Number,
      default: 15, // km
      min: [1, 'Bán kính tối thiểu là 1 km'],
      max: [100, 'Bán kính tối đa là 100 km'],
    },

    serviceAreas: {
      type: [String],
      default: [],
      index: true,
    }, // VD: ['Cần Thơ', 'Ninh Kiều', 'Cái Răng'] -> Lọc theo khu vực/mã hành chính

    skills: {
      type: [String],
      default: [],
      index: true,
    }, // VD: ['Chăm người già', 'Chăm bệnh nhân', 'Vật lý trị liệu', 'Nấu ăn']

    // Bảng giá cấu hình của Cộng tác viên (VNĐ)
    pricing: {
      hourlyRate: {
        type: Number,
        required: [true, 'hourlyRate là bắt buộc'],
        min: [0, 'hourlyRate không được âm'],
      }, // Giá gốc 1 giờ (dùng tính gói 2h, 4h, 6h, 8h, 10h, 12h)

      dailyRate: {
        type: Number,
        required: [true, 'dailyRate là bắt buộc'],
        min: [0, 'dailyRate không được âm'],
      }, // Giá gói 1 ngày (24h)

      weeklyRate: {
        type: Number,
        min: [0, 'weeklyRate không được âm'],
        default: null,
      }, // Giá gói 1 tuần

      monthlyRate: {
        type: Number,
        min: [0, 'monthlyRate không được âm'],
        default: null,
      }, // Giá gói 1 tháng
    },

    // Các trường phục vụ THUẬT TOÁN SẮP XẾP MẶC ĐỊNH
    ratingAvg: {
      type: Number,
      default: 5.0,
      min: [1, 'ratingAvg tối thiểu là 1'],
      max: [5, 'ratingAvg tối đa là 5'],
      index: true,
    }, // Điểm sao trung bình (1 - 5)

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCompletedBookings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Điểm ưu tiên hiển thị = f(ratingAvg, reputationScore)
    // Nếu hủy lịch bị trừ uy tín -> giảm priorityScore -> tụt hạng trên trang danh sách
    priorityScore: {
      type: Number,
      default: 100,
      index: true,
    },

    hourlyRate: {
      type: Number,
      min: [0, 'hourlyRate không được âm'],
      default: undefined,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Tự động làm sạch serviceLocation nếu không có tọa độ hợp lệ để tránh lỗi sparse 2dsphere
caregiverProfileSchema.pre('validate', function (next) {
  if (
    this.serviceLocation &&
    (!this.serviceLocation.coordinates ||
      !Array.isArray(this.serviceLocation.coordinates) ||
      this.serviceLocation.coordinates.length !== 2 ||
      this.serviceLocation.coordinates[0] === null ||
      this.serviceLocation.coordinates[1] === null)
  ) {
    this.serviceLocation = undefined;
  }
  next();
});

// Sparse 2dsphere index phục vụ tìm kiếm theo bán kính
caregiverProfileSchema.index({ serviceLocation: '2dsphere' }, { sparse: true });
caregiverProfileSchema.index({ priorityScore: -1, ratingAvg: -1 });

const CaregiverProfile =
  mongoose.models.CaregiverProfile ||
  mongoose.model('CaregiverProfile', caregiverProfileSchema);

if (!mongoose.models.CaregiverProfiles) {
  mongoose.model('CaregiverProfiles', caregiverProfileSchema);
}

module.exports = CaregiverProfile;
