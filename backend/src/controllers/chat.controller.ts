import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { generateCoachResponse, detectChallengeInMessage } from '../services/claude.service.js';
import { detectCrisis, logCrisisAlert, SAFETY_RESOURCES } from '../services/crisis.service.js';
import { updateUserActivity } from '../services/gamification.service.js';
import { Message } from '../types/index.js';

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ conversations: data });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { title } = req.body;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ conversation: data });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: data });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Crisis detection
    const isCrisis = detectCrisis(content);

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
        flagged_crisis: isCrisis,
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Log crisis alert if detected
    if (isCrisis && userId) {
      await logCrisisAlert(userMessage.id, userId, content);
    }

    // Get user context for personalization
    const { data: user } = await supabase
      .from('users')
      .select('system_prompt_context')
      .eq('id', userId)
      .single();

    // Get conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Generate AI response
    const aiResponseContent = await generateCoachResponse(
      history as Message[],
      user?.system_prompt_context,
      isCrisis
    );

    // Save AI response
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponseContent,
        flagged_crisis: false,
      })
      .select()
      .single();

    if (aiMsgError) throw aiMsgError;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Update user activity (streaks, message count)
    if (userId) {
      await updateUserActivity(userId);
    }

    // Check for challenge in user message (async, don't block response)
    detectChallengeInMessage(content).then(async (result) => {
      if (result.detected && result.title) {
        await supabase.from('challenges').insert({
          user_id: userId,
          title: result.title,
          description: result.description || '',
          status: 'active',
          detected_from_chat: true,
        });
      }
    }).catch(console.error);

    // Build response
    const response: {
      userMessage: typeof userMessage;
      aiMessage: typeof aiMessage;
      crisisDetected: boolean;
      safetyResources?: typeof SAFETY_RESOURCES;
    } = {
      userMessage,
      aiMessage,
      crisisDetected: isCrisis,
    };

    if (isCrisis) {
      response.safetyResources = SAFETY_RESOURCES;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    // Delete messages first
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    // Delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
}
