const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// Snapshot địa điểm phục vụ tại nhà hoặc tại bệnh viện
const locationSnapshotSchema = new mongoose.Schema(
  {
    placeType: {
      type: String,
      enum: ['home', 'hospital'],
      default: 'home',
      required: true,
    },
    // Thông tin người nhận dịch vụ / đại diện liên hệ
    recipientName: { type: String, default: '', trim: true },
    recipientPhone: { type: String, default: '', trim: true },
    // Thông tin địa chỉ hành chính
    provinceCode: { type: String, default: '', trim: true },
    provinceName: { type: String, default: '', trim: true },
    wardCode: { type: String, default: '', trim: true },
    wardName: { type: String, default: '', trim: true },
    detail: { type: String, default: '', trim: true },
    fullAddress: { type: String, default: '', trim: true },
    // Dành riêng cho địa điểm tại bệnh viện
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    hospitalName: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true }, // Khoa/Phòng khám
    roomNumber: { type: String, default: '', trim: true }, // Số phòng
    bedNumber: { type: String, default: '', trim: true },  // Số giường bệnh
    // Tọa độ GPS GeoJSON [longitude, latitude]
    coordinates: {
      type: [Number],
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
  {
    _id: false,
  }
);

// Snapshot cấu trúc chi phí & bảng giá tại thời điểm đặt đơn
const pricingSnapshotSchema = new mongoose.Schema(
  {
    baseRate: { type: Number, default: 0 },
    durationUnit: {
      type: String,
      enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'HOURLY',
    },
    durationValue: { type: Number, default: 1 },
    subtotal: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    distanceFee: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
  },
  {
    _id: false,
  }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'customerId là bắt buộc'],
      index: true,
    },

    // Nếu khách chọn đích danh -> có sẵn ID. Nếu đăng bài kiểu bTaskee -> ban đầu để null
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      default: null,
      index: true,
    },

    caregiverProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaregiverProfile',
      default: null,
      index: true,
    },

    bookingType: {
      type: String,
      enum: ['DIRECT', 'OPEN_POST'],
      default: 'DIRECT',
    },

    // 1. Khu vực của ca làm việc (để hệ thống lọc bài đăng cho đúng Cộng tác viên ở quận/huyện đó)
    serviceArea: {
      type: String,
      required: [true, 'serviceArea là bắt buộc'],
      trim: true,
      index: true,
    }, // VD: 'Ninh Kiều'

    // 2. Yêu cầu giới tính (Khách đăng bài thường muốn chọn: Chỉ tìm Nữ / Chỉ tìm Nam / Không yêu cầu)
    preferredGender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'ANY'],
      default: 'ANY',
    },

    // 3. Danh sách Cộng tác viên ứng tuyển
    applicants: {
      type: [applicantSchema],
      default: [],
    },

    // Xử lý GÓI THỜI GIAN (2, 4, 6, 8, 10, 12 giờ HOẶC 1 ngày, 1 tuần, 1 tháng)
    packageType: {
      type: String,
      enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      required: [true, 'packageType là bắt buộc'],
    },

    durationValue: {
      type: Number,
      required: [true, 'durationValue là bắt buộc'],
      min: [1, 'durationValue tối thiểu là 1'],
    },

    // Thời gian bắt đầu và kết thúc thực tế (Server tự cộng durationValue vào startTime để ra endTime)
    // RẤT QUAN TRỌNG: Dùng cặp (startTime, endTime) này để query chặn TRÙNG LỊCH
    startTime: {
      type: Date,
      required: [true, 'startTime là bắt buộc'],
      index: true,
    },

    endTime: {
      type: Date,
      required: [true, 'endTime là bắt buộc'],
      index: true,
    },

    // Snapshot địa điểm phục vụ (Hỗ trợ cả tại nhà và tại bệnh viện)
    locationSnapshot: {
      type: locationSnapshotSchema,
      default: () => ({ placeType: 'home' }),
    },

    // Giữ trường serviceAddress cũ để tương thích ngược 100%
    serviceAddress: {
      type: String,
      default: '',
      trim: true,
    },

    requiredSkills: {
      type: [String],
      default: [],
    }, // Các yêu cầu công việc trong ca đó

    note: {
      type: String,
      default: '',
      trim: true,
    },

    careNotes: {
      type: String,
      default: '',
      trim: true,
    },

    // Snapshot chi phí
    pricingSnapshot: {
      type: pricingSnapshotSchema,
      default: undefined,
    },

    // Chi phí tổng (VNĐ)
    totalPrice: {
      type: Number,
      required: [true, 'totalPrice là bắt buộc'],
      min: [0, 'totalPrice không được âm'],
    },

    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER'],
      default: 'CASH',
    },

    // VÒNG ĐỜI TRẠNG THÁI ĐƠN (Order Lifecycle)
    status: {
      type: String,
      enum: [
        'PENDING', // Chờ xác nhận (Hoặc đang chờ người nhận trên bảng tin)
        'CONFIRMED', // Đã nhận lịch (Lúc này khóa lịch, bắt đầu áp dụng luật trừ uy tín nếu hủy)
        'IN_PROGRESS', // Đang thực hiện ca chăm sóc
        'COMPLETED', // Hoàn thành (Mở khóa chức năng Đánh giá)
        'CANCELLED', // Đã hủy
      ],
      default: 'PENDING',
      index: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    caregiverRejectedAt: {
      type: Date,
      default: null,
    },

    customerNotificationReadAt: {
      type: Date,
      default: null,
    },

    // Cờ đánh dấu cho chức năng "Đánh giá sau dịch vụ"
    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Lưu vết khi HỦY LỊCH để tính toán trừ điểm Uy Tín
    cancellationInfo: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts',
        default: null,
      },
      cancelledByRole: {
        type: String,
        enum: ['CUSTOMER', 'CAREGIVER', null],
        default: null,
      },
      reason: {
        type: String,
        default: '',
        trim: true,
      },
      cancelledAt: {
        type: Date,
        default: null,
      },
      penaltyPointsDeducted: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes để tối ưu query tìm kiếm, bộ lọc khu vực và chặn trùng lịch
bookingSchema.index({ caregiverId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ caregiverProfileId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ customerId: 1, caregiverId: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ customerId: 1, caregiverProfileId: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ serviceArea: 1, status: 1, bookingType: 1 });
bookingSchema.index({ 'locationSnapshot.coordinates': '2dsphere' }, { sparse: true });

// Pre-validate hook: tính endTime nếu chưa có, và đồng bộ dữ liệu địa chỉ & giá tiền
bookingSchema.pre('validate', function (next) {
  // 1. Tính toán endTime tự động nếu chưa có
  if (this.startTime && this.durationValue && this.packageType) {
    if (!this.endTime) {
      let durationMs = 0;
      switch (this.packageType) {
        case 'HOURLY':
          durationMs = this.durationValue * 60 * 60 * 1000;
          break;
        case 'DAILY':
          durationMs = this.durationValue * 24 * 60 * 60 * 1000;
          break;
        case 'WEEKLY':
          durationMs = this.durationValue * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'MONTHLY':
          durationMs = this.durationValue * 30 * 24 * 60 * 60 * 1000;
          break;
      }
      this.endTime = new Date(this.startTime.getTime() + durationMs);
    }
  }

  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    return next(new Error('Thời gian bắt đầu (startTime) phải nhỏ hơn thời gian kết thúc (endTime)'));
  }

  // 2. Đồng bộ 2 chiều giữa serviceAddress và locationSnapshot.fullAddress
  if (this.serviceAddress && (!this.locationSnapshot || !this.locationSnapshot.fullAddress)) {
    if (!this.locationSnapshot) {
      this.locationSnapshot = { placeType: 'home' };
    }
    this.locationSnapshot.fullAddress = this.serviceAddress;
    this.locationSnapshot.detail = this.serviceAddress;
  } else if (this.locationSnapshot?.fullAddress && !this.serviceAddress) {
    this.serviceAddress = this.locationSnapshot.fullAddress;
  }

  // 3. Làm sạch tọa độ coordinates nếu không hợp lệ để tránh lỗi sparse 2dsphere
  if (
    this.locationSnapshot &&
    (!this.locationSnapshot.coordinates ||
      !Array.isArray(this.locationSnapshot.coordinates) ||
      this.locationSnapshot.coordinates.length !== 2 ||
      this.locationSnapshot.coordinates[0] === null ||
      this.locationSnapshot.coordinates[1] === null)
  ) {
    this.locationSnapshot.coordinates = undefined;
  }

  // 4. Đồng bộ totalPrice và pricingSnapshot
  if (typeof this.totalPrice === 'number' && !this.pricingSnapshot) {
    this.pricingSnapshot = {
      baseRate: this.totalPrice,
      durationUnit: this.packageType || 'HOURLY',
      durationValue: this.durationValue || 1,
      subtotal: this.totalPrice,
      totalPrice: this.totalPrice,
    };
  } else if (this.pricingSnapshot && typeof this.pricingSnapshot.totalPrice === 'number' && !this.totalPrice) {
    this.totalPrice = this.pricingSnapshot.totalPrice;
  }

  next();
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
if (!mongoose.models.Bookings) {
  mongoose.model('Bookings', bookingSchema);
}

module.exports = Booking;
