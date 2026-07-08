'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { ChatInterface } from '@/components/ChatInterface';
import { ErrorAlert } from '@/components/Alert';

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Just verify we can access the API
        await apiClient.getTables();
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    checkPermissions();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Query Your Database</h1>
        <p className="text-gray-600">
          Ask questions about your data in natural language. The AI will write and execute SQL queries.
        </p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {initialized && (
        <div className="bg-white rounded-lg shadow h-screen max-h-[calc(100vh-200px)] min-h-96">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}
