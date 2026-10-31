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

    // 3. Danh sách Cộng tác viên ứng tuyển (Đăng bài -> Nhiều người bấm "Ứng tuyển" -> Khách xem hồ sơ + điểm uy tín rồi bấm "Chọn")
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
    }, // VD: Nếu HOURLY thì lưu 2, 4, 6, 8, 10, 12. Nếu DAILY/WEEKLY/MONTHLY thì lưu 1, 2...

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

    // Địa điểm và ghi chú công việc
    serviceAddress: {
      type: String,
      required: [true, 'serviceAddress là bắt buộc'],
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

    // Chi phí & Thanh toán (Demo)
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
      }, // Số điểm uy tín đã bị trừ ở lần hủy này
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để tối ưu query tìm kiếm, bộ lọc khu vực và chặn trùng lịch
bookingSchema.index({ caregiverId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ serviceArea: 1, status: 1, bookingType: 1 });

// Tự động tính endTime dựa vào startTime, packageType, durationValue nếu endTime chưa được cung cấp
bookingSchema.pre('validate', function (next) {
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

  next();
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
if (!mongoose.models.Bookings) {
  mongoose.model('Bookings', bookingSchema);
}

module.exports = Booking;
