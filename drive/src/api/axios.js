// src/api/axios.js
import axios from 'axios';

// Create an Axios instance with base URL pointing to the Node.js backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to attach the JWT token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to catch JWT expiration or validation failures (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 Unauthorized, local token is expired/invalid
    if (error.response && error.response.status === 401) {
      // Wipe invalid credentials from storage
      localStorage.removeItem('user');
      
      // Auto-redirect to login screen on session expiry
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
