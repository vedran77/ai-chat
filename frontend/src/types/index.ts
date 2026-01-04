export interface User {
  id: string;
  email: string;
  name: string;
  onboarding_completed: boolean;
  system_prompt_context: SystemPromptContext | null;
  is_admin: boolean;
  created_at: string;
}

export interface SystemPromptContext {
  goals: string[];
  challenges: string[];
  preferences: {
    communication_style: 'supportive' | 'direct' | 'motivational';
    focus_areas: string[];
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  flagged_crisis: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  detected_from_chat: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface UserStats {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_challenges_completed: number;
  total_messages: number;
  last_active: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'challenges' | 'messages';
  requirement_value: number;
  earned?: boolean;
  earned_at?: string;
}

export interface SafetyResources {
  message: string;
  resources: Array<{
    name: string;
    url?: string;
    phone?: string;
    description: string;
  }>;
}

export interface CrisisAlert {
  id: string;
  message_id: string;
  user_id: string;
  content: string;
  reviewed: boolean;
  created_at: string;
  user?: User;
}

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  unreviewedAlerts: number;
  totalMessages: number;
  totalChallenges: number;
}
