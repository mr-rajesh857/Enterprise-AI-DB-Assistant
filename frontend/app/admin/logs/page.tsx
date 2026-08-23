'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { AuditLog } from '@/types';
import { AuditLogTable } from '@/components/AuditLogs';
import { ErrorAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track all database queries and actions</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No audit logs found.</p>
          </div>
        ) : (
          <div className="p-6">
            <AuditLogTable
              logs={logs}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
