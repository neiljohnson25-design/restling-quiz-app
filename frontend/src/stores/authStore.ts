import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';
import type { User, AuthResponse, XpProgress, UserStats } from '../types';

interface AuthState {
  user: User | null;
  stats: UserStats | null;
  xpProgress: XpProgress | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      stats: null,
      xpProgress: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });

          // Fetch full user profile with stats
          await get().fetchUser();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/register', {
            email,
            username,
            password,
          });
          const { user, accessToken, refreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          await api.post('/auth/logout', { refreshToken });
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, stats: null, xpProgress: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await api.get('/users/me');
          const { stats, xpProgress, ...userData } = response.data.user;
          set({ user: userData, stats, xpProgress, isAuthenticated: true });
        } catch (error: any) {
          // Only log out on 401 (unauthorized) - other errors might be temporary
          if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null, stats: null, xpProgress: null, isAuthenticated: false });
          }
          // For other errors, keep the user authenticated but log for debugging
          console.error('Failed to fetch user profile:', error);
        }
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
