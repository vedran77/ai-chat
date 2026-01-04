-- AI Coaching Platform - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  system_prompt_context JSONB,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  flagged_crisis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  detected_from_chat BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- User stats table (gamification)
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_challenges_completed INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'challenges', 'messages')),
  requirement_value INTEGER NOT NULL
);

-- User achievements (earned badges)
CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Crisis alerts table (for admin monitoring)
CREATE TABLE crisis_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_flagged ON messages(flagged_crisis) WHERE flagged_crisis = TRUE;
CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_crisis_alerts_reviewed ON crisis_alerts(reviewed);
CREATE INDEX idx_user_stats_last_active ON user_stats(last_active);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Steps', 'Send your first message', '👋', 'messages', 1),
  ('Getting Started', 'Send 10 messages', '💬', 'messages', 10),
  ('Conversationalist', 'Send 50 messages', '🗣️', 'messages', 50),
  ('Deep Talker', 'Send 100 messages', '🎯', 'messages', 100),
  ('First Win', 'Complete your first challenge', '🏆', 'challenges', 1),
  ('Challenge Seeker', 'Complete 5 challenges', '⭐', 'challenges', 5),
  ('Goal Crusher', 'Complete 10 challenges', '🔥', 'challenges', 10),
  ('Unstoppable', 'Complete 25 challenges', '💪', 'challenges', 25),
  ('Consistent', 'Maintain a 3-day streak', '📅', 'streak', 3),
  ('Week Warrior', 'Maintain a 7-day streak', '🗓️', 'streak', 7),
  ('Two Week Champion', 'Maintain a 14-day streak', '🏅', 'streak', 14),
  ('Monthly Master', 'Maintain a 30-day streak', '👑', 'streak', 30);

-- Create an admin user (change password after first login!)
-- Password: admin123 (bcrypt hash)
INSERT INTO users (email, password_hash, name, is_admin, onboarding_completed) VALUES
  ('admin@coaching.app', '$2a$10$rQZQZ6Z6Z6Z6Z6Z6Z6Z6Z.6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6', 'Admin', TRUE, TRUE);

-- Note: The admin password hash above is a placeholder.
-- You should register a new admin through the API or update this hash.
