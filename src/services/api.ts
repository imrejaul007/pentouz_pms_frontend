import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://hotel-management-xcsx.onrender.com/api/v1'  // Your deployed backend URL
    : 'http://localhost:4002/api/v1');  // Use test server that works

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 AUTH: Request interceptor - Token exists?', !!token);
    console.log('🔐 AUTH: Request URL:', config.url);
    
    if (token) {
      console.log('🔐 AUTH: Token found, validating...');
      // Validate token format before sending
      try {
        // Basic JWT format validation (3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('🔐 AUTH: Invalid JWT token format detected, clearing token');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return config;
        }
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 AUTH: Token added to request headers');
      } catch (error) {
        console.warn('🔐 AUTH: Token validation failed, clearing token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else {
      console.warn('🔐 AUTH: No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('🔐 AUTH: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      console.warn('401 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle JWT parsing errors specifically
    if (response?.data?.error?.message?.includes('JSON') && response?.data?.error?.message?.includes('position')) {
      console.error('JWT token parsing error detected:', response.data.error.message);
      localStorage.removeItem('token');
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (response?.status === 429) {
      // Rate limit exceeded
      toast.error('Too many requests. Please wait a moment and try again.');
      return Promise.reject(error);
    }
    
    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (response?.data?.message) {
      // Don't show toast here as it might be handled by the calling component
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Centralized Rates API
export const centralizedRatesApi = {
  // Rate CRUD operations
  createRate: (data: any) => api.post('/centralized-rates', data),
  getRates: (params?: any) => api.get('/centralized-rates', { params }),
  getRateById: (rateId: string, params?: any) => api.get(`/centralized-rates/${rateId}`, { params }),
  updateRate: (rateId: string, data: any) => api.put(`/centralized-rates/${rateId}`, data),
  deleteRate: (rateId: string) => api.delete(`/centralized-rates/${rateId}`),
  
  // Rate operations
  distributeRate: (rateId: string, data: any) => api.post(`/centralized-rates/${rateId}/distribute`, data),
  calculateRate: (rateId: string, data: any) => api.post(`/centralized-rates/${rateId}/calculate`, data),
  validateRate: (rateId: string) => api.get(`/centralized-rates/${rateId}/validate`),
  duplicateRate: (rateId: string, data: any) => api.post(`/centralized-rates/${rateId}/duplicate`, data),
  updateRateStatus: (rateId: string, data: any) => api.patch(`/centralized-rates/${rateId}/status`, data),
  
  // Distribution and sync
  previewDistribution: (rateId: string, data: any) => api.post(`/centralized-rates/${rateId}/preview-distribution`, data),
  syncRates: (groupId: string, data?: any) => api.post(`/centralized-rates/group/${groupId}/sync`, data),
  
  // Analytics and reporting
  getRateAnalytics: (rateId: string, params?: any) => api.get(`/centralized-rates/${rateId}/analytics`, { params }),
  getRateHistory: (rateId: string, params?: any) => api.get(`/centralized-rates/${rateId}/history`, { params }),
  getGroupDashboard: (groupId: string, params?: any) => api.get(`/centralized-rates/group/${groupId}/dashboard`, { params }),
  exportRates: (params?: any) => api.get('/centralized-rates/export', { params }),
  
  // Conflict management
  getConflicts: (params?: any) => api.get('/centralized-rates/conflicts', { params }),
  resolveConflict: (conflictId: string, data: any) => api.post(`/centralized-rates/conflicts/${conflictId}/resolve`, data),
  
  // Additional utility functions
  getRateDistribution: (rateId: string) => api.get(`/centralized-rates/${rateId}/distribution`),
  getActiveConflicts: (rateId: string) => api.get(`/centralized-rates/${rateId}/conflicts`),
  getDashboardStats: () => api.get('/centralized-rates/dashboard/stats'),
  getGroupAnalytics: (groupId: string, params?: any) => api.get(`/centralized-rates/group/${groupId}/analytics`, { params }),
  syncRate: (rateId: string) => api.post(`/centralized-rates/${rateId}/sync`)
};

// Property Groups API
export const propertyGroupsApi = {
  // Group CRUD operations
  createGroup: (data: any) => api.post('/property-groups', data),
  getGroups: (params?: any) => api.get('/property-groups', { params }),
  getGroupById: (groupId: string, params?: any) => api.get(`/property-groups/${groupId}`, { params }),
  updateGroup: (groupId: string, data: any) => api.put(`/property-groups/${groupId}`, data),
  deleteGroup: (groupId: string) => api.delete(`/property-groups/${groupId}`),
  
  // Group operations
  getGroupStats: (groupId: string) => api.get(`/property-groups/${groupId}/stats`),
  addPropertiesToGroup: (groupId: string, data: any) => api.post(`/property-groups/${groupId}/properties`, data),
  removePropertiesFromGroup: (groupId: string, data: any) => api.delete(`/property-groups/${groupId}/properties`, { data }),
  syncGroupSettings: (groupId: string, data?: any) => api.post(`/property-groups/${groupId}/sync`, data),
  
  // Dashboard and analytics
  getConsolidatedDashboard: (groupId: string, params?: any) => api.get(`/property-groups/${groupId}/dashboard`, { params }),
  getPropertyGroupAuditLog: (groupId: string, params?: any) => api.get(`/property-groups/${groupId}/audit-log`, { params }),
  
  // Settings management
  updateGroupSettings: (groupId: string, data: any) => api.patch(`/property-groups/${groupId}/settings`, data)
};

// API Management API
export const apiManagementApi = {
  // API Keys CRUD operations
  createAPIKey: (data: any) => api.post('/api-management/api-keys', data),
  getAPIKeys: (params?: any) => api.get('/api-management/api-keys', { params }),
  getAPIKeyById: (keyId: string, params?: any) => api.get(`/api-management/api-keys/${keyId}`, { params }),
  updateAPIKey: (keyId: string, data: any) => api.put(`/api-management/api-keys/${keyId}`, data),
  deleteAPIKey: (keyId: string) => api.delete(`/api-management/api-keys/${keyId}`),
  toggleAPIKeyStatus: (keyId: string) => api.patch(`/api-management/api-keys/${keyId}/toggle`),
  
  // Webhook CRUD operations
  createWebhook: (data: any) => api.post('/api-management/webhooks', data),
  getWebhooks: (params?: any) => api.get('/api-management/webhooks', { params }),
  getWebhookById: (webhookId: string, params?: any) => api.get(`/api-management/webhooks/${webhookId}`, { params }),
  updateWebhook: (webhookId: string, data: any) => api.put(`/api-management/webhooks/${webhookId}`, data),
  deleteWebhook: (webhookId: string) => api.delete(`/api-management/webhooks/${webhookId}`),
  testWebhook: (webhookId: string) => api.post(`/api-management/webhooks/${webhookId}/test`),
  regenerateWebhookSecret: (webhookId: string) => api.post(`/api-management/webhooks/${webhookId}/regenerate-secret`),
  
  // API Endpoints Catalog
  getAllEndpoints: (params?: any) => api.get('/api-management/endpoints', { params }),

  // Metrics and Analytics
  getMetrics: (params?: any) => api.get('/api-management/metrics', { params }),
  getTopEndpoints: (params?: any) => api.get('/api-management/metrics/endpoints', { params }),
  getEndpointMetrics: (endpoint: string, params?: any) => api.get(`/api-management/metrics/endpoints/${encodeURIComponent(endpoint)}`, { params }),
  getAPIKeyUsage: (params?: any) => api.get('/api-management/metrics/api-keys', { params }),
  getWebhookStats: (params?: any) => api.get('/api-management/metrics/webhooks', { params }),
  
  // Export functionality
  exportLogs: (params?: any) => api.get('/api-management/export/logs', { params, responseType: 'blob' }),

  // API Documentation
  getAPIDocumentation: () => api.get('/api-management/documentation'),
};

export { api };