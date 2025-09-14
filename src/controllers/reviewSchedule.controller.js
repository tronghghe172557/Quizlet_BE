import { z } from 'zod';
import ReviewSchedule from '../models/reviewSchedule.model.js';
import Quiz from '../models/quiz.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../helpers/asyncHandle.js';
import { OK, Created } from '../core/success.response.js';
import ReviewScheduleLogger from '../helpers/reviewScheduleLogger.js';

// Schema validation
const CreateReviewScheduleSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID là bắt buộc'),
  reviewInterval: z.number().optional().default(3)
});

const UpdateReviewScheduleSchema = z.object({
  reviewInterval: z.number().min(1).max(30).optional(),
  isActive: z.boolean().optional()
});

// Tạo lịch ôn tập cho quiz
export const createReviewSchedule = asyncHandler(async (req, res) => {
  const { quizId, reviewInterval } = CreateReviewScheduleSchema.parse(req.body);
  const userId = req.user._id;

  // Kiểm tra quiz có tồn tại không
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz không tồn tại'
    });
  }

  // Kiểm tra đã có lịch ôn cho quiz này chưa
  const existingSchedule = await ReviewSchedule.findOne({
    user: userId,
    quiz: quizId
  });

  if (existingSchedule) {
    return res.status(400).json({
      success: false,
      message: 'Đã có lịch ôn tập cho quiz này'
    });
  }

  // Tính ngày ôn tiếp theo
  const nextReviewAt = new Date(Date.now() + reviewInterval * 24 * 60 * 60 * 1000);

  const reviewSchedule = await ReviewSchedule.create({
    user: userId,
    quiz: quizId,
    reviewInterval,
    nextReviewAt
  });

  await reviewSchedule.populate('quiz', 'title questions.length');

  new Created({
    message: 'Tạo lịch ôn tập thành công',
    metadata: reviewSchedule
  }).send(res);
});

// Lấy danh sách quiz cần ôn tập
export const getQuizzesForReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  const reviewSchedules = await ReviewSchedule.getQuizzesForReview(userId, limit);

  // Log daily review check
  ReviewScheduleLogger.logDailyReview(userId, reviewSchedules.length);

  new OK({
    message: 'Lấy danh sách quiz cần ôn tập thành công',
    metadata: {
      quizzes: reviewSchedules,
      total: reviewSchedules.length
    }
  }).send(res);
});

// Lấy tất cả lịch ôn tập của user
export const getMyReviewSchedules = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (req.query.active !== undefined) {
    filter.isActive = req.query.active === 'true';
  }

  const [schedules, total] = await Promise.all([
    ReviewSchedule.find(filter)
      .populate('quiz', 'title questions.length category')
      .sort({ nextReviewAt: 1 })
      .skip(skip)
      .limit(limit),
    ReviewSchedule.countDocuments(filter)
  ]);

  new OK({
    message: 'Lấy lịch ôn tập thành công',
    metadata: {
      schedules,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  }).send(res);
});

// Cập nhật lịch ôn tập sau khi làm bài
export const updateReviewAfterSubmission = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const { submissionId } = req.body;
  const userId = req.user._id;

  // Tìm lịch ôn tập
  const schedule = await ReviewSchedule.findOne({
    _id: scheduleId,
    user: userId
  });

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy lịch ôn tập'
    });
  }

  // Lấy thông tin submission để tính score
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy bài nộp'
    });
  }

  // Cập nhật lịch ôn tiếp theo dựa trên điểm số
  await schedule.updateNextReview(submission.scorePercentage);

  new OK({
    message: 'Cập nhật lịch ôn tập thành công',
    metadata: schedule
  }).send(res);
});

// Cập nhật cài đặt lịch ôn tập
export const updateReviewSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const updateData = UpdateReviewScheduleSchema.parse(req.body);
  const userId = req.user._id;

  const schedule = await ReviewSchedule.findOneAndUpdate(
    { _id: scheduleId, user: userId },
    updateData,
    { new: true, runValidators: true }
  ).populate('quiz', 'title questions.length category');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy lịch ôn tập'
    });
  }

  new OK({
    message: 'Cập nhật lịch ôn tập thành công',
    metadata: schedule
  }).send(res);
});

// Xóa lịch ôn tập
export const deleteReviewSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const userId = req.user._id;

  const schedule = await ReviewSchedule.findOneAndDelete({
    _id: scheduleId,
    user: userId
  });

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy lịch ôn tập'
    });
  }

  new OK({
    message: 'Xóa lịch ôn tập thành công'
  }).send(res);
});

// Lấy thống kê ôn tập
export const getReviewStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await ReviewSchedule.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalSchedules: { $sum: 1 },
        activeSchedules: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        needsReview: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isActive', true] },
                  { $lte: ['$nextReviewAt', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        averageScore: { $avg: '$averageScore' },
        totalReviews: { $sum: '$reviewCount' }
      }
    }
  ]);

  const statistics = stats[0] || {
    totalSchedules: 0,
    activeSchedules: 0,
    needsReview: 0,
    averageScore: 0,
    totalReviews: 0
  };

  // Lấy performance theo thời gian
  const performanceData = await ReviewSchedule.find({ user: userId })
    .sort({ lastReviewedAt: -1 })
    .limit(30)
    .select('lastScore lastReviewedAt quiz')
    .populate('quiz', 'title');

  new OK({
    message: 'Lấy thống kê ôn tập thành công',
    metadata: {
      statistics,
      recentPerformance: performanceData
    }
  }).send(res);
});