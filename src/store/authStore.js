import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      permissions: [],
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          const perms = (data.permissions || []).map((p) => p.name ?? p);
          set({
            token: data.access_token,
            refreshToken: data.refresh_token,
            permissions: perms,
            isLoading: false,
          });
          return true;
        } catch (err) {
          const msg = err.response?.data?.message || 'بيانات الدخول غير صحيحة';
          set({ error: msg, isLoading: false });
          return false;
        }
      },

      fetchPermissions: async () => {
        try {
          const data = await authApi.getPermissions();
          const perms = (data || []).map((p) => p.name ?? p);
          set({ permissions: perms });
        } catch {
          // token expired — interceptor will redirect to /login
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, permissions: [], error: null });
      },
    }),
    {
      name: 'complaints-auth',
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, permissions: s.permissions }),
    }
  )
);

export default useAuthStore;
