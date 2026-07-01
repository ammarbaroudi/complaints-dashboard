import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          set({ token: data.access_token, refreshToken: data.refresh_token, isLoading: false });
          return true;
        } catch (err) {
          const msg = err.response?.data?.message || 'بيانات الدخول غير صحيحة';
          set({ error: msg, isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, error: null });
      },
    }),
    {
      name: 'complaints-auth',
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken }),
    }
  )
);

export default useAuthStore;
