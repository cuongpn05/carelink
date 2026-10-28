const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customer là bắt buộc'],
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'patient là bắt buộc'],
    },

    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: [true, 'caregiver là bắt buộc'],
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'service là bắt buộc'],
    },

    address: {
      type: String,
      required: [true, 'Địa chỉ đặt lịch là bắt buộc'],
      trim: true,
    },

    startTime: {
      type: Date,
      required: [true, 'startTime là bắt buộc'],
    },

    endTime: {
      type: Date,
      required: [true, 'endTime là bắt buộc'],
    },

    totalPrice: {
      type: Number,
      required: [true, 'totalPrice là bắt buộc'],
      min: [0, 'totalPrice không được âm'],
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Validate business rule: start time must be earlier than end time.
bookingSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    next(new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc'));
    return;
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
