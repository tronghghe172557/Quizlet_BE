import { Router } from 'express';
import { 
  createQuiz, 
  listQuizzes, 
  getQuizById, 
  updateQuiz, 
  deleteQuiz, 
  getMyQuizzes,
  shareQuiz,
  unshareQuiz,
  getQuizSharedUsers 
} from '../controllers/quizzes.controller.js';
import { authenticate, optionalAuth, requireRole, requireOwnerOrAdmin } from '../middlewares/auth.js';
import { validateResourceOwnership } from '../helpers/permissions.js';
import { asyncHandler } from '../helpers/asyncHandle.js';
import Quiz from '../models/quiz.model.js';

const router = Router();

// Tạo quiz - chỉ user và admin
router.post('/', authenticate, requireRole('admin'), asyncHandler(createQuiz));

// Xem danh sách quiz - public
router.get('/', authenticate, asyncHandler(listQuizzes));

// Xem chi tiết quiz - public
router.get('/:id', authenticate, asyncHandler(getQuizById));

// Cập nhật quiz - chỉ owner hoặc admin
router.put('/:id', authenticate, requireOwnerOrAdmin(), validateResourceOwnership(Quiz), asyncHandler(updateQuiz));

// Xóa quiz - chỉ owner hoặc admin  
router.delete('/:id', authenticate, requireOwnerOrAdmin(), validateResourceOwnership(Quiz), asyncHandler(deleteQuiz));

// Chia sẻ quiz - chỉ admin
router.post('/:id/share', authenticate, validateResourceOwnership(Quiz), asyncHandler(shareQuiz));

// Hủy chia sẻ quiz - chỉ admin
router.delete('/:id/share', authenticate, validateResourceOwnership(Quiz), asyncHandler(unshareQuiz));

// Lấy danh sách users được chia sẻ quiz - chỉ owner hoặc admin
router.get('/:id/shared-users', authenticate, validateResourceOwnership(Quiz), asyncHandler(getQuizSharedUsers));

// Lấy quiz của user hiện tại
router.get('/my/quizzes', authenticate, asyncHandler(getMyQuizzes));

export default router;

