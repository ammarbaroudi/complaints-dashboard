import axios from 'axios';

const BASE_URL = 'https://complaints-nest.onrender.com';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('complaints-auth');
  if (raw) {
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.token ?? parsed?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isLoginRequest = original?.url?.includes('/auth/login');
    const isRefreshRequest = original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !isLoginRequest && !isRefreshRequest && !original._retry) {
      original._retry = true;

      const raw = localStorage.getItem('complaints-auth');
      const parsed = raw ? JSON.parse(raw) : {};
      const refreshToken = parsed?.state?.refreshToken ?? parsed?.refreshToken;

      if (!refreshToken) {
        localStorage.removeItem('complaints-auth');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const newToken = data.access_token;

        // zustand/persist يخزن البيانات داخل { state: { token, refreshToken } }
        const stored = JSON.parse(localStorage.getItem('complaints-auth') || '{}');
        if (!stored.state) stored.state = {};
        stored.state.token = newToken;
        if (data.refresh_token) stored.state.refreshToken = data.refresh_token;
        localStorage.setItem('complaints-auth', JSON.stringify(stored));

        if (data.permissions) {
          const { default: useAuthStore } = await import('../store/authStore');
          const perms = data.permissions.map((p) => p.name ?? p);
          useAuthStore.setState({ permissions: perms });
        }

        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('complaints-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  getPermissions: () =>
    api.get('/auth/permissions').then((r) => r.data),
};

export const categoriesApi = {
  getAll: () => api.get('/categories').then((r) => r.data),
  create: (body) => api.post('/categories', body).then((r) => r.data),
  update: (id, body) => api.patch(`/categories/${id}`, body).then((r) => r.data),
  delete: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const requestsApi = {
  getAll: () => api.get('/requests').then((r) => r.data),
  respond: (id, body) =>
    api.patch(`/requests/${id}/respond`, body).then((r) => r.data),
  delete: (id) => api.delete(`/requests/${id}`).then((r) => r.data),
};

export default api;
