const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên dịch vụ là bắt buộc"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Danh mục dịch vụ là bắt buộc"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    locationType: {
      type: String,
      required: [true, "Loại địa điểm cung cấp dịch vụ là bắt buộc"],
      enum: ["home", "clinic", "online", "facility"],
      default: "home",
    },

    price: {
      type: Number,
      required: [true, "Giá dịch vụ là bắt buộc"],
      min: [0, "Giá không được âm"],
    },

    duration: {
      type: Number,
      required: [true, "Thời lượng dịch vụ là bắt buộc"],
      min: [1, "Thời lượng phải lớn hơn 0"],
    },

    unit: {
      type: String,
      enum: ["HOUR", "DAY", "SESSION"],
      default: "HOUR",
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Service", serviceSchema);
