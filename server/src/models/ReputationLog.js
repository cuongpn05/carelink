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

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookings',
      default: null,
      index: true,
    },

    changeAmount: {
      type: Number,
      required: [true, 'changeAmount là bắt buộc'],
    }, // VD: -15 (Hủy lịch sát giờ), +2 (Hoàn thành tốt 5 sao)

    previousScore: {
      type: Number,
      required: [true, 'previousScore là bắt buộc'],
      min: 0,
      max: 100,
    },

    newScore: {
      type: Number,
      required: [true, 'newScore là bắt buộc'],
      min: 0,
      max: 100,
    },

    reason: {
      type: String,
      required: [true, 'reason là bắt buộc'],
      trim: true,
    }, // VD: "Hủy ca chăm sóc #BK102 trước giờ hẹn 2 tiếng"

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const ReputationLog =
  mongoose.models.ReputationLog ||
  mongoose.model('ReputationLog', reputationLogSchema);

if (!mongoose.models.ReputationLogs) {
  mongoose.model('ReputationLogs', reputationLogSchema);
}

module.exports = ReputationLog;
