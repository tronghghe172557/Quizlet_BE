import express from 'express';
import { 
  createReviewSchedule,
  getQuizzesForReview,
  getMyReviewSchedules,
  updateReviewAfterSubmission,
  updateReviewSchedule,
  deleteReviewSchedule,
  getReviewStatistics
} from '../controllers/reviewSchedule.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

// Tạo lịch ôn tập cho quiz
router.post('/', createReviewSchedule);

// Lấy danh sách quiz cần ôn tập hôm nay
router.get('/due', getQuizzesForReview);

// Lấy tất cả lịch ôn tập của user
router.get('/my', getMyReviewSchedules);

// Lấy thống kê ôn tập
router.get('/statistics', getReviewStatistics);

// Cập nhật lịch ôn tập sau khi làm bài
router.patch('/:scheduleId/complete', updateReviewAfterSubmission);

// Cập nhật cài đặt lịch ôn tập
router.patch('/:scheduleId', updateReviewSchedule);

// Xóa lịch ôn tập
router.delete('/:scheduleId', deleteReviewSchedule);

export default router;