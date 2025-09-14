import { Router } from 'express';
import quizzesRouter from './quizzes.routes.js';
import skillsRouter from './skills.routes.js';
import submissionsRouter from './submissions.routes.js';
import authRouter from './auth.routes.js';
import reviewScheduleRouter from './reviewSchedule.routes.js';
import dailyVocabularyRouter from './dailyVocabulary.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
router.use('/api/auth', authRouter);
router.use('/api/quizzes', quizzesRouter);
router.use('/api/skills', skillsRouter);
router.use('/api/submissions', submissionsRouter);
router.use('/api/review-schedule', reviewScheduleRouter);
router.use('/api/vocabulary', dailyVocabularyRouter);

export default router;