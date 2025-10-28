/**
 * API Client for making HTTP requests to the backend
 * Handles authentication tokens and error responses
 */

// Use relative URLs for same-domain API calls (works in both dev and production)
// Only use NEXT_PUBLIC_APP_URL if explicitly set for external API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Try to get token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP errors
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Convenience exports
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string; refreshToken: string }>('/api/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    apiClient.post<{ user: any; token: string; refreshToken: string }>('/api/auth/register', data),
  getCurrentUser: () => apiClient.get<{ user: any }>('/api/auth/me'),

  // Employees
  getEmployees: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/employees', params),
  getEmployee: (id: string) => apiClient.get(`/api/employees/${id}`),
  createEmployee: (data: any) => apiClient.post('/api/employees', data),
  updateEmployee: (id: string, data: any) =>
    apiClient.put(`/api/employees/${id}`, data),
  deleteEmployee: (id: string) => apiClient.delete(`/api/employees/${id}`),

  // Departments
  getDepartments: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/departments', params),
  getDepartment: (id: string) => apiClient.get(`/api/departments/${id}`),
  createDepartment: (data: any) => apiClient.post('/api/departments', data),
  updateDepartment: (id: string, data: any) =>
    apiClient.put(`/api/departments/${id}`, data),
  deleteDepartment: (id: string) => apiClient.delete(`/api/departments/${id}`),

  // Shifts
  getShifts: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/shifts', params),
  getShift: (id: string) => apiClient.get(`/api/shifts/${id}`),
  createShift: (data: any) => apiClient.post('/api/shifts', data),
  updateShift: (id: string, data: any) =>
    apiClient.put(`/api/shifts/${id}`, data),
  deleteShift: (id: string) => apiClient.delete(`/api/shifts/${id}`),

  // Meal Sessions
  getMealSessions: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/meals/sessions', params),
  getMealSession: (id: string) => apiClient.get(`/api/meals/sessions/${id}`),
  createMealSession: (data: any) =>
    apiClient.post('/api/meals/sessions', data),
  updateMealSession: (id: string, data: any) =>
    apiClient.put(`/api/meals/sessions/${id}`, data),
  deleteMealSession: (id: string) =>
    apiClient.delete(`/api/meals/sessions/${id}`),

  // Inventory Items
  getInventoryItems: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/inventory/items', params),
  getInventoryItem: (id: string) => apiClient.get(`/api/inventory/items/${id}`),
  createInventoryItem: (data: any) =>
    apiClient.post('/api/inventory/items', data),
  updateInventoryItem: (id: string, data: any) =>
    apiClient.put(`/api/inventory/items/${id}`, data),
  deleteInventoryItem: (id: string) =>
    apiClient.delete(`/api/inventory/items/${id}`),

  // Stock Movements
  getStockMovements: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/inventory/movements', params),
  getStockMovement: (id: string) => apiClient.get(`/api/inventory/movements/${id}`),
  createStockMovement: (data: any) =>
    apiClient.post('/api/inventory/movements', data),
  updateStockMovement: (id: string, data: any) =>
    apiClient.put(`/api/inventory/movements/${id}`, data),
  deleteStockMovement: (id: string) =>
    apiClient.delete(`/api/inventory/movements/${id}`),

  // Reconciliations
  getReconciliations: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/inventory/reconciliations', params),
  getReconciliation: (id: string) => apiClient.get(`/api/inventory/reconciliations/${id}`),
  createReconciliation: (data: any) =>
    apiClient.post('/api/inventory/reconciliations', data),
  updateReconciliation: (id: string, data: any) =>
    apiClient.put(`/api/inventory/reconciliations/${id}`, data),
  deleteReconciliation: (id: string) =>
    apiClient.delete(`/api/inventory/reconciliations/${id}`),

  // Vendors
  getVendors: (params?: Record<string, any>) =>
    apiClient.get<any[]>('/api/procurement/vendors', params),
  getVendor: (id: string) => apiClient.get(`/api/procurement/vendors/${id}`),
  createVendor: (data: any) => apiClient.post('/api/procurement/vendors', data),
  updateVendor: (id: string, data: any) =>
    apiClient.put(`/api/procurement/vendors/${id}`, data),
  deleteVendor: (id: string) => apiClient.delete(`/api/procurement/vendors/${id}`),
};

export { apiClient };
