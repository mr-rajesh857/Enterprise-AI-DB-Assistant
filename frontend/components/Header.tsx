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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{title}</h1>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{typeof user.role === 'string' ? user.role : user.role?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-gray-50 px-4 py-3">
          {user && (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{typeof user.role === 'string' ? user.role : user.role?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
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
