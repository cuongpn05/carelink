const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User là bắt buộc'],
      unique: true,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'experienceYears không được âm'],
    },

    skills: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: '',
    },

    hourlyRate: {
      type: Number,
      required: [true, 'hourlyRate là bắt buộc'],
      min: [0, 'hourlyRate không được âm'],
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, 'rating không được âm'],
      max: [5, 'rating tối đa là 5'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Caregiver', caregiverSchema);

