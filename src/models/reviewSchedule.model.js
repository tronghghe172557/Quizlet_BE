import mongoose from 'mongoose';
import ReviewScheduleLogger from '../helpers/reviewScheduleLogger.js';

const ReviewScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    lastReviewedAt: {
      type: Date,
      default: Date.now
    },
    nextReviewAt: {
      type: Date,
      required: true
    },
    reviewInterval: {
      type: Number, // số ngày
      enum: [1, 3, 5, 7, 15, 30], // 1 ngày, 3 ngày, 5 ngày, 7 ngày, 15 ngày, 1 tháng
      default: 3
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Thống kê performance
    averageScore: {
      type: Number,
      default: 0
    },
    lastScore: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual để check xem có cần ôn không
ReviewScheduleSchema.virtual('needsReview').get(function() {
  return new Date() >= this.nextReviewAt && this.isActive;
});

// Index cho performance
ReviewScheduleSchema.index({ user: 1, nextReviewAt: 1 });
ReviewScheduleSchema.index({ user: 1, quiz: 1 }, { unique: true });
ReviewScheduleSchema.index({ nextReviewAt: 1, isActive: 1 });

// Method để cập nhật lịch ôn tiếp theo với spaced repetition algorithm
ReviewScheduleSchema.methods.updateNextReview = function(score) {
  const previousInterval = this.reviewInterval;
  
  this.lastReviewedAt = new Date();
  this.reviewCount += 1;
  this.lastScore = score;
  
  // Cập nhật average score (weighted average)
  if (this.reviewCount === 1) {
    this.averageScore = score;
  } else {
    // Weighted average: 70% old average + 30% new score
    this.averageScore = Math.round(this.averageScore * 0.7 + score * 0.3);
  }
  
  // 🧠 Spaced Repetition Logic - Điều chỉnh interval dựa trên performance
  if (score >= 80) {
    // Nếu làm tốt (≥80%), tăng interval để ôn ít hơn
    if (this.reviewInterval === 1) this.reviewInterval = 3;
    else if (this.reviewInterval === 3) this.reviewInterval = 5;
    else if (this.reviewInterval === 5) this.reviewInterval = 7;
    else if (this.reviewInterval === 7) this.reviewInterval = 15;
    else if (this.reviewInterval === 15) this.reviewInterval = 30;
    // Đã max 30 ngày thì giữ nguyên
  } else if (score < 50) {
    // 🚨 ĐIỂM QUÁ THẤP (<50%) → IMMEDIATE RETRY trong hôm nay!
    this.reviewInterval = 0; // 0 ngày = ngay hôm nay
    console.log(`🚨 IMMEDIATE RETRY: Score ${score}% too low, must retry today!`);
  } else if (score < 60) {
    // Nếu làm kém (50-59%), giảm interval để ôn nhiều hơn  
    if (this.reviewInterval === 30) this.reviewInterval = 15;
    else if (this.reviewInterval === 15) this.reviewInterval = 7;
    else if (this.reviewInterval === 7) this.reviewInterval = 5;
    else if (this.reviewInterval === 5) this.reviewInterval = 3;
    else if (this.reviewInterval === 3) this.reviewInterval = 1;
    // Đã min 1 ngày thì giữ nguyên
  }
  // Score 60-79%: giữ nguyên interval
  
  // Tính ngày ôn tiếp theo
  if (this.reviewInterval === 0) {
    // Immediate retry - ngay hôm nay (trong vòng 1 giờ)
    this.nextReviewAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
  } else {
    // Normal interval
    this.nextReviewAt = new Date(Date.now() + this.reviewInterval * 24 * 60 * 60 * 1000);
  }
  
  // Log spaced repetition logic
  const intervalChange = `${previousInterval} → ${this.reviewInterval} days`;
  ReviewScheduleLogger.logSpacedRepetitionTrend(score, intervalChange);
  
  return this.save();
};

// Static method để lấy các quiz cần ôn
ReviewScheduleSchema.statics.getQuizzesForReview = function(userId, limit = 10) {
  return this.find({
    user: userId,
    isActive: true,
    nextReviewAt: { $lte: new Date() }
  })
  .populate('quiz', 'title questions createdAt')
  .sort({ nextReviewAt: 1 })
  .limit(limit);
};

export default mongoose.model('ReviewSchedule', ReviewScheduleSchema);