import { Router } from 'express';
import {
  createSkill,
  getAllSkills,
  getSkillById,
  getSkillsByCreator,
  getSkillsByCategory,
  updateSkill,
  updateSkillLevel,
  deleteSkill,
  getSkillStats
} from '../controllers/skills.controller.js';
import { asyncHandler } from '../helpers/asyncHandle.js';

const router = Router();

// Routes chính
router.post('/', asyncHandler(createSkill));
router.get('/', asyncHandler(getAllSkills));
router.get('/stats', asyncHandler(getSkillStats));
router.get('/:id', asyncHandler(getSkillById));
router.put('/:id', asyncHandler(updateSkill));
router.delete('/:id', asyncHandler(deleteSkill));

// Routes đặc biệt
router.put('/:id/level', asyncHandler(updateSkillLevel));
router.get('/creator/:creatorName', asyncHandler(getSkillsByCreator));
router.get('/category/:category', asyncHandler(getSkillsByCategory));

export default router;
