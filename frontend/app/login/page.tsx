'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { ErrorAlert } from '@/components/Alert';
import { LoadingSpinner, FullPageLoader } from '@/components/Loading';
import { Sparkles, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading, isInitialized, initializeAuth, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/dashboard');
    }
  }, [user, isInitialized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  if (!isInitialized || (user && !localError)) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/20 border border-blue-400/30 mb-1">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Enterprise AI DB Assistant</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
            Natural language database querying with LangGraph StateGraph & FastMCP tool isolation.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          {(localError || error) && (
            <ErrorAlert message={localError || error || ''} onClose={() => setLocalError(null)} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition font-mono"
                  disabled={isLoading}
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition font-mono"
                  disabled={isLoading}
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In to Assistant'
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
            <p>Admin: admin@example.com | User: analyst@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
