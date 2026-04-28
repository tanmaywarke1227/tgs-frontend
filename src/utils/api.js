import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tgs-backend-ifpp.onrender.com',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tgs_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
