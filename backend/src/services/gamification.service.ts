import { supabase } from '../config/supabase.js';
import { UserStats, Achievement, UserAchievement } from '../types/index.js';

export async function getOrCreateUserStats(userId: string): Promise<UserStats> {
  // Try to get existing stats
  const { data: existing } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return existing;

  // Create new stats
  const { data: newStats, error } = await supabase
    .from('user_stats')
    .insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      total_challenges_completed: 0,
      total_messages: 0,
      last_active: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return newStats;
}

export async function updateUserActivity(userId: string): Promise<UserStats> {
  const stats = await getOrCreateUserStats(userId);
  const now = new Date();
  const lastActive = new Date(stats.last_active);

  // Calculate days difference
  const daysDiff = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = stats.current_streak;

  if (daysDiff === 0) {
    // Same day, no change to streak
  } else if (daysDiff === 1) {
    // Consecutive day, increase streak
    newStreak += 1;
  } else {
    // Streak broken, reset to 1
    newStreak = 1;
  }

  const newLongestStreak = Math.max(stats.longest_streak, newStreak);

  const { data, error } = await supabase
    .from('user_stats')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      total_messages: stats.total_messages + 1,
      last_active: now.toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Check for new achievements
  await checkAndAwardAchievements(userId, data);

  return data;
}

export async function incrementChallengesCompleted(userId: string): Promise<void> {
  const stats = await getOrCreateUserStats(userId);

  const { error } = await supabase
    .from('user_stats')
    .update({
      total_challenges_completed: stats.total_challenges_completed + 1,
    })
    .eq('user_id', userId);

  if (error) throw error;

  // Re-fetch and check achievements
  const { data: updatedStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (updatedStats) {
    await checkAndAwardAchievements(userId, updatedStats);
  }
}

export async function checkAndAwardAchievements(
  userId: string,
  stats: UserStats
): Promise<UserAchievement[]> {
  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*');

  if (!achievements) return [];

  // Get user's existing achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const existingIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const newAchievements: UserAchievement[] = [];

  for (const achievement of achievements) {
    if (existingIds.has(achievement.id)) continue;

    let earned = false;

    switch (achievement.requirement_type) {
      case 'streak':
        earned = stats.current_streak >= achievement.requirement_value;
        break;
      case 'challenges':
        earned = stats.total_challenges_completed >= achievement.requirement_value;
        break;
      case 'messages':
        earned = stats.total_messages >= achievement.requirement_value;
        break;
    }

    if (earned) {
      const { data } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        })
        .select()
        .single();

      if (data) {
        newAchievements.push({ ...data, achievement });
      }
    }
  }

  return newAchievements;
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) throw error;
  return data || [];
}
