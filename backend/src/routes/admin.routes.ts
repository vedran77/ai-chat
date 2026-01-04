import { Router } from 'express';
import {
  getUsers,
  getCrisisAlertsHandler,
  reviewCrisisAlert,
  getAdminStats,
  getUserConversations,
} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/users', getUsers);
router.get('/users/:userId/conversations', getUserConversations);
router.get('/crisis-alerts', getCrisisAlertsHandler);
router.patch('/crisis-alerts/:alertId/review', reviewCrisisAlert);
router.get('/stats', getAdminStats);

export default router;
