import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserStats, Achievement, Challenge } from '../types';
import {
  MessageSquare,
  Target,
  Trophy,
  Flame,
  Plus,
  Check,
  X,
  Loader2,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChallenge, setNewChallenge] = useState('');
  const [showNewChallenge, setShowNewChallenge] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [statsRes, achievementsRes, challengesRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/stats/achievements'),
        api.get('/api/challenges?status=active'),
      ]);
      setStats(statsRes.data.stats);
      setAchievements(achievementsRes.data.achievements);
      setChallenges(challengesRes.data.challenges);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createChallenge() {
    if (!newChallenge.trim()) return;

    try {
      const response = await api.post('/api/challenges', {
        title: newChallenge,
      });
      setChallenges([response.data.challenge, ...challenges]);
      setNewChallenge('');
      setShowNewChallenge(false);
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  }

  async function updateChallengeStatus(id: string, status: 'completed' | 'failed') {
    try {
      await api.patch(`/api/challenges/${id}`, { status });
      setChallenges(challenges.filter((c) => c.id !== id));
      if (status === 'completed') {
        // Refresh stats to update completed count
        const response = await api.get('/api/stats');
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to update challenge:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earned);
  const unlockedAchievements = achievements.filter((a) => !a.earned);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">AI Coach</h1>
          <div className="flex items-center gap-4">
            {user?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
              >
                <Shield className="w-5 h-5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <Link
              to="/onboarding"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-500">Here's your coaching progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-gray-500 text-sm">Current Streak</span>
            </div>
            <p className="text-3xl font-bold">{stats?.current_streak || 0}</p>
            <p className="text-sm text-gray-400">days</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <span className="text-gray-500 text-sm">Challenges Done</span>
            </div>
            <p className="text-3xl font-bold">
              {stats?.total_challenges_completed || 0}
            </p>
            <p className="text-sm text-gray-400">completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-gray-500 text-sm">Messages</span>
            </div>
            <p className="text-3xl font-bold">{stats?.total_messages || 0}</p>
            <p className="text-sm text-gray-400">sent</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-gray-500 text-sm">Achievements</span>
            </div>
            <p className="text-3xl font-bold">{earnedAchievements.length}</p>
            <p className="text-sm text-gray-400">
              of {achievements.length} unlocked
            </p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Chat CTA */}
          <Link
            to="/chat"
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat with AI Coach</h3>
            <p className="text-emerald-100">
              Start a conversation and work on your goals
            </p>
          </Link>

          {/* Quick Challenge */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Challenges</h3>
              <button
                onClick={() => setShowNewChallenge(true)}
                className="text-emerald-500 hover:text-emerald-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {showNewChallenge && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChallenge}
                  onChange={(e) => setNewChallenge(e.target.value)}
                  placeholder="New challenge..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && createChallenge()}
                />
                <button
                  onClick={createChallenge}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowNewChallenge(false);
                    setNewChallenge('');
                  }}
                  className="px-3 py-2 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {challenges.length === 0 ? (
              <p className="text-gray-400 text-sm">No active challenges</p>
            ) : (
              <div className="space-y-2">
                {challenges.slice(0, 3).map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{challenge.title}</p>
                      {challenge.detected_from_chat && (
                        <span className="text-xs text-emerald-500">
                          Detected from chat
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateChallengeStatus(challenge.id, 'completed')
                        }
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateChallengeStatus(challenge.id, 'failed')
                        }
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Achievements</h3>

          {earnedAchievements.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Earned</h4>
              <div className="flex flex-wrap gap-3">
                {earnedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full"
                  >
                    <span className="text-xl">{achievement.icon}</span>
                    <span className="font-medium text-emerald-700">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unlockedAchievements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Locked
              </h4>
              <div className="flex flex-wrap gap-3">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full opacity-50"
                    title={achievement.description}
                  >
                    <span className="text-xl grayscale">{achievement.icon}</span>
                    <span className="text-gray-500">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
