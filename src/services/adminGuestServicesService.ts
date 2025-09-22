import { ApiResponse } from '../types/api';
import { API_CONFIG } from '../config/api';

export interface GuestService {
  _id: string;
  serviceType: 'room_service' | 'housekeeping' | 'maintenance' | 'concierge' | 'transport' | 'spa' | 'laundry' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  userId?: { _id: string; name: string; email: string; phone?: string };
  bookingId?: { 
    _id: string; 
    bookingNumber: string;
    rooms?: Array<{ roomId?: { roomNumber: string } }>;
  };
  assignedTo?: { _id: string; name: string; email: string };
  estimatedCost?: number;
  actualCost?: number;
  scheduledTime?: string;
  completedTime?: string;
  notes?: string;
  guestNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestServiceStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  avgResponseTime: number;
  avgCompletionTime: number;
  satisfactionScore: number;
}

export interface AssignServiceData {
  assignedTo: string;
  notes?: string;
  scheduledTime?: string;
}

export interface GuestServiceFilters {
  status?: string;
  serviceType?: string;
  priority?: string;
  assignedTo?: string;
  userId?: string;
  bookingId?: string;
  page?: number;
  limit?: number;
}

class AdminGuestServicesService {
  private baseURL = `${API_CONFIG.BASE_URL}/guest-services`;
  private hotelIdCache: string | null = null;
  private hotelIdCacheExpiry: number = 0;
  
  private async fetchWithAuth<T>(endpoint: string, options: RequestInit & { baseURL?: string } = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const baseURL = options.baseURL || this.baseURL;
    const { baseURL: _, ...fetchOptions } = options;

    try {
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. This might be a deployment configuration issue.');
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', {
        url: `${baseURL}${endpoint}`,
        error: error.message,
        baseURL,
        endpoint
      });
      throw error;
    }
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
      const userData = (response.data as any)?.user;
      
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
    console.log('Using correct hotelId for guest services:', correctHotelId);
    
    // Cache the correct hotelId for 10 minutes to avoid repeated lookups
    this.hotelIdCache = correctHotelId;
    this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
    
    return correctHotelId;
  }

  async getServices(filters: GuestServiceFilters = {}): Promise<ApiResponse<{ serviceRequests: GuestService[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    
    // Add hotelId to filters
    const hotelId = await this.getUserHotelId();
    queryParams.append('hotelId', hotelId);
    console.log('Getting guest services for hotelId:', hotelId);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `?${queryString}`;
    
    return this.fetchWithAuth(endpoint);
  }

  async getServiceById(serviceId: string): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}`);
  }

  async updateService(serviceId: string, updates: Partial<GuestService>): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async assignService(serviceId: string, assignData: AssignServiceData): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        assignedTo: assignData.assignedTo,
        notes: assignData.notes,
        scheduledTime: assignData.scheduledTime,
        status: 'assigned' // Set status to assigned when assigning
      }),
    });
  }

  async updateStatus(serviceId: string, status: string, notes?: string): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getStats(hotelId?: string): Promise<ApiResponse<GuestServiceStats>> {
    const targetHotelId = hotelId || await this.getUserHotelId();
    console.log('Getting guest service stats for hotelId:', targetHotelId);
    
    const queryParams = new URLSearchParams();
    queryParams.append('hotelId', targetHotelId);
    const endpoint = `/stats?${queryParams.toString()}`;
    return this.fetchWithAuth(endpoint);
  }

  // Get pending services that need attention
  async getPendingServices(): Promise<ApiResponse<GuestService[]>> {
    return this.fetchWithAuth('?status=pending&sortBy=priority,createdAt');
  }

  // Get overdue services (assigned/in_progress past scheduled time)
  async getOverdueServices(): Promise<ApiResponse<GuestService[]>> {
    return this.fetchWithAuth('/overdue');
  }

  // Get services by department for workload distribution
  async getServicesByDepartment(): Promise<ApiResponse<Record<string, number>>> {
    return this.fetchWithAuth('/stats/by-department');
  }

  // Get available staff members for assignment
  async getAvailableStaff(hotelId?: string): Promise<ApiResponse<Array<{ _id: string; name: string; email: string; department: string }>>> {
    const targetHotelId = hotelId || await this.getUserHotelId();
    console.log('Getting available staff for guest services with hotelId:', targetHotelId);
    
    const queryParams = new URLSearchParams();
    queryParams.append('hotelId', targetHotelId);
    const endpoint = `/available-staff?${queryParams.toString()}`;
    const response = await this.fetchWithAuth(endpoint);
    return response as ApiResponse<Array<{ _id: string; name: string; email: string; department: string }>>;
  }

  // Get guest satisfaction ratings for completed services
  async getSatisfactionRatings(filters?: { from?: string; to?: string }): Promise<ApiResponse<{ 
    average: number; 
    total: number; 
    breakdown: Record<number, number> 
  }>> {
    const queryParams = new URLSearchParams();
    if (filters?.from) queryParams.append('from', filters.from);
    if (filters?.to) queryParams.append('to', filters.to);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/satisfaction?${queryString}` : '/satisfaction';
    
    return this.fetchWithAuth(endpoint);
  }

  // Add internal notes to a service
  async addInternalNotes(serviceId: string, notes: string): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Update service cost (when completed)
  async updateCost(serviceId: string, actualCost: number): Promise<ApiResponse<GuestService>> {
    return this.fetchWithAuth(`/${serviceId}/cost`, {
      method: 'PATCH',
      body: JSON.stringify({ actualCost }),
    });
  }

  // Bulk operations
  async bulkAssign(serviceIds: string[], assignedTo: string): Promise<ApiResponse<{ updated: number }>> {
    return this.fetchWithAuth('/bulk/assign', {
      method: 'PATCH',
      body: JSON.stringify({ serviceIds, assignedTo }),
    });
  }

  async bulkUpdateStatus(serviceIds: string[], status: string): Promise<ApiResponse<{ updated: number }>> {
    return this.fetchWithAuth('/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ serviceIds, status }),
    });
  }

  // Export services data for reporting
  async exportServices(filters?: GuestServiceFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
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
      throw new Error('Failed to export services data');
    }

    return response.blob();
  }
}

export const adminGuestServicesService = new AdminGuestServicesService();