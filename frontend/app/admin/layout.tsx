'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/Header';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { FullPageLoader } from '@/components/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isInitialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.replace('/login');
      } else {
        const userRoleName = typeof user.role === 'string' ? user.role : user.role?.name;
        if (userRoleName?.toLowerCase() !== 'admin') {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || isLoading || !user) {
    return <FullPageLoader />;
  }

  const userRoleName = typeof user.role === 'string' ? user.role : user.role?.name;
  if (userRoleName?.toLowerCase() !== 'admin') {
    return <FullPageLoader />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pb-0 pb-24 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-950">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
