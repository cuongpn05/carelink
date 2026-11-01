const mongoose = require('mongoose');

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
      required: [true, 'Tiêu đề yêu cầu là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề tối đa 200 ký tự'],
    },

    description: {
      type: String,
      required: [true, 'Mô tả nhu cầu chăm sóc là bắt buộc'],
      trim: true,
      maxlength: [2000, 'Mô tả tối đa 2000 ký tự'],
    },

    recipient: {
      name: {
        type: String,
        required: [true, 'Tên người được chăm sóc là bắt buộc'],
        trim: true,
      },
      age: {
        type: Number,
        required: [true, 'Tuổi người được chăm sóc là bắt buộc'],
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
        required: [true, 'Mối quan hệ là bắt buộc'],
        trim: true,
      },
      conditionNotes: {
        type: String,
        default: '',
        trim: true,
      },
    },

    location: {
      address: {
        type: String,
        required: [true, 'Địa chỉ cụ thể là bắt buộc'],
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
        default: 'TP. Hồ Chí Minh',
        trim: true,
      },
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

    expectedBudget: {
      type: Number,
      required: [true, 'Ngân sách dự kiến là bắt buộc'],
      min: [0, 'Ngân sách không được âm'],
    },

    specialRequirements: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
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

// Compound indexes for high-performance marketplace filtering and fast dashboard loading
careRequestSchema.index({ status: 1, createdAt: -1 });
careRequestSchema.index({ status: 1, serviceCategory: 1, createdAt: -1 });
careRequestSchema.index({ status: 1, 'location.area': 1 });
careRequestSchema.index({ customerId: 1, status: 1, createdAt: -1 });
careRequestSchema.index({ acceptedCaregiverId: 1, status: 1 });

const CareRequest = mongoose.models.CareRequest || mongoose.model('CareRequest', careRequestSchema);

module.exports = CareRequest;
