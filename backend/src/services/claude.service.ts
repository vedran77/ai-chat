import Anthropic from '@anthropic-ai/sdk';
import { SystemPromptContext, Message } from '../types/index.js';
import { SAFETY_RESOURCES } from './crisis.service.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BASE_SYSTEM_PROMPT = `You are a supportive AI life coach. Your role is to help users achieve their goals, overcome challenges, and develop positive habits.

Guidelines:
- Be empathetic, encouraging, and non-judgmental
- Ask thoughtful questions to understand the user's situation
- Provide actionable advice and strategies
- Celebrate progress, no matter how small
- Help users identify and work towards their goals
- When a user mentions a specific goal or challenge, acknowledge it clearly

Important:
- If a user expresses distress or mentions self-harm, respond with compassion and encourage them to seek professional help
- You are not a replacement for professional therapy or medical advice
- Keep responses concise but meaningful (2-3 paragraphs max)`;

function buildSystemPrompt(context: SystemPromptContext | null): string {
  if (!context) return BASE_SYSTEM_PROMPT;

  const personalizations: string[] = [];

  if (context.goals?.length > 0) {
    personalizations.push(`User's current goals: ${context.goals.join(', ')}`);
  }

  if (context.challenges?.length > 0) {
    personalizations.push(`Challenges they're working on: ${context.challenges.join(', ')}`);
  }

  if (context.preferences?.communication_style) {
    const styleDescriptions = {
      supportive: 'Be warm, encouraging, and focus on emotional support.',
      direct: 'Be straightforward and action-oriented in your advice.',
      motivational: 'Use motivational language and help them stay pumped up.',
    };
    personalizations.push(styleDescriptions[context.preferences.communication_style]);
  }

  if (context.preferences?.focus_areas?.length > 0) {
    personalizations.push(`Focus areas to emphasize: ${context.preferences.focus_areas.join(', ')}`);
  }

  if (personalizations.length === 0) return BASE_SYSTEM_PROMPT;

  return `${BASE_SYSTEM_PROMPT}

Personalization for this user:
${personalizations.join('\n')}`;
}

function formatMessagesForClaude(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function generateCoachResponse(
  messages: Message[],
  userContext: SystemPromptContext | null,
  isCrisisDetected: boolean
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userContext);

  // If crisis was detected, add safety context to prompt
  let finalSystemPrompt = systemPrompt;
  if (isCrisisDetected) {
    finalSystemPrompt += `

IMPORTANT: The user's message has been flagged as potentially indicating distress.
Respond with compassion and care. Acknowledge their feelings, express concern for their wellbeing,
and gently encourage them to reach out to professional support services.
Include this information naturally in your response:
${SAFETY_RESOURCES.message}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: finalSystemPrompt,
      messages: formatMessagesForClaude(messages),
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent ? textContent.text : 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Challenge detection - AI analyzes if user mentioned a goal/challenge
export async function detectChallengeInMessage(message: string): Promise<{
  detected: boolean;
  title?: string;
  description?: string;
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: `You analyze messages to detect if a user is setting a goal or challenge for themselves.
If detected, extract the goal/challenge title and description.
Respond ONLY in this JSON format:
{"detected": true/false, "title": "short title", "description": "brief description"}

Examples of goals/challenges:
- "I want to exercise more" -> detected
- "I'm going to read 20 books this year" -> detected
- "My goal is to wake up earlier" -> detected
- "I had a nice day" -> not detected
- "Thanks for the advice" -> not detected`,
      messages: [{ role: 'user', content: message }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) return { detected: false };

    try {
      return JSON.parse(textContent.text);
    } catch {
      return { detected: false };
    }
  } catch (error) {
    console.error('Challenge detection error:', error);
    return { detected: false };
  }
}
