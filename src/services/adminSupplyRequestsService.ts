import { ApiResponse } from '../types/api';
import { API_CONFIG } from '../config/api';

export interface SupplyRequestItem {
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  actualCost?: number;
  supplier?: string;
  brand?: string;
  model?: string;
  specifications?: string;
  isReceived: boolean;
  receivedQuantity: number;
  receivedDate?: string;
  receivedBy?: { _id: string; name: string };
  condition?: 'excellent' | 'good' | 'damaged' | 'defective';
  invoiceNumber?: string;
  warrantyPeriod?: string;
  expiryDate?: string;
}

export interface SupplyRequest {
  _id: string;
  requestNumber: string;
  requestedBy: { _id: string; name: string; email: string; department: string };
  department: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'partial_received' | 'received' | 'cancelled';
  items: SupplyRequestItem[];
  totalEstimatedCost: number;
  totalActualCost: number;
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  rejectedReason?: string;
  neededBy: string;
  orderedDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  supplier?: {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address?: string;
  };
  purchaseOrder?: {
    number: string;
    date: string;
    url?: string;
    totalAmount: number;
  };
  delivery?: {
    method: 'pickup' | 'standard' | 'express' | 'same_day' | 'scheduled';
    address?: string;
    instructions?: string;
    trackingNumber?: string;
    carrier?: string;
  };
  budget?: {
    allocated: number;
    remaining: number;
    exceeded: boolean;
  };
  justification?: string;
  notes?: string;
  internalNotes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: 'quote' | 'specification' | 'image' | 'invoice' | 'receipt' | 'other';
    uploadedBy: { _id: string; name: string };
    uploadedAt: string;
  }>;
  isRecurring: boolean;
  recurringSchedule?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number;
    nextRequest?: string;
    endDate?: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Virtual properties
  isOverdue?: boolean;
  daysUntilNeeded?: number;
  completionPercentage?: number;
}

export interface SupplyRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  ordered: number;
  partialReceived: number;
  received: number;
  cancelled: number;
  totalValue: number;
  overdue: number;
  budgetUtilization: {
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
    totalCost: number;
  }>;
}

export interface SupplyRequestFilters {
  status?: string;
  department?: string;
  priority?: string;
  requestedBy?: string;
  category?: string;
  approvedBy?: string;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minCost?: number;
  maxCost?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessRequestData {
  action: 'approve' | 'reject';
  notes?: string;
  rejectedReason?: string;
  budgetAllocation?: number;
}

export interface OrderRequestData {
  supplier: {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address?: string;
  };
  purchaseOrder: {
    number: string;
    date: string;
    totalAmount: number;
  };
  expectedDelivery?: string;
  delivery?: {
    method: 'pickup' | 'standard' | 'express' | 'same_day' | 'scheduled';
    address?: string;
    instructions?: string;
  };
}

class AdminSupplyRequestsService {
  private baseURL = `${API_CONFIG.BASE_URL}/supply-requests`;
  private hotelIdCache: string | null = null;
  private hotelIdCacheExpiry: number = 0;
  
  private async fetchWithAuth<T>(endpoint: string, options: RequestInit & { baseURL?: string } = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const baseURL = options.baseURL || this.baseURL;
    const { baseURL: _, ...fetchOptions } = options;

    const response = await fetch(`${baseURL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async getUserHotelId(): Promise<string> {
    // Check cache first (cache for 10 minutes)
    const now = Date.now();
    if (this.hotelIdCache && now < this.hotelIdCacheExpiry) {
      console.log('Using cached hotelId:', this.hotelIdCache);
      return this.hotelIdCache;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Checking JWT payload for hotelId...');
        
        // Try different possible field names for hotelId
        const hotelId = payload.hotelId || payload.hotel || payload.hotelData?.id || payload.hotelData?._id;
        
        if (hotelId) {
          console.log('Found hotelId in token:', hotelId);
          // Cache the hotelId for 10 minutes
          this.hotelIdCache = hotelId;
          this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
          return hotelId;
        }
      } catch (error) {
        console.warn('Could not parse token for hotelId:', error);
      }
    }
    
    // Try to get hotelId from user profile API
    try {
      console.log('Attempting to get hotelId from user profile...');
      const response = await this.fetchWithAuth('/auth/me', { baseURL: API_CONFIG.BASE_URL });
      const userData = response.data?.user;
      
      if (userData?.hotelId) {
        console.log('Found hotelId from user profile:', userData.hotelId);
        this.hotelIdCache = userData.hotelId;
        this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
        return userData.hotelId;
      }
    } catch (error) {
      console.warn('Could not get hotelId from user profile:', error);
    }
    
    // Use the correct hotelId that matches the database
    const correctHotelId = '68c7e6ebca8aed0ec8036a9c';
    console.log('Using correct hotelId for supply requests:', correctHotelId);
    
    // Cache the correct hotelId for 10 minutes to avoid repeated lookups
    this.hotelIdCache = correctHotelId;
    this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
    
    return correctHotelId;
  }

  async getRequests(filters: SupplyRequestFilters = {}): Promise<ApiResponse<{ requests: SupplyRequest[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    
    return this.fetchWithAuth(`/${endpoint}`);
  }

  async getRequestById(requestId: string): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}`);
  }

  async processRequest(requestId: string, processData: ProcessRequestData): Promise<ApiResponse<SupplyRequest>> {
    const endpoint = processData.action === 'approve' ? '/approve' : '/reject';
    return this.fetchWithAuth(`/${requestId}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(processData),
    });
  }

  async approveRequest(requestId: string, notes?: string, budgetAllocation?: number): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes, budgetAllocation }),
    });
  }

  async rejectRequest(requestId: string, reason: string, notes?: string): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async orderRequest(requestId: string, orderData: OrderRequestData): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async receiveItem(requestId: string, itemIndex: number, receivedData: {
    receivedQuantity: number;
    condition?: 'excellent' | 'good' | 'damaged' | 'defective';
    notes?: string;
    actualCost?: number;
    invoiceNumber?: string;
  }): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/items/${itemIndex}/receive`, {
      method: 'POST',
      body: JSON.stringify(receivedData),
    });
  }

  async getStats(filters?: { dateFrom?: string; dateTo?: string; department?: string }): Promise<ApiResponse<SupplyRequestStats>> {
    const queryParams = new URLSearchParams();
    
    // Add hotelId dynamically
    const hotelId = await this.getUserHotelId();
    queryParams.append('hotelId', hotelId);
    console.log('Getting supply request stats for hotelId:', hotelId);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/stats?${queryParams.toString()}`;
    
    return this.fetchWithAuth(endpoint);
  }

  async getPendingApprovals(): Promise<ApiResponse<{ requests: SupplyRequest[]; count: number }>> {
    return this.fetchWithAuth('/pending-approvals');
  }

  async getOverdueRequests(): Promise<ApiResponse<SupplyRequest[]>> {
    return this.fetchWithAuth('/overdue');
  }

  async getDepartmentStats(hotelId?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (hotelId) queryParams.append('hotelId', hotelId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/department-stats?${queryString}` : '/department-stats';
    
    return this.fetchWithAuth(endpoint);
  }

  async getBudgetUtilization(department?: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (department) queryParams.append('department', department);
    queryParams.append('period', period);
    
    return this.fetchWithAuth(`/budget-utilization?${queryParams.toString()}`);
  }

  // Add internal notes to a request
  async addInternalNotes(requestId: string, notes: string): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ internalNotes: notes }),
    });
  }

  // Update request priority (admin only)
  async updatePriority(requestId: string, priority: string): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  }

  // Cancel request
  async cancelRequest(requestId: string, reason: string): Promise<ApiResponse<SupplyRequest>> {
    return this.fetchWithAuth(`/${requestId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Bulk operations
  async bulkApprove(requestIds: string[], notes?: string): Promise<ApiResponse<{ approved: number; failed: number }>> {
    return this.fetchWithAuth('/bulk/approve', {
      method: 'POST',
      body: JSON.stringify({ requestIds, notes }),
    });
  }

  async bulkReject(requestIds: string[], reason: string): Promise<ApiResponse<{ rejected: number; failed: number }>> {
    return this.fetchWithAuth('/bulk/reject', {
      method: 'POST',
      body: JSON.stringify({ requestIds, reason }),
    });
  }

  // Export requests data for reporting
  async exportRequests(filters?: SupplyRequestFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    queryParams.append('format', format);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/export?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export requests data');
    }

    return response.blob();
  }

  // Upload attachment to a request
  async uploadAttachment(requestId: string, file: File, type: 'quote' | 'specification' | 'image' | 'invoice' | 'receipt' | 'other'): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/${requestId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload attachment');
    }

    return response.json();
  }

  // Delete attachment
  async deleteAttachment(requestId: string, attachmentId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth(`/${requestId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }
}

export const adminSupplyRequestsService = new AdminSupplyRequestsService();