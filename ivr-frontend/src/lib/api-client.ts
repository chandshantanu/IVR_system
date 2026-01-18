import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from './toast';
import { env } from './env';

const API_URL = env.apiUrl;

// Enable request/response logging in development
const DEBUG = env.isDev;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and logging
apiClient.interceptors.request.use(
  (config) => {
    // Log request in development
    if (DEBUG) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    // Get token from localStorage if it exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add timestamp for request duration tracking
    (config as any).metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (DEBUG) {
      const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`,
        response.data
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log error
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle network errors
    if (!error.response) {
      const errorMsg = 'Network error. Please check your connection.';
      toast.error(errorMsg, 'Connection Failed');
      return Promise.reject(new ApiError(0, errorMsg));
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - try to refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
        return Promise.reject(new ApiError(401, 'Session expired. Please login again.'));
      }
    }

    // Handle other errors
    const errorMessage = (data as any)?.message || error.message || 'An error occurred';

    // Show toast for errors (except 401 which is handled above)
    if (status !== 401) {
      let toastMessage = errorMessage;
      let toastTitle = 'Error';

      if (status === 403) {
        toastTitle = 'Access Denied';
        toastMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        toastTitle = 'Not Found';
        toastMessage = 'The requested resource was not found.';
      } else if (status === 422 || status === 400) {
        toastTitle = 'Validation Error';
      } else if (status >= 500) {
        toastTitle = 'Server Error';
        toastMessage = 'An internal server error occurred. Please try again later.';
      }

      toast.error(toastMessage, toastTitle);
    }

    return Promise.reject(new ApiError(status, errorMessage, data));
  }
);

// API request wrapper with error handling
export async function apiRequest<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.status || 500,
        error.message,
        error.response?.data
      );
    }
    throw new ApiError(500, 'An unexpected error occurred');
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

export default apiClient;
