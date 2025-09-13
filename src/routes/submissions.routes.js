import { Router } from 'express';
import { 
  submitQuiz, 
  getUserSubmissions, 
  getQuizSubmissions, 
  getSubmissionById,
  getQuizStats 
} from '../controllers/submissions.controller.js';
import { asyncHandler } from '../helpers/asyncHandle.js';

const router = Router();

// POST /api/submissions - Nộp bài quiz
router.post('/', asyncHandler(submitQuiz));

// GET /api/submissions?userEmail=xxx - Lấy danh sách submissions của user
router.get('/', asyncHandler(getUserSubmissions));

// GET /api/submissions/:id - Lấy chi tiết một submission
router.get('/:id', asyncHandler(getSubmissionById));

// GET /api/submissions/quiz/:quizId - Lấy submissions của một quiz cụ thể
router.get('/quiz/:quizId', asyncHandler(getQuizSubmissions));

// GET /api/submissions/quiz/:quizId/stats - Lấy thống kê submissions của một quiz
router.get('/quiz/:quizId/stats', asyncHandler(getQuizStats));

export default router;