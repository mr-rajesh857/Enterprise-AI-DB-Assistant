'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { QueryResponse } from '@/types';
import { LoadingSpinner } from './Loading';
import { ErrorAlert, SuccessAlert } from './Alert';
import { Send, Copy, Download } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response?: QueryResponse;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    setLoading(true);
    try {
      const response = await apiClient.chat({
        message: userMessage,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.answer, response },
      ]);

      if (response.status === 'success') {
        setSuccess('Query executed successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process query';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = (response: QueryResponse) => {
    if (!response.rows || !response.columns) return;

    const csv =
      [response.columns, ...response.rows.map((row) => response.columns!.map((col) => row[col]))].map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${new Date().toISOString()}.csv`;
    a.click();
  };

  const copySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setSuccess('SQL copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-500">Start a conversation to query your database</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 rounded-lg rounded-tl-none'
                } p-4`}
              >
                <p className="mb-2">{message.content}</p>

                {message.response && (
                  <div className="mt-4 space-y-3">
                    {message.response.sql && (
                      <div className="bg-gray-800 text-gray-100 rounded p-3 text-sm font-mono overflow-x-auto">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-400">SQL Query</span>
                          <button
                            onClick={() => copySql(message.response!.sql!)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Copy SQL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="overflow-auto max-h-32">{message.response.sql}</pre>
                      </div>
                    )}

                    {message.response.rows && message.response.rows.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold">
                            Results ({message.response.row_count} rows)
                          </span>
                          <button
                            onClick={() => downloadResults(message.response!)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Download as CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="overflow-x-auto max-h-48 bg-white rounded text-black text-xs">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-200">
                                {message.response.columns?.map((col) => (
                                  <th key={col} className="border p-2 text-left font-semibold">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.response.rows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-t hover:bg-gray-50">
                                  {message.response!.columns?.map((col) => (
                                    <td key={col} className="border p-2">
                                      {String(row[col]).substring(0, 50)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {message.response.rows.length > 5 && (
                                <tr className="bg-gray-100">
                                  <td
                                    colSpan={message.response.columns?.length || 1}
                                    className="border p-2 text-center text-gray-600"
                                  >
                                    ... and {message.response.rows.length - 5} more rows
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="px-6 pb-2">
          <ErrorAlert
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}
      {success && (
        <div className="px-6 pb-2">
          <SuccessAlert
            message={success}
            onClose={() => setSuccess(null)}
          />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your database..."
          className="flex-1 px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
