import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      // Don't set default Content-Type - let axios set it based on data type (JSON for objects, multipart/form-data for FormData)
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token and handle Content-Type
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Handle FormData - explicitly delete Content-Type so axios sets it with boundary
        if (config.data instanceof FormData) {
          if (config.headers) {
            // Delete any existing Content-Type - axios will set multipart/form-data with boundary
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
          }
        } else if (config.data && typeof config.data === 'object' && !config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
          // Set JSON Content-Type only for non-FormData objects
          if (config.headers) {
            config.headers['Content-Type'] = 'application/json';
          }
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
          });
        }

        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;

