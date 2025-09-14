import { Router } from 'express';
import { 
  submitQuiz, 
  getUserSubmissions, 
  getQuizSubmissions, 
  getSubmissionById,
  getQuizStats,
  getAllSubmissionsAdmin
} from '../controllers/submissions.controller.js';
import { authenticate, optionalAuth, requireRole, requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../helpers/asyncHandle.js';

const router = Router();

// POST /api/submissions - Nộp bài quiz (chỉ user và admin)
router.post('/', authenticate, requireRole('user', 'admin'), asyncHandler(submitQuiz));

// GET /api/submissions - Lấy submissions của user hiện tại
router.get('/', authenticate, asyncHandler(getUserSubmissions));

// GET /api/submissions/:id - Lấy chi tiết submission (owner hoặc admin)
router.get('/:id', authenticate, asyncHandler(getSubmissionById));

// GET /api/submissions/quiz/:quizId - Lấy tất cả submissions của quiz (chỉ admin hoặc quiz owner)
router.get('/quiz/:quizId', authenticate, asyncHandler(getQuizSubmissions));

// GET /api/submissions/quiz/:quizId/stats - Lấy thống kê submissions của một quiz (public)
router.get('/quiz/:quizId/stats', asyncHandler(getQuizStats));

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(getAllSubmissionsAdmin));

export default router;