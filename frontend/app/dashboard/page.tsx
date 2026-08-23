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
    <div className="h-[calc(100vh-61px)] w-full p-3 sm:p-4 bg-slate-950 flex flex-col">
      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </div>
      )}

      {initialized && (
        <div className="flex-1 w-full h-full min-h-0">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}
