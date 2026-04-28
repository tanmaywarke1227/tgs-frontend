import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://onrender.com',
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- THIS IS WHERE THE AUTHORIZATION HEADER IS ADDED ---
api.interceptors.request.use(
  (config) => {
    // 1. Pull the user data from storage
    const userData = localStorage.getItem('tgs_user');
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      const token = parsedData.token; // Or just parsedData if you saved only the string

      if (token) {
        // 2. This adds the header you were asking about to EVERY request
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tgs_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
