import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
});

// Utility function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const sessionToken = getCookie('session_token');
    
    if (sessionToken) {
      // Add Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    
    // Log request for debugging
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      hasToken: !!sessionToken
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear session token cookie
      document.cookie = 'session_token=; path=/; secure; samesite=none; max-age=0';
      
      // Show error message
      toast.error('Session expired. Please login again.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
    
    // Handle other error statuses
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('Access forbidden. You don\'t have permission for this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    }
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;

// Export specific methods for convenience
export const apiGet = (url, config) => api.get(url, config);
export const apiPost = (url, data, config) => api.post(url, data, config);
export const apiPut = (url, data, config) => api.put(url, data, config);
export const apiDelete = (url, config) => api.delete(url, config);
export const apiPatch = (url, data, config) => api.patch(url, data, config);