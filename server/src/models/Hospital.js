const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã bệnh viện là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Tên bệnh viện là bắt buộc'],
      trim: true,
      index: true,
    },

    provinceCode: {
      type: String,
      required: [true, 'Mã tỉnh/thành là bắt buộc'],
      trim: true,
      index: true,
    },

    provinceName: {
      type: String,
      default: '',
      trim: true,
    },

    wardCode: {
      type: String,
      default: '',
      trim: true,
    },

    wardName: {
      type: String,
      default: '',
      trim: true,
    },

    address: {
      type: String,
      required: [true, 'Địa chỉ bệnh viện là bắt buộc'],
      trim: true,
    },

    // GeoJSON Point [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Tọa độ bệnh viện là bắt buộc'],
        validate: {
          validator: function (val) {
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

    // Danh sách các chuyên khoa trong bệnh viện
    departments: {
      type: [String],
      default: [],
    },

    // Quy định thăm nuôi và hỗ trợ người chăm sóc
    rules: {
      visitingHours: {
        type: String,
        default: '07:00 - 21:00',
      },
      overnightAllowed: {
        type: Boolean,
        default: true,
      },
      caregiverPassRequired: {
        type: Boolean,
        default: true,
      },
      notes: {
        type: String,
        default: '',
        trim: true,
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

// Tạo 2dsphere index trên trường location
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ provinceCode: 1, isActive: 1 });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
if (!mongoose.models.Hospitals) {
  mongoose.model('Hospitals', hospitalSchema);
}

module.exports = Hospital;
