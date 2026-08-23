'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Stats } from '@/types';
import { ErrorAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Users, BarChart3, CheckCircle2, AlertCircle, TrendingUp, RefreshCw, LayoutDashboard } from 'lucide-react';

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
      <div className="p-12 flex justify-center">
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
      title: 'Total Accounts',
      value: stats.total_users,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-600 to-indigo-600',
      badge: 'RBAC Managed',
    },
    {
      title: 'Active Users',
      value: stats.active_users,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Active Today',
    },
    {
      title: 'Total Executed Queries',
      value: stats.total_queries,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Lifetime Total',
    },
    {
      title: 'Queries Today',
      value: stats.queries_today,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'from-amber-600 to-orange-600',
      badge: 'Last 24 Hours',
    },
    {
      title: 'Successful Queries',
      value: stats.successful,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'from-emerald-600 to-emerald-500',
      badge: 'Passed',
    },
    {
      title: 'Failed Queries',
      value: stats.failed,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'from-rose-600 to-red-500',
      badge: 'Blocked / Error',
    },
  ];

  const successRate = stats.total_queries > 0 ? Math.round((stats.successful / stats.total_queries) * 100) : 0;
  const userRate = stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Metrics & Intelligence</h1>
            <p className="text-xs text-slate-400 font-mono">System performance metrics, user engagement, and query telemetry.</p>
          </div>
        </div>

        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold shadow-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} shadow-md text-white`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                {card.badge}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400">{card.title}</p>
              <p className="text-3xl font-bold text-white tracking-tight mt-1">{card.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Gauge Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Query Success Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Query Execution Reliability</h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold">{successRate}% Success</span>
          </div>

          <div className="space-y-2">
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-md shadow-emerald-500/20"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{stats.successful} Successful</span>
              <span>{stats.failed} Blocked/Errors</span>
            </div>
          </div>
        </div>

        {/* User Engagement Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Active Account Rate</h3>
            <span className="text-xs font-mono text-blue-400 font-semibold">{userRate}% Active</span>
          </div>

          <div className="space-y-2">
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 shadow-md shadow-blue-500/20"
                style={{ width: `${userRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{stats.active_users} Active Accounts</span>
              <span>{stats.total_users} Total Accounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
