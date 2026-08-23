'use client';

import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Code2 } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function AuditLogTable({
  logs,
  total,
  page,
  pageSize,
  onPageChange,
  loading,
}: AuditLogTableProps) {
  const [expandedQueries, setExpandedQueries] = useState<Record<number, boolean>>({});
  const totalPages = Math.ceil(total / pageSize);

  const toggleQuery = (id: number) => {
    setExpandedQueries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4 text-slate-100">
      <div className="w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider select-none">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Natural Prompt & Executed SQL</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Rows Returned</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {logs.map((log) => {
                const isSuccess = log.status?.toLowerCase() === 'success' || log.status?.toLowerCase() === 'completed';
                const isError = log.status?.toLowerCase() === 'error' || log.status?.toLowerCase() === 'failed';

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white text-xs">{log.user_name || log.user_email || 'User'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{log.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-300 capitalize">{log.action}</td>
                    <td className="px-6 py-4 max-w-sm">
                      {log.natural_language && (
                        <p className="text-xs text-slate-200 mb-1.5 line-clamp-2">"{log.natural_language}"</p>
                      )}
                      {log.sql_query ? (
                        <code
                          onClick={() => toggleQuery(log.id)}
                          className={`text-[11px] font-mono bg-slate-950 text-blue-400 border border-slate-800 px-2.5 py-1.5 rounded-lg block cursor-pointer hover:border-slate-700 transition ${
                            expandedQueries[log.id] ? 'whitespace-pre-wrap' : 'truncate max-w-xs'
                          }`}
                          title={expandedQueries[log.id] ? 'Click to collapse' : 'Click to expand SQL'}
                        >
                          <span className="text-slate-500 mr-1 flex items-center gap-1 inline-flex">
                            <Code2 className="w-3 h-3" /> SQL:
                          </span>
                          {log.sql_query}
                        </code>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isError
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : isError ? (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-300">{log.row_count ?? '-'}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-400 font-mono">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} audit records
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
            .map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                  pageNum === page
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400'
                }`}
              >
                {pageNum}
              </button>
            ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || loading}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
