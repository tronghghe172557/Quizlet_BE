import { Router } from 'express';
import { createQuiz, listQuizzes, getQuizById } from '../controllers/quizzes.controller.js';
import { asyncHandler } from '../helpers/asyncHandle.js';

const router = Router();

router.post('/', asyncHandler(createQuiz));
router.get('/', asyncHandler(listQuizzes));
router.get('/:id', asyncHandler(getQuizById));

export default router;

