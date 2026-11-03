const mongoose = require('mongoose');

// Danh sách ứng viên Caregiver nộp hồ sơ vào bài đăng mở
const careRequestApplicantSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: true,
    },
    caregiverProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaregiverProfile',
      default: null,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    proposedPrice: {
      type: Number,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// Snapshot địa điểm phục vụ (Tại nhà hoặc Bệnh viện)
const careRequestLocationSnapshotSchema = new mongoose.Schema(
  {
    placeType: {
      type: String,
      enum: ['home', 'hospital'],
      default: 'home',
    },
    provinceCode: { type: String, default: '', trim: true },
    provinceName: { type: String, default: '', trim: true },
    wardCode: { type: String, default: '', trim: true },
    wardName: { type: String, default: '', trim: true },
    detail: { type: String, default: '', trim: true },
    fullAddress: { type: String, default: '', trim: true },
    // Dành riêng cho bệnh viện
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    hospitalName: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    roomNumber: { type: String, default: '', trim: true },
    bedNumber: { type: String, default: '', trim: true },
    // Tọa độ GPS phục vụ quét cự ly tìm việc (GeoJSON Point: [longitude, latitude])
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

const careRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'customerId là bắt buộc'],
      index: true,
    },

    serviceCategory: {
      type: String,
      enum: ['elderly-care', 'child-care', 'home-care', 'post-treatment-care'],
      required: [true, 'serviceCategory là bắt buộc'],
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Tiêu đề tối đa 200 ký tự'],
      default: '',
    },

    description: {
      type: String,
      required: [true, 'Mô tả nhu cầu chăm sóc là bắt buộc'],
      trim: true,
    },

    recipient: {
      name: {
        type: String,
        default: 'Người thân',
        trim: true,
      },
      age: {
        type: Number,
        required: [true, 'Độ tuổi người được chăm sóc là bắt buộc'],
        min: [0, 'Tuổi không hợp lệ'],
        max: [130, 'Tuổi không hợp lệ'],
      },
      gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
        default: 'FEMALE',
      },
      relationship: {
        type: String,
        default: 'Gia đình',
        trim: true,
      },
      conditionNotes: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Trường địa điểm tương thích ngược
    location: {
      address: {
        type: String,
        default: '',
        trim: true,
      },
      area: {
        type: String,
        required: [true, 'Khu vực / Quận là bắt buộc'],
        trim: true,
        index: true,
      },
      city: {
        type: String,
        default: 'Cần Thơ',
        trim: true,
      },
    },

    // Snapshot địa điểm chuẩn hóa (hỗ trợ bệnh viện & tọa độ GeoJSON 2dsphere)
    locationSnapshot: {
      type: careRequestLocationSnapshotSchema,
      default: () => ({ placeType: 'home' }),
    },

    schedule: {
      startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu là bắt buộc'],
      },
      endDate: {
        type: Date,
        default: null,
      },
      timeSlot: {
        type: String,
        required: [true, 'Khung giờ chăm sóc là bắt buộc'],
        trim: true,
      },
      dailyHours: {
        type: Number,
        required: [true, 'Số giờ mỗi ngày là bắt buộc'],
        min: [1, 'Số giờ tối thiểu là 1'],
        max: [24, 'Số giờ tối đa là 24'],
      },
      frequency: {
        type: String,
        enum: ['ONE_TIME', 'DAILY', 'WEEKDAYS', 'WEEKLY'],
        default: 'DAILY',
      },
    },

    // Thời gian chuẩn hóa phục vụ kiểm tra rảnh lịch & chặn trùng ca
    startTime: {
      type: Date,
      index: true,
    },

    endTime: {
      type: Date,
      index: true,
    },

    expectedBudget: {
      type: Number,
      required: [true, 'Ngân sách dự kiến là bắt buộc'],
      min: [0, 'Ngân sách không được âm'],
    },

    budgetUnit: {
      type: String,
      enum: ['PER_DAY', 'PER_HOUR', 'PER_MONTH', 'TOTAL'],
      default: 'PER_DAY',
    },

    specialRequirements: {
      type: [String],
      default: [],
    },

    // Danh sách các ứng viên Caregiver đã nộp hồ sơ ứng tuyển
    applicants: {
      type: [careRequestApplicantSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },

    acceptedCaregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      default: null,
      index: true,
    },

    acceptedCaregiverProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaregiverProfile',
      default: null,
      index: true,
    },

    declinedCaregiverIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' }],
      default: [],
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      default: null,
    },

    customerNotificationReadAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes phục vụ tìm kiếm & quét cự ly
careRequestSchema.index({ 'locationSnapshot.coordinates': '2dsphere' }, { sparse: true });
careRequestSchema.index({ status: 1, createdAt: -1 });
careRequestSchema.index({ status: 1, serviceCategory: 1, createdAt: -1 });
careRequestSchema.index({ status: 1, 'location.area': 1 });
careRequestSchema.index({ customerId: 1, status: 1, createdAt: -1 });
careRequestSchema.index({ acceptedCaregiverId: 1, startTime: 1, endTime: 1, status: 1 });

// Pre-validate hook: tính startTime, endTime nếu chưa có, và đồng bộ dữ liệu địa chỉ
careRequestSchema.pre('validate', function (next) {
  // 1. Đồng bộ startTime & endTime từ schedule
  if (this.schedule?.startDate) {
    if (!this.startTime) {
      this.startTime = this.schedule.startDate;
    }
    if (!this.endTime) {
      if (this.schedule.endDate) {
        this.endTime = this.schedule.endDate;
      } else {
        const hours = this.schedule.dailyHours || 4;
        this.endTime = new Date(this.schedule.startDate.getTime() + hours * 60 * 60 * 1000);
      }
    }
  }

  // 2. Đồng bộ trường location cũ và locationSnapshot
  if (this.location?.address && (!this.locationSnapshot || !this.locationSnapshot.fullAddress)) {
    if (!this.locationSnapshot) {
      this.locationSnapshot = { placeType: 'home' };
    }
    this.locationSnapshot.fullAddress = this.location.address;
    this.locationSnapshot.detail = this.location.address;
    if (this.location.area) {
      this.locationSnapshot.wardName = this.location.area;
    }
    if (this.location.city) {
      this.locationSnapshot.provinceName = this.location.city;
    }
  } else if (this.locationSnapshot?.fullAddress && (!this.location || !this.location.address)) {
    if (!this.location) {
      this.location = {};
    }
    this.location.address = this.locationSnapshot.fullAddress;
    this.location.area = this.locationSnapshot.wardName || this.location.area || 'Ninh Kiều';
    this.location.city = this.locationSnapshot.provinceName || this.location.city || 'Cần Thơ';
  }

  // 3. Làm sạch coordinates nếu không hợp lệ để tránh lỗi sparse 2dsphere index
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

  next();
});

const CareRequest = mongoose.models.CareRequest || mongoose.model('CareRequest', careRequestSchema);

module.exports = CareRequest;
