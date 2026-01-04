import { Router } from 'express';
import {
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from '../controllers/challenge.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getChallenges);
router.post('/', createChallenge);
router.patch('/:challengeId', updateChallenge);
router.delete('/:challengeId', deleteChallenge);

export default router;
