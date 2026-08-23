'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Stats } from '@/types';
import { ErrorAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Users, BarChart3, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Active Users',
      value: stats.active_users,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Total Queries',
      value: stats.total_queries,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Queries Today',
      value: stats.queries_today,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Successful Queries',
      value: stats.successful,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Failed Queries',
      value: stats.failed,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System statistics and insights</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${card.color} mb-4`}>
              {card.icon}
            </div>
            <p className="text-gray-600 text-sm font-medium">{card.title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Success Rate</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${stats.total_queries > 0
                      ? (stats.successful / stats.total_queries) * 100
                      : 0
                      }%`,
                  }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats.total_queries > 0
                ? Math.round((stats.successful / stats.total_queries) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${stats.total_users > 0
                      ? (stats.active_users / stats.total_users) * 100
                      : 0
                      }%`,
                  }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats.total_users > 0
                ? Math.round((stats.active_users / stats.total_users) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={loadStats}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
