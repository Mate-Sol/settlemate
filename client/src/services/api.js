import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// PSP endpoints
export const pspAPI = {
  getProfile: () => api.get('/psp/profile'),
  updateProfile: (data) => api.put('/psp/profile', data),
  applyForLimit: (data) => api.post('/psp/apply-limit', data),
  getOrderBook: () => api.get('/psp/order-book'),
  requestFinancing: (data) => api.post('/psp/request-financing', data),
  getFinancingRequest: (id) => api.get(`/psp/financing-requests/${id}`),
  getActiveFinancings: () => api.get('/psp/active-financings'),
  getRepaymentQuote: (requestId) => api.get(`/psp/repayment-quote/${requestId}`),
  processRepayment: (data) => api.post('/psp/process-repayment', data),
  getPoolStatus: () => api.get('/psp/pool-status'),
  getCreditLineExpiry: () => api.get('/psp/credit-line-expiry'),
};

// CRO endpoints
export const croAPI = {
  getApplications: (status) => api.get('/cro/applications', { params: { status } }),
  getApplication: (id) => api.get(`/cro/applications/${id}`),
  approveApplication: (id, data) => api.post(`/cro/applications/${id}/approve`, data),
  rejectApplication: (id, data) => api.post(`/cro/applications/${id}/reject`, data),
  requestInfo: (id, data) => api.post(`/cro/applications/${id}/request-info`, data),
  getStats: () => api.get('/cro/stats'),
};

// CFO endpoints
export const cfoAPI = {
  getStats: () => api.get('/cfo/stats'),
  getDashboardStats: () => api.get('/cfo/dashboard-stats'),
  getAllFinancings: () => api.get('/cfo/all-financings'),
  getExposure: () => api.get('/cfo/exposure'),
  getYieldHistory: () => api.get('/cfo/yield-history'),
  getYieldAnalytics: () => api.get('/cfo/yield-analytics'),
  getRepaymentHistory: (params) => api.get('/cfo/repayment-history', { params }),
};

export default api;
