const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookings',
      required: [true, 'bookingId là bắt buộc'],
      unique: true,
    }, // 1 đơn chỉ đánh giá 1 lần

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'customerId là bắt buộc'],
      index: true,
    },

    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'caregiverId là bắt buộc'],
      index: true,
    },

    rating: {
      type: Number,
      required: [true, 'rating là bắt buộc'],
      min: [1, 'rating tối thiểu là 1 sao'],
      max: [5, 'rating tối đa là 5 sao'],
    }, // Số sao 1 - 5

    comment: {
      type: String,
      required: [true, 'comment là bắt buộc'],
      trim: true,
    }, // Nhận xét văn bản

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
if (!mongoose.models.Reviews) {
  mongoose.model('Reviews', reviewSchema);
}

module.exports = Review;
