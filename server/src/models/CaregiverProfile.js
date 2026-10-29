const mongoose = require('mongoose');

const caregiverProfileSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 với Accounts & Users
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'accountId là bắt buộc'],
      unique: true,
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

    serviceAreas: {
      type: [String],
      default: [],
      index: true,
    }, // VD: ['Quận 1', 'Quận 3', 'Ninh Kiều'] -> Lọc theo khu vực

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
  },
  {
    timestamps: true,
  }
);

const CaregiverProfile =
  mongoose.models.CaregiverProfile ||
  mongoose.model('CaregiverProfile', caregiverProfileSchema);

if (!mongoose.models.CaregiverProfiles) {
  mongoose.model('CaregiverProfiles', caregiverProfileSchema);
}

module.exports = CaregiverProfile;
