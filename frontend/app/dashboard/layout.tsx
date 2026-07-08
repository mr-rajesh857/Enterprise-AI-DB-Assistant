'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/Header';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { FullPageLoader } from '@/components/Loading';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pb-0 pb-24">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
