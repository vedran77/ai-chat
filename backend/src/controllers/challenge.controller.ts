import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { incrementChallengesCompleted } from '../services/gamification.service.js';

export async function getChallenges(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    let query = supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ challenges: data });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
}

export async function createChallenge(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { title, description } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Challenge title is required' });
      return;
    }

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        user_id: userId,
        title,
        description: description || '',
        status: 'active',
        detected_from_chat: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ challenge: data });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
}

export async function updateChallenge(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { challengeId } = req.params;
    const { status, title, description } = req.body;

    // Get current challenge
    const { data: existing } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    const updates: Record<string, unknown> = {};

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status) {
      updates.status = status;
      if (status === 'completed' && existing.status !== 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', challengeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Update gamification stats if completed
    if (status === 'completed' && existing.status !== 'completed' && userId) {
      await incrementChallengesCompleted(userId);
    }

    res.json({ challenge: data });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
}

export async function deleteChallenge(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { challengeId } = req.params;

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
}
