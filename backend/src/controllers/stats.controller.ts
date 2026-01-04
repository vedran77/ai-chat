import { Request, Response } from 'express';
import {
  getOrCreateUserStats,
  getUserAchievements,
  getAllAchievements,
} from '../services/gamification.service.js';

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await getOrCreateUserStats(userId);

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const [userAchievements, allAchievements] = await Promise.all([
      getUserAchievements(userId),
      getAllAchievements(),
    ]);

    // Map earned achievements
    const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      earned: earnedIds.has(achievement.id),
      earned_at: userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at,
    }));

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
}
