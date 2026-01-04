import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AdminStats, CrisisAlert } from '../types';
import {
  Users,
  AlertTriangle,
  MessageSquare,
  Target,
  ArrowLeft,
  Check,
  Loader2,
  Eye,
} from 'lucide-react';

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: string;
  user_stats: {
    current_streak: number;
    total_messages: number;
    total_challenges_completed: number;
    last_active: string;
  }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'users'>('overview');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadAdminData();
  }, [user, navigate]);

  async function loadAdminData() {
    try {
      const [statsRes, alertsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/crisis-alerts'),
        api.get('/api/admin/users'),
      ]);
      setStats(statsRes.data.stats);
      setAlerts(alertsRes.data.alerts);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAlertReviewed(alertId: string) {
    try {
      await api.patch(`/api/admin/crisis-alerts/${alertId}/review`);
      setAlerts(alerts.filter((a) => a.id !== alertId));
      if (stats) {
        setStats({ ...stats, unreviewedAlerts: stats.unreviewedAlerts - 1 });
      }
    } catch (error) {
      console.error('Failed to mark alert reviewed:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Total Users
            </div>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Active Today
            </div>
            <p className="text-2xl font-bold">{stats?.activeToday || 0}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <MessageSquare className="w-4 h-4" />
              Messages
            </div>
            <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Target className="w-4 h-4" />
              Challenges
            </div>
            <p className="text-2xl font-bold">{stats?.totalChallenges || 0}</p>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              (stats?.unreviewedAlerts || 0) > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <AlertTriangle
                className={`w-4 h-4 ${
                  (stats?.unreviewedAlerts || 0) > 0 ? 'text-red-500' : ''
                }`}
              />
              Crisis Alerts
            </div>
            <p
              className={`text-2xl font-bold ${
                (stats?.unreviewedAlerts || 0) > 0 ? 'text-red-600' : ''
              }`}
            >
              {stats?.unreviewedAlerts || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['overview', 'alerts', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Recent Crisis Alerts
              </h3>
              {alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">No unreviewed alerts</p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {alert.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => markAlertReviewed(alert.id)}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Mark Reviewed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Recent Users
              </h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold">Crisis Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No unreviewed alerts
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{alert.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>
                            User: {alert.user?.name || 'Unknown'}
                          </span>
                          <span>
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => markAlertReviewed(alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600"
                      >
                        <Check className="w-4 h-4" />
                        Reviewed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">User</th>
                    <th className="text-left p-4 font-medium text-gray-600">Streak</th>
                    <th className="text-left p-4 font-medium text-gray-600">Messages</th>
                    <th className="text-left p-4 font-medium text-gray-600">Challenges</th>
                    <th className="text-left p-4 font-medium text-gray-600">Last Active</th>
                    <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => {
                    const userStats = u.user_stats?.[0];
                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-gray-400">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-4">{userStats?.current_streak || 0}</td>
                        <td className="p-4">{userStats?.total_messages || 0}</td>
                        <td className="p-4">{userStats?.total_challenges_completed || 0}</td>
                        <td className="p-4 text-sm text-gray-400">
                          {userStats?.last_active
                            ? new Date(userStats.last_active).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="p-4">
                          <button className="text-emerald-600 hover:text-emerald-700">
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
