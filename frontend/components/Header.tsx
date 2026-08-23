'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Enterprise AI DB Assistant' }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-sm font-semibold text-slate-100 hidden sm:block tracking-wide">{title}</h1>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-200">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 font-mono capitalize">{typeof user.role === 'string' ? user.role : user.role?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 py-3">
          {user && (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-semibold text-slate-200">{user.full_name}</p>
                <p className="text-xs text-slate-400 font-mono capitalize">{typeof user.role === 'string' ? user.role : user.role?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
