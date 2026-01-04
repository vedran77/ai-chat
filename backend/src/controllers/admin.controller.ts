import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { getCrisisAlerts, markAlertReviewed } from '../services/crisis.service.js';

async function verifyAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin === true;
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        onboarding_completed,
        is_admin,
        created_at,
        user_stats(current_streak, total_messages, total_challenges_completed, last_active)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users: data });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getCrisisAlertsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const reviewed = req.query.reviewed === 'true';
    const alerts = await getCrisisAlerts(reviewed);

    res.json({ alerts });
  } catch (error) {
    console.error('Get crisis alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch crisis alerts' });
  }
}

export async function reviewCrisisAlert(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { alertId } = req.params;

    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    await markAlertReviewed(alertId);

    res.json({ success: true });
  } catch (error) {
    console.error('Review alert error:', error);
    res.status(500).json({ error: 'Failed to review alert' });
  }
}

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Get various platform stats
    const [
      { count: totalUsers },
      { count: activeToday },
      { count: unreviewedAlerts },
      { count: totalMessages },
      { count: totalChallenges },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('crisis_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('reviewed', false),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('challenges').select('*', { count: 'exact', head: true }),
    ]);

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        unreviewedAlerts: unreviewedAlerts || 0,
        totalMessages: totalMessages || 0,
        totalChallenges: totalChallenges || 0,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}

export async function getUserConversations(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;

    if (!adminId || !(await verifyAdmin(adminId))) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(id, role, content, flagged_crisis, created_at)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ conversations: data });
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}
