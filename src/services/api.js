import axios from 'axios';

const BASE_URL = 'https://complaints-nest.onrender.com';

const api = axios.create({ baseURL: BASE_URL });

function getStore() {
  return import('../store/authStore').then((m) => m.default);
}

api.interceptors.request.use(async (config) => {
  const store = await getStore();
  const token = store.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

      const store = await getStore();
      const refreshToken = store.getState().refreshToken;

      if (!refreshToken) {
        store.getState().logout();
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

        const update = { token: newToken };
        if (data.refresh_token) update.refreshToken = data.refresh_token;
        if (data.permissions) update.permissions = data.permissions.map((p) => p.name ?? p);
        store.setState(update);

        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.getState().logout();
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
