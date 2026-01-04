import { Router } from 'express';
import { getStats, getAchievements } from '../controllers/stats.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getStats);
router.get('/achievements', getAchievements);

export default router;
