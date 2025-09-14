import express from 'express';
import { 
  getTodayVocabulary,
  markWordAsLearned,
  getVocabularyHistory,
  getVocabularyStatistics,
  updateVocabularyPreferences,
  getWordsForReview,
  resetVocabularyProgress
} from '../controllers/dailyVocabulary.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

// Lấy từ vựng hôm nay
router.get('/today', getTodayVocabulary);

// Đánh dấu từ đã học
router.patch('/learn', markWordAsLearned);

// Lấy lịch sử học từ vựng
router.get('/history', getVocabularyHistory);

// Lấy thống kê học từ vựng
router.get('/statistics', getVocabularyStatistics);

// Lấy từ vựng để ôn tập
router.get('/review', getWordsForReview);

// Cập nhật preferences học từ vựng
router.patch('/preferences', updateVocabularyPreferences);

// Reset progress (chỉ user tự reset)
router.delete('/reset', resetVocabularyProgress);

export default router;