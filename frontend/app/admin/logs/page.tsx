'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { AuditLog } from '@/types';
import { AuditLogTable } from '@/components/AuditLogs';
import { ErrorAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Activity } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * PAGE_SIZE;
      const data = await apiClient.getAuditLogs(skip, PAGE_SIZE);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Audit & Query Logs</h1>
            <p className="text-xs text-slate-400 font-mono">Real-time compliance monitoring, query execution tracking, and access logs.</p>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            <p>No audit log entries found.</p>
          </div>
        ) : (
          <AuditLogTable
            logs={logs}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
