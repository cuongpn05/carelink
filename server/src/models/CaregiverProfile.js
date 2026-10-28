const mongoose = require("mongoose");

// Schema con: Lịch làm việc của caregiver
const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ bắt đầu không hợp lệ"],
    },

    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ kết thúc không hợp lệ"],
    },
  },
  {
    _id: false,
  },
);

// Model: CaregiverProfile
const caregiverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    skills: {
      type: [String],
      default: [],
    },

    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    serviceAreas: {
      type: [String],
      default: [],
    },

    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    availability: {
      type: [availabilitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CaregiverProfile", caregiverProfileSchema);
