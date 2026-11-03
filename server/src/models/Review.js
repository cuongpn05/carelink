const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // Đơn đặt đích danh (Luồng A)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookings',
      default: null,
      index: true,
    },

    // Yêu cầu chăm sóc mở (Luồng B)
    careRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareRequest',
      default: null,
      index: true,
    },

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

    // Đánh giá số sao (1 - 5)
    rating: {
      type: Number,
      required: [true, 'rating là bắt buộc'],
      min: [1, 'rating tối thiểu là 1 sao'],
      max: [5, 'rating tối đa là 5 sao'],
      index: true,
    },

    // Nhận xét văn bản của khách hàng
    comment: {
      type: String,
      required: [true, 'comment là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Nội dung đánh giá tối đa 1000 ký tự'],
    },

    // Phản hồi chính thức từ Người chăm sóc
    response: {
      content: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, 'Nội dung phản hồi tối đa 1000 ký tự'],
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ caregiverId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
if (!mongoose.models.Reviews) {
  mongoose.model('Reviews', reviewSchema);
}

module.exports = Review;
