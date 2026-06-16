import axios from 'axios';

const api = axios.create({
  // All calls go through Next.js — proxy.ts injects the Authorization header
  baseURL: '/api',
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // Ask the Next.js refresh Route Handler to rotate the access token cookie
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });

      if (refreshRes.ok) {
        // Cookie updated server-side — proxy.ts will inject the new token on retry
        return api(original);
      }

      // Refresh failed — redirect to login
      window.location.href = '/auth';
    }

    return Promise.reject(error);
  }
);

export default api;
