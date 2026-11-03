const mongoose = require('mongoose');

const reputationLogSchema = new mongoose.Schema(
  {
    // Liên kết với tài khoản bị trừ/cộng điểm uy tín
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accounts',
      required: [true, 'accountId là bắt buộc'],
      index: true,
    },

    // Đơn đặt đích danh liên quan (nếu có)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookings',
      default: null,
      index: true,
    },

    // Yêu cầu chăm sóc marketplace liên quan (nếu có)
    careRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareRequest',
      default: null,
      index: true,
    },

    // Mức biến động điểm (+5, -15, ...)
    changeAmount: {
      type: Number,
      required: [true, 'changeAmount là bắt buộc'],
    },

    // Điểm trước khi biến động
    previousScore: {
      type: Number,
      required: [true, 'previousScore là bắt buộc'],
      min: 0,
      max: 100,
    },

    // Điểm sau khi biến động
    newScore: {
      type: Number,
      required: [true, 'newScore là bắt buộc'],
      min: 0,
      max: 100,
    },

    // Lý do biến động điểm
    reason: {
      type: String,
      required: [true, 'reason là bắt buộc'],
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual delta & scoreAfter để tương thích với tất cả API đọc log
reputationLogSchema.virtual('delta').get(function () {
  return this.changeAmount;
});

reputationLogSchema.virtual('scoreAfter').get(function () {
  return this.newScore;
});

reputationLogSchema.index({ accountId: 1, createdAt: -1 });

const ReputationLog =
  mongoose.models.ReputationLog ||
  mongoose.model('ReputationLog', reputationLogSchema);

if (!mongoose.models.ReputationLogs) {
  mongoose.model('ReputationLogs', reputationLogSchema);
}

module.exports = ReputationLog;
