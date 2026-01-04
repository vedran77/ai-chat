import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sparkles, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

const GOALS_OPTIONS = [
  'Improve mental health',
  'Build better habits',
  'Increase productivity',
  'Manage stress',
  'Improve relationships',
  'Career growth',
  'Physical fitness',
  'Personal development',
];

const CHALLENGES_OPTIONS = [
  'Procrastination',
  'Lack of motivation',
  'Anxiety',
  'Time management',
  'Self-doubt',
  'Work-life balance',
  'Communication skills',
  'Focus and concentration',
];

const FOCUS_AREAS = [
  'Career',
  'Health',
  'Relationships',
  'Personal growth',
  'Finances',
  'Creativity',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [goals, setGoals] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState<'supportive' | 'direct' | 'motivational'>('supportive');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  function toggleSelection(item: string, list: string[], setList: (items: string[]) => void) {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else if (list.length < 3) {
      setList([...list, item]);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/onboarding', {
        goals,
        challenges,
        communication_style: communicationStyle,
        focus_areas: focusAreas,
      });
      updateUser(response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">AI Coach</h1>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">What are your goals?</h2>
              <p className="text-gray-500 mb-6">Select up to 3 goals you'd like to work on</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleSelection(goal, goals, setGoals)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      goals.includes(goal)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">What challenges do you face?</h2>
              <p className="text-gray-500 mb-6">Select up to 3 challenges you're working on</p>
              <div className="grid grid-cols-2 gap-3">
                {CHALLENGES_OPTIONS.map((challenge) => (
                  <button
                    key={challenge}
                    onClick={() => toggleSelection(challenge, challenges, setChallenges)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      challenges.includes(challenge)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {challenge}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Communication style</h2>
              <p className="text-gray-500 mb-6">How would you like your AI coach to communicate?</p>
              <div className="space-y-3">
                {[
                  { value: 'supportive', title: 'Supportive', desc: 'Warm, encouraging, and focused on emotional support' },
                  { value: 'direct', title: 'Direct', desc: 'Straightforward and action-oriented advice' },
                  { value: 'motivational', title: 'Motivational', desc: 'Energizing language to keep you pumped up' },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setCommunicationStyle(style.value as typeof communicationStyle)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      communicationStyle === style.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{style.title}</div>
                    <div className="text-sm text-gray-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Focus areas</h2>
              <p className="text-gray-500 mb-6">Which areas of life do you want to focus on?</p>
              <div className="grid grid-cols-2 gap-3">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleSelection(area, focusAreas, setFocusAreas)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      focusAreas.includes(area)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-white/80 hover:text-white mt-4"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
