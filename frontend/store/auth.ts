import { create } from 'zustand';
import { User } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login({ email, password });
      apiClient.setToken(response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isInitialized: true,
      });
      throw error;
    }
  },

  logout: async () => {
    await apiClient.logout();
    set({
      user: null,
      token: null,
      error: null,
      isLoading: false,
      isInitialized: true,
    });
  },

  initializeAuth: async () => {
    if (get().isInitialized && !get().isLoading) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      try {
        set({ isLoading: true });
        apiClient.setToken(token);
        const user = await apiClient.getMe();
        set({
          user,
          token,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error: unknown) {
        apiClient.clearToken();
        set({
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    } else {
      set({
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },
}));
