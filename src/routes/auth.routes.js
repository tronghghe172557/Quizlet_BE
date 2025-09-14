import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile, 
  updateProfile 
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../helpers/asyncHandle.js';

const router = Router();

// Public routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));

// Protected routes
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/profile', authenticate, asyncHandler(getProfile));
router.put('/profile', authenticate, asyncHandler(updateProfile));

export default router;