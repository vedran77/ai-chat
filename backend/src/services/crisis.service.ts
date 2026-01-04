import { supabase } from '../config/supabase.js';

// Crisis keywords for detection - SAFETY CRITICAL
const CRISIS_KEYWORDS = [
  // Suicidal ideation
  'kill myself',
  'end my life',
  'want to die',
  'suicide',
  'suicidal',
  'take my own life',
  'better off dead',
  'no reason to live',
  'wish i was dead',
  'life isn\'t worth',

  // Self-harm
  'hurt myself',
  'self-harm',
  'self harm',
  'cutting myself',
  'harming myself',

  // Hopelessness indicators
  'no way out',
  'can\'t go on',
  'give up on life',
  'nothing left to live for',
  'everyone would be better off without me',
];

// Safety resources to show when crisis detected
export const SAFETY_RESOURCES = {
  message: "I notice you may be going through a difficult time. Your safety matters. Please reach out to a crisis helpline if you need immediate support.",
  resources: [
    {
      name: "International Association for Suicide Prevention",
      url: "https://www.iasp.info/resources/Crisis_Centres/",
      description: "Find a crisis center in your country"
    },
    {
      name: "Crisis Text Line",
      description: "Text HOME to 741741 (US)",
    },
    {
      name: "Samaritans (UK)",
      phone: "116 123",
      description: "Free 24/7 support"
    },
    {
      name: "National Suicide Prevention Lifeline (US)",
      phone: "988",
      description: "24/7 support"
    }
  ]
};

export function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

export async function logCrisisAlert(
  messageId: string,
  userId: string,
  content: string
): Promise<void> {
  try {
    await supabase.from('crisis_alerts').insert({
      message_id: messageId,
      user_id: userId,
      content: content.substring(0, 500), // Truncate for privacy
      reviewed: false,
    });
  } catch (error) {
    console.error('Failed to log crisis alert:', error);
  }
}

export async function getCrisisAlerts(reviewed: boolean = false) {
  const { data, error } = await supabase
    .from('crisis_alerts')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('reviewed', reviewed)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function markAlertReviewed(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('crisis_alerts')
    .update({ reviewed: true })
    .eq('id', alertId);

  if (error) throw error;
}
