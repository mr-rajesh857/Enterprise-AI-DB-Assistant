'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const auth = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!auth.user && !auth.isLoading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        router.push('/login');
      }
    }
  }, [auth.user, auth.isLoading, router]);

  return auth;
}

export function useProtected() {
  const auth = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.user, auth.isLoading, router]);

  return auth;
}

export function useAdminOnly() {
  const auth = useProtected();
  const router = useRouter();

  useEffect(() => {
    if (auth.user && auth.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [auth.user, router]);

  return auth;
}
