const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục dịch vụ là bắt buộc'],
      trim: true,
    }, // VD: 'Chăm sóc người cao tuổi', 'Chăm bệnh nhân tại viện', 'Chăm sóc mẹ & bé'

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    }, // Mô tả công việc (giống phần tab "Mô tả công việc" ở ảnh mẫu bạn gửi)

    defaultTasks: {
      type: [String],
      default: [],
    }, // Các đầu việc chuẩn của gói này

    // Giá sàn mặc định của hệ thống (Dùng để tính tiền khi khách Đăng bài chung mà chưa chọn người)
    basePricing: {
      hourlyRate: {
        type: Number,
        required: [true, 'basePricing.hourlyRate là bắt buộc'],
        min: [0, 'Giá không được âm'],
      }, // VD: 80.000đ / giờ

      dailyRate: {
        type: Number,
        required: [true, 'basePricing.dailyRate là bắt buộc'],
        min: [0, 'Giá không được âm'],
      }, // VD: 600.000đ / ngày

      weeklyRate: {
        type: Number,
        required: [true, 'basePricing.weeklyRate là bắt buộc'],
        min: [0, 'Giá không được âm'],
      },

      monthlyRate: {
        type: Number,
        required: [true, 'basePricing.monthlyRate là bắt buộc'],
        min: [0, 'Giá không được âm'],
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tự động sinh slug từ name nếu chưa có
serviceCategorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const ServiceCategory =
  mongoose.models.ServiceCategory ||
  mongoose.model('ServiceCategory', serviceCategorySchema);

if (!mongoose.models.ServiceCategories) {
  mongoose.model('ServiceCategories', serviceCategorySchema);
}

module.exports = ServiceCategory;

